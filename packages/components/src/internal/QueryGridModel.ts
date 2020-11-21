import { fromJS, List, Map, OrderedSet, Record } from 'immutable';
import { Filter, Query, Utils } from '@labkey/api';
import {
    getQueryGridModel,
    QueryColumn,
    QueryInfo,
    resolveKey,
    resolveSchemaQuery,
    SchemaQuery,
    ViewInfo,
} from '..';
import { intersect, toLowerSafe } from './util/utils';

import { GRID_CHECKBOX_OPTIONS, GRID_EDIT_INDEX, GRID_SELECTION_INDEX } from './constants';
import { getQueryMetadata } from './global';
import { DefaultGridLoader } from './components/GridLoader';

const emptyList = List<string>();
const emptyColumns = List<QueryColumn>();
const emptyRow = Map<string, any>();

export function getStateModelId(gridId: string, schemaQuery: SchemaQuery, keyValue?: any): string {
    const parts = [gridId, resolveSchemaQuery(schemaQuery)];

    if (schemaQuery && schemaQuery.viewName) {
        parts.push(schemaQuery.viewName);
    }
    if (keyValue !== undefined) {
        parts.push(keyValue);
    }

    return parts.join('|').toLowerCase();
}

export type PropsInitializer = () => IQueryGridModel;

export interface IQueryGridModel {
    id?: string;
    schema?: string;
    query?: string;
    allowSelection?: boolean;
    baseFilters?: List<Filter.IFilter>;
    bindURL?: boolean;
    containerPath?: string;
    containerFilter?: Query.ContainerFilter;
    data?: Map<any, Map<string, any>>;
    dataIds?: List<any>;
    displayColumns?: List<string>;
    editable?: boolean;
    editing?: boolean;
    filterArray?: List<Filter.IFilter>;
    includeDetailsColumn?: boolean;
    includeUpdateColumn?: boolean;
    isError?: boolean;
    isLoaded?: boolean;
    isLoading?: boolean;
    isPaged?: boolean;
    keyValue?: any;
    loader?: IGridLoader;
    maxRows?: number;
    message?: string;
    messages?: List<Map<string, string>>;
    offset?: number;
    omittedColumns?: List<string>;
    pageNumber?: number;
    queryInfo?: QueryInfo;
    queryParameters?: any;
    requiredColumns?: List<string>;
    showSearchBox?: boolean;
    showViewSelector?: boolean;
    hideEmptyViewSelector?: boolean;
    showChartSelector?: boolean;
    showExport?: boolean;
    hideEmptyChartSelector?: boolean;
    sortable?: boolean;
    sorts?: string;
    selectedIds?: List<string>;
    selectedLoaded?: boolean;
    selectedState?: GRID_CHECKBOX_OPTIONS;
    selectedQuantity?: number;
    title?: string;
    totalRows?: number;
    urlParams?: List<string>;
    urlParamValues?: Map<string, any>;
    urlPrefix?: string;
    view?: string;
}

export interface IGridLoader {
    fetch: (model: QueryGridModel) => Promise<IGridResponse>;
    fetchSelection?: (model: QueryGridModel) => Promise<IGridSelectionResponse>;
}

export interface IGridResponse {
    data: Map<any, any>;
    dataIds: List<any>;
    totalRows?: number;
    messages?: List<Map<string, string>>;
}

export interface IGridSelectionResponse {
    selectedIds: List<any>;
}

export class QueryGridModel
    extends Record({
        id: undefined,
        schema: undefined,
        query: undefined,
        queryParameters: undefined, // These are the parameters used as input to a parameterized query

        allowSelection: true,
        baseFilters: List<Filter.IFilter>(),
        bindURL: true,
        containerPath: undefined,
        containerFilter: undefined,
        data: Map<any, Map<string, any>>(),
        dataIds: List<any>(),
        displayColumns: undefined,
        editable: false,
        editing: false,
        filterArray: List<Filter.IFilter>(),
        includeDetailsColumn: false,
        includeUpdateColumn: false,
        isError: false,
        isLoaded: false,
        isLoading: false,
        isPaged: false,
        keyValue: undefined,
        loader: undefined,
        maxRows: 20,
        // message is a client-only attribute used to store error messages encountered when trying to load a model. It does
        // not come from a LK server response.
        message: undefined,
        // messages comes from LK Server via the metadata object in the selectRows response. At the moment it is only used
        // to notify users that they are looking at a subset of rows due to QC Flags State.
        messages: undefined,
        offset: 0,
        omittedColumns: emptyList,
        pageNumber: 1,
        queryInfo: undefined,
        requiredColumns: emptyList,
        selectedIds: emptyList,
        selectedLoaded: false,
        selectedState: GRID_CHECKBOX_OPTIONS.NONE,
        selectedQuantity: 0,
        showSearchBox: true,
        showViewSelector: true,
        hideEmptyViewSelector: false,
        showChartSelector: true,
        showExport: true,
        hideEmptyChartSelector: false,
        sortable: true,
        sorts: undefined,
        title: undefined,
        totalRows: 0,
        urlParams: List<string>(['p', 'reportId']), // page number and reportId parameters
        urlParamValues: Map<string, any>(),
        urlPrefix: undefined, // TODO we should give each new model a default prefix?
        view: undefined,
    })
    implements IQueryGridModel {
    id: string;
    schema: string;
    query: string;
    queryParameters: any; // an object mapping parameter names to values such as {'MinTemp': '36', 'MinWeight': '90'}
    allowSelection: boolean;
    baseFilters: List<Filter.IFilter>;
    bindURL: boolean;
    containerPath?: string;
    containerFilter?: Query.ContainerFilter;
    data: Map<any, Map<string, any>>;
    dataIds: List<any>;
    displayColumns: List<string>;
    editable: boolean;
    editing: boolean;
    filterArray: List<Filter.IFilter>;
    includeDetailsColumn?: boolean;
    includeUpdateColumn?: boolean;
    isError: boolean;
    isLoaded: boolean;
    isLoading: boolean;
    isPaged: boolean;
    keyValue: any;
    loader?: IGridLoader;
    maxRows: number;
    message: string;
    messages?: List<Map<string, string>>;
    offset: number;
    omittedColumns: List<string>;
    pageNumber: number;
    queryInfo: QueryInfo;
    requiredColumns: List<string>;
    showSearchBox: boolean;
    showViewSelector: boolean;
    hideEmptyViewSelector: boolean;
    showChartSelector: boolean;
    showExport: boolean;
    hideEmptyChartSelector: boolean;
    sortable: boolean;
    sorts: string;
    selectedIds: List<string>; // should be the set of ids selected for the current view, whether filtered or not
    selectedLoaded: boolean;
    selectedState: GRID_CHECKBOX_OPTIONS;
    selectedQuantity: number; // should be the quantity in the current view, whether filtered or not
    title: string;
    totalRows: number;
    urlParams: List<string>;
    urlParamValues: Map<string, any>;
    urlPrefix: string;
    view: string;

    static EMPTY_SELECTION = {
        selectedQuantity: 0,
        selectedIds: emptyList,
        selectedState: GRID_CHECKBOX_OPTIONS.NONE,
    };

    constructor(values?: IQueryGridModel) {
        super(values);

        if (LABKEY.devMode) {
            // ensure that requiredColumns and omittedColumns do not intersect
            const i = intersect(this.requiredColumns, this.omittedColumns);
            if (i.size > 0) {
                console.log('Intersection', i.toJS());
                throw new Error(
                    'Required and omitted columns cannot intersect. Model id: "' +
                    this.id +
                    '". See console for colliding columns.'
                );
            }
        }
    }

    createParam(param: string, useDefault?: string): string {
        return this.urlPrefix ? [this.urlPrefix, param].join('.') : useDefault ? [useDefault, param].join('.') : param;
    }

    getColumn(fieldKey: string): QueryColumn {
        if (this.queryInfo) {
            return this.queryInfo.getColumn(fieldKey);
        }
        return undefined;
    }

    isRequiredColumn(fieldKey: string): boolean {
        const column = this.getColumn(fieldKey);
        return column ? column.required : false;
    }

    /**
     * Returns the set of display columns for this QueryGridModel based on its configuration.
     * @returns {List<QueryColumn>}
     */
    getDisplayColumns(): List<QueryColumn> {
        return this.queryInfo?.getDisplayColumns(this.view, this.omittedColumns) || emptyColumns;
    }

    /**
     * Returns the set of display columns for details view for this QueryGridModel based on its configuration.
     * @returns {List<QueryColumn>}
     */
    getDetailsDisplayColumns(): List<QueryColumn> {
        return this.queryInfo?.getDetailDisplayColumns(ViewInfo.DETAIL_NAME, this.omittedColumns) || emptyColumns;
    }

    /**
     * Returns the set of display columns for update view for this QueryGridModel based on its configuration.
     * @returns {List<QueryColumn>}
     */
    getUpdateDisplayColumns(): List<QueryColumn> {
        return this.queryInfo?.getUpdateDisplayColumns(ViewInfo.UPDATE_NAME, this.omittedColumns) || emptyColumns;
    }

    getColumnIndex(fieldKey: string): number {
        if (!fieldKey) return -1;

        const lcFieldKey = fieldKey.toLowerCase();
        return this.queryInfo.columns.keySeq().findIndex(column => column.toLowerCase() === lcFieldKey);
    }

    getAllColumns(): List<QueryColumn> {
        return this.queryInfo?.getAllColumns(this.view, this.omittedColumns) || emptyColumns;
    }

    getData(): List<any> {
        return this.dataIds
            .map(i => {
                if (this.allowSelection) {
                    const isChecked = this.selectedIds.indexOf(i) !== -1;
                    if (isChecked) {
                        // only set if row is currently checked, otherwise defaults to false
                        return this.data.get(i).merge({
                            [GRID_SELECTION_INDEX]: isChecked,
                        });
                    }
                }

                return this.data.get(i);
            })
            .toList();
    }

    /**
     * @returns the data for the current page that has been selected.
     */
    getSelectedData(): Map<any, Map<string, any>> {
        let dataMap = Map<any, Map<string, any>>();
        this.selectedIds.forEach(id => {
            if (this.data.has(id)) {
                dataMap = dataMap.set(id, this.data.get(id));
            }
        });
        return dataMap;
    }

    getPkData(id): any {
        const data = {};
        const queryData = this.data.get(id);
        this.queryInfo.getPkCols().forEach(pkCol => {
            const pkVal = queryData.getIn([pkCol.fieldKey]);

            if (pkVal !== undefined && pkVal !== null) {
                // when backing an editable grid, the data is a simple value, but when
                // backing a grid, it is a Map, which has type 'object'.
                data[pkCol.fieldKey] = typeof pkVal === 'object' ? pkVal.get('value') : pkVal;
            } else {
                console.warn('Unable to find value for pkCol "' + pkCol.fieldKey + '"');
            }
        });
        return data;
    }

    getSelectedDataWithKeys(data: any): any[] {
        let rows = [];
        if (!Utils.isEmptyObj(data)) {
            // walk though all the selected rows and construct an update row for each
            // using the primary keys from the original data
            rows = this.selectedIds
                .map(id => {
                    return { ...this.getPkData(id), ...data };
                })
                .toArray();
        }
        return rows;
    }

    getExportColumnsString(): string {
        // does not include required columns -- app only
        return this.getDisplayColumns()
            .map(c => c.fieldKey)
            .join(',');
    }

    isFiltered(): boolean {
        return !this.getFilters().isEmpty();
    }

    // Issue 39765: When viewing details for assays, we need to apply an "is not blank" filter on the "Replaced" column in order to
    // see replaced assay runs.  So this is the one case (we know of) where we want to apply base filters when viewing details since
    // the default view restricts the set of items found.
    // Applying other base filters will be problematic (Issue 39719) in that they could possibly exclude the row you are trying
    // to get details for.
    getDetailFilters(): List<Filter.IFilter> {
        return this.baseFilters
            ? this.baseFilters.filter(filter => filter.getColumnName().toLowerCase() === 'replaced').toList()
            : List<Filter.IFilter>();
    }

    getFilters(): List<Filter.IFilter> {
        const baseFilters = this.baseFilters || List<Filter.IFilter>();
        const filterArray = this.filterArray || List<Filter.IFilter>();
        let filterList = List<Filter.IFilter>();

        if (this.queryInfo) {
            if (this.keyValue !== undefined) {
                if (this.queryInfo.pkCols.size === 1) {
                    filterList = filterList.push(Filter.create(this.queryInfo.pkCols.first(), this.keyValue));
                } else {
                    console.warn(
                        'Too many keys. Unable to filter for specific keyValue.',
                        this.queryInfo.pkCols.toJS()
                    );
                }

                return filterList.concat(this.getDetailFilters()).toList();
            }
            return filterList
                .concat(baseFilters.concat(this.queryInfo.getFilters(this.view)).concat(filterArray))
                .toList();
        }

        return baseFilters.concat(filterArray).toList();
    }

    getId(): string {
        return this.id;
    }

    getInsertColumnIndex(fieldKey): number {
        if (!fieldKey) return -1;

        const lcFieldKey = fieldKey.toLowerCase();
        return this.getInsertColumns().findIndex(column => column.fieldKey.toLowerCase() === lcFieldKey);
    }

    getInsertColumns(): List<QueryColumn> {
        if (this.queryInfo) {
            return this.queryInfo.getInsertColumns();
        }
        return emptyColumns;
    }

    getUpdateColumns(readOnlyColumns?: List<string>): List<QueryColumn> {
        if (this.queryInfo) {
            return this.queryInfo.getUpdateColumns(readOnlyColumns);
        }
        return emptyColumns;
    }

    getKeyColumns(): List<QueryColumn> {
        if (this.queryInfo) {
            return this.queryInfo.getPkCols();
        }
        return emptyColumns;
    }

    getMaxRowIndex() {
        const max = this.pageNumber > 1 ? this.pageNumber * this.maxRows : this.maxRows;

        if (max > this.totalRows) {
            return this.totalRows;
        }

        return max;
    }

    getMaxRows() {
        return this.isPaged ? this.maxRows : undefined;
    }

    getMinRowIndex() {
        return this.getOffset() + 1;
    }

    getModelName() {
        return resolveKey(this.schema, this.query);
    }

    getOffset() {
        return this.pageNumber > 1 ? (this.pageNumber - 1) * this.maxRows : 0;
    }

    getRequestColumnsString(): string {
        let fieldKeys = this.requiredColumns
            .concat(this.getKeyColumns().map(c => c.fieldKey))
            .concat(this.getDisplayColumns().map(c => c.fieldKey));

        if (this.omittedColumns.size > 0) {
            const lowerOmit = toLowerSafe(this.omittedColumns);
            fieldKeys = fieldKeys.filter(fieldKey => fieldKey && !lowerOmit.includes(fieldKey.toLowerCase()));
        }

        return fieldKeys.join(',');
    }

    getRow(index?: number): Map<string, any> {
        if (index === undefined) {
            index = 0;
        }

        if (this.dataIds.size > index) {
            return this.data.get(this.dataIds.get(index));
        }

        return emptyRow;
    }

    getSorts(): string {
        if (this.view && this.queryInfo) {
            const sorts = this.queryInfo.getSorts(this.view);

            if (sorts.size > 0) {
                // user sorts are respected over built-in view sorts
                const allSorts = OrderedSet<string>(this.sorts ? this.sorts.split(',') : []).asMutable();
                sorts.forEach(sort => {
                    allSorts.add(sort.dir === '-' ? '-' + sort.fieldKey : sort.fieldKey);
                });
                return allSorts.toArray().join(',');
            }
        }

        return this.sorts;
    }

    getTitle(): string {
        if (this.queryInfo) {
            return this.queryInfo.queryLabel;
        }

        return this.title;
    }

    /**
     * Retrieves the value for a given dataId/column. Defaults to retrieving the "value" from the row, however,
     * it can return any part that is desired (e.g. "displayValue" or "formattedValue") by specifying the "part" argument.
     */
    getValue(column: QueryColumn | string, dataId: string, part?: string): any {
        if (!column || dataId === null || dataId === undefined) {
            return undefined;
        }

        const col: QueryColumn = typeof column === 'string' ? this.getColumn(column) : column;

        // assumes QueryColumn fieldKey casing is same as data fieldKey casing
        return this.data.getIn([dataId, col.fieldKey, part ? part : 'value']);
    }

    showImportDataButton(): boolean {
        const query = this.queryInfo;

        return query && query.showInsertNewButton && query.importUrl && !query.importUrlDisabled;
    }

    showInsertNewButton(): boolean {
        const query = this.queryInfo;

        return query && query.showInsertNewButton && query.insertUrl && !query.insertUrlDisabled;
    }

    getDataEdit(): List<Map<string, any>> {
        return this.dataIds
            .map(i => {
                if (this.data.has(i)) {
                    return this.data.get(i).merge({
                        [GRID_EDIT_INDEX]: i,
                    });
                }

                return Map<string, any>({
                    [GRID_EDIT_INDEX]: i,
                });
            })
            .toList();
    }

    getRowIdsList(useSelectedIds: boolean): List<Map<string, any>> {
        // TODO: remove this method. It looks to only be used by SampleManager in a method called deleteSamples, but
        //  that method looks to be unused.
        let rows = List<Map<string, any>>();
        if (!useSelectedIds) {
            this.getData().forEach(data => {
                rows = rows.push(Map(fromJS({ rowId: data.getIn(['RowId', 'value']) })));
            });
        } else {
            this.selectedIds.forEach(rowId => {
                rows = rows.push(Map(fromJS({ rowId })));
            });
        }

        return rows;
    }

    get selectionKey() {
        if (!this.queryInfo) {
            return undefined;
        }

        if (this.keyValue !== undefined) {
            return SchemaQuery.createAppSelectionKey(this.queryInfo.schemaQuery, [this.keyValue]);
        }

        return this.getId();
    }
}

/**
 * Used to create a QueryGridModel, based on some initial props, that can be put into the global state.
 * @param gridId
 * @param schemaQuery
 * @param [initProps] can be either a props object or a function that returns a props object.
 * @param [keyValue]
 * @returns {QueryGridModel}
 */
export function getStateQueryGridModel(
    gridId: string,
    schemaQuery: SchemaQuery,
    initProps?: IQueryGridModel | PropsInitializer,
    keyValue?: any
): QueryGridModel {
    const modelId = getStateModelId(gridId, schemaQuery, keyValue);

    // if the model already exists in the global state, return it
    const model = getQueryGridModel(modelId);

    if (model) {
        return model;
    }

    const metadata = getQueryMetadata();

    let modelProps: Partial<IQueryGridModel> = {
        keyValue,
        id: modelId,
        loader: DefaultGridLoader, // Should we make this a default on the QueryGridModel class?
        schema: schemaQuery.schemaName,
        query: schemaQuery.queryName,
        view: schemaQuery.viewName,
        hideEmptyChartSelector: metadata.get('hideEmptyChartMenu'),
        hideEmptyViewSelector: metadata.get('hideEmptyViewMenu'),
    };

    if (keyValue !== undefined && schemaQuery.viewName === undefined) {
        modelProps.view = ViewInfo.DETAIL_NAME;
        modelProps.bindURL = false;
    }

    if (initProps !== undefined) {
        const props = typeof initProps === 'function' ? initProps() : initProps;
        modelProps = {
            ...modelProps,
            ...props,
        };
    }

    return new QueryGridModel(modelProps);
}
