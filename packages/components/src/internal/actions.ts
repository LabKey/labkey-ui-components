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
import { fromJS, List, Map, OrderedMap, Set } from 'immutable';
import { ActionURL, Ajax, Filter, getServerContext, Query, Utils } from '@labkey/api';
import $ from 'jquery';

import {
    AssayDefinitionModel,
    buildURL,
    caseInsensitive,
    EditorModelProps,
    GRID_CHECKBOX_OPTIONS,
    IGridResponse,
    insertColumnFilter,
    invalidateQueryDetailsCache,
    QueryColumn,
    QueryConfig,
    QueryGridModel,
    QueryInfo,
    resolveKey,
    SchemaQuery,
} from '..';

import { getQueryDetails, selectRowsDeprecated } from './query/api';
import { isEqual } from './query/filter';
import { buildQueryString, getLocation, Location } from './util/URL';
import {
    BARTENDER_EXPORT_CONTROLLER,
    EXPORT_TYPES,
    FASTA_EXPORT_CONTROLLER,
    GENBANK_EXPORT_CONTROLLER,
    GRID_EDIT_INDEX,
} from './constants';
import { cancelEvent, getPasteValue, setCopyValue } from './events';
import {
    CellMessage,
    CellMessages,
    CellValues,
    DataViewInfo,
    EditorModel,
    getStateQueryGridModel,
    ValueDescriptor,
    VisualizationConfigModel,
} from './models';
import { bindColumnRenderers } from './renderers';
import {
    getEditorModel,
    getQueryGridModel,
    getQueryGridModelsForGridId,
    getQueryGridModelsForSchema,
    getQueryGridModelsForSchemaQuery,
    removeQueryGridModel,
    updateEditorModel,
    updateQueryGridModel,
} from './global';
import { EditableColumnMetadata } from './components/editable/EditableGrid';
import { getSortFromUrl } from './url/ActionURL';

import { intersect, parseCsvString } from './util/utils';
import { resolveErrorMessage } from './util/messaging';
import { hasModule } from './app/utils';

const EMPTY_ROW = Map<string, any>();
let ID_COUNTER = 0;

export function gridInit(model: QueryGridModel, shouldLoadData = true, connectedComponent?: React.Component): void {
    // return quickly if we don't have a model or if it is already loading
    if (!model || model.isLoading) {
        return;
    }

    // call to updateQueryGridModel to make sure this model is in the global state, if it wasn't already
    let newModel = updateQueryGridModel(model, {}, connectedComponent, false);

    if (!newModel.isLoaded) {
        if (newModel.bindURL) {
            newModel = updateQueryGridModel(
                newModel,
                {
                    isLoading: true,
                    ...bindURLProps(newModel),
                },
                connectedComponent,
                true
            );
        } else {
            newModel = updateQueryGridModel(newModel, { isLoading: true }, connectedComponent, true);
        }

        fetchQueryInfo(newModel)
            .then(queryInfo => {
                newModel = updateQueryGridModel(
                    newModel,
                    {
                        queryInfo: bindQueryInfo(queryInfo),
                    },
                    connectedComponent,
                    true
                );

                if (newModel.editable) {
                    initEditorModel(newModel);
                }

                if (shouldLoadData) {
                    gridLoad(newModel, connectedComponent);
                } else {
                    newModel = updateQueryGridModel(
                        newModel,
                        {
                            isError: false,
                            isLoading: false,
                            isLoaded: true,
                            message: undefined,
                        },
                        connectedComponent,
                        true
                    );

                    if (newModel.editable) {
                        loadDataForEditor(newModel);
                    }
                }
            })
            .catch(reason => {
                setError(newModel, resolveErrorMessage(reason, 'data'), connectedComponent);
            });
    } else if (shouldLoadData && hasURLChange(newModel) && newModel.bindURL) {
        newModel = updateQueryGridModel(
            newModel,
            { selectedLoaded: false, ...QueryGridModel.EMPTY_SELECTION, ...bindURLProps(newModel) },
            connectedComponent,
            true
        );
        gridLoad(newModel, connectedComponent);
    }
}

export function selectAll(
    key: string,
    schemaName: string,
    queryName: string,
    filterList: List<Filter.IFilter>,
    containerPath?: string,
    queryParameters?: { [key: string]: any }
): Promise<ISelectResponse> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('query', 'selectAll.api', undefined, {
                container: containerPath,
            }),
            method: 'POST',
            params: getQueryParams(key, schemaName, queryName, filterList, queryParameters),
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(
                response => {
                    console.error('Problem in selecting all items in the grid', key, schemaName, queryName, response);
                    reject(response);
                },
                this,
                true
            ),
        });
    });
}

export function schemaGridInvalidate(schemaName: string, remove = false): void {
    getQueryGridModelsForSchema(schemaName).map(model => gridClearSelectionAndInvalidate(model, remove));
}

export function queryGridInvalidate(schemaQuery: SchemaQuery, remove = false): void {
    getQueryGridModelsForSchemaQuery(schemaQuery).map(model => gridClearSelectionAndInvalidate(model, remove));
}

export function gridIdInvalidate(gridIdPrefix: string, remove = false): void {
    getQueryGridModelsForGridId(gridIdPrefix).map(model => gridClearSelectionAndInvalidate(model, remove));
}

function gridClearSelectionAndInvalidate(model: QueryGridModel, remove: boolean): void {
    if (model.allowSelection) {
        clearSelected(model.getId(), undefined, undefined, undefined, model.containerPath).then(() => {
            gridRemoveOrInvalidate(model, remove);
        });
    } else {
        gridRemoveOrInvalidate(model, remove);
    }
}

function gridRemoveOrInvalidate(model: QueryGridModel, remove: boolean): void {
    if (remove) {
        removeQueryGridModel(model);
    } else {
        gridInvalidate(model);
    }
}

export function gridInvalidate(
    model: QueryGridModel,
    shouldInit = false,
    connectedComponent?: React.Component
): QueryGridModel {
    // if the model doesn't exist in the global state, no need to invalidate it
    if (!getQueryGridModel(model.getId())) {
        return;
    }

    const newModel = updateQueryGridModel(
        model,
        {
            data: Map<any, Map<string, any>>(),
            dataIds: List<any>(),
            selectedIds: List<string>(),
            selectedQuantity: 0,
            selectedState: GRID_CHECKBOX_OPTIONS.NONE,
            selectedLoaded: false,
            isError: false,
            isLoaded: false,
            isLoading: false,
            message: undefined,
        },
        connectedComponent
    );

    if (shouldInit) {
        gridInit(newModel, true, connectedComponent);
    }

    return newModel;
}

export async function getLookupValueDescriptors(
    columns: QueryColumn[],
    rows: Map<any, Map<string, any>>,
    ids: List<any>
): Promise<{ [colKey: string]: ValueDescriptor[] }> {
    const descriptorMap = {};
    // for each lookup column, find the unique values in the rows and query for those values when they look like ids
    for (let cn = 0; cn < columns.length; cn++) {
        const col = columns[cn];
        let values = Set<number>();

        if (col.isPublicLookup()) {
            ids.forEach(id => {
                const row = rows.get(id);
                const value = row.get(col.fieldKey);
                if (Utils.isNumber(value)) {
                    values = values.add(value);
                }
            });
            if (!values.isEmpty()) {
                const { descriptors } = await findLookupValues(col, values.toArray());
                descriptorMap[col.lookupKey] = descriptors;
            }
        }
    }

    return descriptorMap;
}

async function loadDataForEditor(model: QueryGridModel, response?: any): Promise<void> {
    const rows: Map<any, Map<string, any>> = response ? response.data : Map<string, Map<string, any>>();
    const ids = response ? response.dataIds : List();
    const columns = model.queryInfo.columns.toList().filter(column => {
        return insertColumnFilter(column, false) || model.requiredColumns?.indexOf(column.fieldKey) > -1;
    });

    const cellValues = Map<string, List<ValueDescriptor>>().asMutable();

    const lookupValueDescriptors = await getLookupValueDescriptors(columns.toArray(), rows, ids);

    // data is initialized in column order
    columns.forEach((col, cn) => {
        let rn = 0; // restart index, cannot use index from "rows"
        for (const id of ids) {
            const row = rows.get(id);
            const cellKey = genCellKey(cn, rn);
            const value = row.get(col.fieldKey);

            if (List.isList(value)) {
                // assume to be list of {displayValue, value} objects
                cellValues.set(
                    cellKey,
                    value.reduce(
                        (list, v) =>
                            list.push({
                                display: v.displayValue,
                                raw: v.value,
                            }),
                        List<ValueDescriptor>()
                    )
                );
            } else {
                // Issue 37833: try resolving the value for the lookup to get the displayValue to show in the grid cell
                const valueDescriptor = { display: value, raw: value };
                if (col.isLookup() && Utils.isNumber(value)) {
                    const descriptors = lookupValueDescriptors[col.lookupKey];
                    if (descriptors) {
                        cellValues.set(cellKey, List(descriptors.filter(descriptor => descriptor.raw === value)));
                    } else {
                        cellValues.set(cellKey, List([valueDescriptor]));
                    }
                } else {
                    cellValues.set(cellKey, List([valueDescriptor]));
                }
            }
            rn++;
        }
    });

    const editorModel = getEditorModel(model.getId());
    updateEditorModel(editorModel, {
        colCount: columns.size,
        cellValues: cellValues.asImmutable(),
        deletedIds: Set<any>(), // when initially loaded, nothing has been deleted; need to clear out any ids possibly set from the last edit.
        rowCount: rows.size > 0 ? rows.size : editorModel.rowCount,
    });
}

export function gridLoad(model: QueryGridModel, connectedComponent?: React.Component): void {
    // validate view exists prior to initiating request
    if (model.view && model.queryInfo && !model.queryInfo.getView(model.view)) {
        setError(model, `Unable to find view "${model.view}".`);
        return;
    }

    let newModel = updateQueryGridModel(model, { isLoading: true }, connectedComponent, true);

    newModel.loader
        .fetch(newModel)
        .then(
            response => {
                if (newModel.editable) {
                    loadDataForEditor(newModel, response);
                }

                // data we have here is the filtered data, so totalRows is the number of items in the filtered grid.
                // model.selectedIds, however, is the selection from the previous (likely unfiltered) grid.  We need to
                // trigger a load of the selectedIds with the filter applied.
                const { data, dataIds, totalRows, messages } = response;

                // if filtered, find the selected ids that are in the set of (filtered) dataIds returned
                const filteredIds = model.isFiltered() ? intersect(dataIds, model.selectedIds) : List<string>();

                newModel = updateQueryGridModel(
                    newModel,
                    {
                        isError: false,
                        isLoading: false,
                        isLoaded: true,
                        message: undefined,
                        messages,
                        selectedState: getSelectedState(
                            dataIds,
                            model.isFiltered() ? filteredIds : model.selectedIds,
                            model.maxRows,
                            totalRows
                        ),
                        totalRows,
                        data,
                        dataIds,
                    },
                    connectedComponent,
                    true
                );

                if (newModel.allowSelection) {
                    fetchSelectedIfNeeded(newModel, connectedComponent);
                }
            },
            payload => {
                if (payload.model) {
                    setError(payload.model, resolveErrorMessage(payload.error, 'data'), connectedComponent);
                } else {
                    console.error('No model available for loading.', payload.error || payload);
                    setError(model, resolveErrorMessage(payload.error, 'data'));
                }
            }
        )
        .catch(reason => {
            setError(model, resolveErrorMessage(reason, 'data'));
        });
}

function bindURLProps(model: QueryGridModel): Partial<QueryGridModel> {
    const props = {
        filterArray: List<Filter.IFilter>(),
        pageNumber: 1,
        maxRows: model.maxRows,
        sorts: model.sorts || undefined,
        urlParamValues: Map<string, any>(),
        view: undefined,
    };

    const location = getLocation();
    const queryString = buildQueryString(location.query);
    const p = location.query.get(model.createParam('p'));
    const pageCount = location.query.get(model.createParam('pageCount'));
    const q = location.query.get(model.createParam('q'));
    const view = location.query.get(model.createParam('view'));

    props.filterArray = List<Filter.IFilter>(Filter.getFiltersFromUrl(queryString, model.urlPrefix))
        .concat(bindSearch(q))
        .toList();
    props.sorts = getSortFromUrl(queryString, model.urlPrefix);
    props.view = view ? decodeURIComponent(view) : undefined;

    if (model.isPaged) {
        const pageNumber = parseInt(p, 10);
        if (!isNaN(pageNumber)) {
            props.pageNumber = pageNumber;
        }

        let maxRows = parseInt(pageCount, 10);
        if (!isNaN(maxRows)) {
            // Issue 39420: pageCount param of negative number will result in all rows being shown in QueryGrid
            if (maxRows < 0) {
                maxRows = 0;
            }

            props.maxRows = maxRows;
        }
    }

    // pick up other parameters as indicated by the model
    if (model.urlParams) {
        model.urlParams.forEach(paramName => {
            const value = location.query.get(model.createParam(paramName));
            if (value !== undefined) {
                props.urlParamValues = props.urlParamValues.set(paramName, decodeURIComponent(value));
            }
        });
    }

    return props;
}

function bindSearch(searchTerm: string): List<Filter.IFilter> {
    const searchFilters = List<Filter.IFilter>().asMutable();

    if (searchTerm) {
        searchTerm.split(';').forEach(term => {
            if (term) {
                searchFilters.push(Filter.create('*', decodeURIComponent(term), Filter.Types.Q));
            }
        });
    }

    return searchFilters.asImmutable();
}

export interface ExportOptions {
    columns?: string;
    filters?: List<Filter.IFilter>;
    sorts?: string;
    showRows?: 'ALL' | 'SELECTED' | 'UNSELECTED';
    selectionKey?: string;
}

export function getExportParams(
    type: EXPORT_TYPES,
    schemaQuery: SchemaQuery,
    options?: ExportOptions,
    advancedOptions?: Record<string, any>
): Record<string, any> {
    let params: any = {
        schemaName: schemaQuery.schemaName,
        'query.queryName': schemaQuery.queryName,
        'query.showRows': options?.showRows ? [options.showRows] : ['ALL'],
        'query.selectionKey': options?.selectionKey ? options.selectionKey : undefined,
    };

    if (advancedOptions) params = { ...params, ...advancedOptions };

    if (schemaQuery.viewName) {
        params['query.viewName'] = schemaQuery.viewName;
    }

    // 32052: Apply default headers (CRSF, etc)
    const { defaultHeaders } = getServerContext();
    for (const i in defaultHeaders) {
        if (defaultHeaders.hasOwnProperty(i)) {
            params[i] = defaultHeaders[i];
        }
    }

    if (type === EXPORT_TYPES.CSV) {
        params['delim'] = 'COMMA';
    }

    if (options) {
        if (options.columns) {
            let columnsString = options.columns;
            if (advancedOptions && advancedOptions['includeColumn'])
                columnsString = columnsString + ',' + advancedOptions['includeColumn'].join(',');
            if (advancedOptions && advancedOptions['excludeColumn']) {
                const toExclude = advancedOptions['excludeColumn'];
                const columns = [];
                columnsString.split(',').forEach(col => {
                    if (toExclude.indexOf(col) == -1 && toExclude.indexOf(col.toLowerCase()) == -1) {
                        columns.push(col);
                    }
                });
                params['query.columns'] = columns.join(',');
            } else {
                params['query.columns'] = columnsString;
            }
        }

        if (options.filters) {
            options.filters.forEach(f => {
                if (f) {
                    if (!params[f.getURLParameterName()]) params[f.getURLParameterName()] = [];
                    params[f.getURLParameterName()].push(f.getURLParameterValue());
                }
            });
        }

        if (options.sorts) {
            params['query.sort'] = options.sorts;
        }
    }
    return params;
}

export function exportTabsXlsx(filename: string, queryForms: SchemaQuery[]): Promise<void> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('query', 'exportQueriesXLSX.api'),
            method: 'POST',
            jsonData: {
                filename,
                queryForms,
            },
            downloadFile: true,
            success: () => {
                resolve();
            },
            failure: Utils.getCallbackWrapper(error => {
                console.error('Failed to export tabular data', error);
                reject(resolveErrorMessage(error) ?? 'Unexpected error while exporting selected tabs.');
            }),
        });
    });
}

export function exportRows(type: EXPORT_TYPES, exportParams: Record<string, any>): void {
    const params = Object.assign({}, exportParams);

    let controller, action;
    if (type === EXPORT_TYPES.CSV || type === EXPORT_TYPES.TSV) {
        controller = 'query';
        action = 'exportRowsTsv.post';
    } else if (type === EXPORT_TYPES.EXCEL) {
        controller = 'query';
        action = 'exportRowsXLSX.post';
    } else if (type === EXPORT_TYPES.FASTA) {
        controller = FASTA_EXPORT_CONTROLLER;
        action = 'export.post';
        params['format'] = 'FASTA';
    } else if (type === EXPORT_TYPES.GENBANK) {
        controller = GENBANK_EXPORT_CONTROLLER;
        action = 'export.post';
        params['format'] = 'GENBANK';
    } else if (type === EXPORT_TYPES.LABEL) {
        controller = BARTENDER_EXPORT_CONTROLLER;
        action = 'printBarTenderLabels.post';
    } else {
        throw new Error('Unknown export type: ' + type);
    }

    const url = buildURL(controller, action, undefined, { returnUrl: false });

    // POST a form
    const form = $(`<form method="POST" action="${url}">`);
    $.each(params, function (k, v) {
        const safeValue = quoteEncodedValue(v);
        if (safeValue instanceof Array) {
            safeValue.forEach(val => {
                form.append($(`<input type="hidden" name="${k.toString()}" value="${val}">`));
            });
        } else form.append($(`<input type="hidden" name="${k.toString()}" value="${safeValue}">`));
    });
    $('body').append(form);
    form.trigger('submit');
}

const QUOTE_REGEX = new RegExp('"', 'g');
const QUOTE_ENTITY = '&quot;';

// Issue 45366: form value containing unescaped quotes gets truncated
export function quoteEncodedValue(rawValue: any) {
    let safeValue = rawValue;

    if (rawValue instanceof Array) {
        safeValue = [];
        rawValue.forEach(rawVal => {
            safeValue.push(_quoteEncodedValue(rawVal));
        });
    } else safeValue = _quoteEncodedValue(rawValue);

    return safeValue;
}

function _quoteEncodedValue(rawValue: any) {
    let safeValue = rawValue;
    if (typeof rawValue === 'string' && rawValue.indexOf('"') > -1) {
        safeValue = rawValue.replace(QUOTE_REGEX, QUOTE_ENTITY);
    }
    return safeValue;
}

// Complex comparator to determine if the location matches the models location-sensitive properties
function hasURLChange(model: QueryGridModel): boolean {
    if (!model || !model.bindURL) {
        return false;
    }

    const nextProps = bindURLProps(model);

    // filterArray and sorts are set specially so we check those specially.
    if (!isEqual(nextProps.filterArray, model.filterArray)) return true;
    else if (nextProps.view !== model.view) return true;
    else if (nextProps.sorts !== model.sorts) return true;

    const mismatchIndex = model.urlParams.findIndex(name => {
        return nextProps.urlParamValues.get(name) !== model.urlParamValues.get(name);
    });

    return mismatchIndex >= 0;
}

function fetchQueryInfo(model: QueryGridModel): Promise<QueryInfo> {
    if (model.queryInfo) {
        return Promise.resolve(model.queryInfo);
    }

    return getQueryDetails({
        containerPath: model.containerPath,
        schemaName: model.schema,
        queryName: model.query,
    });
}

function bindQueryInfo(queryInfo: QueryInfo): QueryInfo {
    if (queryInfo) {
        return queryInfo.merge({
            columns: bindColumnRenderers(queryInfo.columns),
        }) as QueryInfo;
    }

    return queryInfo;
}

function getSelectedState(
    dataIds: List<string>,
    selected: List<string>,
    maxRows: number,
    totalRows: number
): GRID_CHECKBOX_OPTIONS {
    const selectedOnPage: number = dataIds.filter(id => selected.indexOf(id) !== -1).size,
        totalSelected: number = selected.size; // This needs to be the number selected in the current view

    if (
        maxRows === selectedOnPage ||
        (totalRows === totalSelected && totalRows !== 0) ||
        (selectedOnPage === dataIds.size && selectedOnPage > 0)
    ) {
        return GRID_CHECKBOX_OPTIONS.ALL;
    } else if (selectedOnPage > 0) {
        // if model has any selected on the page show checkbox as indeterminate
        return GRID_CHECKBOX_OPTIONS.SOME;
    }

    return GRID_CHECKBOX_OPTIONS.NONE;
}

function fetchSelectedIfNeeded(model: QueryGridModel, connectedComponent: React.Component): void {
    const { allowSelection, isLoaded, loader, selectedLoaded } = model;

    if (allowSelection && isLoaded && !selectedLoaded && loader.fetchSelection) {
        loader.fetchSelection(model).then(
            response => {
                const selectedIds = response.selectedIds;

                if (selectedIds !== undefined && selectedIds.size) {
                    const { dataIds, maxRows, totalRows } = model;
                    const selectedState = getSelectedState(dataIds, selectedIds, maxRows, totalRows);

                    updateQueryGridModel(
                        model,
                        {
                            selectedLoaded: true,
                            selectedQuantity: selectedIds.size,
                            selectedIds,
                            selectedState,
                        },
                        connectedComponent,
                        true
                    );
                } else {
                    updateQueryGridModel(
                        model,
                        {
                            selectedLoaded: true,
                            selectedQuantity: 0,
                            selectedIds,
                        },
                        connectedComponent,
                        true
                    );
                }
            },
            payload => {
                gridShowError(payload.model, payload.error, connectedComponent);
            }
        );
    }
}

interface IGetSelectedResponse {
    selected: any[];
}

function getFilteredQueryParams(
    key: string,
    schemaName: string,
    queryName: string,
    filterList: List<Filter.IFilter>,
    queryParameters?: { [key: string]: any }
): any {
    if (schemaName && queryName && filterList && !filterList.isEmpty()) {
        return getQueryParams(key, schemaName, queryName, filterList, queryParameters);
    } else {
        return {
            key,
        };
    }
}

function getQueryParams(
    key: string,
    schemaName: string,
    queryName: string,
    filterList: List<Filter.IFilter>,
    queryParameters?: { [key: string]: any }
): any {
    const filters = filterList.reduce((prev, next) => {
        return Object.assign(prev, { [next.getURLParameterName()]: next.getURLParameterValue() });
    }, {});

    const params = {
        schemaName,
        queryName,
        'query.selectionKey': key,
    };
    if (queryParameters) {
        for (const propName in queryParameters) {
            if (queryParameters.hasOwnProperty(propName)) {
                params['query.param.' + propName] = queryParameters[propName];
            }
        }
    }
    return {
        ...params,
        ...filters,
    };
}

/**
 * Gets selected ids from a particular query view, optionally using the provided query parameters
 * @param key the selection key associated with the grid
 * @param schemaName? name of the schema for the query grid
 * @param queryName? name of the query
 * @param filterList? list of filters to use
 * @param containerPath? the container path to use for this API call
 * @param queryParameters? the parameters to the underlying query
 */
export function getSelected(
    key: string,
    schemaName?: string,
    queryName?: string,
    filterList?: List<Filter.IFilter>,
    containerPath?: string,
    queryParameters?: { [key: string]: any }
): Promise<IGetSelectedResponse> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('query', 'getSelected.api', undefined, {
                container: containerPath,
            }),
            method: 'POST',
            jsonData: getFilteredQueryParams(key, schemaName, queryName, filterList, queryParameters),
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(
                response => {
                    reject(response);
                },
                this,
                true
            ),
        });
    });
}

export interface ISelectResponse {
    count: number;
}

export function clearSelected(
    key: string,
    schemaName?: string,
    queryName?: string,
    filterList?: List<Filter.IFilter>,
    containerPath?: string,
    queryParameters?: { [key: string]: any }
): Promise<ISelectResponse> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('query', 'clearSelected.api', undefined, {
                container: containerPath,
            }),
            method: 'POST',
            jsonData: getFilteredQueryParams(key, schemaName, queryName, filterList, queryParameters),
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(
                response => {
                    console.error('Problem clearing the selection ', key, schemaName, queryName, response);
                    reject(response);
                },
                this,
                true
            ),
        });
    });
}

/**
 * Selects individual ids for a particular view
 * @param key the selection key for the grid
 * @param checked whether to set selected or unselected
 * @param ids ids to change selection for
 * @param containerPath optional path to the container for this grid.  Default is the current container path
 * @param validateIds if true, check the ids are present in dataregion before setting selection in session
 * @param schemaName? name of the schema for the query grid
 * @param queryName? name of the query
 * @param filterList? list of filters to use
 * @param queryParameters? the parameters to the underlying query
 */
export function setSelected(
    key: string,
    checked: boolean,
    ids: string[] | string,
    containerPath?: string,

    validateIds?: boolean,
    schemaName?: string,
    queryName?: string,
    filterList?: List<Filter.IFilter>,
    queryParameters?: { [key: string]: any }
): Promise<ISelectResponse> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('query', 'setSelected.api', undefined, {
                container: containerPath,
            }),
            method: 'POST',
            jsonData: {
                id: ids,
                key,
                checked,
                validateIds,
                schemaName,
                queryName,
                filterList,
                queryParameters,
            },
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(
                response => {
                    reject(response);
                },
                this,
                true
            ),
        });
    });
}

/**
 * Selects individual ids for a particular view
 * @param key the selection key for the grid
 * @param ids ids to change selection for
 * @param containerPath optional path to the container for this grid.  Default is the current container path
 */
export function replaceSelected(key: string, ids: string[] | string, containerPath?: string): Promise<ISelectResponse> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('query', 'replaceSelected.api', undefined, {
                container: containerPath,
            }),
            method: 'POST',
            jsonData: {
                key,
                id: ids,
            },
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(
                response => {
                    reject(response);
                },
                this,
                true
            ),
        });
    });
}

/**
 * Set the snapshot selections for a grid
 * @param key the selection key for the grid
 * @param ids ids to change selection for
 * @param containerPath optional path to the container for this grid.  Default is the current container path
 */
export function setSnapshotSelections(
    key: string,
    ids: string[] | string,
    containerPath?: string
): Promise<ISelectResponse> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('query', 'setSnapshotSelection.api', undefined, {
                container: containerPath,
            }),
            method: 'POST',
            jsonData: {
                key,
                id: ids,
            },
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(
                response => {
                    reject(response);
                },
                this,
                true
            ),
        });
    });
}

/**
 * Get the snapshot selections for a grid
 * @param key the selection key for the grid
 * @param containerPath optional path to the container for this grid.  Default is the current container path
 */
export function getSnapshotSelections(key: string, containerPath?: string): Promise<IGetSelectedResponse> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('query', 'getSnapshotSelection.api', undefined, {
                container: containerPath,
            }),
            method: 'POST',
            jsonData: {
                key,
            },
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(
                response => {
                    reject(response);
                },
                this,
                true
            ),
        });
    });
}

function removeAll(selected: List<string>, toDelete: List<string>): List<string> {
    toDelete.forEach(id => {
        const idx = selected.indexOf(id);
        if (idx >= 0) {
            selected = selected.delete(idx);
        }
    });
    return selected;
}

/**
 * Selects all the items on the current page of the grid.
 */
function setGridSelected(
    model: QueryGridModel,
    checked: boolean,
    onSelectionChange?: (model: QueryGridModel, row: Map<string, any>, checked: boolean) => any
): void {
    const { dataIds } = model;
    const modelId = model.getId();

    let ids: string[];
    if (dataIds && dataIds.size) {
        ids = dataIds.toArray();
    }

    setSelected(modelId, checked, ids, model.containerPath).then(response => {
        const dataIds = model.dataIds;
        let selected = model.selectedIds;

        if (checked) {
            dataIds.forEach(id => {
                if (selected.indexOf(id) < 0) {
                    selected = selected.push(id);
                }
            });
        } else {
            selected = removeAll(selected, dataIds);
        }

        const updatedModel = updateQueryGridModel(model, {
            selectedIds: selected,
            selectedQuantity: selected.size,
            selectedState: checked ? GRID_CHECKBOX_OPTIONS.ALL : GRID_CHECKBOX_OPTIONS.NONE,
        });

        if (onSelectionChange) {
            onSelectionChange(updatedModel, undefined, checked);
        }
    });
}

export function unselectAll(model: QueryGridModel): void {
    clearSelected(model.getId(), undefined, undefined, undefined, model.containerPath)
        .then(() => {
            updateQueryGridModel(model, {
                selectedIds: List<string>(),
                selectedQuantity: 0,
                selectedState: GRID_CHECKBOX_OPTIONS.NONE,
            });
        })
        .catch(err => {
            const error = err ? err : { message: 'Something went wrong' };
            gridShowError(model, error);
        });
}

interface ISelectionResponse {
    resolved: boolean;
    schemaQuery?: SchemaQuery;
    selected: any[];
}

export function getFilterListFromQuery(location: Location): List<Filter.IFilter> {
    const filters = Filter.getFiltersFromParameters(Object.assign({}, location.query));
    if (filters.length > 0) return List<Filter.IFilter>(filters);
    return undefined;
}

export function getSelection(location: any, schemaName?: string, queryName?: string): Promise<ISelectionResponse> {
    if (location?.query?.selectionKey) {
        const key = location.query.selectionKey;

        return new Promise((resolve, reject) => {
            let { keys, schemaQuery } = SchemaQuery.parseSelectionKey(key);

            if (keys !== undefined) {
                return resolve({
                    resolved: true,
                    schemaQuery,
                    selected: keys.split(';'),
                });
            }
            if (!schemaQuery) {
                if (schemaName && queryName) {
                    schemaQuery = SchemaQuery.create(schemaName, queryName);
                }
            }

            if (!schemaQuery) {
                reject(
                    'No schema found for selection with selectionKey ' +
                        location.query.selectionKey +
                        ' schemaName ' +
                        schemaName +
                        ' queryName ' +
                        queryName
                );
            }

            return getSelected(
                key,
                schemaQuery.schemaName,
                schemaQuery.queryName,
                getFilterListFromQuery(location),
                undefined,
                undefined
            ).then(response => {
                resolve({
                    resolved: true,
                    schemaQuery,
                    selected: response.selected,
                });
            });
        });
    }

    return Promise.resolve({
        resolved: false,
        selected: [],
    });
}

export function getSelectedData(
    schemaName?: string,
    queryName?: string,
    selections?: string[],
    columns?: string,
    sorts?: string,
    queryParameters?: { [key: string]: any },
    keyColumn = 'RowId'
): Promise<IGridResponse> {
    const filterArray = [];
    filterArray.push(Filter.create(keyColumn, selections, Filter.Types.IN));

    return new Promise((resolve, reject) =>
        selectRowsDeprecated({
            schemaName,
            queryName,
            filterArray,
            parameters: queryParameters,
            sort: sorts,
            columns,
            offset: 0,
        })
            .then(response => {
                const { models, orderedModels, totalRows } = response;
                const dataKey = resolveKey(schemaName, queryName);
                resolve({
                    data: fromJS(models[dataKey]),
                    dataIds: List(orderedModels[dataKey]),
                    totalRows,
                });
            })
            .catch(reason => {
                console.error(reason);
                reject(resolveErrorMessage(reason));
            })
    );
}

export function getVisualizationConfig(reportId: string): Promise<VisualizationConfigModel> {
    return new Promise((resolve, reject) => {
        Query.Visualization.get({
            reportId,
            name: undefined,
            schemaName: undefined,
            queryName: undefined,
            success: response => {
                resolve(VisualizationConfigModel.create(response.visualizationConfig));
            },
            failure: reject,
        });
    });
}

export function fetchCharts(schemaQuery: SchemaQuery, containerPath?: string): Promise<List<DataViewInfo>> {
    return new Promise((resolve, reject) => {
        // if we know we don't have the study module, no need to make the API call
        if (!hasModule('Study')) {
            resolve(List<DataViewInfo>());
            return;
        }

        Ajax.request({
            url: buildURL(
                'study-reports',
                'getReportInfos.api',
                {
                    schemaName: schemaQuery.getSchema(),
                    queryName: schemaQuery.getQuery(),
                },
                {
                    container: containerPath,
                }
            ),
            success: Utils.getCallbackWrapper((response: any) => {
                if (response && response.success) {
                    const result = response.reports.reduce(
                        (list, rawDataViewInfo) => list.push(new DataViewInfo(rawDataViewInfo)),
                        List<DataViewInfo>()
                    );
                    resolve(result);
                } else {
                    reject({
                        error: 'study-report-getReportInfos.api responded to success without success',
                    });
                }
            }),
            failure: Utils.getCallbackWrapper(
                error => {
                    reject(error);
                },
                this,
                true
            ),
        });
    });
}

function setError(model: QueryGridModel, message: string, connectedComponent?: React.Component): void {
    updateQueryGridModel(
        model,
        {
            isLoading: false,
            isLoaded: true,
            isError: true,
            message,
        },
        connectedComponent
    );
}

export function gridShowError(model: QueryGridModel, error: any, connectedComponent?: React.Component): void {
    setError(
        model,
        error ? resolveErrorMessage(error) : 'There was a problem retrieving the data.',
        connectedComponent
    );
}

export function genCellKey(colIdx: number, rowIdx: number): string {
    return [colIdx, rowIdx].join('-');
}

export function parseCellKey(cellKey: string): { colIdx: number; rowIdx: number } {
    const [colIdx, rowIdx] = cellKey.split('-');

    return {
        colIdx: parseInt(colIdx, 10),
        rowIdx: parseInt(rowIdx, 10),
    };
}

const dragLock = Map<string, boolean>().asMutable();

export function beginDrag(editorModel: EditorModel, event: any): void {
    if (handleDrag(editorModel, event)) {
        dragLock.set(editorModel.id, true);
    }
}

export function endDrag(editorModel: EditorModel, event: any): void {
    if (handleDrag(editorModel, event)) {
        dragLock.remove(editorModel.id);
    }
}

function handleDrag(editorModel: EditorModel, event: any): boolean {
    if (!editorModel.hasFocus()) {
        event.preventDefault();
        return true;
    }
    return false;
}

export function inDrag(modelId: string): boolean {
    return dragLock.get(modelId) !== undefined;
}

function initEditorModel(model: QueryGridModel): void {
    const newModel = new EditorModel({ id: model.getId() });
    updateEditorModel(newModel, {}, false);
}

export function copyEvent(editorModel: EditorModel, insertColumns: QueryColumn[], event: any): void {
    if (editorModel && !editorModel.hasFocus() && editorModel.hasSelection()) {
        cancelEvent(event);
        setCopyValue(event, getCopyValue(editorModel, insertColumns));
    }
}

function getCellCopyValue(valueDescriptors: List<ValueDescriptor>): string {
    let value = '';

    if (valueDescriptors && valueDescriptors.size > 0) {
        let sep = '';
        value = valueDescriptors.reduce((agg, vd) => {
            agg += sep + (vd.display !== undefined ? vd.display.toString().trim() : '');
            sep = ', ';
            return agg;
        }, value);
    }

    return value;
}

function getCopyValue(model: EditorModel, insertColumns: QueryColumn[]): string {
    let copyValue = '';
    const EOL = '\n';

    if (model && model.hasSelection() && !model.hasFocus()) {
        const selectionCells = model.selectionCells.add(genCellKey(model.selectedColIdx, model.selectedRowIdx));

        for (let rn = 0; rn < model.rowCount; rn++) {
            let cellSep = '';
            let inSelection = false;

            insertColumns.forEach((col, cn) => {
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

const findLookupValues = async (
    column: QueryColumn,
    lookupKeyValues?: any[],
    lookupValues?: any[]
): Promise<{ column: QueryColumn; descriptors: ValueDescriptor[] }> => {
    const lookup = column.lookup;
    const { displayColumn, keyColumn } = column.lookup;
    const selectRowsOptions: any = {
        schemaName: lookup.schemaName,
        queryName: lookup.queryName,
        columns: [displayColumn, keyColumn].join(','),
        containerPath: lookup.containerPath,
        maxRows: -1,
        includeTotalCount: 'f',
    };

    if (lookupValues) {
        selectRowsOptions.filterArray = [Filter.create(displayColumn, lookupValues, Filter.Types.IN)];
    }

    if (lookupKeyValues) {
        selectRowsOptions.filterArray = [Filter.create(keyColumn, lookupKeyValues, Filter.Types.IN)];
    }

    const result = await selectRowsDeprecated(selectRowsOptions);

    const { key, models } = result;

    const descriptors = [];
    if (models[key]) {
        Object.values(models[key]).forEach(row => {
            const key = caseInsensitive(row[keyColumn], 'value');
            if (key !== undefined && key !== null) {
                descriptors.push({
                    display:
                        caseInsensitive(row[displayColumn], 'displayValue') ||
                        caseInsensitive(row[displayColumn], 'value'),
                    raw: key,
                });
            }
        });
    }
    return {
        column,
        descriptors,
    };
};

export async function getLookupDisplayValue(
    column: QueryColumn,
    value: any
): Promise<{ message?: CellMessage; valueDescriptor: ValueDescriptor }> {
    if (value === undefined || value === null || typeof value === 'string') {
        return {
            valueDescriptor: {
                display: value,
                raw: value,
            },
        };
    }

    let message: CellMessage;

    const { descriptors } = await findLookupValues(column, [value]);
    if (!descriptors.length) {
        message = {
            message: 'Could not find data for ' + value,
        };
    }

    return {
        message,
        valueDescriptor: descriptors[0],
    };
}

export async function addRowsToEditorModel(
    rowCount: number,
    cellMessages: CellMessages,
    cellValues: CellValues,
    insertColumns: List<QueryColumn>,
    rowData: List<any>,
    numToAdd: number,
    rowMin = 0,
    colMin = 0
): Promise<Partial<EditorModel>> {
    let selectionCells = Set<string>();
    const preparedData = await prepareInsertRowDataFromBulkForm(insertColumns, rowData, 0);
    const { values, messages } = preparedData;

    for (let rowIdx = rowMin; rowIdx < rowMin + numToAdd; rowIdx++) {
        // eslint-disable-next-line no-loop-func
        rowData.forEach((value, colIdx) => {
            const cellKey = genCellKey(colIdx, rowIdx);
            cellMessages = cellMessages.set(cellKey, messages.get(colIdx));
            selectionCells = selectionCells.add(cellKey);
            cellValues = cellValues.set(cellKey, values.get(colIdx));
        });
    }

    return {
        cellValues,
        cellMessages,
        selectionCells,
        rowCount: Math.max(rowMin + Number(numToAdd), rowCount),
    };
}

async function prepareInsertRowDataFromBulkForm(
    insertColumns: List<QueryColumn>,
    rowData: List<any>,
    colMin = 0
): Promise<{ values: List<List<ValueDescriptor>>; messages: List<CellMessage> }> {
    let values = List<List<ValueDescriptor>>();
    let messages = List<CellMessage>();

    for (let cn = 0; cn < rowData.size; cn++) {
        const data = rowData.get(cn);
        const colIdx = colMin + cn;
        const col = insertColumns.get(colIdx);
        let cv: List<ValueDescriptor>;

        if (data && col && col.isLookup()) {
            cv = List<ValueDescriptor>();
            // value had better be the rowId here, but it may be several in a comma-separated list.
            // If it's the display value, which happens to be a number, much confusion will arise.
            const values = data.toString().split(',');
            for (const val of values) {
                const intVal = parseInt(val, 10);
                const { message, valueDescriptor } = await getLookupDisplayValue(col, isNaN(intVal) ? val : intVal);
                cv = cv.push(valueDescriptor);
                if (message) {
                    messages = messages.push(message);
                }
            }
        } else {
            cv = List([{ display: data, raw: data }]);
        }

        values = values.push(cv);
    }

    return {
        values,
        messages,
    };
}

export async function pasteEvent(
    editorModel: EditorModel,
    dataKeys: List<any>,
    data: Map<any, Map<string, any>>,
    queryInfo: QueryInfo,
    event: any,
    columnMetadata?: Map<string, EditableColumnMetadata>,
    readonlyRows?: List<string>,
    lockRowCount?: boolean
): Promise<EditorModelAndGridData> {
    // If a cell has focus do not accept incoming paste events -- allow for normal paste to input
    if (editorModel && editorModel.hasSelection() && !editorModel.hasFocus()) {
        cancelEvent(event);
        const value = getPasteValue(event);
        return await pasteCell(
            editorModel,
            dataKeys,
            data,
            queryInfo,
            value,
            columnMetadata,
            readonlyRows,
            lockRowCount
        );
    }

    return { data: undefined, dataKeys: undefined, editorModel: undefined };
}

async function pasteCell(
    editorModel: EditorModel,
    dataKeys: List<any>,
    data: Map<any, Map<string, any>>,
    queryInfo: QueryInfo,
    value: string,
    columnMetadata?: Map<string, EditableColumnMetadata>,
    readonlyRows?: List<string>,
    lockRowCount?: boolean
): Promise<EditorModelAndGridData> {
    const { selectedColIdx, selectedRowIdx } = editorModel;
    const readOnlyRowCount =
        readonlyRows && !lockRowCount
            ? getReadonlyRowCount(editorModel.rowCount, dataKeys, data, queryInfo, selectedRowIdx, readonlyRows)
            : 0;
    const paste = validatePaste(editorModel, selectedColIdx, selectedRowIdx, value, readOnlyRowCount);

    if (paste.success) {
        const byColumnValues = getPasteValuesByColumn(paste);
        // prior to load, ensure lookup column stores are loaded
        const columnLoaders: any[] = queryInfo.getInsertColumns().reduce((arr, column, index) => {
            if (column.isPublicLookup()) {
                const filteredLookup = getColumnFilteredLookup(column, columnMetadata);
                if (
                    index >= paste.coordinates.colMin &&
                    index <= paste.coordinates.colMax &&
                    byColumnValues.get(index - paste.coordinates.colMin).size > 0
                ) {
                    arr.push(
                        findLookupValues(
                            column,
                            undefined,
                            filteredLookup
                                ? filteredLookup.toArray()
                                : byColumnValues.get(index - paste.coordinates.colMin).toArray()
                        )
                    );
                } else if (filteredLookup) {
                    arr.push(findLookupValues(column, undefined, filteredLookup.toArray()));
                }
            }
            return arr;
        }, []);

        const results = await Promise.all(columnLoaders);
        const descriptorMap = results.reduce((reduction, result) => {
            const { column, descriptors } = result;
            reduction[column.lookupKey] = descriptors;
            return reduction;
        }, {});
        return pasteCellLoad(
            dataKeys,
            data,
            queryInfo,
            editorModel,
            paste,
            descriptorMap,
            columnMetadata,
            readonlyRows,
            lockRowCount
        );
    } else {
        const cellKey = genCellKey(selectedColIdx, selectedRowIdx);
        return {
            data: undefined,
            dataKeys: undefined,
            editorModel: { cellMessages: editorModel.cellMessages.set(cellKey, { message: paste.message }) },
        };
    }
}

function validatePaste(
    model: EditorModel,
    colMin: number,
    rowMin: number,
    value: string,
    readOnlyRowCount?: number
): IPasteModel {
    const maxRowPaste = 1000;
    const payload = parsePaste(value);

    const coordinates = {
        colMax: colMin + payload.numCols - 1,
        colMin,
        rowMax: rowMin + payload.numRows - 1,
        rowMin,
    };

    const paste: IPasteModel = {
        coordinates,
        payload,
        rowsToAdd: Math.max(
            0,
            coordinates.rowMin + payload.numRows + (readOnlyRowCount ? readOnlyRowCount : 0) - model.rowCount
        ),
        success: true,
    };

    // If P = 1 then target can be 1 or M
    // If P = M(x,y) then target can be 1 or exact M(x,y)

    if (
        (coordinates.colMin !== coordinates.colMax || coordinates.rowMin !== coordinates.rowMax) &&
        model.hasMultipleSelection()
    ) {
        paste.success = false;
        paste.message = 'Unable to paste. Paste is not supported against multiple selections.';
    } else if (coordinates.colMax >= model.colCount) {
        paste.success = false;
        paste.message = 'Unable to paste. Cannot paste columns beyond the columns found in the grid.';
    } else if (coordinates.rowMax - coordinates.rowMin > maxRowPaste) {
        paste.success = false;
        paste.message = 'Unable to paste. Cannot paste more than ' + maxRowPaste + ' rows.';
    }

    return paste;
}

type IParsePastePayload = {
    data: List<List<string>>;
    numCols: number;
    numRows: number;
};

type IPasteModel = {
    message?: string;
    coordinates: {
        colMax: number;
        colMin: number;
        rowMax: number;
        rowMin: number;
    };
    payload: IParsePastePayload;
    rowsToAdd: number;
    success: boolean;
};

function parsePaste(value: string): IParsePastePayload {
    let numCols = 0;
    let rows = List<List<string>>().asMutable();

    if (value === undefined || value === null || typeof value !== 'string') {
        return {
            data: rows.asImmutable(),
            numCols,
            numRows: rows.size,
        };
    }

    // remove trailing newline from pasted data to avoid creating an empty row of cells
    if (value.endsWith('\n')) value = value.substring(0, value.length - 1);

    value.split('\n').forEach(rv => {
        const columns = List(rv.split('\t'));
        if (numCols < columns.size) {
            numCols = columns.size;
        }
        rows.push(columns);
    });

    rows = rows
        .map(columns => {
            if (columns.size < numCols) {
                const remainder = [];
                for (let i = columns.size; i < numCols; i++) {
                    remainder.push('');
                }
                return columns.push(...remainder);
            }
            return columns;
        })
        .toList();

    return {
        data: rows.asImmutable(),
        numCols,
        numRows: rows.size,
    };
}

export function changeColumnForQueryGridModel(
    model: QueryGridModel,
    existingFieldKey: string,
    newQueryColumn: QueryColumn
): EditorModel {
    const originalEditorModel = getEditorModel(model.getId());
    const { editorModelChanges, data, queryInfo } = changeColumn(
        originalEditorModel,
        model.queryInfo,
        model.data,
        existingFieldKey,
        newQueryColumn
    );

    const updatedEditorModel = updateEditorModel(originalEditorModel, editorModelChanges);
    updateQueryGridModel(model, { data, queryInfo });
    return updatedEditorModel;
}

export function changeColumn(
    editorModel: EditorModel,
    queryInfo: QueryInfo,
    originalData: Map<any, Map<string, any>>,
    existingFieldKey: string,
    newQueryColumn: QueryColumn
): EditorModelUpdates {
    const colIndex = queryInfo.getInsertColumns().findIndex(column => column.fieldKey === existingFieldKey);

    // nothing to do if there is no such column
    if (colIndex === -1) return {};

    let newCellMessages = editorModel.cellMessages;
    let newCellValues = editorModel.cellValues;

    // get rid of existing messages and values at the designated index.
    newCellMessages = newCellMessages.reduce((newCellMessages, message, cellKey) => {
        const [oldColIdx] = cellKey.split('-').map(v => parseInt(v, 10));
        if (oldColIdx !== colIndex) {
            return newCellMessages.set(cellKey, message);
        }

        return newCellMessages;
    }, Map<string, CellMessage>());

    newCellValues = newCellValues.reduce((newCellValues, value, cellKey) => {
        const [oldColIdx, oldRowIdx] = cellKey.split('-').map(v => parseInt(v, 10));

        if (oldColIdx !== colIndex) {
            return newCellValues.set(cellKey, value);
        }

        return newCellValues;
    }, Map<string, List<ValueDescriptor>>());

    const editorUpdates = {
        focusColIdx: -1,
        focusRowIdx: -1,
        selectedColIdx: -1,
        selectedRowIdx: -1,
        selectionCells: Set<string>(),
        cellMessages: newCellMessages,
        cellValues: newCellValues,
    };

    const currentCol = queryInfo.getColumn(existingFieldKey);

    // remove existing column and set new column in data
    let data = originalData;
    data = data
        .map(rowData => {
            rowData = rowData.remove(currentCol.fieldKey);
            return rowData.set(newQueryColumn.fieldKey, undefined);
        })
        .toMap();

    let columns = OrderedMap<string, QueryColumn>();
    queryInfo.columns.forEach((column, key) => {
        if (column.fieldKey === currentCol.fieldKey) {
            columns = columns.set(newQueryColumn.fieldKey.toLowerCase(), newQueryColumn);
        } else {
            columns = columns.set(key, column);
        }
    });

    return {
        editorModelChanges: editorUpdates,
        data,
        queryInfo: queryInfo.merge({ columns }) as QueryInfo,
    };
}

export function removeColumnForQueryGridModel(model: QueryGridModel, fieldKey: string): EditorModel {
    const originalEditorModel = getEditorModel(model.getId());
    const { editorModelChanges, data, queryInfo } = removeColumn(
        originalEditorModel,
        model.queryInfo,
        model.data,
        fieldKey
    );

    const updatedEditorModel = updateEditorModel(originalEditorModel, editorModelChanges);
    updateQueryGridModel(model, { data, queryInfo });
    return updatedEditorModel;
}

export function removeColumn(
    editorModel: EditorModel,
    queryInfo: QueryInfo,
    originalData: Map<any, Map<string, any>>,
    fieldKey: string
): EditorModelUpdates {
    const deleteIndex = queryInfo.getInsertColumnIndex(fieldKey);
    // nothing to do if there is no such column
    if (deleteIndex === -1) return {};

    let newCellMessages = editorModel.cellMessages;
    let newCellValues = editorModel.cellValues;

    newCellMessages = newCellMessages.reduce((newCellMessages, message, cellKey) => {
        const [oldColIdx, oldRowIdx] = cellKey.split('-').map(v => parseInt(v, 10));
        if (oldColIdx > deleteIndex) {
            return newCellMessages.set([oldColIdx - 1, oldRowIdx].join('-'), message);
        } else if (oldColIdx < deleteIndex) {
            return newCellMessages.set(cellKey, message);
        }

        return newCellMessages;
    }, Map<string, CellMessage>());

    newCellValues = newCellValues.reduce((newCellValues, value, cellKey) => {
        const [oldColIdx, oldRowIdx] = cellKey.split('-').map(v => parseInt(v, 10));

        if (oldColIdx > deleteIndex) {
            return newCellValues.set([oldColIdx - 1, oldRowIdx].join('-'), value);
        } else if (oldColIdx < deleteIndex) {
            return newCellValues.set(cellKey, value);
        }

        return newCellValues;
    }, Map<string, List<ValueDescriptor>>());

    const editorUpdates = {
        colCount: editorModel.colCount - 1,
        focusColIdx: -1,
        focusRowIdx: -1,
        selectedColIdx: -1,
        selectedRowIdx: -1,
        selectionCells: Set<string>(),
        cellMessages: newCellMessages,
        cellValues: newCellValues,
    };

    // remove column from all rows in queryGridModel.data
    let data = originalData;
    data = data
        .map(rowData => {
            return rowData.remove(fieldKey);
        })
        .toMap();

    const columns = queryInfo.columns.remove(fieldKey.toLowerCase());

    return {
        editorModelChanges: editorUpdates,
        data,
        queryInfo: queryInfo.merge({ columns }) as QueryInfo,
    };
}

interface GridData {
    data: Map<any, Map<string, any>>;
    dataKeys: List<any>;
}

export function addColumnsForQueryGridModel(
    model: QueryGridModel,
    queryColumns: OrderedMap<string, QueryColumn>,
    fieldKey?: string
): EditorModel {
    const originalEditorModel = getEditorModel(model.getId());
    const { editorModelChanges, data, queryInfo } = addColumns(
        originalEditorModel,
        model.queryInfo,
        model.data,
        queryColumns,
        fieldKey
    );

    const updatedEditorModel = updateEditorModel(originalEditorModel, editorModelChanges);
    updateQueryGridModel(model, { data, queryInfo });
    return updatedEditorModel;
}

export interface EditorModelUpdates {
    editorModelChanges?: Partial<EditorModelProps>;
    data?: Map<any, Map<string, any>>;
    queryInfo?: QueryInfo;
}

/**
 * Adds columns to the editor model and the underlying model's data
 * @param queryColumns the ordered map of columns to be added
 * @param fieldKey the fieldKey of the existing column after which the new columns should be inserted.  If undefined
 * or the column is not found, columns will be added at the beginning.
 */
export function addColumns(
    editorModel: EditorModel,
    queryInfo: QueryInfo,
    originalData: Map<any, Map<string, any>>,
    queryColumns: OrderedMap<string, QueryColumn>,
    fieldKey?: string
): EditorModelUpdates {
    if (queryColumns.size === 0) return {};

    // add one to these because we insert after the given field (or at the
    // beginning if there is no such field)
    const editorColIndex = queryInfo.getInsertColumnIndex(fieldKey) + 1;
    const queryColIndex = queryInfo.getColumnIndex(fieldKey) + 1;

    if (editorColIndex < 0 || editorColIndex > queryInfo.columns.size) return {};

    let newCellMessages = editorModel.cellMessages;
    let newCellValues = editorModel.cellValues;

    newCellMessages = newCellMessages.reduce((newCellMessages, message, cellKey) => {
        const [oldColIdx, oldRowIdx] = cellKey.split('-').map(v => parseInt(v, 10));
        if (oldColIdx >= editorColIndex) {
            return newCellMessages.set([oldColIdx + queryColumns.size, oldRowIdx].join('-'), message);
        } else if (oldColIdx < editorColIndex) {
            return newCellMessages.set(cellKey, message);
        }

        return newCellMessages;
    }, Map<string, CellMessage>());

    newCellValues = newCellValues.reduce((newCellValues, value, cellKey) => {
        const [oldColIdx, oldRowIdx] = cellKey.split('-').map(v => parseInt(v, 10));

        if (oldColIdx >= editorColIndex) {
            return newCellValues.set([oldColIdx + queryColumns.size, oldRowIdx].join('-'), value);
        } else if (oldColIdx < editorColIndex) {
            return newCellValues.set(cellKey, value);
        }

        return newCellValues;
    }, Map<string, List<ValueDescriptor>>());
    for (let rowIdx = 0; rowIdx < editorModel.rowCount; rowIdx++) {
        for (let c = 0; c < queryColumns.size; c++) {
            newCellValues = newCellValues.set(genCellKey(editorColIndex + c, rowIdx), List<ValueDescriptor>());
        }
    }

    const editorUpdates = {
        colCount: editorModel.colCount + queryColumns.size,
        focusColIdx: -1,
        focusRowIdx: -1,
        selectedColIdx: -1,
        selectedRowIdx: -1,
        selectionCells: Set<string>(),
        cellMessages: newCellMessages,
        cellValues: newCellValues,
    };

    let data = originalData;
    data = data
        .map(rowData => {
            queryColumns.forEach(column => {
                rowData = rowData.set(column.fieldKey, undefined);
            });
            return rowData;
        })
        .toMap();

    const columns = queryInfo.insertColumns(queryColIndex, queryColumns);

    return {
        editorModelChanges: editorUpdates,
        data,
        queryInfo: queryInfo.merge({ columns }) as QueryInfo,
    };
}

interface EditorModelAndGridData extends GridData {
    editorModel: Partial<EditorModel>;
}

export function addRowsToGridData(
    dataKeys: List<any>,
    data: Map<any, Map<string, any>>,
    count: number,
    rowData?: Map<string, any>
): GridData {
    for (let i = 0; i < count; i++) {
        // ensure we don't step on another ID
        const id = GRID_EDIT_INDEX + ID_COUNTER++;
        data = data.set(id, rowData || EMPTY_ROW);
        dataKeys = dataKeys.push(id);
    }

    return { data, dataKeys };
}

export async function addRowsPerPivotValue(
    editorModel: EditorModel,
    dataKeys: List<any>,
    data: Map<any, Map<string, any>>,
    insertColumns: List<QueryColumn>,
    numPerParent: number,
    pivotKey: string,
    pivotValues: string[],
    rowData: Map<string, any>
): Promise<EditorModelAndGridData> {
    let { cellMessages, cellValues, rowCount } = editorModel;

    if (numPerParent > 0) {
        for (const value of pivotValues) {
            rowData = rowData.set(pivotKey, value);
            const changes = await addRowsToEditorModel(
                rowCount,
                cellMessages,
                cellValues,
                insertColumns,
                rowData.toList(),
                numPerParent,
                dataKeys.size
            );
            cellMessages = changes.cellMessages;
            cellValues = changes.cellValues;
            rowCount = changes.rowCount;
            const dataChanges = addRowsToGridData(dataKeys, data, numPerParent, rowData);
            data = dataChanges.data;
            dataKeys = dataChanges.dataKeys;
        }
    }

    return { editorModel: { cellMessages, cellValues, rowCount }, data, dataKeys };
}

export async function addRows(
    editorModel: EditorModel,
    dataKeys: List<any>,
    data: Map<any, Map<string, any>>,
    insertColumns: List<QueryColumn>,
    numToAdd: number,
    rowData?: Map<string, any>
): Promise<EditorModelAndGridData> {
    let editorModelChanges: Partial<EditorModel>;

    if (rowData) {
        editorModelChanges = await addRowsToEditorModel(
            editorModel.rowCount,
            editorModel.cellMessages,
            editorModel.cellValues,
            insertColumns,
            rowData.toList(),
            numToAdd,
            data.size
        );
    } else {
        editorModelChanges = { rowCount: editorModel.rowCount + numToAdd };
    }

    const dataChanges = addRowsToGridData(dataKeys, data, numToAdd, rowData);
    data = dataChanges.data;
    dataKeys = dataChanges.dataKeys;

    return { editorModel: editorModelChanges, data, dataKeys };
}

// Gets the non-blank values pasted for each column.  The values in the resulting lists may not align to the rows
// pasted if there were empty cells within the paste block.
function getPasteValuesByColumn(paste: IPasteModel): List<List<string>> {
    const { data } = paste.payload;
    const valuesByColumn = List<List<string>>().asMutable();

    for (let i = 0; i < data.get(0).size; i++) {
        valuesByColumn.push(List<string>().asMutable());
    }
    data.forEach(row => {
        row.forEach((value, index) => {
            // if values contain commas, users will need to paste the values enclosed in quotes
            // but we don't want to retain these quotes for purposes of selecting values in the grid
            parseCsvString(value, ',', true).forEach(v => {
                if (v.trim().length > 0) valuesByColumn.get(index).push(v.trim());
            });
        });
    });
    return valuesByColumn.asImmutable();
}

function isReadOnly(column: QueryColumn, columnMetadata: Map<string, EditableColumnMetadata>): boolean {
    const metadata: EditableColumnMetadata = columnMetadata && column && columnMetadata.get(column.fieldKey);
    return (column && column.readOnly) || (metadata && metadata.readOnly);
}

function getColumnFilteredLookup(
    column: QueryColumn,
    columnMetadata: Map<string, EditableColumnMetadata>
): List<string> {
    const metadata: EditableColumnMetadata = columnMetadata && columnMetadata.get(column.fieldKey);
    if (metadata) return metadata.filteredLookupValues;

    return undefined;
}

function pasteCellLoad(
    dataKeys: List<any>,
    data: Map<any, Map<string, any>>,
    queryInfo: QueryInfo,
    editorModel: EditorModel,
    paste: IPasteModel,
    lookupDescriptorMap: { [colKey: string]: ValueDescriptor[] },
    columnMetadata: Map<string, EditableColumnMetadata>,
    readonlyRows?: List<any>,
    lockRowCount?: boolean
): EditorModelAndGridData {
    const pastedData = paste.payload.data;
    const columns = queryInfo.getInsertColumns();
    const cellMessages = editorModel.cellMessages.asMutable();
    const cellValues = editorModel.cellValues.asMutable();
    const selectionCells = Set<string>().asMutable();
    let rowCount = editorModel.rowCount;
    let updatedDataKeys: List<any>;
    let updatedData: Map<any, Map<string, any>>;

    if (paste.rowsToAdd > 0 && !lockRowCount) {
        rowCount += paste.rowsToAdd;
        const dataChanges = addRowsToGridData(dataKeys, data, paste.rowsToAdd);
        updatedData = dataChanges.data;
        updatedDataKeys = dataChanges.dataKeys;
    }

    if (editorModel.hasMultipleSelection()) {
        editorModel.selectionCells.forEach(cellKey => {
            const { colIdx } = parseCellKey(cellKey);
            const col = columns.get(colIdx);

            pastedData.forEach(row => {
                row.forEach(value => {
                    let cv: List<ValueDescriptor>;
                    let msg: CellMessage;

                    if (col && col.isPublicLookup()) {
                        const { message, values } = parsePasteCellLookup(
                            col,
                            lookupDescriptorMap[col.lookupKey],
                            value
                        );
                        cv = values;

                        if (message) {
                            msg = message;
                        }
                    } else {
                        cv = List([{ display: value, raw: value }]);
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
    } else {
        const { colMin, rowMin } = paste.coordinates;
        const pkCols = queryInfo.getPkCols();
        let rowIdx = rowMin;
        let hasReachedRowLimit = false;
        pastedData.forEach(row => {
            if (hasReachedRowLimit && lockRowCount) return;

            if (readonlyRows) {
                while (rowIdx < rowCount && isReadonlyRow(data.get(dataKeys.get(rowIdx)), pkCols, readonlyRows)) {
                    // Skip over readonly rows
                    rowIdx++;
                }

                if (rowIdx >= rowCount) {
                    hasReachedRowLimit = true;
                    return;
                }
            }

            row.forEach((value, cn) => {
                const colIdx = colMin + cn;
                const col = columns.get(colIdx);
                const cellKey = genCellKey(colIdx, rowIdx);
                let cv: List<ValueDescriptor>;
                let msg: CellMessage;

                if (col && col.isPublicLookup()) {
                    const { message, values } = parsePasteCellLookup(col, lookupDescriptorMap[col.lookupKey], value);
                    cv = values;

                    if (message) {
                        msg = message;
                    }
                } else {
                    cv = List([{ display: value, raw: value }]);
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

            rowIdx++;
        });
    }

    return {
        editorModel: {
            cellMessages: cellMessages.asImmutable(),
            cellValues: cellValues.asImmutable(),
            rowCount,
            selectionCells: selectionCells.asImmutable(),
        },
        data: updatedData,
        dataKeys: updatedDataKeys,
    };
}

function isReadonlyRow(row: Map<string, any>, pkCols: List<QueryColumn>, readonlyRows: List<string>) {
    if (pkCols.size === 1 && row) {
        const pkValue = caseInsensitive(row.toJS(), pkCols.get(0).fieldKey);
        return readonlyRows.contains(pkValue);
    }

    return false;
}

function getReadonlyRowCount(
    rowCount: number,
    dataKeys: List<any>,
    data: Map<any, Map<string, any>>,
    queryInfo: QueryInfo,
    startRowInd: number,
    readonlyRows: List<string>
): number {
    const pkCols = queryInfo.getPkCols();

    // Rows with multiple PKs are always read-only
    if (pkCols.size !== 1) {
        return rowCount - startRowInd;
    }

    return dataKeys.slice(startRowInd, rowCount).reduce((total, index) => {
        if (isReadonlyRow(data.get(dataKeys.get(index)), pkCols, readonlyRows)) total++;
        return total;
    }, 0);
}

interface IParseLookupPayload {
    message?: CellMessage;
    values: List<ValueDescriptor>;
}

function parsePasteCellLookup(column: QueryColumn, descriptors: ValueDescriptor[], value: string): IParseLookupPayload {
    if (value === undefined || value === null || typeof value !== 'string') {
        return {
            values: List([
                {
                    display: value,
                    raw: value,
                },
            ]),
        };
    }

    let message: CellMessage;
    const unmatched: string[] = [];

    // parse pasted strings to split properly around quoted values.
    // Remove the quotes for storing the actual values in the grid.
    const values = parseCsvString(value, ',', true)
        .map(v => {
            const vt = v.trim();
            if (vt.length > 0) {
                const vl = vt.toLowerCase();
                const vd = descriptors.find(d => d.display && d.display.toString().toLowerCase() === vl);
                if (!vd) {
                    unmatched.push(vt);
                    return { display: vt, raw: vt };
                } else {
                    return vd;
                }
            }
        })
        .filter(v => v !== undefined)
        .reduce((list, v) => list.push(v), List<ValueDescriptor>());

    if (unmatched.length) {
        message = {
            message:
                'Could not find data for ' +
                unmatched
                    .slice(0, 4)
                    .map(u => '"' + u + '"')
                    .join(', '),
        };
    }

    return {
        message,
        values,
    };
}

export async function updateGridFromBulkForm(
    editorModel: EditorModel,
    queryInfo: QueryInfo,
    rowData: OrderedMap<string, any>,
    dataRowIndexes: List<number>
): Promise<Partial<EditorModel>> {
    let cellMessages = editorModel.cellMessages;
    let cellValues = editorModel.cellValues;

    const preparedData = await prepareUpdateRowDataFromBulkForm(queryInfo, rowData);
    const { values, messages } = preparedData; // {3: 'x', 4: 'z}

    dataRowIndexes.forEach(rowIdx => {
        values.forEach((value, colIdx) => {
            const cellKey = genCellKey(colIdx, rowIdx);
            cellMessages = cellMessages.set(cellKey, messages.get(colIdx));
            cellValues = cellValues.set(cellKey, value);
        });
    });

    return { cellValues, cellMessages };
}

async function prepareUpdateRowDataFromBulkForm(
    queryInfo: QueryInfo,
    rowData: OrderedMap<string, any>
): Promise<{ values: OrderedMap<number, List<ValueDescriptor>>; messages: OrderedMap<number, CellMessage> }> {
    const columns = queryInfo.getInsertColumns();
    let values = OrderedMap<number, List<ValueDescriptor>>();
    let messages = OrderedMap<number, CellMessage>();

    for (const colKey of rowData.keySeq().toArray()) {
        const data = rowData.get(colKey);
        let colIdx = -1;
        columns.forEach((col, ind) => {
            if (col.fieldKey === colKey) {
                colIdx = ind;
            }
        });

        const col = columns.get(colIdx);

        let cv: List<ValueDescriptor>;

        if (data && col && col.isLookup()) {
            cv = List<ValueDescriptor>();
            // value had better be the rowId here, but it may be several in a comma-separated list.
            // If it's the display value, which happens to be a number, much confusion will arise.
            const rawValues = data.toString().split(',');
            for (const val of rawValues) {
                const intVal = parseInt(val, 10);
                const { message, valueDescriptor } = await getLookupDisplayValue(col, isNaN(intVal) ? val : intVal);
                cv = cv.push(valueDescriptor);
                if (message) {
                    messages = messages.set(colIdx, message);
                }
            }
        } else {
            cv = List([{ display: data, raw: data }]);
        }

        values = values.set(colIdx, cv);
    }

    return { values, messages };
}

/**
 * Create a QueryGridModel for this assay's Data grid, filtered to samples for the provided `value`
 * iff the assay design has one or more sample lookup columns.
 *
 * The `value` may be a sample id or a labook id and the `singleFilter` or `whereClausePart` should
 * provide a filter for the sample column or columns defined in the assay design.
 *
 * If you're using a QueryModel see "createQueryConfigFilteredBySample()".
 */
export function createQueryGridModelFilteredBySample(
    model: AssayDefinitionModel,
    gridId: string,
    value,
    singleFilter: Filter.IFilterType,
    whereClausePart: (fieldKey, value) => string,
    useLsid?: boolean,
    omitSampleCols?: boolean,
    singleFilterValue?: any
): QueryGridModel {
    const sampleColumns = model.getSampleColumnFieldKeys();

    if (sampleColumns.isEmpty()) {
        return undefined;
    }

    return getStateQueryGridModel(gridId, SchemaQuery.create(model.protocolSchemaName, 'Data'), () => {
        const filter = model.createSampleFilter(
            sampleColumns,
            value,
            singleFilter,
            whereClausePart,
            useLsid,
            singleFilterValue
        );

        return {
            baseFilters: List([filter]),
            isPaged: true,
            omittedColumns: omitSampleCols ? sampleColumns : List<string>(),
            title: model.name,
            urlPrefix: model.name,
        };
    });
}

/**
 * Create a QueryConfig for this assay's Data grid, filtered to samples for the provided `value`
 * iff the assay design has one or more sample lookup columns.
 *
 * The `value` may be a sample id or a labook id and the `singleFilter` or `whereClausePart` should
 * provide a filter for the sample column or columns defined in the assay design.
 *
 * If you're using a QueryGridModel see "createQueryGridModelFilteredBySample()".
 */
export function createQueryConfigFilteredBySample(
    model: AssayDefinitionModel,
    value,
    singleFilter: Filter.IFilterType,
    whereClausePart: (fieldKey, value) => string,
    useLsid?: boolean,
    omitSampleCols?: boolean,
    singleFilterValue?: any
): QueryConfig {
    const sampleColumns = model.getSampleColumnFieldKeys();

    if (sampleColumns.isEmpty()) {
        return undefined;
    }

    return {
        baseFilters: [
            model.createSampleFilter(sampleColumns, value, singleFilter, whereClausePart, useLsid, singleFilterValue),
        ],
        omittedColumns: omitSampleCols ? sampleColumns.toArray() : undefined,
        schemaQuery: SchemaQuery.create(model.protocolSchemaName, 'Data'),
        title: model.name,
        urlPrefix: model.name,
    };
}

/**
 * Call the core-incrementClientSideMetricCount to track a given client side action (grouped by featureArea and metricName).
 * Note that this call does not return a Promise as it is to just be a background action and not interrupt the
 * main flow of the applications. Also note, that if something goes wrong it will just log the error to the console,
 * but will intentionally not return the error response to the caller.
 * @param featureArea
 * @param metricName
 */
export function incrementClientSideMetricCount(featureArea: string, metricName: string): void {
    if (!featureArea || !metricName || getServerContext().user.isGuest) {
        return;
    }

    Ajax.request({
        url: buildURL('core', 'incrementClientSideMetricCount.api'),
        method: 'POST',
        jsonData: {
            featureArea,
            metricName,
        },
        success: Utils.getCallbackWrapper(response => {
            // success, no-op
        }),
        failure: Utils.getCallbackWrapper(
            response => {
                // log the error but don't prevent from proceeding
                console.error(response);
            },
            this,
            true
        ),
    });
}

export function saveSessionGridView(schemaQuery: SchemaQuery, columns: any, containerPath: string, name: string): Promise<void> {
    return new Promise((resolve, reject) => {
        Query.saveQueryViews({
            schemaName: schemaQuery.schemaName,
            queryName: schemaQuery.queryName,
            containerPath,
            views: [{ name, columns, session: true }],
            success: () => {
                invalidateQueryDetailsCache(schemaQuery, containerPath);
                resolve();
            },
            failure: response => {
                console.error(response);
                reject('There was a problem saving the view for the data grid. ' + resolveErrorMessage(response));
            },
        });
    });
}

export function revertViewEdit(schemaQuery: SchemaQuery, containerPath: string, viewName?: string) : Promise<void> {
    return new Promise((resolve, reject) => {
        Query.deleteQueryView({
            schemaName: schemaQuery.schemaName,
            queryName: schemaQuery.queryName,
            viewName,
            containerPath,
            revert: true,
            success: () => {
                invalidateQueryDetailsCache(schemaQuery, containerPath);
                resolve();
            },
            failure: response => {
                console.error(response);
                reject('There was a problem updating the view for the data grid. ' + resolveErrorMessage(response));
            },
        });
    });
}
