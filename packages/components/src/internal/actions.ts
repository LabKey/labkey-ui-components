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
import { Ajax, Filter, getServerContext, Query, Utils } from '@labkey/api';
import $ from 'jquery';

import {
    AssayDefinitionModel,
    buildURL,
    caseInsensitive,
    GRID_CHECKBOX_OPTIONS,
    IGridResponse,
    insertColumnFilter,
    naturalSort,
    QueryColumn,
    QueryConfig,
    QueryGridModel,
    QueryInfo,
    resolveKey,
    SchemaQuery,
    ViewInfo,
} from '..';

import { getQueryDetails, searchRows, selectRows } from './query/api';
import { isEqual } from './query/filter';
import { buildQueryString, getLocation, Location, replaceParameter, replaceParameters } from './util/URL';
import {
    BARTENDER_EXPORT_CONTROLLER,
    EXPORT_TYPES,
    FASTA_EXPORT_CONTROLLER,
    GENBANK_EXPORT_CONTROLLER,
    GRID_EDIT_INDEX,
    KEYS,
    LOOKUP_DEFAULT_SIZE,
    MODIFICATION_TYPES,
    SELECTION_TYPES,
} from './constants';
import { cancelEvent, getPasteValue, setCopyValue } from './events';
import {
    CellMessage,
    CellMessages,
    CellValues,
    DataViewInfo,
    EditorModel,
    EditorModelProps,
    getStateQueryGridModel,
    LookupStore,
    ValueDescriptor,
    VisualizationConfigModel,
} from './models';
import { bindColumnRenderers } from './renderers';
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
    updateSelections,
} from './global';
import { EditableColumnMetadata } from './components/editable/EditableGrid';
import { getSortFromUrl } from './url/ActionURL';

import { intersect, not } from './util/utils';
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

export function gridClearAll(
    model: QueryGridModel,
    onSelectionChange?: (model: QueryGridModel, row: Map<string, any>, checked: boolean) => any
): void {
    clearSelected(model.getId(), model.schema, model.query, model.getFilters(), model.containerPath)
        .then(() => {
            const updatedModel = updateQueryGridModel(model, QueryGridModel.EMPTY_SELECTION);

            if (onSelectionChange) {
                onSelectionChange(updatedModel, undefined, false);
            }
        })
        .catch(err => {
            const error = err ? err : { message: 'Something went wrong when clearing the selection from the grid.' };
            gridShowError(model, error);
        });
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

export function gridSelectAll(
    model: QueryGridModel,
    onSelectionChange?: (model: QueryGridModel, row: Map<string, any>, checked: boolean) => any
): void {
    const id = model.getId();

    selectAll(id, model.schema, model.query, model.getFilters(), model.containerPath).then(data => {
        if (data && data.count > 0) {
            return getSelected(
                id,
                model.schema,
                model.query,
                model.getFilters(),
                model.containerPath,
                model.queryParameters
            )
                .then(response => {
                    const updatedModel = updateSelections(model, { selectedIds: List(response.selected) });

                    if (onSelectionChange) {
                        onSelectionChange(updatedModel, undefined, true);
                    }
                })
                .catch(err => {
                    const error = err ? err : { message: 'Something went wrong in selecting all items for this grid' };
                    gridShowError(model, error);
                });
        }
    });
}

export function sort(model: QueryGridModel, column: QueryColumn, dir: string): void {
    const fieldKey = encodeURIComponent(column.resolveFieldKey());

    if (model.bindURL) {
        const urlDir = dir === '+' ? '' : '-';
        replaceParameters(
            getLocation(),
            Map<string, any>({
                [model.createParam('sort')]: `${urlDir}${fieldKey}`,
            })
        );
    } else {
        const newModel = updateQueryGridModel(model, {
            sorts: dir + fieldKey, // TODO: Support multiple sorts
        });

        gridLoad(newModel);
    }
}

// Handle single row select/deselect from the QueryGrid checkbox column
export function toggleGridRowSelection(
    model: QueryGridModel,
    row: Map<string, any>,
    checked: boolean,
    onSelectionChange?: (model: QueryGridModel, row: Map<string, any>, checked: boolean) => any
): void {
    let pkValue;
    const pkCols: List<QueryColumn> = model.queryInfo.getPkCols();

    if (pkCols.size === 1) {
        const pkCol: QueryColumn = pkCols.first();
        pkValue = row.getIn([pkCol.name, 'value']);

        setSelected(model.getId(), checked, pkValue, model.containerPath)
            .then(() => {
                const stringKey = pkValue !== undefined ? pkValue.toString() : pkValue;
                const selected: List<string> = model.selectedIds;
                let selectedState: GRID_CHECKBOX_OPTIONS;

                if (checked) {
                    // if one is checked, value cannot be 'NONE'
                    const allSelected: boolean = model.data.every(d => {
                        // compare if item is already 'checked' or will be 'checked' by this action
                        const keyVal =
                            d.getIn([pkCol.name, 'value']) !== undefined
                                ? d.getIn([pkCol.name, 'value']).toString()
                                : undefined;

                        return keyVal === stringKey || selected.indexOf(keyVal) !== -1;
                    });

                    selectedState = allSelected ? GRID_CHECKBOX_OPTIONS.ALL : GRID_CHECKBOX_OPTIONS.SOME;
                } else {
                    // if unchecking, value cannot be 'ALL'
                    const someSelected: boolean = model.data.some(d => {
                        // compare if item is already 'checked' or will be 'unchecked' by this action
                        const keyVal =
                            d.getIn([pkCol.name, 'value']) !== undefined
                                ? d.getIn([pkCol.name, 'value']).toString()
                                : undefined;
                        return keyVal !== stringKey && selected.indexOf(keyVal) !== -1;
                    });

                    selectedState = someSelected ? GRID_CHECKBOX_OPTIONS.SOME : GRID_CHECKBOX_OPTIONS.NONE;
                }

                const selectedIds = checked
                    ? model.selectedIds.push(stringKey)
                    : model.selectedIds.delete(model.selectedIds.findIndex(item => item === stringKey));

                const updatedModel = updateQueryGridModel(model, {
                    selectedState,
                    selectedQuantity: selectedIds.size,
                    selectedIds,
                });

                if (onSelectionChange) {
                    onSelectionChange(updatedModel, row, checked);
                }
            })
            .catch(reason => {
                console.error(reason);
                const error = reason
                    ? reason
                    : { message: 'There was a problem updating the selection for this grid.' };
                gridShowError(model, error);
            });
    } else {
        console.warn(
            'Selection requires only one key be available. Unable to toggle selection for specific keyValue. Keys:',
            pkCols.toJS()
        );
    }
}

export function toggleGridSelected(
    model: QueryGridModel,
    checked: boolean,
    onSelectionChange?: (model: QueryGridModel, row: Map<string, any>, checked: boolean) => any
): void {
    if (checked) {
        setGridSelected(model, checked, onSelectionChange);
    } else {
        setGridUnselected(model, onSelectionChange);
    }
}

export function clearError(model: QueryGridModel): void {
    if (model.isError) {
        updateQueryGridModel(model, {
            isError: false,
            message: undefined,
        });
    }
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
            data: Map<any, List<any>>(),
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

export function loadPage(model: QueryGridModel, pageNumber: number): void {
    if (pageNumber !== model.pageNumber) {
        if (model.bindURL) {
            replaceParameters(
                getLocation(),
                Map<string, any>({
                    [model.createParam('p')]: pageNumber > 1 ? pageNumber : undefined,
                })
            );
        } else {
            const newModel = updateQueryGridModel(model, { pageNumber: pageNumber > 1 ? pageNumber : 1 });
            gridLoad(newModel);
        }
    }
}

export function setMaxRows(model: QueryGridModel, maxRows: number): void {
    if (maxRows !== model.maxRows) {
        // also make sure to reset page number to force grid back to first page
        if (model.bindURL) {
            replaceParameters(
                getLocation(),
                Map<string, any>({
                    [model.createParam('p')]: undefined,
                    [model.createParam('pageCount')]: maxRows,
                })
            );
        } else {
            const newModel = updateQueryGridModel(model, { pageNumber: 1, maxRows });
            gridLoad(newModel);
        }
    }
}

export function setReportId(model: QueryGridModel, reportId: string) {
    if (model.bindURL) {
        replaceParameters(
            getLocation(),
            Map<string, any>({
                [model.createParam('reportId')]: reportId,
            })
        );
    }
}

export function gridRefresh(model: QueryGridModel, connectedComponent?: React.Component): void {
    if (model.allowSelection) {
        setGridUnselected(model);
    }

    gridLoad(model, connectedComponent);
}

// need to reload when the URL changes and also need to reload selections because one of the
// reasons the URL may change is for the application of filters.
export function reloadQueryGridModel(model: QueryGridModel): void {
    const newModel = updateQueryGridModel(model, {
        isLoading: true,
        selectedLoaded: false,
        ...QueryGridModel.EMPTY_SELECTION,
        ...bindURLProps(model),
    });
    gridLoad(newModel);
}

// Takes a List<Filter.IFilter> and remove each filter from the grid model
// Alternately, the 'all' flag can be set to true to remove all filters. This
// setting takes precedence over the filters list.
export function removeFilters(model: QueryGridModel, filters?: List<Filter.IFilter>, all = false): void {
    if (model.bindURL) {
        replaceParameters(getLocation(), getFilterParameters(filters, true));
    } else {
        let newModel = model;
        if (model.filterArray.count()) {
            if (all) {
                newModel = updateQueryGridModel(newModel, {
                    selectedLoaded: false,
                    ...QueryGridModel.EMPTY_SELECTION,
                    filterArray: List<any>(),
                });
            } else if (filters && filters.count()) {
                const urls = filters.reduce((urls, filter: any) => {
                    return urls.add(filter.getURLParameterName() + filter.getURLParameterValue());
                }, Set());

                const filtered = model.filterArray.filter((f: any) => {
                    return !urls.has(f.getURLParameterName() + f.getURLParameterValue());
                });

                if (filtered.count() < model.filterArray.count()) {
                    newModel = updateQueryGridModel(newModel, {
                        selectedLoaded: false,
                        ...QueryGridModel.EMPTY_SELECTION,
                        filterArray: filtered,
                    });
                }
            }
        }

        gridLoad(newModel);
    }
}

export function addFilters(model: QueryGridModel, filters: List<Filter.IFilter>): void {
    if (model.bindURL) {
        replaceParameters(getLocation(), getFilterParameters(filters));
    } else {
        if (filters.count()) {
            const newModel = updateQueryGridModel(model, {
                selectedLoaded: false,
                ...QueryGridModel.EMPTY_SELECTION,
                filterArray: model.filterArray.merge(filters),
            });
            gridLoad(newModel);
        }
    }
}

function loadDataForEditor(model: QueryGridModel, response?: any): void {
    const rows: Map<any, Map<string, any>> = response ? response.data : Map<string, Map<string, any>>();
    const ids = response ? response.dataIds : List();
    const columns = model.queryInfo.columns.toList().filter(column => {
        return (
            (insertColumnFilter(column) || model.requiredColumns?.indexOf(column.fieldKey) > -1) && !column.isFileInput
        );
    });

    const getLookup = (col: QueryColumn) => getLookupStore(col);
    const cellValues = Map<string, List<ValueDescriptor>>().asMutable();

    // data is initialized in column order
    columns.forEach((col, cn) => {
        let rn = 0; // restart index, cannot use index from "rows"
        ids.forEach(id => {
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
                let valueDescriptor = { display: value, raw: value };
                if (col.isLookup() && Utils.isNumber(value)) {
                    valueDescriptor = getLookupDisplayValue(col, getLookup(col), value).valueDescriptor;
                }

                cellValues.set(cellKey, List([valueDescriptor]));
            }
            rn++;
        });
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
        'query.showRows': options.showRows ? [options.showRows] : ['ALL'],
        'query.selectionKey': options.selectionKey ? options.selectionKey : undefined,
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
            if (advancedOptions && advancedOptions['includeColumn'])
                params['query.columns'] = options.columns + ',' + advancedOptions['includeColumn'].join(',');
            else params['query.columns'] = options.columns;
        }

        if (options.filters) {
            options.filters.forEach(f => {
                if (f) {
                    params[f.getURLParameterName()] = [f.getURLParameterValue()];
                }
            });
        }

        if (options.sorts) {
            params['query.sort'] = options.sorts;
        }
    }
    return params;
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
        form.append($(`<input type="hidden" name="${k.toString()}" value="${v}">`));
    });
    $('body').append(form);
    form.trigger('submit');
}

export function gridExport(model: QueryGridModel, type: EXPORT_TYPES, advancedOptions?: Record<string, any>): void {
    const { allowSelection, selectedState } = model;
    const showRows = allowSelection && selectedState !== GRID_CHECKBOX_OPTIONS.NONE ? 'SELECTED' : 'ALL';
    const options: ExportOptions = {
        filters: model.getFilters(),
        columns: model.getExportColumnsString(),
        sorts: model.getSorts(),
        showRows,
        selectionKey: model.getId(),
    };
    const exportParams = getExportParams(
        type,
        SchemaQuery.create(model.schema, model.query, model.view),
        options,
        advancedOptions
    );
    exportRows(type, exportParams);
}

export function gridSelectView(model: QueryGridModel, view: ViewInfo): void {
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

function setGridUnselected(
    model: QueryGridModel,
    onSelectionChange?: (model: QueryGridModel, row: Map<string, any>, checked: boolean) => any
): void {
    setGridSelected(model, false, onSelectionChange);
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
        selectRows({
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

function getFilterParameters(filters: List<any>, remove = false): Map<string, string> {
    const params = {};

    filters.map(filter => {
        if (remove) {
            params[filter.getURLParameterName()] = undefined;
        } else {
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

function isCellEmpty(values: List<ValueDescriptor>): boolean {
    return !values || values.isEmpty() || values.some(v => v.raw === undefined || v.raw === null || v.raw === '');
}

function moveDown(colIdx: number, rowIdx: number): { colIdx: number; rowIdx: number } {
    return { colIdx, rowIdx: rowIdx + 1 };
}

function moveLeft(colIdx: number, rowIdx: number): { colIdx: number; rowIdx: number } {
    return { colIdx: colIdx - 1, rowIdx };
}

function moveRight(colIdx: number, rowIdx: number): { colIdx: number; rowIdx: number } {
    return { colIdx: colIdx + 1, rowIdx };
}

function moveUp(colIdx: number, rowIdx: number): { colIdx: number; rowIdx: number } {
    return { colIdx, rowIdx: rowIdx - 1 };
}

const dragLock = Map<string, boolean>().asMutable();

export function beginDrag(modelId: string, event: any): void {
    return handleDrag(modelId, event, () => dragLock.set(modelId, true));
}

export function endDrag(modelId: string, event: any): void {
    return handleDrag(modelId, event, () => dragLock.remove(modelId));
}

function handleDrag(modelId: string, event: any, handle: () => any): void {
    const model = getEditorModel(modelId);
    if (model && !model.hasFocus()) {
        event.preventDefault();
        handle();
    }
}

export function inDrag(modelId: string): boolean {
    return dragLock.get(modelId) !== undefined;
}

function initEditorModel(model: QueryGridModel): void {
    const newModel = new EditorModel({ id: model.getId() });
    updateEditorModel(newModel, {}, false);
}

export function clearSelection(modelId: string): void {
    const model = getEditorModel(modelId);

    if (model && (model.hasSelection() || model.hasFocus())) {
        updateEditorModel(model, {
            focusColIdx: -1,
            focusRowIdx: -1,
            selectedColIdx: -1,
            selectedRowIdx: -1,
            selectionCells: Set<string>(),
        });
    }
}

export function copyEvent(modelId: string, event: any): void {
    const editorModel = getEditorModel(modelId);

    if (editorModel && !editorModel.hasFocus() && editorModel.hasSelection()) {
        cancelEvent(event);
        setCopyValue(event, getCopyValue(editorModel, getQueryGridModel(modelId)));
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

function getCopyValue(model: EditorModel, queryModel: QueryGridModel): string {
    let copyValue = '';
    const EOL = '\n';

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

export function focusCell(modelId: string, colIdx: number, rowIdx: number, clearValue?: boolean): void {
    const cellKey = genCellKey(colIdx, rowIdx);
    const model = getEditorModel(modelId);

    const props: Partial<EditorModelProps> = {
        cellMessages: model.cellMessages.remove(cellKey),
        focusColIdx: colIdx,
        focusRowIdx: rowIdx,
        focusValue: model.getIn(['cellValues', cellKey]),
        selectedColIdx: colIdx,
        selectedRowIdx: rowIdx,
    };

    if (clearValue) {
        props.cellValues = model.cellValues.set(cellKey, List<ValueDescriptor>());
    }

    updateEditorModel(model, props);
}

export function selectCell(
    modelId: string,
    colIdx: number,
    rowIdx: number,
    selection?: SELECTION_TYPES,
    resetValue?: boolean
): void {
    const model = getEditorModel(modelId);

    // check bounds
    if (model && colIdx >= 0 && rowIdx >= 0 && colIdx < model.colCount) {
        // 33855: select last row
        if (rowIdx === model.rowCount) {
            rowIdx = rowIdx - 1;
        }

        if (rowIdx < model.rowCount) {
            const props: Partial<EditorModelProps> = {
                focusColIdx: -1,
                focusRowIdx: -1,
                ...applySelection(model as EditorModel, colIdx, rowIdx, selection),
            };

            if (resetValue) {
                props.focusValue = undefined;
                props.cellValues = model.cellValues.set(genCellKey(colIdx, rowIdx), model.focusValue);
            }

            updateEditorModel(model, props);
        }
    }
}

export function unfocusCellSelection(modelId: string): void {
    updateEditorModel(getEditorModel(modelId), {
        selectedColIdx: -1,
        selectedRowIdx: -1,
    });
}

function updateCellValues(model: EditorModel, cellKey: string, values: List<ValueDescriptor>): void {
    updateEditorModel(model, {
        cellValues: model.cellValues.set(cellKey, values),
    });
}

export function modifyCell(
    modelId: string,
    colIdx: number,
    rowIdx: number,
    newValue: ValueDescriptor,
    mod: MODIFICATION_TYPES
): void {
    const cellKey = genCellKey(colIdx, rowIdx);
    const keyPath = ['cellValues', cellKey];
    const VD = List<ValueDescriptor>();

    let model = getEditorModel(modelId);
    if (!model) {
        console.warn("No model available for id '" + modelId + "'");
        return;
    }

    model = updateEditorModel(model, { cellMessages: model.cellMessages.delete(cellKey) });

    if (mod === MODIFICATION_TYPES.ADD) {
        const values: List<ValueDescriptor> = model.getIn(keyPath);
        if (values !== undefined) {
            updateCellValues(model, cellKey, values.push(newValue));
        } else {
            updateCellValues(model, cellKey, VD.push(newValue));
        }
    } else if (mod === MODIFICATION_TYPES.REPLACE) {
        updateCellValues(model, cellKey, VD.push(newValue));
    } else if (mod === MODIFICATION_TYPES.REMOVE) {
        let values: List<ValueDescriptor> = model.getIn(keyPath);

        const idx = values.findIndex(vd => vd.display === newValue.display && vd.raw === vd.raw);

        if (idx > -1) {
            values = values.remove(idx);
        }

        if (values.size) {
            updateCellValues(model, cellKey, values);
        } else {
            updateCellValues(model, cellKey, VD);
        }
    } else if (mod == MODIFICATION_TYPES.REMOVE_ALL) {
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
                }, Map<string, CellMessage>()),
            });
        } else {
            updateCellValues(model, cellKey, VD);
        }
    }
}

function applySelection(
    model: EditorModel,
    colIdx: number,
    rowIdx: number,
    selection?: SELECTION_TYPES
): Partial<EditorModelProps> {
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
                const upperLeft = [Math.min(model.selectedColIdx, colIdx), Math.min(model.selectedRowIdx, rowIdx)];

                const bottomRight = [Math.max(model.selectedColIdx, colIdx), Math.max(model.selectedRowIdx, rowIdx)];

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
        selectionCells: selectionCells.asImmutable(),
    };
}

export function initLookup(column: QueryColumn, maxRows: number, values?: List<string>, keys?: List<any>) {
    if (shouldInitLookup(column, values)) {
        const store = new LookupStore({
            key: LookupStore.key(column),
            isLoaded: false,
            isLoading: true,
        });
        updateLookupStore(store, {}, false);

        return searchLookup(column, maxRows, undefined, values, keys);
    }

    return Promise.resolve();
}

function shouldInitLookup(col: QueryColumn, values?: List<string>): boolean {
    if (!col.isPublicLookup()) {
        return false;
    }

    const lookup = getLookupStore(col);

    if (!lookup) {
        return true;
    } else if (!lookup.isLoading && !lookup.isLoaded) {
        return true;
    } else if (values && !lookup.containsAll(values)) {
        return true;
    }

    return false;
}

export function searchLookup(
    column: QueryColumn,
    maxRows: number,
    token?: string,
    values?: List<string>,
    keys?: List<any>
) {
    let store = getLookupStore(column);

    // prevent redundant search
    if (store && (token !== store.lastToken || values || keys)) {
        store = updateLookupStore(store, {
            isLoaded: false,
            isLoading: true,
            lastToken: token,
            loadCount: store.loadCount + 1,
        });

        const lookup = column.lookup;

        const selectRowOptions: any = {
            schemaName: lookup.schemaName,
            queryName: lookup.queryName,
            columns: [lookup.displayColumn, lookup.keyColumn].join(','),
            containerPath: lookup.containerPath,
            maxRows,
            includeTotalCount: 'f',
        };

        if (values) {
            selectRowOptions.filterArray = [
                Filter.create(column.lookup.displayColumn, values.toArray(), Filter.Types.IN),
            ];
        }

        if (keys) {
            selectRowOptions.filterArray = [Filter.create(column.lookup.keyColumn, keys.toArray(), Filter.Types.IN)];
        }

        return searchRows(selectRowOptions, token, lookup.displayColumn)
            .then(result => {
                const { displayColumn, keyColumn } = column.lookup;
                const { key, models, totalRows } = result;

                if (models[key]) {
                    const descriptors = fromJS(models[key])
                        .reduce((list, row) => {
                            const key = row.getIn([keyColumn, 'value']);

                            if (key !== undefined && key !== null) {
                                return list.push({
                                    display:
                                        row.getIn([displayColumn, 'displayValue']) ||
                                        row.getIn([displayColumn, 'value']),
                                    raw: key,
                                });
                            }
                        }, List<ValueDescriptor>())
                        .sortBy(vd => vd.display, naturalSort)
                        .reduce((map, vd) => map.set(vd.raw, vd), OrderedMap<any, ValueDescriptor>());

                    updateLookupStore(store, {
                        isLoaded: true,
                        isLoading: false,
                        matchCount: totalRows,
                        descriptors,
                    });
                }
            })
            .catch(reason => {
                console.error(reason);
                updateLookupStore(store, {
                    isLoaded: true,
                    isLoading: false,
                });
            });
    }
}

function getLookupDisplayValue(
    column: QueryColumn,
    lookup: LookupStore,
    value: any
): {
    message?: CellMessage;
    valueDescriptor: ValueDescriptor;
} {
    if (value === undefined || value === null || typeof value === 'string') {
        return {
            valueDescriptor: {
                display: value,
                raw: value,
            },
        };
    }

    let message: CellMessage;

    const valueDescriptor = lookup.descriptors.find(d => d.raw && d.raw === value);
    if (!valueDescriptor) {
        message = {
            message: 'Could not find data for ' + value,
        };
    }

    return {
        message,
        valueDescriptor,
    };
}

/**
 * Updates data in the editable grid associated with the given grid model.
 * @param gridModel the model whose editable data is updated
 * @param rowData the data for a single row
 * @param rowCount the number of rows to be added
 * @param rowMin the starting row for the new rows
 * @param colMin the starting column
 */
export function updateEditorData(
    gridModel: QueryGridModel,
    rowData: List<any>,
    rowCount: number,
    rowMin = 0,
    colMin = 0
): EditorModel {
    const editorModel = getEditorModel(gridModel.getId());

    let cellMessages = editorModel.cellMessages;
    let cellValues = editorModel.cellValues;
    let selectionCells = Set<string>();

    const preparedData = prepareInsertRowDataFromBulkForm(gridModel, rowData, colMin);
    const { values, messages } = preparedData;

    for (let rowIdx = rowMin; rowIdx < rowMin + rowCount; rowIdx++) {
        rowData.forEach((value, cn) => {
            const colIdx = colMin + cn;
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
        rowCount: Math.max(rowMin + Number(rowCount), editorModel.rowCount),
    });
}

function prepareInsertRowDataFromBulkForm(
    gridModel: QueryGridModel,
    rowData: List<any>,
    colMin = 0
): { values: List<List<ValueDescriptor>>; messages: List<CellMessage> } {
    const columns = gridModel.getInsertColumns();

    const getLookup = (col: QueryColumn) => getLookupStore(col);

    let values = List<List<ValueDescriptor>>();
    let messages = List<CellMessage>();

    rowData.forEach((data, cn) => {
        const colIdx = colMin + cn;
        const col = columns.get(colIdx);

        let cv: List<ValueDescriptor>;

        if (data && col && col.isLookup()) {
            cv = List<ValueDescriptor>();
            // value had better be the rowId here, but it may be several in a comma-separated list.
            // If it's the display value, which happens to be a number, much confusion will arise.
            const values = data.toString().split(',');
            values.forEach(val => {
                const intVal = parseInt(val, 10);
                const { message, valueDescriptor } = getLookupDisplayValue(
                    col,
                    getLookup(col),
                    isNaN(intVal) ? val : intVal
                );
                cv = cv.push(valueDescriptor);
                if (message) {
                    messages = messages.push(message);
                }
            });
        } else {
            cv = List([
                {
                    display: data,
                    raw: data,
                },
            ]);
        }

        values = values.push(cv);
    });

    return {
        values,
        messages,
    };
}

export function pasteEvent(
    modelId: string,
    event: any,
    onBefore?: any,
    onComplete?: any,
    columnMetadata?: Map<string, EditableColumnMetadata>,
    readonlyRows?: List<any>,
    lockRowCount?: boolean
): void {
    const model = getEditorModel(modelId);

    // If a cell has focus do not accept incoming paste events -- allow for normal paste to input
    if (model && model.hasSelection() && !model.hasFocus()) {
        cancelEvent(event);
        pasteCell(
            modelId,
            model.selectedColIdx,
            model.selectedRowIdx,
            getPasteValue(event),
            onBefore,
            onComplete,
            columnMetadata,
            readonlyRows,
            lockRowCount
        );
    }
}

function pasteCell(
    modelId: string,
    colIdx: number,
    rowIdx: number,
    value: any,
    onBefore?: any,
    onComplete?: any,
    columnMetadata?: Map<string, EditableColumnMetadata>,
    readonlyRows?: List<any>,
    lockRowCount?: boolean
): void {
    const gridModel = getQueryGridModel(modelId);
    let model = getEditorModel(modelId);

    if (model) {
        const readOnlyRowCount =
            readonlyRows && !lockRowCount ? getReadonlyRowCount(gridModel, model, rowIdx, readonlyRows) : 0;
        const paste = validatePaste(model, colIdx, rowIdx, value, readOnlyRowCount);

        if (paste.success) {
            if (onBefore) {
                onBefore();
            }
            model = beginPaste(model, paste.payload.data.size);

            if (paste.rowsToAdd > 0 && !lockRowCount) {
                model = addRows(gridModel, paste.rowsToAdd);
            }

            const byColumnValues = getPasteValuesByColumn(paste);
            // prior to load, ensure lookup column stores are loaded
            const columnLoaders: any[] = gridModel.getInsertColumns().reduce((arr, column, index) => {
                const filteredLookup = getColumnFilteredLookup(column, columnMetadata);
                if (
                    index >= paste.coordinates.colMin &&
                    index <= paste.coordinates.colMax &&
                    byColumnValues.get(index - paste.coordinates.colMin).size > 0
                )
                    arr.push(
                        initLookup(
                            column,
                            undefined,
                            filteredLookup ? filteredLookup : byColumnValues.get(index - paste.coordinates.colMin)
                        )
                    );
                else arr.push(initLookup(column, LOOKUP_DEFAULT_SIZE, filteredLookup));
                return arr;
            }, []);

            Promise.all(columnLoaders)
                .then(() => {
                    return pasteCellLoad(
                        model,
                        gridModel,
                        paste,
                        (col: QueryColumn) => getLookupStore(col),
                        columnMetadata,
                        readonlyRows,
                        lockRowCount
                    ).then(payload => {
                        model = updateEditorModel(model, {
                            cellMessages: payload.cellMessages,
                            cellValues: payload.cellValues,
                            selectionCells: payload.selectionCells,
                        });

                        model = endPaste(model);
                    });
                })
                .then(() => {
                    if (onComplete) {
                        onComplete();
                    }
                });
        } else {
            const cellKey = genCellKey(colIdx, rowIdx);
            model = updateEditorModel(model, {
                cellMessages: model.cellMessages.set(cellKey, { message: paste.message } as CellMessage),
            });
        }
    }
}

function endPaste(model: EditorModel): EditorModel {
    return updateEditorModel(model, {
        isPasting: false,
        numPastedRows: 0,
    });
}

function validatePaste(
    model: EditorModel,
    colMin: number,
    rowMin: number,
    value: any,
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

export function changeColumn(
    model: QueryGridModel,
    existingFieldKey: string,
    newQueryColumn: QueryColumn
): EditorModel {
    let editorModel = getEditorModel(model.getId());

    const colIndex = model.queryInfo.getInsertColumns().findIndex(column => column.fieldKey === existingFieldKey);

    // nothing to do if there is no such column
    if (colIndex === -1) return editorModel;

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

    editorModel = updateEditorModel(editorModel, {
        focusColIdx: -1,
        focusRowIdx: -1,
        selectedColIdx: -1,
        selectedRowIdx: -1,
        selectionCells: Set<string>(),
        cellMessages: newCellMessages,
        cellValues: newCellValues,
    });

    const currentCol = model.queryInfo.getColumn(existingFieldKey);

    // remove existing column and set new column in data
    let data = model.data;
    data = data
        .map(rowData => {
            rowData = rowData.remove(currentCol.fieldKey);
            return rowData.set(newQueryColumn.fieldKey, undefined);
        })
        .toMap();

    let columns = OrderedMap<string, QueryColumn>();
    model.queryInfo.columns.forEach((column, key) => {
        if (column.fieldKey === currentCol.fieldKey) {
            columns = columns.set(newQueryColumn.fieldKey.toLowerCase(), newQueryColumn);
        } else {
            columns = columns.set(key, column);
        }
    });

    updateQueryGridModel(model, {
        data,
        queryInfo: model.queryInfo.merge({ columns }) as QueryInfo,
    });

    return editorModel;
}

/**
 * Adds columns to the editor model and the underlying QueryGridModel
 * @param model the model to be updated
 * @param queryColumns the ordered map of columns to be added
 * @param fieldKey the fieldKey of the existing column after which the new columns should be inserted.  If undefined
 * or the column is not found, columns will be added at the beginning.
 */
export function addColumns(
    model: QueryGridModel,
    queryColumns: OrderedMap<string, QueryColumn>,
    fieldKey?: string
): EditorModel {
    let editorModel = getEditorModel(model.getId());

    if (queryColumns.size === 0) return editorModel;

    let editorColIndex;
    let queryColIndex;

    // add one to these because we insert after the given field (or at the
    // beginning if there is no such field)
    editorColIndex = model.getInsertColumnIndex(fieldKey) + 1;
    queryColIndex = model.getColumnIndex(fieldKey) + 1;

    if (editorColIndex < 0 || editorColIndex > model.queryInfo.columns.size) return editorModel;

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

    editorModel = updateEditorModel(editorModel, {
        colCount: editorModel.colCount + queryColumns.size,
        focusColIdx: -1,
        focusRowIdx: -1,
        selectedColIdx: -1,
        selectedRowIdx: -1,
        selectionCells: Set<string>(),
        cellMessages: newCellMessages,
        cellValues: newCellValues,
    });

    let data = model.data;
    data = data
        .map(rowData => {
            queryColumns.forEach(column => {
                rowData = rowData.set(column.fieldKey, undefined);
            });
            return rowData;
        })
        .toMap();

    const columns = model.queryInfo.insertColumns(queryColIndex, queryColumns);

    updateQueryGridModel(model, {
        data,
        queryInfo: model.queryInfo.merge({ columns }) as QueryInfo,
    });

    return editorModel;
}

export function removeColumn(model: QueryGridModel, fieldKey: string): EditorModel {
    let editorModel = getEditorModel(model.getId());

    const deleteIndex = model.getInsertColumnIndex(fieldKey);
    // nothing to do if there is no such column
    if (deleteIndex === -1) return editorModel;

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

    editorModel = updateEditorModel(editorModel, {
        colCount: editorModel.colCount - 1,
        focusColIdx: -1,
        focusRowIdx: -1,
        selectedColIdx: -1,
        selectedRowIdx: -1,
        selectionCells: Set<string>(),
        cellMessages: newCellMessages,
        cellValues: newCellValues,
    });

    // remove column from all rows in queryGridModel.data
    let data = model.data;
    data = data
        .map(rowData => {
            return rowData.remove(fieldKey);
        })
        .toMap();

    const columns = model.queryInfo.columns.remove(fieldKey.toLowerCase());

    updateQueryGridModel(model, {
        data,
        queryInfo: model.queryInfo.merge({ columns }) as QueryInfo,
    });

    return editorModel;
}

function beginPaste(model: EditorModel, numRows: number): EditorModel {
    return updateEditorModel(model, {
        isPasting: true,
        numPastedRows: numRows,
    });
}

export function addRowsPerPivotValue(
    model: QueryGridModel,
    numPerParent: number,
    pivotKey: string,
    pivotValues: string[],
    rowData: Map<string, any>
): EditorModel {
    let editorModel = getEditorModel(model.getId());
    let data = model.data;
    let dataIds = model.dataIds;
    if (numPerParent > 0) {
        pivotValues.forEach(value => {
            rowData = rowData.set(pivotKey, value);
            editorModel = updateEditorData(model, rowData.toList(), numPerParent, dataIds.size);
            for (let i = 0; i < numPerParent; i++) {
                // ensure we don't step on another ID
                const id = GRID_EDIT_INDEX + ID_COUNTER++;

                data = data.set(id, rowData || EMPTY_ROW);
                dataIds = dataIds.push(id);
            }
        });
    }

    updateQueryGridModel(model, {
        data,
        dataIds,
        isError: false,
        message: undefined,
    });
    return editorModel;
}

export function addRows(model: QueryGridModel, count?: number, rowData?: Map<string, any>): EditorModel {
    let editorModel = getEditorModel(model.getId());
    if (count > 0) {
        if (model.editable) {
            if (rowData) {
                editorModel = updateEditorData(model, rowData.toList(), count, model.getData().size);
            } else {
                editorModel = updateEditorModel(editorModel, {
                    rowCount: editorModel.rowCount + count,
                });
            }
        }

        let data = model.data;
        let dataIds = model.dataIds;

        for (let i = 0; i < count; i++) {
            // ensure we don't step on another ID
            const id = GRID_EDIT_INDEX + ID_COUNTER++;

            data = data.set(id, rowData || EMPTY_ROW);
            dataIds = dataIds.push(id);
        }

        updateQueryGridModel(model, {
            data,
            dataIds,
            isError: false,
            message: undefined,
        });
    }

    return editorModel;
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
            value.split(',').forEach(v => {
                if (v.trim().length > 0) valuesByColumn.get(index).push(v.trim());
            });
        });
    });
    return valuesByColumn.asImmutable();
}

function isReadOnly(column: QueryColumn, columnMetadata: Map<string, EditableColumnMetadata>): boolean {
    const metadata: EditableColumnMetadata = columnMetadata && columnMetadata.get(column.fieldKey);
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
    model: EditorModel,
    gridModel: QueryGridModel,
    paste: IPasteModel,
    getLookup: (col: QueryColumn) => LookupStore,
    columnMetadata: Map<string, EditableColumnMetadata>,
    readonlyRows?: List<any>,
    lockRowCount?: boolean
): Promise<{ cellMessages: CellMessages; cellValues: CellValues; selectionCells: Set<string> }> {
    return new Promise(resolve => {
        const { data } = paste.payload;
        const columns = gridModel.getInsertColumns();

        const cellMessages = model.cellMessages.asMutable();
        const cellValues = model.cellValues.asMutable();
        const selectionCells = Set<string>().asMutable();

        if (model.hasMultipleSelection()) {
            model.selectionCells.forEach(cellKey => {
                const { colIdx } = parseCellKey(cellKey);
                const col = columns.get(colIdx);

                data.forEach(row => {
                    row.forEach(value => {
                        let cv: List<ValueDescriptor>;
                        let msg: CellMessage;

                        if (col && col.isPublicLookup()) {
                            const { message, values } = parsePasteCellLookup(col, getLookup(col), value);
                            cv = values;

                            if (message) {
                                msg = message;
                            }
                        } else {
                            cv = List([
                                {
                                    display: value,
                                    raw: value,
                                },
                            ]);
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

            let rowIdx = rowMin;
            let hasReachedRowLimit = false;
            data.forEach((row, rn) => {
                if (hasReachedRowLimit && lockRowCount) return;

                if (readonlyRows) {
                    while (rowIdx < model.rowCount && isReadonlyRow(gridModel, rowIdx, readonlyRows)) {
                        // add row if needed
                        rowIdx++;
                    }

                    if (rowIdx >= model.rowCount) {
                        hasReachedRowLimit = true;
                        return;
                    }
                }

                // find the next editable row;
                row.forEach((value, cn) => {
                    const colIdx = colMin + cn;
                    const col = columns.get(colIdx);
                    const cellKey = genCellKey(colIdx, rowIdx);

                    let cv: List<ValueDescriptor>;
                    let msg: CellMessage;

                    if (col && col.isPublicLookup()) {
                        const { message, values } = parsePasteCellLookup(col, getLookup(col), value);
                        cv = values;

                        if (message) {
                            msg = message;
                        }
                    } else {
                        cv = List([
                            {
                                display: value,
                                raw: value,
                            },
                        ]);
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

        resolve({
            cellMessages: cellMessages.asImmutable(),
            cellValues: cellValues.asImmutable(),
            selectionCells: selectionCells.asImmutable(),
        });
    });
}

function isReadonlyRow(model: QueryGridModel, rowInd: number, readonlyRows: List<string>): boolean {
    const data: List<Map<string, string>> = model.getDataEdit();
    const keyCols = model.getKeyColumns();

    if (keyCols.size == 1 && data.get(rowInd)) {
        const key = caseInsensitive(data.get(rowInd).toJS(), keyCols.get(0).fieldKey);
        return readonlyRows.contains(key);
    }

    return false;
}

function getReadonlyRowCount(
    model: QueryGridModel,
    editorModel: EditorModel,
    startRowInd: number,
    readonlyRows: List<string>
): number {
    const data: List<Map<string, string>> = model.getDataEdit();
    const keyCols = model.getKeyColumns();

    if (keyCols.size == 1) {
        const fieldKey = keyCols.get(0).fieldKey;
        let editableRowCount = 0;
        for (let i = startRowInd; i < editorModel.rowCount; i++) {
            const key = caseInsensitive(data.get(i).toJS(), fieldKey);
            if (readonlyRows.contains(key)) editableRowCount++;
        }

        return editableRowCount;
    }

    return editorModel.rowCount - startRowInd;
}

interface IParseLookupPayload {
    message?: CellMessage;
    values: List<ValueDescriptor>;
}

function parsePasteCellLookup(column: QueryColumn, lookup: LookupStore, value: string): IParseLookupPayload {
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

    const values = value
        .split(',')
        .map(v => {
            const vt = v.trim();
            if (vt.length > 0) {
                const vl = vt.toLowerCase();
                const vd = lookup.descriptors.find(d => d.display && d.display.toString().toLowerCase() === vl);
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

export function select(modelId: string, event: React.KeyboardEvent<HTMLElement>): void {
    const editModel = getEditorModel(modelId);

    if (editModel && !editModel.hasFocus()) {
        const colIdx = editModel.selectedColIdx;
        const rowIdx = editModel.selectedRowIdx;

        let nextCol, nextRow;

        switch (event.keyCode) {
            case KEYS.LeftArrow:
                if (event.ctrlKey) {
                    const found = editModel.findNextCell(colIdx, rowIdx, not(isCellEmpty), moveLeft);
                    if (found) {
                        nextCol = found.colIdx;
                        nextRow = found.rowIdx;
                    } else {
                        nextCol = 0;
                        nextRow = rowIdx;
                    }
                } else {
                    nextCol = colIdx - 1;
                    nextRow = rowIdx;
                }
                break;

            case KEYS.UpArrow:
                if (event.ctrlKey) {
                    const found = editModel.findNextCell(colIdx, rowIdx, not(isCellEmpty), moveUp);
                    if (found) {
                        nextCol = found.colIdx;
                        nextRow = found.rowIdx;
                    } else {
                        nextCol = colIdx;
                        nextRow = 0;
                    }
                } else {
                    nextCol = colIdx;
                    nextRow = rowIdx - 1;
                }
                break;

            case KEYS.RightArrow:
                if (event.ctrlKey) {
                    const found = editModel.findNextCell(colIdx, rowIdx, not(isCellEmpty), moveRight);
                    if (found) {
                        nextCol = found.colIdx;
                        nextRow = found.rowIdx;
                    } else {
                        nextCol = editModel.colCount - 1;
                        nextRow = rowIdx;
                    }
                } else {
                    nextCol = colIdx + 1;
                    nextRow = rowIdx;
                }
                break;

            case KEYS.DownArrow:
                if (event.ctrlKey) {
                    const found = editModel.findNextCell(colIdx, rowIdx, not(isCellEmpty), moveDown);
                    if (found) {
                        nextCol = found.colIdx;
                        nextRow = found.rowIdx;
                    } else {
                        nextCol = colIdx;
                        nextRow = editModel.rowCount - 1;
                    }
                } else {
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

export function removeAllRows(model: QueryGridModel): QueryGridModel {
    const editorModel = getEditorModel(model.getId());

    updateEditorModel(editorModel, {
        focusColIdx: -1,
        focusRowIdx: -1,
        rowCount: 0,
        selectedColIdx: -1,
        selectedRowIdx: -1,
        selectionCells: Set<string>(),
        cellMessages: Map<string, CellMessage>(),
        cellValues: Map<string, CellValues>(),
    });

    return updateQueryGridModel(model, {
        data: Map<any, Map<string, any>>(),
        dataIds: List<any>(),
        isError: false,
        message: undefined,
    });
}

export function updateGridFromBulkForm(
    gridModel: QueryGridModel,
    rowData: OrderedMap<string, any>,
    dataRowIndexes: List<number>
): EditorModel {
    const editorModel = getEditorModel(gridModel.getId());

    let cellMessages = editorModel.cellMessages;
    let cellValues = editorModel.cellValues;

    const preparedData = prepareUpdateRowDataFromBulkForm(gridModel, rowData);
    const { values, messages } = preparedData; // {3: 'x', 4: 'z}

    dataRowIndexes.forEach(rowIdx => {
        values.forEach((value, colIdx) => {
            const cellKey = genCellKey(colIdx, rowIdx);
            cellMessages = cellMessages.set(cellKey, messages.get(colIdx));
            cellValues = cellValues.set(cellKey, value);
        });
    });

    return updateEditorModel(editorModel, {
        cellValues,
        cellMessages,
    });
}

function prepareUpdateRowDataFromBulkForm(
    gridModel: QueryGridModel,
    rowData: OrderedMap<string, any>
): { values: OrderedMap<number, List<ValueDescriptor>>; messages: OrderedMap<number, CellMessage> } {
    const columns = gridModel.getInsertColumns();

    const getLookup = (col: QueryColumn) => getLookupStore(col);

    let values = OrderedMap<number, List<ValueDescriptor>>();
    let messages = OrderedMap<number, CellMessage>();

    rowData.forEach((data, colKey) => {
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
            const values = data.toString().split(',');
            values.forEach(val => {
                const intVal = parseInt(val, 10);
                const { message, valueDescriptor } = getLookupDisplayValue(
                    col,
                    getLookup(col),
                    isNaN(intVal) ? val : intVal
                );
                cv = cv.push(valueDescriptor);
                if (message) {
                    messages = messages.set(colIdx, message);
                }
            });
        } else {
            cv = List([
                {
                    display: data,
                    raw: data,
                },
            ]);
        }

        values = values.set(colIdx, cv);
    });

    return {
        values,
        messages,
    };
}

export function removeRows(model: QueryGridModel, dataIdIndexes: List<number>): void {
    const editorModel = getEditorModel(model.getId());

    // sort descending so we remove the data for the row with the largest index first and don't mess up the index number for other rows
    const sortedIdIndexes = dataIdIndexes.sort().reverse();

    let data = model.data;
    let dataIds = model.dataIds;
    let deletedIds = Set<any>();
    sortedIdIndexes.forEach(dataIdIndex => {
        const dataId = dataIds.get(dataIdIndex);
        deletedIds = deletedIds.add(dataId);
        data = data.remove(dataId);
        dataIds = dataIds.remove(dataIdIndex);
    });

    if (model.editable) {
        let newCellMessages = editorModel.cellMessages;
        let newCellValues = editorModel.cellValues;

        sortedIdIndexes.forEach(rowIdx => {
            newCellMessages = newCellMessages.reduce((newCellMessages, message, cellKey) => {
                const [colIdx, oldRowIdx] = cellKey.split('-').map(v => parseInt(v, 10));
                if (oldRowIdx > rowIdx) {
                    return newCellMessages.set([colIdx, oldRowIdx - 1].join('-'), message);
                } else if (oldRowIdx < rowIdx) {
                    return newCellMessages.set(cellKey, message);
                }

                return newCellMessages;
            }, Map<string, CellMessage>());

            newCellValues = newCellValues.reduce((newCellValues, value, cellKey) => {
                const [colIdx, oldRowIdx] = cellKey.split('-').map(v => parseInt(v, 10));

                if (oldRowIdx > rowIdx) {
                    return newCellValues.set([colIdx, oldRowIdx - 1].join('-'), value);
                } else if (oldRowIdx < rowIdx) {
                    return newCellValues.set(cellKey, value);
                }

                return newCellValues;
            }, Map<string, List<ValueDescriptor>>());
        });

        updateEditorModel(editorModel, {
            deletedIds: editorModel.deletedIds.merge(deletedIds),
            focusColIdx: -1,
            focusRowIdx: -1,
            rowCount: editorModel.rowCount - dataIdIndexes.size,
            selectedColIdx: -1,
            selectedRowIdx: -1,
            selectionCells: Set<string>(),
            cellMessages: newCellMessages,
            cellValues: newCellValues,
        });
    }

    updateQueryGridModel(model, {
        data,
        dataIds,
        isError: false,
        message: undefined,
    });
}

export function removeRow(model: QueryGridModel, dataId: any, rowIdx: number): void {
    removeRows(
        model,
        List<number>([rowIdx])
    );
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

interface IClientSideMetricCountResponse {
    count: number;
}

export function incrementClientSideMetricCount(
    featureArea: string,
    metricName: string
): Promise<IClientSideMetricCountResponse> {
    return new Promise((resolve, reject) => {
        if (!featureArea || !metricName)
            resolve(undefined);
        else {
            return Ajax.request({
                url: buildURL('core', 'incrementClientSideMetricCount.api'),
                method: 'POST',
                jsonData: {
                    featureArea,
                    metricName,
                },
                success: Utils.getCallbackWrapper(response => {
                    resolve(response);
                }),
                failure: Utils.getCallbackWrapper(
                    response => {
                        console.error(response);
                        reject(response);
                    },
                    this,
                    true
                ),
            });
        }
    });
}
