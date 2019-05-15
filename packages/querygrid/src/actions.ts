/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { fromJS, List, Map, OrderedMap, Set } from 'immutable'
import { Ajax, Filter, Query, Utils } from '@labkey/api'
import $ from 'jquery'
import {
    buildURL,
    getSortFromUrl,
    GRID_CHECKBOX_OPTIONS,
    GRID_EDIT_INDEX,
    naturalSort,
    not,
    QueryColumn,
    QueryGridModel,
    QueryInfo,
    SchemaQuery,
    ViewInfo
} from '@glass/base'

import { getQueryDetails, searchRows } from './query/api'
import { isEqual } from './query/filter'
import { buildQueryString, getLocation, replaceParameter, replaceParameters } from './util/URL'
import {
    EXPORT_TYPES,
    FASTA_EXPORT_CONTROLLER,
    GENBANK_EXPORT_CONTROLLER,
    KEYS,
    LOOKUP_DEFAULT_SIZE,
    MODIFICATION_TYPES,
    SELECTION_TYPES
} from "./constants";
import { cancelEvent, getPasteValue, setCopyValue } from './events'
import {
    CellMessage,
    CellMessages,
    CellValues,
    DataViewInfo,
    EditorModel,
    EditorModelProps,
    LookupStore,
    ValueDescriptor,
    VisualizationConfigModel
} from './model'
import { bindColumnRenderers } from './renderers'
import {
    getEditorModel,
    getLookupStore,
    getQueryGridModel,
    getQueryGridModelsForGridId,
    getQueryGridModelsForSchema,
    getQueryGridModelsForSchemaQuery,
    removeQueryGridModel,
    updateEditorModel,
    updateLookupStore,
    updateQueryGridModel,
    updateSelections
} from './global'
import { EditableColumnMetadata } from "./components/editable/EditableGrid";

const EMPTY_ROW = Map<string, any>();
let ID_COUNTER = 0;

export function gridInit(model: QueryGridModel, shouldLoadData: boolean = true, connectedComponent?: React.Component) {
    if (!model || model.isLoaded || model.isLoading) {
        return;
    }

    let newModel = updateQueryGridModel(model, {}, connectedComponent, false);

    if (!newModel.isLoaded) {
        if (newModel.bindURL) {
            newModel = updateQueryGridModel(newModel, {
                isLoading: true,
                ...bindURLProps(newModel)
            }, connectedComponent);
        }
        else {
            newModel = updateQueryGridModel(newModel, {isLoading: true}, connectedComponent);
        }

        fetchQueryInfo(newModel).then(queryInfo => {
            newModel = updateQueryGridModel(newModel, {
                queryInfo: bindQueryInfo(queryInfo)
            }, connectedComponent);

            if (newModel.editable) {
                initEditorModel(newModel);
            }

            if (shouldLoadData) {
                gridLoad(newModel, connectedComponent);
            }
            else {
                newModel = updateQueryGridModel(newModel, {
                    isError: false,
                    isLoading: false,
                    isLoaded: true,
                    message: undefined
                }, connectedComponent);

                if (newModel.editable) {
                    loadDataForEditor(newModel);
                }
            }
        }).catch(reason => {
            setError(newModel, reason.message, connectedComponent);
        });
    }
    else if (shouldLoadData && hasURLChange(newModel) && newModel.bindURL) {
        newModel = updateQueryGridModel(newModel, bindURLProps(newModel), connectedComponent);
        gridLoad(newModel, connectedComponent);
    }
}

export function selectAll(key: string, schemaName: string, queryName: string, filterList: List<Filter.IFilter>): Promise<ISelectResponse> {

    const filters = filterList.reduce((prev, next)=> {
        return Object.assign(prev, {[next.getURLParameterName()]: next.getValue()});
    }, {});

    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('query', 'selectAll.api'),
            method: 'POST',
            params: Object.assign({
                schemaName,
                queryName,
                'query.selectionKey': key,
            }, filters),
            success: Utils.getCallbackWrapper((response) => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper((response) => {
                reject(response);
            }),
        });
    });
}


export function gridSelectAll(model: QueryGridModel) {

    const id = model.getId();

    selectAll(id, model.schema, model.query, model.getFilters()).then(data => {

        if (data && data.count > 0) {
            return getSelected(id).then(response => {
                updateSelections(model, {
                    selectedIds: List(response.selected)
                })

            }).catch(err => {
                const error = err ? err : {message: 'Something went wrong in selecting all items for this grid (name: ' + model.getModelName() + ', id:' + id + ')'};
                gridShowError(model, error);
            });
        }
    })

}

export function sort(model: QueryGridModel, columnIndex: string, dir: string) {
    if (model.bindURL) {
        const urlDir = dir == '+' ? '' : '-';
        replaceParameters(getLocation(), Map<string, any>({
            [model.createParam('sort')]: `${urlDir}${columnIndex}`
        }));
    }
    else {
        let newModel = updateQueryGridModel(model, {
            sorts: dir + columnIndex // TODO: Support multiple sorts
        });

        gridLoad(newModel)
    }
}

// Handle single row select/deselect from the QueryGrid checkbox column
export function toggleGridRowSelection(model: QueryGridModel, row: Map<string, any>, checked: boolean) {
    let pkValue;
    let pkCols: List<QueryColumn> = model.queryInfo.getPkCols();

    if (pkCols.size === 1) {
        let pkCol: QueryColumn = pkCols.first();
        pkValue = row.getIn([pkCol.name, 'value']);

        setSelected(model.getId(), checked, pkValue).then(response => {
            const stringKey = pkValue !== undefined ? pkValue.toString(): pkValue;
            const selected: List<string> = model.selectedIds;
            let selectedState: GRID_CHECKBOX_OPTIONS;

            if (checked) {
                // if one is checked, value cannot be 'NONE'
                const allSelected: boolean = model.data.every(d => {
                    // compare if item is already 'checked' or will be 'checked' by this action
                    let keyVal = d.getIn([pkCol.name, 'value']) !== undefined ? d.getIn([pkCol.name, 'value']).toString() : undefined;

                    return keyVal === stringKey || selected.indexOf(keyVal) !== -1;
                });

                selectedState = allSelected ? GRID_CHECKBOX_OPTIONS.ALL : GRID_CHECKBOX_OPTIONS.SOME;
            }
            else {
                // if unchecking, value cannot be 'ALL'
                const someSelected: boolean = model.data.some(d => {
                    // compare if item is already 'checked' or will be 'unchecked' by this action
                    let keyVal = d.getIn([pkCol.name, 'value']) !== undefined ? d.getIn([pkCol.name, 'value']).toString() : undefined;
                    return keyVal !== stringKey && selected.indexOf(keyVal) !== -1;
                });

                selectedState = someSelected ? GRID_CHECKBOX_OPTIONS.SOME : GRID_CHECKBOX_OPTIONS.NONE;
            }

            const selectedIds = checked ? selected.push(stringKey) : selected.delete(selected.findIndex(item => item === stringKey));

            updateQueryGridModel(model, {
                selectedState: selectedState,
                selectedQuantity: response.count,
                selectedIds: selectedIds
            });
        });
    }
    else {
        console.warn('Selection requires only one key be available. Unable to toggle selection for specific keyValue. Keys:', pkCols.toJS());
    }
}

export function toggleGridSelected(model: QueryGridModel, checked: boolean) {
    if (checked) {
        setGridSelected(model, checked);
    }
    else {
        setGridUnselected(model);
    }
}

export function clearError(model: QueryGridModel) {
    if (model.isError) {
        updateQueryGridModel(model, {
            isError: false,
            message: undefined
        });
    }
}

export function schemaGridInvalidate(schemaName: string, remove: boolean = false) {
    getQueryGridModelsForSchema(schemaName).map((model) => gridRemoveOrInvalidate(model, remove));
}

export function queryGridInvalidate(schemaQuery: SchemaQuery, remove: boolean = false) {
    getQueryGridModelsForSchemaQuery(schemaQuery).map((model) => gridRemoveOrInvalidate(model, remove));
}

export function gridIdInvalidate(gridId: string, remove: boolean = false) {
    getQueryGridModelsForGridId(gridId).map((model) => gridRemoveOrInvalidate(model, remove));
}

function gridRemoveOrInvalidate(model: QueryGridModel, remove: boolean) {
    if (remove) {
        removeQueryGridModel(model);
    }
    else {
        gridInvalidate(model);
    }
}

export function gridInvalidate(model: QueryGridModel, shouldInit: boolean = false, connectedComponent?: React.Component): QueryGridModel {
    const newModel = updateQueryGridModel(model, {
        data: Map<any, List<any>>(),
        dataIds: List<any>(),
        isError: false,
        isLoaded: false,
        isLoading: false,
        message: undefined
    }, connectedComponent);

    if (shouldInit) {
        gridInit(newModel, true, connectedComponent);
    }

    return newModel;
}

export function loadPage(model: QueryGridModel, pageNumber: number) {
    if (pageNumber !== model.pageNumber) {
        if (model.bindURL) {
            replaceParameters(getLocation(), Map<string, any>({
                [model.createParam('p')]: pageNumber > 1 ? pageNumber : undefined
            }));
        }
        else {
            let newModel = updateQueryGridModel(model, {pageNumber: pageNumber > 1 ? pageNumber : 1});
            gridLoad(newModel);
        }
    }
}

export function gridRefresh(model: QueryGridModel, connectedComponent?: React.Component) {
    if (model.allowSelection) {
        setGridUnselected(model);
    }

    gridLoad(model, connectedComponent);
}

export function reloadQueryGridModel(model: QueryGridModel) {
    const newModel = updateQueryGridModel(model, {
        isLoading: true,
        ...bindURLProps(model)
    });
    gridLoad(newModel);
}

// Takes a List<Filter.IFilter> and remove each filter from the grid model
// Alternately, the 'all' flag can be set to true to remove all filters. This
// setting takes precedence over the filters list.
export function removeFilters(model: QueryGridModel, filters?: List<Filter.IFilter>, all: boolean = false) {
    if (model.bindURL) {
        replaceParameters(getLocation(), getFilterParameters(filters, true));
    }
    else {
        let newModel = model;
        if (model.filterArray.count()) {
            if (all) {
                newModel = updateQueryGridModel(newModel, {filterArray: List<any>()});
            }
            else if (filters && filters.count()) {
                let urls = filters.reduce((urls, filter: any) => {
                    return urls.add(filter.getURLParameterName() + filter.getURLParameterValue());
                }, Set());

                let filtered = model.filterArray.filter((f: any) => {
                    return !urls.has(f.getURLParameterName() + f.getURLParameterValue());
                });

                if (filtered.count() < model.filterArray.count()) {
                    newModel = updateQueryGridModel(newModel, {filterArray: filtered});
                }
            }
        }

        gridLoad(newModel);
    }
}

export function addFilters(model: QueryGridModel, filters: List<Filter.IFilter>) {
    if (model.bindURL) {
        replaceParameters(getLocation(), getFilterParameters(filters));
    }
    else {
        if (filters.count()) {
            let newModel = updateQueryGridModel(model, {filterArray: model.filterArray.merge(filters)});
            gridLoad(newModel);
        }
    }
}

function loadDataForEditor(model: QueryGridModel, response?: any) {
    const rows: List<Map<string, any>> = response ? response.data : List();
    const columns = model.getInsertColumns();
    let cellValues = Map<string, List<ValueDescriptor>>().asMutable();

    // data is initialized in column order
    columns.forEach((col, cn) => {
        let rn = 0; // restart index, cannot use index from "rows"
        rows.forEach((row) => {
            const cellKey = genCellKey(cn, rn);
            const value = row.get(col.fieldKey);

            if (List.isList(value)) {
                // assume to be list of {displayValue, value} objects
                cellValues.set(cellKey, value.reduce((list, v) => list.push({
                    display: v.displayValue,
                    raw: v.value
                }), List<ValueDescriptor>()));
            }
            else {
                cellValues.set(cellKey, List([{
                    display: value,
                    raw: value
                }]));
            }
            rn++;
        });
    });

    const editorModel = getEditorModel(model.getId());
    updateEditorModel(editorModel, {
        colCount: columns.size,
        cellValues: cellValues.asImmutable(),
        rowCount: rows.size > 0 ? rows.size : editorModel.rowCount
    });
}

export function gridLoad(model: QueryGridModel, connectedComponent?: React.Component) {
    // validate view exists prior to initiating request
    if (model.view && model.queryInfo && !model.queryInfo.getView(model.view)) {
        setError(model, `Unable to find view "${model.view}".`);
        return;
    }

    let newModel = updateQueryGridModel(model, {isLoading: true}, connectedComponent);

    newModel.loader.fetch(newModel).then(response => {
        if (newModel.editable) {
            loadDataForEditor(newModel, response);
        }

        const { data, dataIds, totalRows } = response;
        newModel = updateQueryGridModel(newModel, {
            isError: false,
            isLoading: false,
            isLoaded: true,
            message: undefined,
            selectedState: getSelectedState(dataIds, model.selectedIds, model.maxRows, totalRows),
            totalRows,
            data,
            dataIds
        }, connectedComponent);

        if (newModel.allowSelection) {
            fetchSelectedIfNeeded(newModel);
        }
    }, payload => {
        gridShowError(payload.model, payload.error, connectedComponent);
    });
}

function bindURLProps(model: QueryGridModel): Partial<QueryGridModel> {
    let props = {
        filterArray: List<Filter.IFilter>(),
        pageNumber: 1,
        sorts: model.sorts || undefined,
        urlParamValues: Map<string, any>().asMutable(),
        view: undefined
    };

    const location = getLocation();
    const queryString = buildQueryString(location.query);
    const p = location.query.get(model.createParam('p'));
    const q = location.query.get(model.createParam('q'));
    const view = location.query.get(model.createParam('view'));

    props.filterArray = List<Filter.IFilter>(Filter.getFiltersFromUrl(queryString, model.urlPrefix))
        .concat(bindSearch(q))
        .toList();
    props.sorts = getSortFromUrl(queryString, model.urlPrefix);
    props.view = view;

    if (model.isPaged) {
        let pageNumber = parseInt(p);
        if (!isNaN(pageNumber)) {
            props.pageNumber = pageNumber;
        }
    }

    // pick up other parameters as indicated by the model
    if (model.urlParams) {
        model.urlParams.forEach((paramName) => {
            const value = location.query.get(model.createParam(paramName));
            if (value !== undefined) {
                props.urlParamValues.set(paramName, value);
            }
        });
    }

    props.urlParamValues = props.urlParamValues.asImmutable();

    return props;
}

function bindSearch(searchTerm: string): List<Filter.IFilter> {
    let searchFilters = List<Filter.IFilter>().asMutable();

    if (searchTerm) {
        searchTerm.split(';').forEach((term) => {
            if (term) {
                searchFilters.push(Filter.create('*', term, Filter.Types.Q));
            }
        });
    }

    return searchFilters.asImmutable();
}

interface IExportOptions {
    columns?: string
    filters?: List<Filter.IFilter>
    sorts?: string
    showRows?: 'ALL' | 'SELECTED' | 'UNSELECTED'
    selectionKey?: string
}

export function exportRows(type: EXPORT_TYPES, schemaQuery: SchemaQuery, options?: IExportOptions): void {

    let params: any = {
        schemaName: schemaQuery.schemaName,
        ['query.queryName']: schemaQuery.queryName,
        ['query.showRows']: options.showRows ? [options.showRows] : ['ALL'],
        ['query.selectionKey']: options.selectionKey ? options.selectionKey : undefined
    };

    if (schemaQuery.viewName) {
        params['query.viewName'] = schemaQuery.viewName;
    }

    // 32052: Apply default headers (CRSF, etc)
    for (let i in LABKEY.defaultHeaders) {
        if (LABKEY.defaultHeaders.hasOwnProperty(i)) {
            params[i] = LABKEY.defaultHeaders[i];
        }
    }

    if (type === EXPORT_TYPES.CSV) {
        params['delim'] = 'COMMA';
    }

    if (options) {
        if (options.columns) {
            params['query.columns'] = options.columns;
        }

        if (options.filters) {
            options.filters.forEach((f) => {
                if (f) {
                    params[f.getURLParameterName()] = [f.getURLParameterValue()];
                }
            })
        }

        if (options.sorts) {
            params['query.sort'] = options.sorts;
        }
    }

    let controller, action;
    if (type === EXPORT_TYPES.CSV || type === EXPORT_TYPES.TSV) {
        controller = 'query';
        action = 'exportRowsTsv.post';
    }
    else if (type === EXPORT_TYPES.EXCEL) {
        controller = 'query';
        action = 'exportRowsXLSX.post';
    }
    else if (type === EXPORT_TYPES.FASTA) {
        controller = FASTA_EXPORT_CONTROLLER;
        action = 'export.post';
        params['format'] = 'FASTA';
    }
    else if (type === EXPORT_TYPES.GENBANK) {
        controller = GENBANK_EXPORT_CONTROLLER;
        action = 'export.post';
        params['format'] = 'GENBANK';
    }
    else {
        throw new Error("Unknown export type: " + type);
    }
    const url = buildURL(controller, action, undefined, { returnURL: false });

    // POST a form
    let form = $(`<form method="POST" action="${url}">`);
    $.each(params, function(k, v) {
        form.append($(`<input type="hidden" name="${k.toString()}" value="${v}">`));
    });
    $('body').append(form);
    form.trigger( "submit" );
}

export function gridExport(model: QueryGridModel, type: EXPORT_TYPES) {
    const { allowSelection, selectedState } = model;
    const showRows = allowSelection && selectedState !== GRID_CHECKBOX_OPTIONS.NONE ? 'SELECTED' : 'ALL';

    exportRows(type, SchemaQuery.create(model.schema, model.query, model.view), {
        filters: model.getFilters(),
        columns: model.getExportColumnsString(),
        sorts: model.getSorts(),
        showRows,
        selectionKey: model.getId()
    });
}

export function gridSelectView(model: QueryGridModel, view: ViewInfo) {
    const viewName = view.isDefault ? undefined : view.name;
    replaceParameter(getLocation(), model.createParam('view'), viewName);
}

// Complex comparator to determine if the location matches the models location-sensitive properties
function hasURLChange(model: QueryGridModel): boolean {
    if (!model || !model.bindURL) {
        return false;
    }

    const nextProps = bindURLProps(model);

    // filterArray and sorts are set specially so we check those specially.
    if (!isEqual(nextProps.filterArray, model.filterArray))
        return true;
    else if (nextProps.view !== model.view)
        return true;
    else if (nextProps.sorts !== model.sorts)
        return true;

    const mismatchIndex = model.urlParams.findIndex((name) => {
        return nextProps.urlParamValues.get(name) !== model.urlParamValues.get(name)
    });

    return mismatchIndex >= 0;
}

function fetchQueryInfo(model: QueryGridModel): Promise<QueryInfo> {
    if (model.queryInfo) {
        return Promise.resolve(model.queryInfo);
    }

    return getQueryDetails({
        schemaName: model.schema,
        queryName: model.query
    })
}

function bindQueryInfo(queryInfo: QueryInfo): QueryInfo {
    if (queryInfo) {
        return queryInfo.merge({
            columns: bindColumnRenderers(queryInfo.columns)
        }) as QueryInfo;
    }

    return queryInfo;
}

function getSelectedState(dataIds: List<string>, selected: List<string>, maxRows: number, totalRows: number): GRID_CHECKBOX_OPTIONS {

    const selectedOnPage: number = dataIds.filter((id) => selected.indexOf(id) !== -1).size,
        totalSelected: number = selected.size;

    if (
        maxRows === selectedOnPage ||
        totalRows === totalSelected && totalRows !== 0 ||
        selectedOnPage === dataIds.size && selectedOnPage > 0
    ) {
        return GRID_CHECKBOX_OPTIONS.ALL;
    }
    else if (totalSelected > 0) {
        // if model has any selected show checkbox as indeterminate
        return GRID_CHECKBOX_OPTIONS.SOME;
    }

    return GRID_CHECKBOX_OPTIONS.NONE;
}

function fetchSelectedIfNeeded(model: QueryGridModel) {
    const { allowSelection, isLoaded, loader, selectedLoaded } = model;

    if (allowSelection && isLoaded && !selectedLoaded && loader.fetchSelection) {
        loader.fetchSelection(model).then(response => {
            const selectedIds = response.selectedIds;

            if (selectedIds !== undefined && selectedIds.size) {
                const { dataIds, maxRows, totalRows } = model;
                const selectedState = getSelectedState(dataIds, selectedIds, maxRows, totalRows);

                updateQueryGridModel(model, {
                    selectedLoaded: true,
                    selectedQuantity: selectedIds.size,
                    selectedIds,
                    selectedState
                });
            }
            else {
                updateQueryGridModel(model, {
                    selectedLoaded: true
                });
            }
        }, payload => {
            gridShowError(payload.model, payload.error);
        });
    }
}

interface IGetSelectedResponse {
    selected: Array<any>
}

export function getSelected(key: string): Promise<IGetSelectedResponse> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('query', 'getSelected.api', {
                key,
            }),
            success: Utils.getCallbackWrapper((response) => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper((response) => {
                reject(response);
            })
        });
    });
}

interface ISelectResponse {
    count: number
}

function clearSelected(key: string): Promise<ISelectResponse> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('query', 'clearSelected.api', {
                key,
            }),
            method: 'POST',
            success: Utils.getCallbackWrapper((response) => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper((response) => {
                reject(response);
            })
        });
    });
}

function setSelected(key: string, checked: boolean, ids: Array<string> | string): Promise<ISelectResponse> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('query', 'setSelected.api', {
                key,
                checked
            }),
            method: 'POST',
            params: {
                id: ids
            },
            success: Utils.getCallbackWrapper((response) => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper((response) => {
                reject(response);
            }),
        });
    })
}

function setGridSelected(model: QueryGridModel, checked: boolean) {
    const { dataIds } = model;
    const modelId = model.getId();

    let ids: Array<string>;
    if (dataIds && dataIds.size) {
        ids = dataIds.toArray();
    }

    setSelected(modelId, checked, ids).then(response => {
        const dataIds = model.dataIds;
        const currentSelected = model.selectedIds;

        updateQueryGridModel(model, {
            selectedIds: checked ? currentSelected.merge(dataIds) : List<string>(),
            selectedQuantity: response.count,
            selectedState: checked ? GRID_CHECKBOX_OPTIONS.ALL : GRID_CHECKBOX_OPTIONS.NONE
        });
    });
}

function setGridUnselected(model: QueryGridModel) {
    clearSelected(model.getId()).then(() => {
        updateQueryGridModel(model, {
            selectedIds: List<string>(),
            selectedQuantity: 0,
            selectedState: GRID_CHECKBOX_OPTIONS.NONE
        });
    }).catch(err => {
        const error = err ? err : {message: 'Something went wrong'};
        gridShowError(model, error);
    })
}

interface ISelectionResponse {
    resolved: boolean
    schemaQuery?: SchemaQuery
    selected: Array<any>
}

export function getSelection(location: any): Promise<ISelectionResponse> {
    if (location && location.query && location.query.selectionKey) {
        const key = location.query.selectionKey;

        return new Promise(resolve => {
            const { keys, schemaQuery } = SchemaQuery.parseSelectionKey(key);

            if (keys !== undefined) {
                return resolve({
                    resolved: true,
                    schemaQuery,
                    selected: keys.split(';')
                });
            }

            return getSelected(key).then((response) => {
                resolve({
                    resolved: true,
                    schemaQuery,
                    selected: response.selected
                });
            });
        });
    }

    return Promise.resolve({
        resolved: false,
        selected: []
    });
}

function getFilterParameters(filters: List<any>, remove: boolean = false): Map<string, string> {

    const params = {};

    filters.map((filter) => {
        if (remove) {
            params[filter.getURLParameterName()] = undefined;
        }
        else {
            params[filter.getURLParameterName()] = filter.getURLParameterValue();
        }
    });

    return Map<string, string>(params);
}

export function getVisualizationConfig(reportId: string): Promise<VisualizationConfigModel> {
    return new Promise((resolve, reject) => {
        Query.Visualization.get({
            reportId,
            name: undefined,
            schemaName: undefined,
            queryName: undefined,
            success: (response) => {
                resolve(VisualizationConfigModel.create(response.visualizationConfig));
            },
            failure: reject
        });
    });
}

export function fetchCharts(schemaQuery: SchemaQuery): Promise<List<DataViewInfo>> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('study-reports', 'getReportInfos.api', {
                schemaName: schemaQuery.getSchema(),
                queryName: schemaQuery.getQuery()
            }),
            success: Utils.getCallbackWrapper((response: any) => {
                if (response && response.success) {
                    let result = response.reports.reduce((list, rawDataViewInfo) => list.push(new DataViewInfo(rawDataViewInfo)), List<DataViewInfo>());
                    resolve(result);
                }
                else {
                    reject({
                        error: 'study-report-getReportInfos.api responded to success without success'
                    });
                }
            }),
            failure: Utils.getCallbackWrapper((error) => {
                reject(error);
            }),
        })
    });
}

function setError(model: QueryGridModel, message: string, connectedComponent?: React.Component) {
    updateQueryGridModel(model, {
        isLoading: false,
        isLoaded: true,
        isError: true,
        message
    }, connectedComponent)
}

export function gridShowError(model: QueryGridModel, error: any, connectedComponent?: React.Component) {
    setError(model, error ? (error.status ? error.status + ': ' : '') + (error.message ? error.message : error.exception) : 'Query error', connectedComponent);
}

export function genCellKey(colIdx: number, rowIdx: number): string {
    return [colIdx, rowIdx].join('-');
}

function parseCellKey(cellKey: string): {colIdx: number, rowIdx: number} {
    let [colIdx, rowIdx] = cellKey.split('-');

    return {
        colIdx: parseInt(colIdx),
        rowIdx: parseInt(rowIdx)
    }
}

function isCellEmpty(values: List<ValueDescriptor>): boolean {
    return !values || values.isEmpty() || values.some(v => v.raw === undefined || v.raw === null || v.raw === '');
}

function moveDown(colIdx: number, rowIdx: number) {
    return {colIdx, rowIdx: rowIdx + 1};
}

function moveLeft(colIdx: number, rowIdx: number) {
    return {colIdx: colIdx - 1, rowIdx};
}

function moveRight(colIdx: number, rowIdx: number) {
    return {colIdx: colIdx + 1, rowIdx};
}

function moveUp(colIdx: number, rowIdx: number) {
    return {colIdx, rowIdx: rowIdx - 1};
}

let dragLock = Map<string, boolean>().asMutable();

export function beginDrag(modelId: string, event: any) {
    return handleDrag(modelId, event, () => dragLock.set(modelId, true));
}

export function endDrag(modelId: string, event: any) {
    return handleDrag(modelId, event, () => dragLock.remove(modelId));
}

function handleDrag(modelId: string, event: any, handle: () => any) {
    const model = getEditorModel(modelId);
    if (model && !model.hasFocus()) {
        event.preventDefault();
        handle();
    }
}

export function inDrag(modelId: string): boolean {
    return dragLock.get(modelId) !== undefined;
}

function initEditorModel(model: QueryGridModel) {
    const newModel = new EditorModel({id: model.getId()});
    updateEditorModel(newModel, {}, false);
}

export function clearSelection(modelId: string) {
    const model = getEditorModel(modelId);

    if (model && (model.hasSelection() || model.hasFocus())) {
        updateEditorModel(model, {
            focusColIdx: -1,
            focusRowIdx: -1,
            selectedColIdx: -1,
            selectedRowIdx: -1,
            selectionCells: Set<string>()
        });
    }
}

export function copyEvent(modelId: string, event: any) {
    const editorModel = getEditorModel(modelId);

    if (editorModel && !editorModel.hasFocus() && editorModel.hasSelection()) {
        cancelEvent(event);
        setCopyValue(event, getCopyValue(
            editorModel,
            getQueryGridModel(modelId)
        ));
    }
}

function getCellCopyValue(valueDescriptors: List<ValueDescriptor>): string {
    let value = '';

    if (valueDescriptors && valueDescriptors.size > 0) {
        let sep = '';
        value = valueDescriptors.reduce((agg, vd) => {
            agg += sep + ((vd.display !== undefined) ? vd.display.toString().trim() : '');
            sep = ', ';
            return agg;
        }, value);
    }

    return value;
}

function getCopyValue(model: EditorModel, queryModel: QueryGridModel): string {
    let copyValue = '';
    let EOL = '\n';

    if (model && queryModel && model.hasSelection() && !model.hasFocus()) {
        const selectionCells = model.selectionCells.add(genCellKey(model.selectedColIdx, model.selectedRowIdx));

        for (let rn = 0; rn < model.rowCount; rn++) {
            let cellSep = '';
            let inSelection = false;

            queryModel.getInsertColumns().forEach((col, cn) => {
                const cellKey = genCellKey(cn, rn);

                if (selectionCells.contains(cellKey)) {
                    inSelection = true;
                    copyValue += cellSep + getCellCopyValue(model.cellValues.get(cellKey));
                    cellSep = '\t';
                }
            });

            if (inSelection) {
                copyValue += EOL;
            }
        }
    }

    if (copyValue[copyValue.length - 1] === EOL) {
        copyValue = copyValue.slice(0, copyValue.length - 1);
    }

    return copyValue;
}

export function focusCell(modelId: string, colIdx: number, rowIdx: number, clearValue?: boolean) {
    const cellKey = genCellKey(colIdx, rowIdx);
    const model = getEditorModel(modelId);

    let props: Partial<EditorModelProps> = {
        cellMessages: model.cellMessages.remove(cellKey),
        focusColIdx: colIdx,
        focusRowIdx: rowIdx,
        focusValue: model.getIn(['cellValues', cellKey]),
        selectedColIdx: colIdx,
        selectedRowIdx: rowIdx
    };

    if (clearValue) {
        props.cellValues = model.cellValues.set(cellKey, List<ValueDescriptor>());
    }

    updateEditorModel(model, props);
}

export function selectCell(modelId: string, colIdx: number, rowIdx: number, selection?: SELECTION_TYPES, resetValue?: boolean) {
    const model = getEditorModel(modelId);

    // check bounds
    if (model && colIdx >= 0 && rowIdx >= 0 && colIdx < model.colCount) {

        // 33855: select last row
        if (rowIdx === model.rowCount) {
            rowIdx = rowIdx - 1;
        }

        if (rowIdx < model.rowCount) {
            let props: Partial<EditorModelProps> = {
                focusColIdx: -1,
                focusRowIdx: -1,
                ...applySelection(model as EditorModel, colIdx, rowIdx, selection)
            };

            if (resetValue) {
                props.focusValue = undefined;
                props.cellValues = model.cellValues.set(genCellKey(colIdx, rowIdx), model.focusValue);
            }

            updateEditorModel(model, props);
        }
    }
}

function updateCellValues(model: EditorModel, cellKey: string, values: List<ValueDescriptor>) {
    updateEditorModel(model, {
        cellValues: model.cellValues.set(cellKey, values)
    });
}

export function modifyCell(modelId: string, colIdx: number, rowIdx: number, newValue: ValueDescriptor, mod: MODIFICATION_TYPES) {
    const cellKey = genCellKey(colIdx, rowIdx);
    const keyPath = ['cellValues', cellKey];
    const VD = List<ValueDescriptor>();

    let model = getEditorModel(modelId);
    model = updateEditorModel(model, {cellMessages: model.cellMessages.delete(cellKey)});

    if (mod === MODIFICATION_TYPES.ADD) {
        let values: List<ValueDescriptor> = model.getIn(keyPath);
        if (values !== undefined) {
            updateCellValues(model, cellKey, values.push(newValue));
        }
        else {
            updateCellValues(model, cellKey, VD.push(newValue));
        }
    }
    else if (mod === MODIFICATION_TYPES.REPLACE) {
        updateCellValues(model, cellKey, VD.push(newValue));
    }
    else if (mod === MODIFICATION_TYPES.REMOVE) {
        let values: List<ValueDescriptor> = model.getIn(keyPath);

        const idx = values.findIndex((vd) => (
            vd.display === newValue.display &&
            vd.raw === vd.raw
        ));

        if (idx > -1) {
            values = values.remove(idx);
        }

        if (values.size) {
            updateCellValues(model, cellKey, values);
        }
        else {
            updateCellValues(model, cellKey, VD);
        }
    }
    else if (mod == MODIFICATION_TYPES.REMOVE_ALL) {
        if (model.selectionCells.size > 0) {
            updateEditorModel(model, {
                cellValues: model.cellValues.reduce((map, vd, cellKey) => {
                    if (model.selectionCells.contains(cellKey)) {
                        return map.set(cellKey, VD);
                    }
                    return map.set(cellKey, vd);
                }, Map<string, List<ValueDescriptor>>()),
                cellMessages: model.cellMessages.reduce((map, msg, cellKey) => {
                    if (model.selectionCells.contains(cellKey)) {
                        return map.remove(cellKey);
                    }
                    return map.set(cellKey, msg);
                }, Map<string, CellMessage>())
            })
        }
        else {
            updateCellValues(model, cellKey, VD);
        }
    }
}

function applySelection(model: EditorModel, colIdx: number, rowIdx: number, selection?: SELECTION_TYPES): Partial<EditorModelProps> {
    let selectionCells = Set<string>().asMutable();
    const hasSelection = model.hasSelection();

    let selectedColIdx = colIdx;
    let selectedRowIdx = rowIdx;

    switch (selection) {
        case SELECTION_TYPES.ALL:
            for (let c = 0; c < model.colCount; c++) {
                for (let r = 0; r < model.rowCount; r++) {
                    selectionCells.add(genCellKey(c, r));
                }
            }
            break;
        case SELECTION_TYPES.AREA:
            selectedColIdx = model.selectedColIdx;
            selectedRowIdx = model.selectedRowIdx;

            if (hasSelection) {
                const upperLeft = [
                    Math.min(model.selectedColIdx, colIdx),
                    Math.min(model.selectedRowIdx, rowIdx)
                ];

                const bottomRight = [
                    Math.max(model.selectedColIdx, colIdx),
                    Math.max(model.selectedRowIdx, rowIdx)
                ];

                const maxColumn = Math.min(bottomRight[0], model.colCount - 1);
                const maxRow = Math.min(bottomRight[1], model.rowCount - 1);

                for (let c = upperLeft[0]; c <= maxColumn; c++) {
                    for (let r = upperLeft[1]; r <= maxRow; r++) {
                        selectionCells.add(genCellKey(c, r));
                    }
                }
            }
            break;
        case SELECTION_TYPES.SINGLE:
            selectionCells = model.selectionCells.add(genCellKey(colIdx, rowIdx));
            break;
    }

    if (selectionCells.size > 0) {
        // if a cell was previously selected and there are remaining selectionCells then mark the previously
        // selected cell as in "selection"
        if (hasSelection) {
            selectionCells.add(genCellKey(model.selectedColIdx, model.selectedRowIdx));
        }
    }

    return {
        selectedColIdx,
        selectedRowIdx,
        selectionCells: selectionCells.asImmutable()
    };
}

export function initLookup(column: QueryColumn, maxRows: number, values?: List<string>) {
    if (shouldInitLookup(column, values)) {
        const store = new LookupStore({
            key: LookupStore.key(column),
            isLoaded: false,
            isLoading: true
        });
        updateLookupStore(store, {}, false);

        return searchLookup(column, maxRows, undefined, values);
    }

    return Promise.resolve();
}

function shouldInitLookup(col: QueryColumn, values?: List<string>): boolean {
    if (!col.isLookup()) {
        return false;
    }

    const lookup = getLookupStore(col);

    if (!lookup) {
        return true;
    }
    else if (!lookup.isLoading && !lookup.isLoaded) {
        return true;
    }
    else if (values && !lookup.containsAll(values)) {
        return true;
    }

    return false;
}

export function searchLookup(column: QueryColumn, maxRows: number, token?: string,  values?: List<string>) {
    let store = getLookupStore(column);

    // prevent redundant search
    if (store && (token !== store.lastToken || values)) {
        store = updateLookupStore(store, {
            isLoaded: false,
            isLoading: true,
            lastToken: token,
            loadCount: store.loadCount + 1
        });

        const lookup = column.lookup;

        let selectRowOptions: any = {
            schemaName: lookup.schemaName,
            queryName: lookup.queryName,
            columns: [lookup.displayColumn,lookup.keyColumn].join(','),
            maxRows
        };

        if (values) {
            selectRowOptions.filterArray = [
                Filter.create(column.lookup.displayColumn, values.toArray(), Filter.Types.IN)
            ];
        }

        return searchRows(selectRowOptions, token, lookup.displayColumn).then((result) => {
            const {displayColumn, keyColumn} = column.lookup;
            const {key, models, totalRows} = result;

            if (models[key]) {
                let descriptors = fromJS(models[key])
                    .reduce((list, row) => {
                        const key = row.getIn([keyColumn, 'value']);

                        if (key !== undefined && key !== null) {
                            return list.push({
                                display: row.getIn([displayColumn, 'displayValue']) || row.getIn([displayColumn, 'value']),
                                raw: key
                            });
                        }
                    }, List<ValueDescriptor>()).sortBy(vd => vd.display, naturalSort)
                    .reduce((map, vd) => map.set(vd.raw, vd), OrderedMap<any, ValueDescriptor>());

                updateLookupStore(store, {
                    isLoaded: true,
                    isLoading: false,
                    matchCount: totalRows,
                    descriptors
                });
            }
        });
    }
}

function getLookupDisplayValue(column: QueryColumn, lookup: LookupStore, value: any) {

    if (value === undefined || value === null || typeof(value) === 'string') {
        return {
            values: List([{
                display: value,
                raw: value
            }])
        };
    }

    let message: CellMessage;
    let values = List<ValueDescriptor>();

    const valueDescriptor = lookup.descriptors.find(d => d.raw && d.raw === value);
    if (!valueDescriptor) {
        message = {
            message: 'Could not find data for ' + value
        }
    }
    else {
        values = values.push(valueDescriptor);
    }

    return {
        message,
        values
    }
}

export function updateEditorData(gridModel: QueryGridModel, data: List<any>, count: number, rowMin: number = 0, colMin: number = 0) : EditorModel {
    const columns = gridModel.getInsertColumns();
    const editorModel = getEditorModel(gridModel.getId());

    const getLookup = (col: QueryColumn) => getLookupStore(col);
    let cellMessages = editorModel.cellMessages;
    let cellValues = editorModel.cellValues;
    let selectionCells = Set<string>();

    let values = List<List<ValueDescriptor>>();
    let messages = List<CellMessage>();

    data.forEach((value, cn) => {

        const colIdx = colMin + cn;
        const col = columns.get(colIdx);

        let cv: List<ValueDescriptor>;
        let msg: CellMessage;

        if (col && col.isLookup()) {
            const {message, values} = getLookupDisplayValue(col, getLookup(col), value);
            cv = values;
            if (message) {
                msg = message;
            }
        } else {
            cv = List([{
                display: value,
                raw: value
            }]);
        }

        if (msg) {
            messages = messages.push(msg);
        } else {
            messages = messages.push(undefined);
        }

        values = values.push(cv);
    });

    for (let rowIdx = rowMin; rowIdx < rowMin + count; rowIdx++) {
        data.forEach((value, cn) => {

            const colIdx = colMin + cn;
            const col = columns.get(colIdx);
            const cellKey = genCellKey(colIdx, rowIdx);

            cellMessages = cellMessages.set(cellKey, messages.get(cn));
            selectionCells = selectionCells.add(cellKey);
            cellValues = cellValues.set(cellKey, values.get(cn));
        });
    }

    return updateEditorModel(editorModel, {
        cellValues,
        cellMessages,
        selectionCells,
        rowCount: editorModel.rowCount + count});
}

export function pasteEvent(modelId: string, event: any, onBefore?: any, onComplete?: any, columnMetadata?: Map<string, EditableColumnMetadata>) {
    const model = getEditorModel(modelId);

    // If a cell has focus do not accept incoming paste events -- allow for normal paste to input
    if (model && model.hasSelection() && !model.hasFocus()) {
        cancelEvent(event);
        pasteCell(modelId, model.selectedColIdx, model.selectedRowIdx, getPasteValue(event), onBefore, onComplete, columnMetadata);
    }
}

function pasteCell(modelId: string, colIdx: number, rowIdx: number, value: any, onBefore?: any, onComplete?: any, columnMetadata?: Map<string, EditableColumnMetadata>) {
    const gridModel = getQueryGridModel(modelId);
    let model = getEditorModel(modelId);

    if (model) {
        const paste = validatePaste(model, colIdx, rowIdx, value);

        if (paste.success) {
            if (onBefore) {
                onBefore();
            }
            model = beginPaste(model, paste.payload.data.size);

            if (paste.rowsToAdd > 0) {
                model = addRows(gridModel, paste.rowsToAdd);
            }

            const byColumnValues = getPasteValuesByColumn(paste);
            // prior to load, ensure lookup column stores are loaded
            const columnLoaders: Array<any> = gridModel.getInsertColumns().reduce((arr, column, index) => {
                if (index >= paste.coordinates.colMin && index <= paste.coordinates.colMax && byColumnValues.get(index - paste.coordinates.colMin).size > 0)
                    arr.push(initLookup(column, undefined, byColumnValues.get(index - paste.coordinates.colMin)));
                else
                    arr.push(initLookup(column, LOOKUP_DEFAULT_SIZE));
                return arr;
            }, []);

            Promise.all(columnLoaders)
                .then(() => {
                    return pasteCellLoad(model, gridModel, paste, (col: QueryColumn) => getLookupStore(col), columnMetadata)
                        .then((payload) => {
                            model = updateEditorModel(model, {
                                cellMessages: payload.cellMessages,
                                cellValues: payload.cellValues,
                                selectionCells: payload.selectionCells
                            });

                            model = endPaste(model);
                        });
                })
                .then(() => {
                    if (onComplete) {
                        onComplete();
                    }
                });
        }
        else {
            const cellKey = genCellKey(colIdx, rowIdx);
            model = updateEditorModel(model, {
                cellMessages: model.cellMessages.set(cellKey, {message: paste.message} as CellMessage)
            });
        }
    }
}

function endPaste(model: EditorModel): EditorModel {
    return updateEditorModel(model, {
        isPasting: false,
        numPastedRows: 0
    });
}

function validatePaste(model: EditorModel, colMin: number, rowMin: number, value: any): IPasteModel {
    const maxRowPaste = 1000;
    const payload = parsePaste(value);

    const coordinates = {
        colMax: colMin + payload.numCols - 1,
        colMin,
        rowMax: rowMin + payload.numRows - 1,
        rowMin
    };

    let paste: IPasteModel = {
        coordinates,
        payload,
        rowsToAdd: Math.max(0, (coordinates.rowMin + payload.numRows) - model.rowCount),
        success: true
    };

    // If P = 1 then target can be 1 or M
    // If P = M(x,y) then target can be 1 or exact M(x,y)

    if ((coordinates.colMin !== coordinates.colMax || coordinates.rowMin !== coordinates.rowMax) && model.hasMultipleSelection()) {
        paste.success = false;
        paste.message = 'Unable to paste. Paste is not supported against multiple selections.';
    }
    else if (coordinates.colMax >= model.colCount) {
        paste.success = false;
        paste.message = 'Unable to paste. Cannot paste columns beyond the columns found in the grid.';
    }
    else if ((coordinates.rowMax - coordinates.rowMin) > maxRowPaste) {
        paste.success = false;
        paste.message = 'Unable to paste. Cannot paste more than ' + maxRowPaste + ' rows.';
    }

    return paste;
}

type IParsePastePayload = {
    data: List<List<string>>
    numCols: number
    numRows: number
}

type IPasteModel = {
    message?: string
    coordinates: {
        colMax: number
        colMin: number
        rowMax: number
        rowMin: number
    }
    payload: IParsePastePayload
    rowsToAdd: number
    success: boolean
}

function parsePaste(value: string): IParsePastePayload {
    let numCols = 0;
    let rows = List<List<string>>().asMutable();

    if (value === undefined || value === null || typeof(value) !== 'string') {
        return {
            data: rows.asImmutable(),
            numCols,
            numRows: rows.size
        }
    }

    // remove trailing newline from pasted data to avoid creating an empty row of cells
    if (value.endsWith('\n'))
        value = value.substring(0, value.length-1);

    value.split('\n').forEach((rv) => {
        const columns = List(rv.split('\t'));
        if (numCols < columns.size) {
            numCols = columns.size;
        }
        rows.push(columns);
    });

    rows = rows.map((columns) => {
        if (columns.size < numCols) {
            let remainder = [];
            for (let i = columns.size; i < numCols; i++) {
                remainder.push('');
            }
            return columns.push(...remainder);
        }
        return columns;
    }).toList();

    return {
        data: rows.asImmutable(),
        numCols,
        numRows: rows.size
    }
}

export function addColumns(model: QueryGridModel, colIndex: number, queryColumns: OrderedMap<string, QueryColumn>) : EditorModel {
    let editorModel = getEditorModel(model.getId());

    if (model.editable) {
        let newCellMessages = editorModel.cellMessages;
        let newCellValues = editorModel.cellValues;

        newCellMessages = newCellMessages.reduce((newCellMessages, message, cellKey) => {
            const [oldColIdx, oldRowIdx] = cellKey.split('-').map((v) => parseInt(v));
            if (oldColIdx >= colIndex) {
                return newCellMessages.set([oldColIdx + queryColumns.size, oldRowIdx].join('-'), message);
            } else if (oldColIdx < colIndex) {
                return newCellMessages.set(cellKey, message);
            }

            return newCellMessages;
        }, Map<string, CellMessage>());

        newCellValues = newCellValues.reduce((newCellValues, value, cellKey) => {
            const [oldColIdx, oldRowIdx] = cellKey.split('-').map((v) => parseInt(v));

            if (oldColIdx >= colIndex) {
                return newCellValues.set([oldColIdx + queryColumns.size, oldRowIdx].join('-'), value);
            } else if (oldColIdx < colIndex) {
                return newCellValues.set(cellKey, value);
            }

            return newCellValues;
        }, Map<string, List<ValueDescriptor>>());
        for (var rowIdx = 0; rowIdx < editorModel.rowCount; rowIdx++) {
            for (let c = 0; c < queryColumns.size; c++) {
                newCellValues = newCellValues.set(genCellKey(colIndex + c, rowIdx), List<ValueDescriptor>());
            }
        }

        editorModel = updateEditorModel(editorModel, {
            colCount: editorModel.colCount + queryColumns.size,
            focusColIdx: -1,
            focusRowIdx: -1,
            selectedColIdx: -1,
            selectedRowIdx: -1,
            selectionCells: Set<string>(),
            cellMessages: newCellMessages,
            cellValues: newCellValues
        });
    }

    let data = model.data;
    data = data.map((rowData) => {
        queryColumns.forEach(column => {
            rowData = rowData.set(column.fieldKey, undefined)
        });
        return rowData;
    }).toMap();

    let columns = OrderedMap<string, QueryColumn>();
    let index = 0;
    model.queryInfo.columns.forEach((column, key) => {
        if (index == colIndex) {
            columns = columns.merge(queryColumns);
        }
        else {
            columns = columns.set(key, column);
        }
        index++;
    });

    const updatedGridModel = updateQueryGridModel(model, {
        data,
        queryInfo: model.queryInfo.merge({columns}) as QueryInfo
    });

    return editorModel;
}

export function removeColumn(model: QueryGridModel, colIndex: number, fieldKey: string) {
    let editorModel = getEditorModel(model.getId());

    if (model.editable) {
        let newCellMessages = editorModel.cellMessages;
        let newCellValues = editorModel.cellValues;

        newCellMessages = newCellMessages.reduce((newCellMessages, message, cellKey) => {
            const [oldColIdx, oldRowIdx] = cellKey.split('-').map((v) => parseInt(v));
            if (oldColIdx > colIndex) {
                return newCellMessages.set([oldColIdx - 1, oldRowIdx].join('-'), message);
            } else if (oldColIdx < colIndex) {
                return newCellMessages.set(cellKey, message);
            }

            return newCellMessages;
        }, Map<string, CellMessage>());

        newCellValues = newCellValues.reduce((newCellValues, value, cellKey) => {
            const [oldColIdx, oldRowIdx] = cellKey.split('-').map((v) => parseInt(v));

            if (oldColIdx > colIndex) {
                return newCellValues.set([oldColIdx - 1, oldRowIdx].join('-'), value);
            } else if (oldColIdx < colIndex) {
                return newCellValues.set(cellKey, value);
            }

            return newCellValues;
        }, Map<string, List<ValueDescriptor>>());

        editorModel = updateEditorModel(editorModel, {
            colCount: editorModel.colCount - 1,
            focusColIdx: -1,
            focusRowIdx: -1,
            selectedColIdx: -1,
            selectedRowIdx: -1,
            selectionCells: Set<string>(),
            cellMessages: newCellMessages,
            cellValues: newCellValues
        });
    }

    // remove column from all rows in queryGridModel.data
    let data = model.data;
    data = data.map((rowData) => {
        return rowData.remove(fieldKey);
    }).toMap();

    const columns = model.queryInfo.columns.remove(fieldKey.toLowerCase());

    updateQueryGridModel(model, {
        data,
        queryInfo: model.queryInfo.merge({columns}) as QueryInfo
    });

    return editorModel;

}

function beginPaste(model: EditorModel, numRows: number): EditorModel {
    return updateEditorModel(model, {
        isPasting: true,
        numPastedRows: numRows
    });
}

export function addRows(model: QueryGridModel, count?: number, rowData?: Map<string, any>): EditorModel {
    let editorModel = getEditorModel(model.getId());

    if (count > 0) {
        if (model.editable) {
            if (rowData) {
                editorModel = updateEditorData(model, rowData.toList(), count, model.getData().size);
            }
            else {
                editorModel = updateEditorModel(editorModel, {
                    rowCount: editorModel.rowCount + count
                });
            }
        }

        let data = model.data;
        let dataIds = model.dataIds;

        for (let i = 0; i < count; i++) {
            // ensure we don't step on another ID
            let id = GRID_EDIT_INDEX + ID_COUNTER++;

            data = data.set(id, rowData || EMPTY_ROW);
            dataIds = dataIds.push(id);
        }

        updateQueryGridModel(model, {
            data,
            dataIds
        });
    }

    return editorModel;
}

// Gets the non-blank values pasted for each column.  The values in the resulting lists may not align to the rows
// pasted if there were empty cells within the paste block.
function getPasteValuesByColumn(paste: IPasteModel): List<List<string>> {
    const { data } = paste.payload;
    let valuesByColumn =  List<List<string>>().asMutable();

    for (let i=0; i< data.get(0).size; i++) {
        valuesByColumn.push(List<string>().asMutable())
    }
    data.forEach((row) => {
        row.forEach( (value, index) => {
            value.split(",").forEach(v => {
                if (v.trim().length > 0)
                    valuesByColumn.get(index).push(v.trim())
            });
        })
    });
    return valuesByColumn.asImmutable();
}

function isReadOnly(column: QueryColumn, columnMetadata: Map<string, EditableColumnMetadata>) {
    const metadata: EditableColumnMetadata = columnMetadata && columnMetadata.get(column.fieldKey);
    return (column && column.readOnly) || (metadata && metadata.readOnly);
}

function pasteCellLoad(model: EditorModel, gridModel: QueryGridModel, paste: IPasteModel, getLookup: (col: QueryColumn) => LookupStore, columnMetadata: Map<string, EditableColumnMetadata>): Promise<{ cellMessages: CellMessages; cellValues: CellValues; selectionCells: Set<string> }> {
    return new Promise((resolve) => {
        const { data } = paste.payload;
        const columns = gridModel.getInsertColumns();

        let cellMessages = model.cellMessages.asMutable();
        let cellValues = model.cellValues.asMutable();
        let selectionCells = Set<string>().asMutable();

        if (model.hasMultipleSelection()) {
            model.selectionCells.forEach((cellKey) => {
                const { colIdx } = parseCellKey(cellKey);
                const col = columns.get(colIdx);

                data.forEach((row) => {
                    row.forEach((value) => {
                        let cv: List<ValueDescriptor>;
                        let msg: CellMessage;

                        if (col && col.isLookup()) {
                            const { message, values } = parsePasteCellLookup(col, getLookup(col), value);
                            cv = values;

                            if (message) {
                                msg = message;
                            }
                        }
                        else {
                            cv = List([{
                                display: value,
                                raw: value
                            }]);
                        }

                        if (!isReadOnly(col, columnMetadata)) {
                            if (msg) {
                                cellMessages.set(cellKey, msg);
                            } else {
                                cellMessages.remove(cellKey);
                            }
                            cellValues.set(cellKey, cv);
                        }

                        selectionCells.add(cellKey);

                    });
                });
            });
        }
        else {
            const { colMin, rowMin } = paste.coordinates;

            data.forEach((row, rn) => {
                const rowIdx = rowMin + rn;
                row.forEach((value, cn) => {
                    const colIdx = colMin + cn;
                    const col = columns.get(colIdx);
                    const cellKey = genCellKey(colIdx, rowIdx);

                    let cv: List<ValueDescriptor>;
                    let msg: CellMessage;

                    if (col && col.isLookup()) {
                        const {message, values} = parsePasteCellLookup(col, getLookup(col), value);
                        cv = values;

                        if (message) {
                            msg = message;
                        }
                    } else {
                        cv = List([{
                            display: value,
                            raw: value
                        }]);
                    }

                    if (!isReadOnly(col, columnMetadata)) {
                        if (msg) {
                            cellMessages.set(cellKey, msg);
                        } else {
                            cellMessages.remove(cellKey);
                        }
                        cellValues.set(cellKey, cv);
                    }

                    selectionCells.add(cellKey);

                });
            });
        }

        resolve({
            cellMessages: cellMessages.asImmutable(),
            cellValues: cellValues.asImmutable(),
            selectionCells: selectionCells.asImmutable()
        });
    });
}

interface IParseLookupPayload {
    message?: CellMessage
    values: List<ValueDescriptor>
}

function parsePasteCellLookup(column: QueryColumn, lookup: LookupStore, value: string): IParseLookupPayload {
    if (value === undefined || value === null || typeof(value) !== 'string') {
        return {
            values: List([{
                display: value,
                raw: value
            }])
        };
    }

    let message: CellMessage;
    let unmatched: Array<string> = [];

    const values = value
        .split(',')
        .map(v => {
            const vt = v.trim();
            if (vt.length > 0) {
                const vl = vt.toLowerCase();
                const vd = lookup.descriptors.find(d => d.display && d.display.toString().toLowerCase() === vl);
                if (!vd) {
                    unmatched.push(vt);
                    return {display: vt, raw: vt};
                }
                else {
                    return vd;
                }
            }
        })
        .filter(v => v !== undefined)
        .reduce((list, v) => list.push(v), List<ValueDescriptor>());

    if (unmatched.length) {
        message = {
            message: 'Could not find data for ' + unmatched.slice(0, 4).map(u => '"' + u + '"').join(', ')
        };
    }

    return {
        message,
        values
    }
}

export function select(modelId: string, event: React.KeyboardEvent<HTMLElement>) {
    const editModel = getEditorModel(modelId);

    if (editModel && !editModel.hasFocus()) {
        let colIdx = editModel.selectedColIdx;
        let rowIdx = editModel.selectedRowIdx;

        let nextCol, nextRow;

        switch (event.keyCode) {
            case KEYS.LeftArrow:
                if (event.ctrlKey) {
                    let found = editModel.findNextCell(colIdx, rowIdx, not(isCellEmpty), moveLeft);
                    if (found) {
                        nextCol = found.colIdx;
                        nextRow = found.rowIdx;
                    }
                    else {
                        nextCol = 0;
                        nextRow = rowIdx;
                    }
                }
                else {
                    nextCol = colIdx - 1;
                    nextRow = rowIdx;
                }
                break;

            case KEYS.UpArrow:
                if (event.ctrlKey) {
                    let found = editModel.findNextCell(colIdx, rowIdx, not(isCellEmpty), moveUp);
                    if (found) {
                        nextCol = found.colIdx;
                        nextRow = found.rowIdx;
                    }
                    else {
                        nextCol = colIdx;
                        nextRow = 0;
                    }
                }
                else {
                    nextCol = colIdx;
                    nextRow = rowIdx - 1;
                }
                break;

            case KEYS.RightArrow:
                if (event.ctrlKey) {
                    let found = editModel.findNextCell(colIdx, rowIdx, not(isCellEmpty), moveRight);
                    if (found) {
                        nextCol = found.colIdx;
                        nextRow = found.rowIdx;
                    }
                    else {
                        nextCol = editModel.colCount - 1;
                        nextRow = rowIdx;
                    }
                }
                else {
                    nextCol = colIdx + 1;
                    nextRow = rowIdx;
                }
                break;

            case KEYS.DownArrow:
                if (event.ctrlKey) {
                    let found = editModel.findNextCell(colIdx, rowIdx, not(isCellEmpty), moveDown);
                    if (found) {
                        nextCol = found.colIdx;
                        nextRow = found.rowIdx;
                    }
                    else {
                        nextCol = colIdx;
                        nextRow = editModel.rowCount - 1;
                    }
                }
                else {
                    nextCol = colIdx;
                    nextRow = rowIdx + 1;
                }
                break;

            case KEYS.Home:
                nextCol = 0;
                nextRow = rowIdx;
                break;

            case KEYS.End:
                nextCol = editModel.colCount - 1;
                nextRow = rowIdx;
                break;
        }

        if (nextCol !== undefined && nextRow !== undefined) {
            cancelEvent(event);
            selectCell(modelId, nextCol, nextRow);
        }
    }
}


export function removeRows(model: QueryGridModel, dataIdIndexes: List<number>) {
    const editorModel = getEditorModel(model.getId());

    // sort descending so we remove the data for the row with the largest index first and don't mess up the index number for other rows
    const sortedIdIndexes = dataIdIndexes.sort().reverse();

    if (model.editable) {
        let newCellMessages = editorModel.cellMessages;
        let newCellValues = editorModel.cellValues;

        sortedIdIndexes.forEach((rowIdx) => {
            newCellMessages = newCellMessages.reduce((newCellMessages, message, cellKey) => {
                const [colIdx, oldRowIdx] = cellKey.split('-').map((v) => parseInt(v));
                if (oldRowIdx > rowIdx) {
                    return newCellMessages.set([colIdx, oldRowIdx - 1].join('-'), message);
                } else if (oldRowIdx < rowIdx) {
                    return newCellMessages.set(cellKey, message);
                }

                return newCellMessages;
            }, Map<string, CellMessage>());

            newCellValues = newCellValues.reduce((newCellValues, value, cellKey) => {
                const [colIdx, oldRowIdx] = cellKey.split('-').map((v) => parseInt(v));

                if (oldRowIdx > rowIdx) {
                    return newCellValues.set([colIdx, oldRowIdx - 1].join('-'), value);
                } else if (oldRowIdx < rowIdx) {
                    return newCellValues.set(cellKey, value);
                }

                return newCellValues;
            }, Map<string, List<ValueDescriptor>>())
        });

        updateEditorModel(editorModel, {
            focusColIdx: -1,
            focusRowIdx: -1,
            rowCount: editorModel.rowCount - dataIdIndexes.size,
            selectedColIdx: -1,
            selectedRowIdx: -1,
            selectionCells: Set<string>(),
            cellMessages: newCellMessages,
            cellValues: newCellValues
        });
    }

    let data = model.data;
    let dataIds = model.dataIds;
    sortedIdIndexes.forEach((dataIdIndex) => {
        const dataId = dataIds.get(dataIdIndex);
        data = data.remove(dataId);
        dataIds = dataIds.remove(dataIdIndex);
    });

    updateQueryGridModel(model, {
        data,
        dataIds
    });
}

export function removeRow(model: QueryGridModel, dataId: any, rowIdx: number) {
    removeRows(model, List<number>([rowIdx]));
}