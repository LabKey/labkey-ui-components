/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List, Record, Map, OrderedSet, Set } from 'immutable'
import { Location } from 'history'
import { Filter } from '@labkey/api'

import * as actions from './actions'
import { GRID_SELECTION_INDEX } from './constants'
import { getQueryGridModel } from './reducers'
import { resolveKey, resolveSchemaQuery } from './query/utils'
import { CHECKBOX_OPTIONS, EXPORT_TYPES } from './query/constants'
import { QueryColumn, QueryInfo, SchemaQuery, ViewInfo } from './query/model'
import { DefaultGridLoader } from './GridLoader'

const emptyList = List<string>();
const emptyColumns = List<QueryColumn>();
const emptyRow = Map<string, any>();

interface QueryGridModelProps {
    id?: string
    schema?: string
    query?: string

    allowSelection?: boolean
    baseFilters?: List<Filter.Filter>
    bindURL?: boolean
    data?: Map<any, Map<string, any>>
    dataIds?: List<any>
    displayColumns?: List<string>
    editable?: boolean
    editing?: boolean
    filterArray?: List<Filter.Filter>
    isError?: boolean
    isLoaded?: boolean
    isLoading?: boolean
    isPaged?: boolean
    loader?: IGridLoader
    keyValue?: any
    maxRows?: number
    message?: string
    offset?: number
    omittedColumns?: List<string>
    pageNumber?: number
    queryInfo?: QueryInfo
    requiredColumns?: List<string>
    showSearchBox?: boolean
    sortable?: boolean
    sorts?: string
    selectedIds?: List<string>
    selectedLoaded?: boolean
    selectedState?: CHECKBOX_OPTIONS
    selectedQuantity?: number
    title?: string
    totalRows?: number
    urlParams?: List<string>
    urlPrefix?: string
    view?: string
}

export class QueryGridModel extends Record({
    id: undefined,
    schema: undefined,
    query: undefined,

    allowSelection: true,
    baseFilters: List<Filter.Filter>(),
    bindURL: true,
    data: Map<any, Map<string, any>>(),
    dataIds: List<any>(),
    displayColumns: undefined,
    editable: false,
    editing: false,
    filterArray: List<Filter.Filter>(),
    isError: false,
    isLoaded: false,
    isLoading: false,
    isPaged: false,
    loader: DefaultGridLoader,
    keyValue: undefined,
    maxRows: 20,
    message: undefined,
    offset: 0,
    omittedColumns: emptyList,
    pageNumber: 1,
    queryInfo: undefined,
    requiredColumns: emptyList,
    selectedIds: emptyList,
    selectedLoaded: false,
    selectedState: CHECKBOX_OPTIONS.NONE,
    selectedQuantity: 0,
    showSearchBox: true,
    showViewSelector: true,
    showChartSelector: true,
    sortable: true,
    sorts: undefined,
    title: undefined,
    totalRows: 0,
    urlParams: List<string>(['p']), // page number parameter
    urlParamValues: Map<string, any>(),
    urlPrefix: undefined,
    view: undefined,
}) implements QueryGridModelProps {
    id: string;
    schema: string;
    query: string;

    allowSelection: boolean;
    baseFilters: List<Filter.Filter>;
    bindURL: boolean;
    data: Map<any, Map<string, any>>;
    dataIds: List<any>;
    displayColumns: List<string>;
    editable: boolean;
    editing: boolean;
    filterArray: List<Filter.Filter>;
    isError: boolean;
    isLoaded: boolean;
    isLoading: boolean;
    isPaged: boolean;
    loader: IGridLoader;
    keyValue: any;
    maxRows: number;
    message: string;
    offset: number;
    omittedColumns: List<string>;
    pageNumber: number;
    queryInfo: QueryInfo;
    requiredColumns: List<string>;
    showSearchBox: boolean;
    showViewSelector: boolean;
    showChartSelector: boolean;
    sortable: boolean;
    sorts: string;
    selectedIds: List<string>;
    selectedLoaded: boolean;
    selectedState: CHECKBOX_OPTIONS;
    selectedQuantity: number;
    title: string;
    totalRows: number;
    urlParams: List<string>;
    urlParamValues: Map<string, any>;
    urlPrefix: string;
    view: string;

    constructor(values?: QueryGridModelProps) {
        super(values);

        if (LABKEY.devMode) {
            // ensure that requiredColumns and omittedColumns do not intersect
            let i = intersect(this.requiredColumns, this.omittedColumns);
            if (i.size > 0) {
                console.log('Intersection', i.toJS());
                throw new Error('Required and omitted columns cannot intersect. Model id: "' + this.id + '". See console for colliding columns.');
            }
        }
    }

    init() {
        actions.init(this);
    }

    load() {
        actions.load(this);
    }

    doExport(type: EXPORT_TYPES) {
        return actions.doExport(this, type);
    }

    selectView(view: ViewInfo) {
        return actions.selectView(this, view);
    }

    canImport() {
        return this.showImportDataButton().get('canImport');
    }

    createParam(param: string, useDefault?: string): string {
        return this.urlPrefix ? [this.urlPrefix, param].join('.') : (useDefault ? [useDefault, param].join('.') : param);
    }

    getColumn(fieldKey: string): QueryColumn {
        if (this.queryInfo) {
            return this.queryInfo.getColumn(fieldKey);
        }
        return undefined;
    }

    /**
     * Returns the set of display columns for this QueryGridModel based on its configuration.
     * @returns {List<QueryColumn>}
     */
    getColumns(): List<QueryColumn> {
        if (this.queryInfo) {
            let cols = this.queryInfo.getDisplayColumns(this.view);

            if (this.omittedColumns.size > 0) {
                const lowerOmit = toLowerSafe(this.omittedColumns);
                return cols.filter(c => c && c.fieldKey && !lowerOmit.includes(c.fieldKey.toLowerCase())).toList();
            }

            return cols;
        }

        return emptyColumns;
    }

    getData(): List<any> {
        return this.dataIds.map((i) => {
            if (this.allowSelection) {
                const isChecked = this.selectedIds.indexOf(i) !== -1;
                if (isChecked) {
                    // only set if row is currently checked, otherwise defaults to false
                    return this.data.get(i).merge({
                        [GRID_SELECTION_INDEX]: isChecked
                    });
                }
            }

            return this.data.get(i);

        }).toList();
    }

    getExportColumnsString(): string {
        // does not include required columns -- app only
        return this.getColumns().map(c => c.fieldKey).join(',');
    }

    getFilters(): List<Filter.Filter> {
        if (this.queryInfo) {
            if (this.keyValue !== undefined) {
                if (this.queryInfo.pkCols.size === 1) {
                    return List([
                        Filter.create(this.queryInfo.pkCols.first(), this.keyValue)
                    ]);
                }
                console.warn('Too many keys. Unable to filter for specific keyValue.', this.queryInfo.pkCols.toJS());
            }

            return this.baseFilters.concat(this.queryInfo.getFilters(this.view)).concat(this.filterArray).toList();
        }

        return this.baseFilters.concat(this.filterArray).toList();
    }

    getId(): string {
        return this.id;
    }

    getInsertColumns(): List<QueryColumn> {
        if (this.queryInfo) {
            return this.queryInfo.getInsertColumns();
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
        let max = this.pageNumber > 1 ? this.pageNumber * this.maxRows : this.maxRows;

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
            .concat(this.getColumns().map(c => c.fieldKey));

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
            let sorts = this.queryInfo.getSorts(this.view);

            if (sorts.size > 0) {
                // user sorts are respected over built-in view sorts
                let allSorts = OrderedSet<string>(this.sorts ? this.sorts.split(',') : []).asMutable();
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
        if (!column || (dataId === null || dataId === undefined)) {
            return undefined;
        }

        const col: QueryColumn = (typeof column === 'string') ? this.getColumn(column) : column;

        // assumes QueryColumn fieldKey casing is same as data fieldKey casing
        return this.data.getIn([dataId, col.fieldKey, part ? part : 'value']);
    }

    showImportDataButton(): Map<any, any> {
        const query = this.queryInfo;

        if (query) {
            return Map({
                canImport: query.showInsertNewButton && query.importUrl && !query.importUrlDisabled,
                importUrl: query.importUrl
            });
        }

        return Map({
            canImport: false,
            importUrl: undefined
        });
    }

    showInsertNewButton(): Map<any, any> {
        const query = this.queryInfo;

        if (query) {
            return Map({
                canInsert: query.showInsertNewButton && query.insertUrl && !query.insertUrlDisabled,
                insertUrl: query.insertUrl
            });
        }
        return Map({
            canInsert: false,
            insertUrl: false
        });
    }
}

interface IStateModelProps {
    allowSelection?: boolean
    baseFilters?: List<Filter.Filter>
    bindURL?: boolean
    editable?: boolean
    isPaged?: boolean
    loader?: IGridLoader
    maxRows?: number
    queryInfo?: QueryInfo
    requiredColumns?: List<string>
    sorts?: string
    sortable?: boolean
    title?: string
    urlPrefix?: string
    omittedColumns?: List<string>
}

export function getStateModelId(gridId: string, schemaQuery: SchemaQuery, keyValue?: any): string {
    let parts = [gridId, resolveSchemaQuery(schemaQuery)];

    if (schemaQuery.viewName) {
        parts.push(schemaQuery.viewName);
    }
    if (keyValue !== undefined) {
        parts.push(keyValue);
    }

    return parts.join('|').toLowerCase();
}

/**
 * Used to create a QueryGridModel, based on some initial props, that can be put into the global state.
 * @param gridId
 * @param schemaQuery
 * @param [initProps] can be either a props object or a function that returns a props object. The advantage of using
 * a function is that it is only called once for the lifetime of the model thus saving cycles constructing the prop
 * object.
 * @param [keyValue]
 * @returns {QueryGridModel}
 */
export function getStateQueryGridModel(
    gridId: string,
    schemaQuery: SchemaQuery,
    initProps?: IStateModelProps | Function, // () => IStateModelProps
    keyValue?: any
): QueryGridModel {
    const modelId = getStateModelId(gridId, schemaQuery, keyValue);

    // if the model already exists in the global state, return it
    const model = getQueryGridModel(modelId, false);
    if (model) {
        return model;
    }

    let modelProps: Partial<QueryGridModelProps> = {
        allowSelection: true,
        baseFilters: List<Filter.Filter>(),
        bindURL: true,
        editable: false,
        id: modelId,
        isPaged: false, // Figure out how to set this to the same default value as the model
        loader: DefaultGridLoader,
        keyValue: undefined,
        maxRows: 20,
        schema: schemaQuery.schemaName,
        query: schemaQuery.queryName,
        queryInfo: undefined,
        requiredColumns: emptyList,
        sorts: undefined,
        sortable: true,
        title: undefined,
        urlPrefix: undefined,
        view: schemaQuery.viewName,
        omittedColumns: emptyList
    };

    if (keyValue !== undefined) {
        modelProps.keyValue = keyValue;

        if (schemaQuery.viewName === undefined) {
            modelProps.view = ViewInfo.DETAIL_NAME;
            modelProps.bindURL = false;
        }
    }

    let props: IStateModelProps;
    if (initProps !== undefined) {
        props = typeof initProps === 'function' ? initProps() : initProps;

        if (props) {
            if (props.bindURL !== undefined) {
                modelProps.bindURL = props.bindURL === true;
            }

            if (props.isPaged !== undefined) {
                modelProps.isPaged = props.isPaged === true;
            }

            if (props.loader !== undefined) {
                modelProps.loader = props.loader;
            }

            if (props.queryInfo !== undefined) {
                modelProps.queryInfo = props.queryInfo;
            }

            if (props.maxRows !== undefined) {
                modelProps.maxRows = props.maxRows;
            }

            if (props.baseFilters) {
                modelProps.baseFilters = props.baseFilters;
            }

            if (props.requiredColumns !== undefined) {
                modelProps.requiredColumns = props.requiredColumns;
            }
            if (props.urlPrefix !== undefined) {
                modelProps.urlPrefix = props.urlPrefix;
            }

            if (props.title !== undefined) {
                modelProps.title = props.title;
            }

            if (props.allowSelection !== undefined) {
                modelProps.allowSelection = props.allowSelection;
            }

            if (props.editable !== undefined) {
                modelProps.editable = props.editable;
            }

            if (props.sortable !== undefined) {
                modelProps.sortable = props.sortable;
            }

            if (props.sorts !== undefined) {
                modelProps.sorts = props.sorts;
            }

            if (props.omittedColumns !== undefined) {
                modelProps.omittedColumns = props.omittedColumns;
            }
        }
    }

    return new QueryGridModel(modelProps);
}

export interface IGridLoader {
    fetch: (model: QueryGridModel, location: Location) => Promise<IGridResponse>
    fetchSelection?: (model: QueryGridModel) => Promise<IGridSelectionResponse>
}

export interface IGridResponse {
    data: Map<any, any>,
    dataIds: List<any>,
    totalRows?: number
}

export interface IGridSelectionResponse {
    selectedIds: List<any>
}


/* Utility function */ // TODO should these be moved to a more central / shared location

// Returns a case-insensitive intersection of two List<string>.
function intersect(a: List<string>, b: List<string>): List<string> {
    if (!a || !b || a.size === 0 || b.size === 0) {
        return emptyList;
    }

    const sa = a.reduce(toLowerReducer, Set<string>().asMutable()).asImmutable();
    const sb = b.reduce(toLowerReducer, Set<string>().asMutable()).asImmutable();

    return sa.intersect(sb).toList();
}

// Returns a copy of List<string> and ensures that in copy all values are lower case strings.
function toLowerSafe(a: List<string>): List<string> {
    if (a) {
        return a
            .filter(v => typeof v === 'string')
            .map(v => v.toLowerCase())
            .toList();
    }

    return emptyList;
}

function toLowerReducer(s: Set<string>, v: string) {
    if (typeof v === 'string') {
        s.add(v.toLowerCase());
    }
    return s;
}