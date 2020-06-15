import { List } from 'immutable';
import { Draft, immerable, produce } from 'immer';
import { Filter, Query } from '@labkey/api';

import {
    GRID_CHECKBOX_OPTIONS,
    LoadingState,
    IDataViewInfo,
    naturalSort,
    QueryColumn,
    QueryInfo,
    QuerySort,
    SchemaQuery,
    ViewInfo,
} from '..';
import { GRID_SELECTION_INDEX } from '../components/base/models/constants';

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    keyValue?: any; // Should be a Primary Key Value, used when loading/rendering details pages.
    maxRows?: number;
    offset?: number;
    omittedColumns?: string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryParameters?: { [key: string]: any };
    requiredColumns?: string[];
    schemaQuery: SchemaQuery;
    sorts?: QuerySort[];
}

const DEFAULT_OFFSET = 0;
const DEFAULT_MAX_ROWS = 20;

export class QueryModel {
    [immerable] = true;

    // Fields from QueryConfig
    // Some of the fields we have in common with QueryConfig are not optional because we give them default values.
    readonly baseFilters: Filter.IFilter[];
    readonly containerFilter?: Query.ContainerFilter;
    readonly containerPath?: string;
    readonly id: string;
    readonly includeDetailsColumn: boolean;
    readonly includeUpdateColumn: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly keyValue?: any;
    readonly maxRows: number;
    readonly offset: number;
    readonly omittedColumns: string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly queryParameters?: { [key: string]: any };
    readonly requiredColumns: string[];
    readonly schemaQuery: SchemaQuery;
    readonly sorts: QuerySort[];

    // QueryModel only fields
    readonly filterArray: Filter.IFilter[];
    readonly messages?: GridMessage[];
    readonly orderedRows?: string[];
    readonly queryInfo?: QueryInfo;
    readonly queryInfoError?: string;
    readonly queryInfoLoadingState: LoadingState;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly rows?: { [key: string]: any };
    readonly rowCount?: number;
    readonly rowsError?: string;
    readonly rowsLoadingState: LoadingState;
    readonly selections?: Set<string>; // Note: ES6 Set is being used here, not Immutable Set
    readonly selectionsError?: string;
    readonly selectionsLoadingState: LoadingState;
    readonly charts: IDataViewInfo[];
    readonly chartsError: string;
    readonly chartsLoadingState: LoadingState;

    constructor(queryConfig: QueryConfig) {
        this.baseFilters = queryConfig.baseFilters ?? [];
        this.containerFilter = queryConfig.containerFilter;
        this.containerPath = queryConfig.containerPath;
        this.schemaQuery = queryConfig.schemaQuery;

        // Even though this is a situation that we shouldn't be in due to the type annotations it's still possible
        // due to conversion from any, and it's best to have a specific error than an error due to undefined later
        // when we try to use the model during an API request.
        if (this.schemaQuery === undefined) {
            throw new Error('schemaQuery is required to instantiate a QueryModel');
        }

        this.id = queryConfig.id ?? createQueryModelId(this.schemaQuery);
        this.includeDetailsColumn = queryConfig.includeDetailsColumn ?? false;
        this.includeUpdateColumn = queryConfig.includeUpdateColumn ?? false;
        this.keyValue = queryConfig.keyValue;
        this.maxRows = queryConfig.maxRows ?? DEFAULT_MAX_ROWS;
        this.offset = queryConfig.offset ?? DEFAULT_OFFSET;
        this.omittedColumns = queryConfig.omittedColumns ?? [];
        this.queryParameters = queryConfig.queryParameters;
        this.requiredColumns = queryConfig.requiredColumns ?? [];
        this.sorts = queryConfig.sorts ?? [];
        this.rowsError = undefined;
        this.filterArray = [];
        this.messages = [];
        this.queryInfo = undefined;
        this.queryInfoError = undefined;
        this.queryInfoLoadingState = LoadingState.INITIALIZED;
        this.orderedRows = undefined;
        this.rows = undefined;
        this.rowCount = undefined;
        this.rowsError = undefined;
        this.rowsLoadingState = LoadingState.INITIALIZED;
        this.selections = undefined;
        this.selectionsError = undefined;
        this.selectionsLoadingState = LoadingState.INITIALIZED;
        this.charts = undefined;
        this.chartsError = undefined;
        this.chartsLoadingState = LoadingState.INITIALIZED;
    }

    get schemaName(): string {
        return this.schemaQuery.schemaName;
    }

    get queryName(): string {
        return this.schemaQuery.queryName;
    }

    get viewName(): string {
        return this.schemaQuery.viewName;
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

        let sortStrings = sorts.map(sortStringMapper);
        const viewSorts = queryInfo.getSorts(viewName).map(sortStringMapper).toArray();

        if (viewSorts.length > 0) {
            sortStrings = sortStrings.concat(viewSorts);
        }

        return sortStrings.join(',');
    }

    /**
     * Returns the data needed for a <Grid /> component to render.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get gridData(): Array<{ [key: string]: any }> {
        const { hasSelections, selections } = this;

        return this.orderedRows.map(value => {
            const row = this.rows[value];

            if (hasSelections) {
                return {
                    ...row,
                    [GRID_SELECTION_INDEX]: selections.has(value),
                };
            }

            return row;
        });
    }

    /**
     * Returns the data for the specified key parameter on the QueryModel.rows object.
     * If no key parameter is provided, the first data row will be returned.
     * @param key
     */
    getRow(key?: string): any {
        if (!this.rows) {
            return undefined;
        }

        if (key === undefined) {
            key = Object.keys(this.rows)[0];
        }

        return this.rows[key];
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

    get hasCharts(): boolean {
        return this.charts !== undefined;
    }

    get hasSelections(): boolean {
        return this.selections !== undefined;
    }

    get selectedState(): GRID_CHECKBOX_OPTIONS {
        const { hasSelections, hasData, isLoading, maxRows, orderedRows, selections, rowCount } = this;

        if (!isLoading && hasData && hasSelections) {
            const selectedOnPage = orderedRows.filter(rowId => selections.has(rowId)).length;

            if (selectedOnPage === maxRows && rowCount > 0) {
                return GRID_CHECKBOX_OPTIONS.ALL;
            } else if (selectedOnPage > 0) {
                // if model has any selected on the page show checkbox as indeterminate
                return GRID_CHECKBOX_OPTIONS.SOME;
            }
        }

        // Default to none.
        return GRID_CHECKBOX_OPTIONS.NONE;
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

    get isLoadingCharts(): boolean {
        const { chartsLoadingState } = this;
        return chartsLoadingState === LoadingState.INITIALIZED || chartsLoadingState === LoadingState.LOADING;
    }

    get isLoadingSelections(): boolean {
        const { selectionsLoadingState } = this;
        return selectionsLoadingState === LoadingState.INITIALIZED || selectionsLoadingState === LoadingState.LOADING;
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
    mutate(props: Partial<QueryModel>): QueryModel {
        return produce(this, (draft: Draft<QueryModel>) => {
            Object.assign(draft, props);
        });
    }
}
