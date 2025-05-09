/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { fromJS, List, Map, OrderedMap, Record as ImmutableRecord } from 'immutable';
import { Filter, Query } from '@labkey/api';

import { QueryInfo } from '../../../public/QueryInfo';

import { SchemaQuery } from '../../../public/SchemaQuery';

import {
    getQueryDetails,
    ISelectRowsResult,
    quoteValueColumnWithDelimiters,
    searchRows,
    selectRowsDeprecated,
} from '../../query/api';
import { similaritySortFactory } from '../../util/similaritySortFactory';
import { caseInsensitive, parseCsvString } from '../../util/utils';

import { naturalSort } from '../../../public/sort';

import { Row } from '../../query/selectRows';

import { SelectInputOption } from './input/SelectInput';
import { DELIMITER } from './constants';
import { QuerySelectOwnProps } from './QuerySelect';
import { resolveDetailFieldLabel, resolveDetailFieldValue } from './utils';

function formatOption(model: QuerySelectModel, result: any): SelectInputOption {
    const { displayColumn, valueColumn } = model;

    const valueCol = model.queryInfo.getColumn(valueColumn) ?? model.queryInfo.getColumnFromName(valueColumn);
    const valueField = result.get(valueCol.name) ?? result.get(valueCol.fieldKey);

    const labelCol = model.queryInfo.getColumn(displayColumn) ?? model.queryInfo.getColumnFromName(displayColumn);
    const labelField = result.get(labelCol.name) ?? result.get(labelCol.fieldKey) ?? valueField;

    const option: SelectInputOption = {
        label: resolveDetailFieldLabel(labelField) as string,
        value: resolveDetailFieldValue(valueField),
    };

    if (valueField?.has('notFound')) {
        option.notFound = valueField.get('notFound');
    }

    return option;
}

export function formatResults(model: QuerySelectModel, results: Map<string, any>, token?: string): SelectInputOption[] {
    const { displayColumn, groupByColumn, queryInfo } = model;

    if (!queryInfo || !results) {
        return [];
    }

    if (groupByColumn) {
        return formatGroupedResults(model, results, token);
    }

    let options = results.map(result => formatOption(model, result));

    // Issue 46618: If a sort key is applied, then skip sorting on the client to retain sort done on server.
    if (!queryInfo.getColumn(displayColumn)?.hasSortKey) {
        options = options.sortBy(item => item.label, similaritySortFactory(token));
    }

    return options.toArray();
}

const NOT_GROUPED_LABEL = 'Uncategorized';

function formatGroupedResults(model: QuerySelectModel, results: Map<string, any>, token?: string): SelectInputOption[] {
    const { groupByColumn } = model;

    const groupedOptions: SelectInputOption[] = [];
    const optionMap: Record<string, SelectInputOption[]> = {};

    results.forEach(result => {
        let label = resolveDetailFieldLabel(result.get(groupByColumn)) as string;
        if (!label) {
            label = NOT_GROUPED_LABEL;
        }
        if (!optionMap[label]) {
            optionMap[label] = [];
        }
        optionMap[label].push(formatOption(model, result));
    });

    Object.keys(optionMap).forEach(label => {
        const options = List(optionMap[label])
            .sortBy(o => o.label, similaritySortFactory(token))
            .toArray();
        groupedOptions.push({ label, options });
    });

    return groupedOptions;
}

/**
 * Given a model this method returns "options" that are consumable by a ReactSelect.
 * @param model for which results are formatted
 * @param result select rows result
 * @param token an optional search token that will be used to sort the results
 */
export function formatSavedResults(
    model: QuerySelectModel,
    result: ISelectRowsResult,
    token?: string
): SelectInputOption[] {
    const { queryInfo, selectedItems } = model;

    if (!queryInfo) {
        return [];
    }

    const { key, orderedModels } = result;
    const models = fromJS(result.models[key]);
    const filteredResults = orderedModels[key]
        .filter(k => !selectedItems.has(k))
        .reduce((ordered, k) => ordered.set(k, models.get(k)), OrderedMap<string, any>());

    return formatResults(model, filteredResults, token);
}

export function saveSearchResults(model: QuerySelectModel, result: ISelectRowsResult): QuerySelectModel {
    const { key } = result;
    const searchResults = fromJS(result.models[key]);

    return model.merge({
        allResults: model.allResults.merge(searchResults),
        searchResults,
    }) as QuerySelectModel;
}

function getSelectedOptions(model: QuerySelectModel, value: any): Map<string, any> {
    // if no "value", just return currently selectedItems
    if (value === undefined || value === null || value === '') {
        return Map<string, any>();
    }

    const keyPath = [model.valueColumn, 'value'];
    const sources = model.allResults.merge(model.selectedItems);

    // multi-value case
    if (model.multiple === true) {
        const values = parseCsvString(value.toString(), model.delimiter);
        return sources
            .filter(result => {
                const resultValue = result.getIn(keyPath);
                return resultValue !== undefined && values.includes(resultValue.toString());
            })
            .toMap();
    }

    // single-value case
    return sources.filter(source => source.getIn(keyPath) === value).toMap();
}

// "selectedQuery" should match against displayColumn as that is what the user is typing against
export function parseSelectedQuery(model: QuerySelectModelProps, data: Map<string, Map<string, any>>): any {
    return data.map(result => result.getIn([model.displayColumn, 'value'])).join(model.delimiter);
}

export function setSelection(model: QuerySelectModel, rawSelectedValue: any): QuerySelectModel {
    const selectedItems = getSelectedOptions(model, rawSelectedValue);

    return model.merge({
        // Issue 52773: Unset notFoundValues once a value has been selected
        notFoundValues: undefined,
        rawSelectedValue,
        selectedItems,
        selectedQuery: parseSelectedQuery(model, selectedItems),
    }) as QuerySelectModel;
}

export function fetchSearchResults(model: QuerySelectModel, input: any): Promise<ISelectRowsResult> {
    const { addExactFilter, displayColumn, maxRows, queryFilters, schemaQuery, selectedItems, valueColumn } = model;

    let allFilters: Filter.IFilter[] = [];
    const filterVal = input.trim();

    // fetch additional options and exclude previously selected so user can see more
    if (model.multiple) {
        const excluded = selectedItems.map(row => row.getIn([valueColumn, 'value'])).toList();

        if (excluded.size) {
            if (excluded.size === 1) {
                allFilters.push(Filter.create(valueColumn, excluded.first(), Filter.Types.NOT_EQUAL));
            } else {
                allFilters.push(Filter.create(valueColumn, excluded.toArray(), Filter.Types.NOT_IN));
            }
        }
    }

    if (queryFilters) {
        allFilters = allFilters.concat(queryFilters.toArray());
    }

    // Issue 35112: Explicitly request exact matches -- can be disabled via QuerySelectModel.addExactFilter = false
    return searchRows(
        {
            containerFilter: model.containerFilter,
            containerPath: model.containerPath,
            schemaName: schemaQuery.schemaName,
            queryName: schemaQuery.queryName,
            viewName: schemaQuery.viewName,
            columns: model.queryColumnNames,
            filterArray: allFilters,
            sort: displayColumn,
            maxRows,
            includeTotalCount: 'f',
            parameters: model.queryParams,
        },
        filterVal,
        model.valueColumn,
        model.delimiter,
        addExactFilter ? displayColumn : undefined
    );
}

function initErrorMsg(queryInfo: QueryInfo, suffix?: string): string {
    const msg = `Unable to initialize QuerySelect for (${queryInfo.schemaName}.${queryInfo.name}).`;
    if (suffix) return msg + ' ' + suffix;
    return msg;
}

function initValueColumn(queryInfo: QueryInfo, column?: string): string {
    if (column) {
        const valueCol = queryInfo.getColumn(column) ?? queryInfo.getColumnFromName(column);

        if (!valueCol) {
            throw new Error(initErrorMsg(queryInfo, `The specified "valueColumn" "${column}" does not exist.`));
        }

        return valueCol.fieldKey;
    }

    const pkCols = queryInfo.getPkCols();

    if (pkCols.length === 0) {
        throw new Error(
            initErrorMsg(queryInfo, 'Set "valueColumn" explicitly as this query does not have any primary keys.')
        );
    }

    if (pkCols.length > 1) {
        const availablePkKeys = pkCols.map(col => `"${col.fieldKey}"`).join(', ');
        throw new Error(
            initErrorMsg(queryInfo, `Set "valueColumn" explicitly to any of the primary keys: ${availablePkKeys}`)
        );
    }

    return pkCols[0].fieldKey;
}

function initDisplayColumn(queryInfo: QueryInfo, valueColumn: string, column?: string): string {
    let displayColumn: string;

    if (column) {
        const col = queryInfo.getColumn(column) ?? queryInfo.getColumnFromName(column);
        if (!col) {
            console.warn(initErrorMsg(queryInfo, `The display column "${column}" does not exist.`));
        } else {
            displayColumn = col.fieldKey;
        }
    }

    // fallback to titleColumn
    if (!displayColumn && queryInfo.titleColumn) {
        const titleColumn =
            queryInfo.getColumn(queryInfo.titleColumn) ?? queryInfo.getColumnFromName(queryInfo.titleColumn);
        // Issue 52543: Sample Manager: lookup field that looks up to a list with auto key and field containing special character fails to resolve lookup values
        if (titleColumn) displayColumn = titleColumn.fieldKey;
    }

    // fallback to valueColumn
    if (!displayColumn) {
        const valueCol = queryInfo.getColumn(valueColumn) ?? queryInfo.getColumnFromName(valueColumn);
        displayColumn = valueCol.fieldKey;
    }

    return displayColumn;
}

function initGroupByColumn(queryInfo: QueryInfo, column?: string): string {
    let groupByColumn: string;

    if (column) {
        if (!queryInfo.getColumn(column)) {
            console.warn(initErrorMsg(queryInfo, `The group by column "${column}" does not exist.`));
        } else {
            groupByColumn = column;
        }
    }

    return groupByColumn;
}

export function queryColumnNames(
    queryInfo: QueryInfo,
    displayColumn: string,
    valueColumn: string,
    requiredColumns: string[],
    groupByColumn: string
): string[] {
    let queryColumns = queryInfo.pkCols.concat([displayColumn, valueColumn].concat(requiredColumns));
    const lookupViewColumns = queryInfo.getLookupViewColumns();

    if (groupByColumn) {
        queryColumns.push(groupByColumn);
    }

    if (lookupViewColumns.length > 0) {
        queryColumns = lookupViewColumns.map(c => c.fieldKey).concat(queryColumns);
    }

    // Remove duplicates
    return Array.from(new Set(queryColumns));
}

async function initQueryInfoWithColumns(props: QuerySelectOwnProps): Promise<Partial<QuerySelectModelProps>> {
    const { containerPath, schemaQuery } = props;
    const queryInfo = await getQueryDetails({ containerPath, schemaQuery });

    const valueColumn = initValueColumn(queryInfo, props.valueColumn);
    const displayColumn = initDisplayColumn(queryInfo, valueColumn, props.displayColumn);
    const groupByColumn = initGroupByColumn(queryInfo, props.groupByColumn);

    return { queryInfo, valueColumn, displayColumn, groupByColumn };
}

export function buildValueFilter(
    value: any,
    valueColumn: string,
    multiple: boolean,
    delimiter: string
): { expectedValueCount: number; filter: Filter.IFilter } {
    let filter: Filter.IFilter;
    let expectedValueCount = 1;

    if (multiple) {
        if (Array.isArray(value)) {
            filter = Filter.create(valueColumn, value, Filter.Types.IN);
            expectedValueCount = new Set(value).size;
        } else if (typeof value === 'string') {
            const parsed = parseCsvString(value, delimiter, true);
            filter = Filter.create(valueColumn, parsed, Filter.Types.IN);
            expectedValueCount = new Set(parsed).size;
        }
    }

    if (!filter) {
        filter = Filter.create(valueColumn, value);
    }

    return { expectedValueCount, filter };
}

export function findNotFoundValues(
    selectedRows: Record<string, Row>,
    filter: Filter.IFilter,
    valueColumn: string
): string[] {
    const filterValue = filter.getValue();
    if (filterValue === undefined || filterValue === null) return [];

    const rawValues = Array.isArray(filterValue) ? filterValue : [filterValue];
    const expectedValues = new Set(rawValues.filter(v => v !== undefined && v !== null).map(v => v.toString()));

    Object.values(selectedRows)
        .map(item => caseInsensitive(item, valueColumn)?.value)
        .filter(value => value !== undefined && value !== null)
        .forEach(value => expectedValues.delete(value.toString()));

    return Array.from(expectedValues).sort(naturalSort);
}

function initSelectedItems(
    props: QuerySelectOwnProps,
    queryInfo: QueryInfo,
    valueColumn: string,
    displayColumn: string,
    groupByColumn: string,
    filter: Filter.IFilter
): Promise<ISelectRowsResult> {
    const filters = props.queryFilters ? props.queryFilters.toArray() : [];
    filters.push(filter);

    const { queryName, schemaName, viewName } = props.schemaQuery;

    return selectRowsDeprecated({
        columns: queryColumnNames(queryInfo, displayColumn, valueColumn, props.requiredColumns, groupByColumn),
        containerFilter: props.containerFilter,
        containerPath: props.containerPath,
        filterArray: filters,
        parameters: props.queryParams,
        queryName,
        schemaName,
        viewName,
    });
}

export async function initSelect(props: QuerySelectOwnProps): Promise<Partial<QuerySelectModelProps>> {
    const { delimiter, multiple, value } = props;
    const { queryInfo, valueColumn, displayColumn, groupByColumn } = await initQueryInfoWithColumns(props);

    let selectedItems: ISelectRowsResult;
    let notFoundValues: List<any>;

    if (value !== undefined && value !== null) {
        const { expectedValueCount, filter } = buildValueFilter(value, valueColumn, multiple, delimiter);
        selectedItems = await initSelectedItems(props, queryInfo, valueColumn, displayColumn, groupByColumn, filter);
        const selectedRows = selectedItems.models[selectedItems.key];

        if (Object.keys(selectedRows).length !== expectedValueCount) {
            const notFoundValuesArray = findNotFoundValues(selectedRows, filter, valueColumn);
            if (notFoundValuesArray) {
                notFoundValues = List(notFoundValuesArray);

                notFoundValuesArray.forEach(v => {
                    if (!selectedRows.hasOwnProperty(v)) {
                        selectedRows[v] = { [valueColumn]: { displayValue: `<${v}>`, notFound: true, value: v } };
                    }
                });
            }
        }
    }

    return {
        displayColumn,
        groupByColumn,
        isInit: true,
        notFoundValues,
        queryInfo,
        selectedItems: selectedItems
            ? fromJS(quoteValueColumnWithDelimiters(selectedItems, valueColumn, delimiter).models[selectedItems.key])
            : Map<string, any>(),
        valueColumn,
    };
}

export interface QuerySelectModelProps {
    addExactFilter: boolean;
    allResults: Map<string, Map<string, any>>;
    containerFilter?: Query.ContainerFilter;
    containerPath?: string;
    delimiter: string;
    displayColumn: string;
    groupByColumn: string;
    isInit: boolean;
    maxRows: number;
    multiple: boolean;
    notFoundValues: List<any>;
    queryFilters: List<Filter.IFilter>;
    queryInfo: QueryInfo;
    queryParams: Record<string, any>;
    rawSelectedValue: any;
    requiredColumns: string[];
    schemaQuery: SchemaQuery;
    searchResults: Map<string, Map<string, any>>;
    selectedItems: Map<string, any>;
    selectedQuery: string;
    valueColumn: string;
}

export class QuerySelectModel
    extends ImmutableRecord({
        addExactFilter: true,
        allResults: Map<string, Map<string, any>>(),
        containerFilter: undefined,
        containerPath: undefined,
        displayColumn: undefined,
        delimiter: DELIMITER,
        groupByColumn: undefined,
        isInit: false,
        maxRows: 20,
        multiple: false,
        notFoundValues: undefined,
        queryFilters: undefined,
        queryInfo: undefined,
        queryParams: undefined,
        rawSelectedValue: undefined,
        requiredColumns: [],
        schemaQuery: undefined,
        searchResults: Map<string, Map<string, any>>(),
        selectedQuery: '',
        selectedItems: Map<string, any>(),
        valueColumn: undefined,
    })
    implements QuerySelectModelProps
{
    declare addExactFilter: boolean;
    declare allResults: Map<string, Map<string, any>>;
    declare containerFilter: Query.ContainerFilter;
    declare containerPath: string;
    declare displayColumn: string;
    declare delimiter: string;
    declare groupByColumn: string;
    declare isInit: boolean;
    declare maxRows: number;
    declare multiple: boolean;
    declare notFoundValues: List<any>;
    declare queryFilters: List<Filter.IFilter>;
    declare queryInfo: QueryInfo;
    declare queryParams: Record<string, any>;
    declare rawSelectedValue: any;
    declare requiredColumns: string[];
    declare schemaQuery: SchemaQuery;
    declare searchResults: Map<string, Map<string, any>>;
    declare selectedQuery: string;
    declare selectedItems: Map<string, any>;
    declare valueColumn: string;

    get selectedOptions(): SelectInputOption | SelectInputOption[] {
        const options = formatResults(this, this.selectedItems);

        if (this.multiple) {
            return options;
        } else if (options.length === 1) {
            if (this.groupByColumn) {
                return options[0].options[0];
            }
            return options[0];
        } else if (options.length > 1) {
            console.warn(
                'QuerySelect.getSelectedOptions: There are multiple options available, but model does not allow multiple selections.'
            );
        }

        return undefined;
    }

    get queryColumnNames(): string[] {
        return queryColumnNames(
            this.queryInfo,
            this.displayColumn,
            this.valueColumn,
            this.requiredColumns,
            this.groupByColumn
        );
    }
}

export interface ISelectInitData {
    getSelectComponentId(): string;
    name: string;
    type: string;
}
