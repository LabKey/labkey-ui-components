import { List } from 'immutable';
import { Draft, immerable, produce } from 'immer';
import { Filter, Query } from '@labkey/api';

import { LoadingState, naturalSort, QueryColumn, QueryInfo, SchemaQuery, ViewInfo } from '..';
import { QuerySort } from '../components/base/models/model';

import { getOrDefault } from './utils';

/**
 * Creates a QueryModel ID for a given SchemaQuery. The id is just the SchemaQuery snake-cased as
 * schemaName-queryName-viewName or schemaName-queryName if viewName is undefined.
 *
 * @param schemaQuery: SchemaQuery
 */
export function createQueryModelId(schemaQuery: SchemaQuery): string {
    const { schemaName, queryName, viewName } = schemaQuery;
    return `${schemaName}-${queryName}${viewName !== undefined ? '-' + viewName : ''}`;
}

const sortStringMapper = (s: QuerySort): string => s.toRequestString();

export interface GridMessage {
    area: string;
    type: string;
    content: string;
}

export interface QueryConfig {
    baseFilters?: Filter.IFilter[];
    containerFilter?: Query.ContainerFilter;
    containerPath?: string;
    id?: string;
    includeDetailsColumn?: boolean;
    includeUpdateColumn?: boolean;
    keyValue?: any; // TODO: better name
    maxRows?: number;
    offset?: number;
    omittedColumns?: string[];
    queryParameters?: { [key: string]: any };
    requiredColumns?: string[];
    schemaQuery: SchemaQuery;
    sorts?: QuerySort[];
}

export interface IQueryModel extends QueryConfig {
    error?: string;
    // Separate from baseFilters because these are set by the user when interacting with grids (e.g. via omnibox)
    filterArray: Filter.IFilter[];
    // Set by server (Assay QC, etc)
    messages: GridMessage[];
    queryInfo?: QueryInfo;
    queryInfoLoadingState: LoadingState;
    orderedRows?: string[];
    rows?: { [key: string]: any };
    rowCount?: number;
    rowsLoadingState: LoadingState;
}

const DEFAULT_OFFSET = 0;
const DEFAULT_MAX_ROWS = 20;

export class QueryModel implements IQueryModel {
    [immerable] = true;

    // Fields from QueryConfig
    readonly baseFilters: Filter.IFilter[];
    readonly containerFilter?: Query.ContainerFilter;
    readonly containerPath?: string;
    readonly id: string;
    readonly includeDetailsColumn: boolean;
    readonly includeUpdateColumn: boolean;
    readonly keyValue?: any; // TODO: better name
    readonly maxRows?: number;
    readonly offset: number;
    readonly omittedColumns: string[];
    readonly queryParameters?: { [key: string]: any };
    readonly requiredColumns: string[];
    readonly schemaQuery: SchemaQuery;
    readonly sorts?: QuerySort[];

    // QueryModel only fields
    readonly error: string;
    readonly filterArray: Filter.IFilter[];
    readonly rowsLoadingState: LoadingState;
    readonly messages: GridMessage[];
    readonly orderedRows?: string[];
    readonly queryInfo?: QueryInfo;
    readonly queryInfoLoadingState: LoadingState;
    readonly rows?: { [key: string]: any };
    readonly rowCount?: number;

    constructor(queryConfig: QueryConfig) {
        this.baseFilters = getOrDefault(queryConfig.baseFilters, []);
        this.containerFilter = getOrDefault(queryConfig.containerFilter);
        this.containerPath = getOrDefault(queryConfig.containerPath);
        this.schemaQuery = getOrDefault(queryConfig.schemaQuery);

        // Even though this is a situation that we shouldn't be in due to the type annotations it's still possible
        // due to conversion from any, and it's best to have a specific error than an error due to undefined later
        // when we try to use the model during an API request.
        if (this.schemaQuery === undefined) {
            throw new Error('schemaQuery is required to instantiate a QueryModel');
        }

        this.id = getOrDefault(queryConfig.id, createQueryModelId(this.schemaQuery));
        this.includeDetailsColumn = getOrDefault(queryConfig.includeDetailsColumn, false);
        this.includeUpdateColumn = getOrDefault(queryConfig.includeUpdateColumn, false);
        this.keyValue = getOrDefault(queryConfig.keyValue);
        this.maxRows = getOrDefault(queryConfig.maxRows, DEFAULT_MAX_ROWS);
        this.offset = getOrDefault(queryConfig.offset, DEFAULT_OFFSET);
        this.omittedColumns = getOrDefault(queryConfig.omittedColumns, []);
        this.queryParameters = getOrDefault(queryConfig.queryParameters);
        this.requiredColumns = getOrDefault(queryConfig.requiredColumns, []);
        this.sorts = getOrDefault(queryConfig.sorts);
        this.error = undefined;
        this.filterArray = [];
        this.messages = [];
        this.queryInfo = undefined;
        this.orderedRows = undefined;
        this.rows = undefined;
        this.rowCount = undefined;
        this.rowsLoadingState = LoadingState.INITIALIZED;
        this.queryInfoLoadingState = LoadingState.INITIALIZED;
    }

    get schemaName() {
        return this.schemaQuery.schemaName;
    }

    get queryName() {
        return this.schemaQuery.queryName;
    }

    get viewName() {
        return this.schemaQuery.viewName;
    }

    getColumn(fieldKey: string): QueryColumn {
        return this.queryInfo?.getColumn(fieldKey);
    }

    get detailColumns(): QueryColumn[] {
        return this.queryInfo?.getDetailDisplayColumns(ViewInfo.DETAIL_NAME, List(this.omittedColumns)).toArray();
    }

    get displayColumns(): QueryColumn[] {
        return this.queryInfo?.getDisplayColumns(this.viewName, List(this.omittedColumns)).toArray();
    }

    get allColumns(): QueryColumn[] {
        return this.queryInfo?.getAllColumns(this.viewName, List(this.omittedColumns)).toArray();
    }

    get updateColumns(): QueryColumn[] {
        return this.queryInfo?.getUpdateDisplayColumns(ViewInfo.UPDATE_NAME, List(this.omittedColumns)).toArray();
    }

    get keyColumns(): QueryColumn[] {
        return this.queryInfo?.getPkCols().toArray();
    }

    /**
     * Issue 39765: When viewing details for assays, we need to apply an "is not blank" filter on the "Replaced" column
     * in order to see replaced assay runs.  So this is the one case (we know of) where we want to apply base filters
     * when viewing details since the default view restricts the set of items found.
     *
     * Applying other base filters will be problematic (Issue 39719) in that they could possibly exclude the row you are
     * trying to get details for.
     */
    get detailFilters(): Filter.IFilter[] {
        return this.baseFilters.filter(filter => filter.getColumnName().toLowerCase() === 'replaced');
    }

    get filters(): Filter.IFilter[] {
        const { baseFilters, filterArray, queryInfo, keyValue, viewName } = this;

        if (!queryInfo) {
            // Throw an error because this method is only used when making an API request, and if we don't have a
            // QueryInfo then we're going to make a bad request. It's better to error here before hitting the server.
            throw new Error('Cannot get filters, no QueryInfo available');
        }

        if (this.keyValue !== undefined) {
            const pkFilter = [];

            if (queryInfo.pkCols.size === 1) {
                pkFilter.push(Filter.create(queryInfo.pkCols.first(), keyValue));
            } else {
                // Note: This behavior of not throwing an error, and continuing despite not having a single PK column is
                // inherited from QueryGridModel, we may want to rethink this before widely adopting this API.
                const warning = 'Too many keys. Unable to filter for specific keyValue.';
                console.warn(warning, queryInfo.pkCols.toJS());
            }

            return [...pkFilter, ...this.detailFilters];
        }

        return [...baseFilters, ...filterArray, ...queryInfo.getFilters(viewName).toArray()];
    }

    get columnString(): string {
        const { queryInfo, requiredColumns, omittedColumns } = this;

        if (!queryInfo) {
            // Throw an error because this method is only used when making an API request, and if we don't have a
            // QueryInfo then we're going to make a bad request. It's better to error here before hitting the server.
            throw new Error('Cannot construct column string, no QueryInfo available');
        }

        // Note: ES6 Set is being used here, not Immutable Set
        const uniqueFieldKeys = new Set(requiredColumns);
        this.keyColumns.forEach(col => uniqueFieldKeys.add(col.fieldKey));
        this.displayColumns.forEach(col => uniqueFieldKeys.add(col.fieldKey));
        let fieldKeys = Array.from(uniqueFieldKeys);

        if (omittedColumns.length) {
            const lowerOmit = new Set(omittedColumns.map(c => c.toLowerCase()));
            fieldKeys = fieldKeys.filter(fieldKey => lowerOmit.has(fieldKey.toLowerCase()));
        }

        return fieldKeys.join(',');
    }

    get exportColumnString(): string {
        return this.displayColumns.map(column => column.fieldKey).join(',');
    }

    get sortString(): string {
        const { sorts, viewName, queryInfo } = this;

        if (!queryInfo) {
            // Throw an error because this method is only used when making an API request, and if we don't have a
            // QueryInfo then we're going to make a bad request. It's better to error here before hitting the server.
            throw new Error('Cannot construct sort string, no QueryInfo available');
        }

        let sortStrings = sorts?.map(sortStringMapper) || [];
        const viewSorts = queryInfo.getSorts(viewName).map(sortStringMapper).toArray();

        if (viewSorts.length > 0) {
            sortStrings = sortStrings.concat(viewSorts);
        }

        return sortStrings.join(',');
    }

    /**
     * Returns the data needed for a <Grid /> component to render.
     */
    get gridData() {
        return this.orderedRows.map(i => this.rows[i]);
    }

    get pageCount(): number {
        const { maxRows, rowCount } = this;
        return maxRows > 0 ? Math.ceil(rowCount / maxRows) : 1;
    }

    get currentPage(): number {
        const { offset, maxRows } = this;
        return offset > 0 ? Math.floor(offset / maxRows) + 1 : 1;
    }

    get lastPageOffset(): number {
        return (this.pageCount - 1) * this.maxRows;
    }

    get views(): ViewInfo[] {
        return this.queryInfo?.views.sortBy(v => v.label, naturalSort).toArray() || [];
    }

    get hasData(): boolean {
        return this.rows !== undefined;
    }

    get isLoading(): boolean {
        const { queryInfoLoadingState, rowsLoadingState } = this;
        return (
            queryInfoLoadingState === LoadingState.INITIALIZED ||
            queryInfoLoadingState === LoadingState.LOADING ||
            rowsLoadingState === LoadingState.INITIALIZED ||
            rowsLoadingState === LoadingState.LOADING
        );
    }

    get isLastPage(): boolean {
        return this.currentPage === this.pageCount;
    }

    get isFirstPage(): boolean {
        return this.currentPage === 1;
    }

    /**
     * Indicates whether pagination can be rendered based on if the model has data, and if it has enough data. Different
     * than the GridPanel isPaged setting.
     */
    get isPaged(): boolean {
        return this.hasData && this.pageCount > 1;
    }

    /**
     * Returns a deep copy of this model with props applied iff props is not empty/null/undefined else
     * returns this.
     * @param props
     */
    mutate(props: Partial<IQueryModel>): QueryModel {
        return produce(this, (draft: Draft<QueryModel>) => {
            Object.assign(draft, props);
        });
    }
}
