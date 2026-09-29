/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { FieldKey, Query, QueryKey } from '@labkey/api';

import {
    getQueryDetails,
    GetQueryDetailsOptions,
    SelectDistinctOptions,
    selectDistinctRows,
} from '../../../internal/query/api';
import { executeSql, ExecuteSqlOptions, ExecuteSqlResponseBase } from '../../../internal/query/executeSql';
import { selectRows, SelectRowsOptions, SelectRowsResponse } from '../../../internal/query/selectRows';
import { QueryColumn } from '../../QueryColumn';
import { QueryInfo } from '../../QueryInfo';
import { SchemaQuery } from '../../SchemaQuery';

import { buildSuggestions, createSearchSuggestion, DEFAULT_MAX_SUGGESTIONS } from './buildSuggestions';
import { FilterSuggestionsRequest, FilterSuggestionsResponse, SuggestionColumn } from './models';
import { parseSuggestionTerm } from './term';
import { getValueShape } from './utils';

/**
 * In-browser stand-in for the planned query-getFilterSuggestions.api endpoint. It gathers column facts with the
 * standard query APIs (one aggregate executeSql pass, then distinct values or sampled value shapes per column),
 * caches them per table and container scope, and ranks suggestions with buildSuggestions.
 */

export interface SuggestionDataAPI {
    executeSql: (options: ExecuteSqlOptions) => Promise<ExecuteSqlResponseBase>;
    getQueryDetails: (options: GetQueryDetailsOptions) => Promise<QueryInfo>;
    selectDistinctRows: (options: SelectDistinctOptions) => Promise<Query.SelectDistinctResponse>;
    selectRows: (options: SelectRowsOptions) => Promise<SelectRowsResponse>;
}

export interface FilterSuggestionEngineOptions {
    budgetMs?: number;
    dataAPI?: SuggestionDataAPI;
}

export const DISTINCT_VALUE_LIMIT = 500;
const SHAPE_SAMPLE_SIZE = 200;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 2000;
const DEFAULT_BUDGET_MS = 400;

const DEFAULT_DATA_API: SuggestionDataAPI = { executeSql, getQueryDetails, selectDistinctRows, selectRows };

type Strategy = 'boolean' | 'date' | 'fixed' | 'float' | 'int' | 'key' | 'lookup' | 'string';

interface ColumnStats {
    distinctCount?: number;
    max?: number | string;
    min?: number | string;
}

interface PlannedColumn {
    column: QueryColumn;
    fieldKey: string;
    strategy: Strategy;
}

// Distinct values beyond DISTINCT_VALUE_LIMIT are not worth listing
type Values = 'overflow' | string[];

interface CacheEntry<T> {
    expires: number;
    failed: boolean;
    promise: Promise<T>;
    settled: boolean;
    value?: T;
}

const cache = new Map<string, CacheEntry<unknown>>();

export function invalidateFilterSuggestionCache(): void {
    cache.clear();
}

function getFreshEntry<T>(key: string): CacheEntry<T> {
    const entry = cache.get(key) as CacheEntry<T>;
    if (entry && entry.expires > Date.now()) return entry;
    if (entry) cache.delete(key);
    return undefined;
}

function setEntry<T>(key: string, load: Promise<T>): CacheEntry<T> {
    const entry: CacheEntry<T> = {
        expires: Date.now() + CACHE_TTL_MS,
        failed: false,
        promise: undefined,
        settled: false,
    };
    entry.promise = load.then(
        value => {
            entry.value = value;
            entry.settled = true;
            return value;
        },
        error => {
            entry.failed = true;
            entry.settled = true;
            throw error;
        }
    );
    // Failures are recorded on the entry; consumers inspect entry.failed rather than the rejection
    entry.promise.catch(() => undefined);

    cache.set(key, entry);
    if (cache.size > MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
    return entry;
}

function getOrLoad<T>(key: string, loader: () => Promise<T>): CacheEntry<T> {
    return getFreshEntry<T>(key) ?? setEntry(key, loader());
}

function classifyColumn(column: QueryColumn, isPrimaryKey: boolean): Strategy {
    if (!column.filterable || column.facetingBehaviorType === 'ALWAYS_OFF') return undefined;
    if (column.isFileInput || column.inputType === 'textarea' || column.isTimeColumn) return undefined;
    if (column.multiValue || column.isMultiChoice || column.isJunctionLookup()) return undefined;

    const jsonType = column.getDisplayFieldJsonType();
    if (isPrimaryKey && jsonType === 'int') return 'key';
    if (column.validValues?.length) return 'fixed';
    if (jsonType === 'boolean') return 'boolean';
    if (jsonType === 'string') return column.isLookup() ? 'lookup' : 'string';
    if (jsonType === 'int') return 'int';
    if (jsonType === 'float' || jsonType === 'double') return 'float';
    if (jsonType === 'date') return 'date';
    return undefined;
}

function normalizeDate(value: unknown): string {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'number') return new Date(value).toISOString().substring(0, 10);
    const match = /^(\d{4})[-/](\d{2})[-/](\d{2})/.exec(String(value));
    return match ? `${match[1]}-${match[2]}-${match[3]}` : undefined;
}

function toStringValues(values: unknown[]): Values {
    const strings = values.filter(value => value !== null && value !== undefined && value !== '').map(String);
    return strings.length > DISTINCT_VALUE_LIMIT ? 'overflow' : strings;
}

function getScopeKey(request: FilterSuggestionsRequest): string {
    return [
        request.schemaName.toLowerCase(),
        request.queryName.toLowerCase(),
        request.containerPath ?? '',
        request.containerFilter ?? '',
        JSON.stringify(request.parameters ?? {}),
    ].join('|');
}

async function loadStats(
    dataAPI: SuggestionDataAPI,
    request: FilterSuggestionsRequest,
    planned: PlannedColumn[]
): Promise<Record<string, ColumnStats>> {
    const selects: string[] = [];
    planned.forEach((p, i) => {
        const sqlColumn = FieldKey.fromString(p.fieldKey).toSQLString();
        if (p.strategy !== 'string') {
            selects.push(`MIN(${sqlColumn}) AS "min_${i}"`, `MAX(${sqlColumn}) AS "max_${i}"`);
        }
        if (p.strategy === 'string' || p.strategy === 'int') {
            selects.push(`COUNT(DISTINCT ${sqlColumn}) AS "cd_${i}"`);
        }
    });

    const response = await dataAPI.executeSql({
        containerFilter: request.containerFilter,
        containerPath: request.containerPath,
        parameters: request.parameters,
        schemaName: request.schemaName,
        sql: `SELECT ${selects.join(', ')} FROM ${QueryKey.quote(request.queryName)}`,
    });

    const row = response.rows[0] ?? {};
    return planned.reduce<Record<string, ColumnStats>>((stats, p, i) => {
        const min = row[`min_${i}`]?.value;
        const max = row[`max_${i}`]?.value;
        const distinctCount = row[`cd_${i}`]?.value;
        const isDate = p.strategy === 'date';
        stats[p.fieldKey] = {
            distinctCount: distinctCount === undefined || distinctCount === null ? undefined : Number(distinctCount),
            max: isDate ? normalizeDate(max) : (max ?? undefined),
            min: isDate ? normalizeDate(min) : (min ?? undefined),
        };
        return stats;
    }, {});
}

async function loadValues(
    dataAPI: SuggestionDataAPI,
    options: Omit<SelectDistinctOptions, 'maxRows'>
): Promise<Values> {
    const response = await dataAPI.selectDistinctRows({ ...options, maxRows: DISTINCT_VALUE_LIMIT + 1 });
    return toStringValues(response.values);
}

async function loadShapes(
    dataAPI: SuggestionDataAPI,
    request: FilterSuggestionsRequest,
    fieldKeys: string[]
): Promise<Record<string, string[]>> {
    const response = await dataAPI.selectRows({
        columns: fieldKeys,
        containerFilter: request.containerFilter,
        containerPath: request.containerPath,
        includeTotalCount: false,
        maxRows: SHAPE_SAMPLE_SIZE,
        parameters: request.parameters,
        schemaQuery: new SchemaQuery(request.schemaName, request.queryName),
    });

    return fieldKeys.reduce<Record<string, string[]>>((shapes, fieldKey) => {
        const columnShapes = new Set<string>();
        response.rows.forEach(row => {
            const value = row[fieldKey]?.value;
            if (value !== null && value !== undefined && value !== '') columnShapes.add(getValueShape(String(value)));
        });
        shapes[fieldKey] = Array.from(columnShapes);
        return shapes;
    }, {});
}

class RequestLoader {
    private readonly dataAPI: SuggestionDataAPI;
    private readonly request: FilterSuggestionsRequest;
    private readonly scopeKey: string;
    private pendingShapeFieldKeys: string[] = [];
    private readonly pendingShapeResolvers = new Map<string, (shapes: Record<string, string[]>) => void>();
    private shapeFlushScheduled = false;

    constructor(dataAPI: SuggestionDataAPI, request: FilterSuggestionsRequest) {
        this.dataAPI = dataAPI;
        this.request = request;
        this.scopeKey = getScopeKey(request);
    }

    statsKey = (fieldKey: string): string => `stats|${this.scopeKey}|${fieldKey.toLowerCase()}`;
    valuesKey = (fieldKey: string): string => `values|${this.scopeKey}|${fieldKey.toLowerCase()}`;
    shapesKey = (fieldKey: string): string => `shapes|${this.scopeKey}|${fieldKey.toLowerCase()}`;

    static lookupValuesKey(column: QueryColumn, containerPath: string): string {
        const { lookup } = column;
        return [
            'lookupValues',
            lookup.schemaName,
            lookup.queryName,
            lookup.displayColumn,
            lookup.containerPath ?? containerPath,
        ]
            .join('|')
            .toLowerCase();
    }

    ensureStats(planned: PlannedColumn[]): void {
        const missing = planned.filter(p => !getFreshEntry(this.statsKey(p.fieldKey)));
        if (!missing.length) return;

        const batch = loadStats(this.dataAPI, this.request, missing);
        missing.forEach(p =>
            setEntry(
                this.statsKey(p.fieldKey),
                batch.then(stats => stats[p.fieldKey])
            )
        );
    }

    ensureValues(fieldKey: string): CacheEntry<Values> {
        const { containerFilter, containerPath, parameters, queryName, schemaName } = this.request;
        return getOrLoad(this.valuesKey(fieldKey), () =>
            loadValues(this.dataAPI, {
                column: fieldKey,
                containerFilter,
                containerPath,
                parameters,
                queryName,
                schemaName,
            })
        );
    }

    ensureLookupValues(column: QueryColumn): CacheEntry<Values> {
        const { lookup } = column;
        const containerPath = lookup.containerPath ?? this.request.containerPath;
        return getOrLoad(RequestLoader.lookupValuesKey(column, this.request.containerPath), () =>
            loadValues(this.dataAPI, {
                column: lookup.displayColumnFieldKey ?? lookup.displayColumn,
                containerFilter: lookup.containerFilter,
                containerPath,
                queryName: lookup.queryName,
                schemaName: lookup.schemaName,
            })
        );
    }

    // Shape requests made in the same tick share one selectRows call
    ensureShapes(fieldKey: string): CacheEntry<string[]> {
        const existing = getFreshEntry<string[]>(this.shapesKey(fieldKey));
        if (existing) return existing;

        const load = new Promise<Record<string, string[]>>(resolve => {
            this.pendingShapeResolvers.set(fieldKey, resolve);
        });
        this.pendingShapeFieldKeys.push(fieldKey);
        this.scheduleShapeFlush();
        return setEntry(
            this.shapesKey(fieldKey),
            load.then(shapes => {
                if (!shapes) throw new Error('Unable to load value shapes');
                return shapes[fieldKey];
            })
        );
    }

    private scheduleShapeFlush(): void {
        if (this.shapeFlushScheduled) return;
        this.shapeFlushScheduled = true;

        Promise.resolve().then(async () => {
            const fieldKeys = this.pendingShapeFieldKeys;
            const resolvers = new Map(this.pendingShapeResolvers);
            this.pendingShapeFieldKeys = [];
            this.pendingShapeResolvers.clear();
            this.shapeFlushScheduled = false;

            let shapes: Record<string, string[]>;
            try {
                shapes = await loadShapes(this.dataAPI, this.request, fieldKeys);
            } catch {
                shapes = undefined;
            }
            resolvers.forEach(resolve => resolve(shapes));
        });
    }

    /** Starts every load the column needs and resolves once they settle. */
    load(p: PlannedColumn): Promise<unknown> {
        switch (p.strategy) {
            case 'date':
            case 'float':
                return getFreshEntry(this.statsKey(p.fieldKey)).promise;
            case 'int':
            case 'string':
                return getFreshEntry<ColumnStats>(this.statsKey(p.fieldKey)).promise.then(stats => {
                    if (stats.distinctCount !== undefined && stats.distinctCount <= DISTINCT_VALUE_LIMIT) {
                        return this.ensureValues(p.fieldKey).promise;
                    }
                    return p.strategy === 'string' ? this.ensureShapes(p.fieldKey).promise : undefined;
                });
            case 'lookup':
                return this.ensureLookupValues(p.column).promise.then(values =>
                    values === 'overflow' ? this.ensureShapes(p.fieldKey).promise : values
                );
            default:
                return Promise.resolve();
        }
    }

    /** Snapshot of what has loaded so far for the column. */
    toSuggestionColumn(p: PlannedColumn, titleColumn: string): SuggestionColumn {
        const { column, fieldKey, strategy } = p;
        const suggestionColumn: SuggestionColumn = {
            caption: column.caption,
            fieldKey,
            isTitle: !!titleColumn && titleColumn.toLowerCase() === column.fieldKey.toLowerCase(),
            isUniqueId: column.isUniqueIdColumn || undefined,
            nameExpression: column.nameExpression || undefined,
            type: 'string',
        };

        const stats = getFreshEntry<ColumnStats>(this.statsKey(fieldKey));
        const settledStats = stats?.settled && !stats.failed ? stats.value : undefined;
        const settledValues = (entry: CacheEntry<Values>): string[] =>
            entry?.settled && !entry.failed && entry.value !== 'overflow' ? entry.value : undefined;
        const settledShapes = (): string[] => {
            const entry = getFreshEntry<string[]>(this.shapesKey(fieldKey));
            return entry?.settled && !entry.failed ? entry.value : undefined;
        };

        switch (strategy) {
            case 'boolean':
                return { ...suggestionColumn, type: 'boolean', values: ['true', 'false'] };
            case 'date':
            case 'float':
            case 'int':
                return {
                    ...suggestionColumn,
                    max: settledStats?.max,
                    min: settledStats?.min,
                    rangeUnknown: stats?.failed || undefined,
                    type: strategy,
                    values:
                        strategy === 'int' ? settledValues(getFreshEntry<Values>(this.valuesKey(fieldKey))) : undefined,
                };
            case 'fixed':
                return { ...suggestionColumn, values: column.validValues };
            case 'key':
                return { ...suggestionColumn, isKey: true, type: 'int' };
            case 'lookup': {
                const entry = getFreshEntry<Values>(RequestLoader.lookupValuesKey(column, this.request.containerPath));
                return { ...suggestionColumn, shapes: settledShapes(), values: settledValues(entry) };
            }
            case 'string':
                return {
                    ...suggestionColumn,
                    shapes: settledShapes(),
                    values: settledValues(getFreshEntry<Values>(this.valuesKey(fieldKey))),
                };
            default:
                return suggestionColumn;
        }
    }
}

function planColumns(queryInfo: QueryInfo, request: FilterSuggestionsRequest): PlannedColumn[] {
    const viewColumns = new Map<string, QueryColumn>();
    queryInfo
        .getDisplayColumns(request.viewName)
        .forEach(column => viewColumns.set(column.fieldKey.toLowerCase(), column));

    const pkFieldKeys = new Set(queryInfo.pkCols.map(pk => pk.toLowerCase()));
    const candidates: QueryColumn[] = request.columns
        .map(fieldKey => viewColumns.get(fieldKey.toLowerCase()) ?? queryInfo.getColumn(fieldKey))
        .filter(column => column !== undefined);
    // Q matches numeric primary keys even when they are not displayed, so keep doing that
    queryInfo.getPkCols().forEach(pk => {
        if (!candidates.some(column => column.fieldKey.toLowerCase() === pk.fieldKey.toLowerCase()))
            candidates.push(pk);
    });

    const seen = new Set<string>();
    return candidates.reduce<PlannedColumn[]>((planned, column) => {
        const fieldKey = column.getDisplayFieldKey();
        const strategy = classifyColumn(column, pkFieldKeys.has(column.fieldKey.toLowerCase()));
        if (strategy && !seen.has(fieldKey.toLowerCase())) {
            seen.add(fieldKey.toLowerCase());
            planned.push({ column, fieldKey, strategy });
        }
        return planned;
    }, []);
}

async function settleWithin(promises: Promise<unknown>[], ms: number): Promise<boolean> {
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<boolean>(resolve => {
        timer = setTimeout(() => resolve(false), ms);
    });
    const settled = Promise.allSettled(promises).then(() => true);
    const complete = await Promise.race([settled, timeout]);
    clearTimeout(timer);
    return complete;
}

export async function getFilterSuggestions(
    request: FilterSuggestionsRequest,
    options: FilterSuggestionEngineOptions = {}
): Promise<FilterSuggestionsResponse> {
    const { budgetMs = DEFAULT_BUDGET_MS, dataAPI = DEFAULT_DATA_API } = options;
    const term = parseSuggestionTerm(request.term);
    if (!term.raw) return { complete: true, suggestions: [] };

    let queryInfo: QueryInfo;
    try {
        queryInfo = await dataAPI.getQueryDetails({
            containerPath: request.containerPath,
            schemaQuery: new SchemaQuery(request.schemaName, request.queryName),
        });
    } catch {
        return { complete: false, suggestions: [createSearchSuggestion(term.raw)] };
    }

    const planned = planColumns(queryInfo, request);
    const loader = new RequestLoader(dataAPI, request);
    loader.ensureStats(planned.filter(p => ['string', 'int', 'float', 'date'].includes(p.strategy)));
    const complete = await settleWithin(
        planned.map(p => loader.load(p)),
        budgetMs
    );

    const columns = planned.map(p => loader.toSuggestionColumn(p, queryInfo.titleColumn));
    return {
        complete,
        suggestions: buildSuggestions(term, columns, request.maxSuggestions ?? DEFAULT_MAX_SUGGESTIONS),
    };
}
