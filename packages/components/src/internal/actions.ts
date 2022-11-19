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

import { QueryColumn } from '../public/QueryColumn';

import { resolveKey, SchemaQuery } from '../public/SchemaQuery';

import { QueryInfo } from '../public/QueryInfo';

import { Actions } from '../public/QueryModel/withQueryModels';

import { getContainerFilter, invalidateQueryDetailsCache, selectRowsDeprecated } from './query/api';
import { Location } from './util/URL';
import {
    BARTENDER_EXPORT_CONTROLLER,
    CELL_SELECTION_HANDLE_CLASSNAME,
    EXPORT_TYPES,
    FASTA_EXPORT_CONTROLLER,
    GENBANK_EXPORT_CONTROLLER,
    GRID_EDIT_INDEX,
    VIEW_NOT_FOUND_EXCEPTION_CLASS,
} from './constants';
import { cancelEvent, getPasteValue, setCopyValue } from './events';
import {
    CellMessage,
    CellMessages,
    CellValues,
    EditorModel,
    EditorModelProps,
    IGridResponse,
    ValueDescriptor,
} from './components/editable/models';
import { DataViewInfo } from './DataViewInfo';
import { EditableColumnMetadata } from './components/editable/EditableGrid';

import {
    caseInsensitive,
    handleRequestFailure,
    isFloat,
    isInteger,
    parseCsvString,
    parseScientificInt,
} from './util/utils';
import { resolveErrorMessage } from './util/messaging';
import { hasModule } from './app/utils';
import { buildURL } from './url/AppURL';

import { ViewInfo } from './ViewInfo';
import { decimalDifference, genCellKey, getSortedCellKeys, parseCellKey } from './utils';
import { createGridModelId } from './models';

const EMPTY_ROW = Map<string, any>();
let ID_COUNTER = 0;

export function selectAll(
    key: string,
    schemaName: string,
    queryName: string,
    filterList: List<Filter.IFilter>,
    containerPath?: string,
    queryParameters?: Record<string, any>
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
            failure: handleRequestFailure(
                reject,
                `Problem in selecting all items in the grid ${key} ${schemaName} ${queryName}`
            ),
        });
    });
}

export function selectGridIdsFromTransactionId(
    gridIdPrefix: string,
    schemaQuery: SchemaQuery,
    transactionAuditId: number,
    dataType: string,
    actions: Actions
): Promise<any> {
    if (!transactionAuditId) {
        return;
    }
    const failureMsg = 'There was a problem retrieving the ' + dataType + ' from the last action.';
    const modelId = createGridModelId(gridIdPrefix, schemaQuery);

    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('audit', 'getTransactionRowIds.api'),
            method: 'GET',
            params: { transactionAuditId, dataType },
            success: Utils.getCallbackWrapper(response => {
                if (response.success) {
                    const selected = response.rowIds;
                    setSelected(
                        modelId,
                        true,
                        selected,
                        undefined,
                        true,
                        schemaQuery.getSchema(),
                        schemaQuery.getQuery()
                    )
                        .then(response => {
                            actions.replaceSelections(modelId, selected);
                            actions.loadModel(modelId, true);
                            resolve(selected);
                        })
                        .catch(reason => {
                            console.error(reason);
                            reject(reason);
                        });
                } else {
                    console.error(failureMsg + ' (transactionAuditId = ' + transactionAuditId + ')', response);
                    reject(failureMsg);
                }
            }),
            failure: Utils.getCallbackWrapper(error => {
                console.error(failureMsg + ' (transactionAuditId = ' + transactionAuditId + ')', error);
                reject(failureMsg);
            }),
        });
    });
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
                const value = row?.get(col.fieldKey);
                if (Utils.isNumber(value)) {
                    values = values.add(value);
                } else if (List.isList(value)) {
                    value.forEach(val => {
                        values = values.add(val);
                    });
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

export interface ExportOptions {
    columns?: string;
    containerFilter?: Query.ContainerFilter;
    containerPath?: string;
    filters?: List<Filter.IFilter>;
    selectionKey?: string;
    showRows?: 'ALL' | 'SELECTED' | 'UNSELECTED';
    sorts?: string;
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
    };

    if (advancedOptions) params = { ...params, ...advancedOptions };

    if (schemaQuery.viewName) {
        params['query.viewName'] = schemaQuery.viewName;
    }

    // Issue 32052: Apply default headers (CRSF, etc)
    const { defaultHeaders } = getServerContext();
    for (const i in defaultHeaders) {
        if (defaultHeaders.hasOwnProperty(i)) {
            params[i] = defaultHeaders[i];
        }
    }

    if (type === EXPORT_TYPES.CSV) {
        params.delim = 'COMMA';
    }

    if (options) {
        if (options.columns) {
            let columnsString = options.columns;
            if (advancedOptions?.includeColumn)
                columnsString = columnsString + ',' + advancedOptions.includeColumn.join(',');
            if (advancedOptions?.excludeColumn) {
                const toExclude = advancedOptions.excludeColumn;
                const columns = [];
                columnsString.split(',').forEach(col => {
                    if (toExclude.indexOf(col) === -1 && toExclude.indexOf(col.toLowerCase()) === -1) {
                        columns.push(col);
                    }
                });
                params['query.columns'] = columns.join(',');
            } else {
                params['query.columns'] = columnsString;
            }
        }

        const containerFilter = options.containerFilter ?? getContainerFilter(options.containerPath);
        if (containerFilter) {
            params['query.containerFilterName'] = containerFilter;
        }

        options.filters?.forEach(f => {
            if (f) {
                const name = f.getURLParameterName();
                if (!params[name]) {
                    params[name] = [];
                }
                params[name].push(f.getURLParameterValue());
            }
        });

        if (options.selectionKey !== undefined) {
            params['query.selectionKey'] = options.selectionKey;
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

export function exportRows(type: EXPORT_TYPES, exportParams: Record<string, any>, containerPath?: string): void {
    const form = new FormData();
    Object.keys(exportParams).forEach(key => {
        const value = exportParams[key];

        if (value instanceof Array) {
            value.forEach(arrayValue => form.append(key, arrayValue));
        } else {
            form.append(key, value);
        }
    });

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
        form.append('format', 'FASTA');
    } else if (type === EXPORT_TYPES.GENBANK) {
        controller = GENBANK_EXPORT_CONTROLLER;
        action = 'export.post';
        form.append('format', 'GENEBANK');
    } else if (type === EXPORT_TYPES.LABEL) {
        controller = BARTENDER_EXPORT_CONTROLLER;
        action = 'printBarTenderLabels.post';
    } else {
        throw new Error('Unknown export type: ' + type);
    }

    Ajax.request({
        url: buildURL(controller, action, undefined, { container: containerPath, returnUrl: false }),
        method: 'POST',
        form,
        downloadFile: true,
    });
}

interface IGetSelectedResponse {
    selected: any[];
}

function getFilteredQueryParams(
    key: string,
    schemaName: string,
    queryName: string,
    filterList: List<Filter.IFilter>,
    queryParameters?: Record<string, any>,
    containerPath?: string
): Record<string, any> {
    if (schemaName && queryName && filterList && !filterList.isEmpty()) {
        return getQueryParams(key, schemaName, queryName, filterList, queryParameters, containerPath);
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
    queryParameters?: Record<string, any>,
    containerPath?: string
): Record<string, any> {
    const filters = filterList.reduce((prev, next) => {
        return Object.assign(prev, { [next.getURLParameterName()]: next.getURLParameterValue() });
    }, {});

    const params = {
        schemaName,
        queryName,
        'query.selectionKey': key,
    };

    const containerFilter = queryParameters?.containerFilter ?? getContainerFilter(containerPath);
    if (containerFilter) {
        params['query.containerFilterName'] = containerFilter;
    }

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
    queryParameters?: Record<string, any>
): Promise<IGetSelectedResponse> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('query', 'getSelected.api', undefined, {
                container: containerPath,
            }),
            method: 'POST',
            jsonData: getFilteredQueryParams(key, schemaName, queryName, filterList, queryParameters, containerPath),
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: handleRequestFailure(reject, 'Failed to get selected.'),
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
            jsonData: getFilteredQueryParams(key, schemaName, queryName, filterList, queryParameters, containerPath),
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: handleRequestFailure(reject, `Problem clearing the selection ${key} ${schemaName} ${queryName}`),
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
    queryParameters?: Record<string, any>
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
            failure: handleRequestFailure(reject, 'Failed to set selection.'),
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
            failure: handleRequestFailure(reject, 'Failed to replace selection.'),
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
            failure: handleRequestFailure(reject, 'Failed to set snapshot selection.'),
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
            failure: handleRequestFailure(reject, 'Failed to get snapshot selection.'),
        });
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
                getFilterListFromQuery(location)
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
    queryParameters?: Record<string, any>,
    viewName?: string,
    keyColumn = 'RowId'
): Promise<IGridResponse> {
    return new Promise((resolve, reject) =>
        selectRowsDeprecated({
            schemaName,
            queryName,
            viewName,
            filterArray: [Filter.create(keyColumn, selections, Filter.Types.IN)],
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
            failure: handleRequestFailure(reject),
        });
    });
}

const dragLock = Map<string, boolean>().asMutable();
let dragHandleInitSelection; // track the initial selection state if the drag event was initiated from the corner drag handle

export function beginDrag(editorModel: EditorModel, event: any): void {
    if (handleDrag(editorModel, event)) {
        dragLock.set(editorModel.id, true);

        const isDragHandleAction = (event.target as Element).className?.indexOf(CELL_SELECTION_HANDLE_CLASSNAME) > -1;
        if (isDragHandleAction) {
            dragHandleInitSelection = [...editorModel.selectionCells.toArray()];
            if (!dragHandleInitSelection.length) dragHandleInitSelection.push(editorModel.selectionKey);
        }
    }
}

export function endDrag(editorModel: EditorModel, event: any): string[] {
    if (handleDrag(editorModel, event)) {
        dragLock.remove(editorModel.id);

        const _dragHandleInitSelection = dragHandleInitSelection ? [...dragHandleInitSelection] : undefined;
        dragHandleInitSelection = undefined;
        return _dragHandleInitSelection;
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

const resolveDisplayColumn = (column: QueryColumn): string => {
    // Handle MVFK
    if (column.multiValue && column.isJunctionLookup()) {
        const parts = column.displayField.split('$S');
        if (parts.length > 1) return parts[1];
    }

    return column.lookup.displayColumn;
};

const findLookupValues = async (
    column: QueryColumn,
    lookupKeyValues?: any[],
    lookupValues?: any[]
): Promise<{ column: QueryColumn; descriptors: ValueDescriptor[] }> => {
    const lookup = column.lookup;
    const { keyColumn } = column.lookup;
    const displayColumn = resolveDisplayColumn(column);

    const selectRowsOptions: any = {
        schemaName: lookup.schemaName,
        queryName: lookup.queryName,
        viewName: ViewInfo.DETAIL_NAME, // Use the detail view so values that may be filtered out of the default view show up.
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
): Promise<{ messages: List<CellMessage>; values: List<List<ValueDescriptor>> }> {
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
                const { message, valueDescriptor } = await getLookupDisplayValue(col, parseIntIfNumber(val));
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

// exported for jest testing
export function parseIntIfNumber(val: any): number | string {
    const intVal = !isNaN(val) ? parseInt(val, 10) : undefined;
    return intVal === undefined || isNaN(intVal) ? val : intVal;
}

export function checkCellReadStatus(
    row: any,
    queryInfo: QueryInfo,
    columnMetadata: EditableColumnMetadata,
    readonlyRows: List<any>,
    lockedRows: List<any>
): { isLockedRow: boolean; isReadonlyCell: boolean; isReadonlyRow: boolean } {
    if (readonlyRows || columnMetadata?.isReadOnlyCell || lockedRows) {
        const keyCols = queryInfo.getPkCols();
        if (keyCols.size === 1) {
            let key = caseInsensitive(row.toJS(), keyCols.get(0).fieldKey);
            if (Array.isArray(key)) key = key[0];
            if (typeof key === 'object') key = key.value;

            return {
                isReadonlyRow: readonlyRows && key ? readonlyRows.contains(key) : false,
                isReadonlyCell: columnMetadata?.isReadOnlyCell ? columnMetadata.isReadOnlyCell(key) : false,
                isLockedRow: lockedRows && key ? lockedRows.contains(key) : false,
            };
        } else {
            console.warn(
                'Setting readonly rows or cells for models with ' + keyCols.size + ' keys is not currently supported.'
            );
        }
    }

    return {
        isReadonlyRow: false,
        isReadonlyCell: false,
        isLockedRow: false,
    };
}

export function dragFillEvent(
    editorModel: EditorModel,
    initSelection: string[],
    dataKeys: List<any>,
    data: Map<any, Map<string, any>>,
    queryInfo: QueryInfo,
    columnMetadata: EditableColumnMetadata,
    readonlyRows: List<any>,
    lockedRows: List<any>
): EditorModelAndGridData {
    if (initSelection?.length > 0) {
        const initColIdx = parseCellKey(initSelection[0]).colIdx;
        const fillCells = editorModel.sortedSelectionKeys
            // initially we will only support fill for drag end that is within a single column
            .filter(cellKey => parseCellKey(cellKey).colIdx === initColIdx)
            // filter out the initial selection as we don't want to update/fill those
            .filter(cellKey => initSelection.indexOf(cellKey) === -1)
            // filter out readOnly/locked rows and columns
            .filter(cellKey => {
                const { isReadonlyCell, isReadonlyRow, isLockedRow } = checkCellReadStatus(
                    data.get(dataKeys.get(parseCellKey(cellKey).rowIdx)),
                    queryInfo,
                    columnMetadata,
                    readonlyRows,
                    lockedRows
                );
                return !isReadonlyCell && !isReadonlyRow && !isLockedRow;
            });

        return {
            data: undefined,
            dataKeys: undefined,
            editorModel: {
                cellValues: generateFillSequence(editorModel, initSelection, fillCells),
            },
        };
    }

    return { data: undefined, dataKeys: undefined, editorModel: undefined };
}

/**
 * Generate a sequence, of length fillSelection, based on the values in the initSelection of the editorModel.
 * If the initSelection is for a single cell, the fill operation will always be a copy of that value.
 * If the initSelection includes a range of cells and all values are numeric, fill via a generated sequence where the step/diff is based on the first and last value in the initSelection.
 * If the initSelection includes a range of cells and not all values are numeric, fill via a copy of all of the values in initSelection.
 */
export function generateFillSequence(
    editorModel: EditorModel,
    initSelection: string[],
    fillSelection: string[]
): CellValues {
    const sortedInitSelection = getSortedCellKeys(initSelection, editorModel.rowCount);
    const initCellValues = sortedInitSelection.map(cellKey => editorModel.getValueForCellKey(cellKey));
    const initCellRawValues = initCellValues.map(cellValue => cellValue?.first()?.raw);
    const initCellDisplayValues = initCellValues.map(cellValue => cellValue?.first()?.display);

    // use the display values to determine sequence type to account for lookup cell values with numeric key/raw values
    const isFloatSeq = initCellValues.length > 1 && initCellDisplayValues.every(isFloat);
    const isIntSeq = initCellValues.length > 1 && initCellDisplayValues.every(isInteger);

    let firstCellRawVal = initCellRawValues[0];
    let lastCellRawVal = initCellRawValues[initCellRawValues.length - 1];

    let diff = 0;
    if (isFloatSeq || isIntSeq) {
        if (isFloatSeq) {
            firstCellRawVal = parseFloat(firstCellRawVal);
            lastCellRawVal = parseFloat(lastCellRawVal);
        } else if (isIntSeq) {
            firstCellRawVal = parseScientificInt(firstCellRawVal);
            lastCellRawVal = parseScientificInt(lastCellRawVal);
        }

        // diff -> last value minus first value divide by the number of steps in the initial selection
        diff = decimalDifference(lastCellRawVal, firstCellRawVal);
        diff = initCellRawValues.length > 1 ? diff / (initCellRawValues.length - 1) : 0;
    }

    let cellValues = editorModel.cellValues;
    fillSelection.forEach((cellKey, i) => {
        let fillValue = initCellValues[i % sortedInitSelection.length];
        if (isFloatSeq || isIntSeq) {
            const raw = decimalDifference(diff * (i + 1), lastCellRawVal, false);
            fillValue = List([{ raw, display: raw }]);
        }

        cellValues = cellValues.set(cellKey, fillValue);
    });

    return cellValues;
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
    coordinates: {
        colMax: number;
        colMin: number;
        rowMax: number;
        rowMin: number;
    };
    message?: string;
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
    newCellMessages = newCellMessages.reduce((cellMessages, message, cellKey) => {
        const [oldColIdx] = cellKey.split('-').map(v => parseInt(v, 10));
        if (oldColIdx !== colIndex) {
            return cellMessages.set(cellKey, message);
        }

        return cellMessages;
    }, Map<string, CellMessage>());

    newCellValues = newCellValues.reduce((cellValues, value, cellKey) => {
        const [oldColIdx] = cellKey.split('-').map(v => parseInt(v, 10));

        if (oldColIdx !== colIndex) {
            return cellValues.set(cellKey, value);
        }

        return cellValues;
    }, Map<string, List<ValueDescriptor>>());

    const currentCol = queryInfo.getColumn(existingFieldKey);

    // remove existing column and set new column in data
    const data = originalData
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

    let editorModelColumns = editorModel.columns;
    const replaceIdx = editorModelColumns.findIndex(fieldKey => fieldKey === existingFieldKey);
    if (replaceIdx > -1) {
        editorModelColumns = editorModelColumns.set(replaceIdx, newQueryColumn.fieldKey);
    }

    return {
        editorModelChanges: {
            columns: editorModelColumns,
            focusColIdx: -1,
            focusRowIdx: -1,
            selectedColIdx: -1,
            selectedRowIdx: -1,
            selectionCells: Set<string>(),
            cellMessages: newCellMessages,
            cellValues: newCellValues,
        },
        data,
        queryInfo: queryInfo.merge({ columns }) as QueryInfo,
    };
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

    newCellMessages = newCellMessages.reduce((cellMessages, message, cellKey) => {
        const [oldColIdx, oldRowIdx] = cellKey.split('-').map(v => parseInt(v, 10));
        if (oldColIdx > deleteIndex) {
            return cellMessages.set([oldColIdx - 1, oldRowIdx].join('-'), message);
        } else if (oldColIdx < deleteIndex) {
            return cellMessages.set(cellKey, message);
        }

        return cellMessages;
    }, Map<string, CellMessage>());

    newCellValues = newCellValues.reduce((cellValues, value, cellKey) => {
        const [oldColIdx, oldRowIdx] = cellKey.split('-').map(v => parseInt(v, 10));

        if (oldColIdx > deleteIndex) {
            return cellValues.set([oldColIdx - 1, oldRowIdx].join('-'), value);
        } else if (oldColIdx < deleteIndex) {
            return cellValues.set(cellKey, value);
        }

        return cellValues;
    }, Map<string, List<ValueDescriptor>>());

    // remove column from all rows in model data
    const data = originalData.map(rowData => rowData.remove(fieldKey)).toMap();

    let columns = editorModel.columns;
    const removeIdx = editorModel.columns.findIndex(colFieldKey => Utils.caseInsensitiveEquals(colFieldKey, fieldKey));
    if (removeIdx > -1) {
        columns = columns.remove(removeIdx);
    }

    return {
        editorModelChanges: {
            columns,
            colCount: editorModel.colCount - 1,
            focusColIdx: -1,
            focusRowIdx: -1,
            selectedColIdx: -1,
            selectedRowIdx: -1,
            selectionCells: Set<string>(),
            cellMessages: newCellMessages,
            cellValues: newCellValues,
        },
        data,
        queryInfo: queryInfo.merge({ columns: queryInfo.columns.remove(fieldKey.toLowerCase()) }) as QueryInfo,
    };
}

interface GridData {
    data: Map<any, Map<string, any>>;
    dataKeys: List<any>;
}

export interface EditorModelUpdates {
    data?: Map<any, Map<string, any>>;
    editorModelChanges?: Partial<EditorModelProps>;
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

    newCellMessages = newCellMessages.reduce((cellMessages, message, cellKey) => {
        const [oldColIdx, oldRowIdx] = cellKey.split('-').map(v => parseInt(v, 10));
        if (oldColIdx >= editorColIndex) {
            return cellMessages.set([oldColIdx + queryColumns.size, oldRowIdx].join('-'), message);
        } else if (oldColIdx < editorColIndex) {
            return cellMessages.set(cellKey, message);
        }

        return cellMessages;
    }, Map<string, CellMessage>());

    newCellValues = newCellValues.reduce((cellValues, value, cellKey) => {
        const [oldColIdx, oldRowIdx] = cellKey.split('-').map(v => parseInt(v, 10));

        if (oldColIdx >= editorColIndex) {
            return cellValues.set([oldColIdx + queryColumns.size, oldRowIdx].join('-'), value);
        } else if (oldColIdx < editorColIndex) {
            return cellValues.set(cellKey, value);
        }

        return cellValues;
    }, Map<string, List<ValueDescriptor>>());
    for (let rowIdx = 0; rowIdx < editorModel.rowCount; rowIdx++) {
        for (let c = 0; c < queryColumns.size; c++) {
            newCellValues = newCellValues.set(genCellKey(editorColIndex + c, rowIdx), List<ValueDescriptor>());
        }
    }

    const data = originalData
        .map(rowData => {
            queryColumns.forEach(column => {
                rowData = rowData.set(column.fieldKey, undefined);
            });
            return rowData;
        })
        .toMap();

    let { columns } = editorModel;
    if (columns.size < editorColIndex) {
        columns = columns.concat(queryColumns.valueSeq().map(col => col.fieldKey)).toList();
    } else {
        queryColumns.valueSeq().forEach((col, i) => {
            columns = columns.insert(i + editorColIndex, col.fieldKey);
        });
        columns = columns.toList();
    }

    return {
        editorModelChanges: {
            columns,
            colCount: editorModel.colCount + queryColumns.size,
            focusColIdx: -1,
            focusRowIdx: -1,
            selectedColIdx: -1,
            selectedRowIdx: -1,
            selectionCells: Set<string>(),
            cellMessages: newCellMessages,
            cellValues: newCellValues,
        },
        data,
        queryInfo: queryInfo.merge({ columns: queryInfo.insertColumns(queryColIndex, queryColumns) }) as QueryInfo,
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
    dataRowIndexes: List<number>,
    lockedOrReadonlyRows?: number[]
): Promise<Partial<EditorModel>> {
    let cellMessages = editorModel.cellMessages;
    let cellValues = editorModel.cellValues;

    const preparedData = await prepareUpdateRowDataFromBulkForm(queryInfo, rowData);
    const { values, messages } = preparedData; // {3: 'x', 4: 'z}

    dataRowIndexes.forEach(rowIdx => {
        if (lockedOrReadonlyRows && lockedOrReadonlyRows.indexOf(rowIdx) > -1) return;

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
): Promise<{ messages: OrderedMap<number, CellMessage>; values: OrderedMap<number, List<ValueDescriptor>> }> {
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
                const { message, valueDescriptor } = await getLookupDisplayValue(col, parseIntIfNumber(val));
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

export function saveAsSessionView(schemaQuery: SchemaQuery, containerPath: string, viewInfo: ViewInfo): Promise<void> {
    // See DataRegion.js _updateSessionCustomView(), this set of hard coded booleans matches that set
    return saveGridView(schemaQuery, containerPath, viewInfo, true, true, false, false);
}

export function saveGridView(
    schemaQuery: SchemaQuery,
    containerPath: string,
    viewInfo: ViewInfo,
    replace: boolean,
    session: boolean,
    inherit: boolean,
    shared: boolean
): Promise<void> {
    return new Promise((resolve, reject) => {
        Query.saveQueryViews({
            schemaName: schemaQuery.schemaName,
            queryName: schemaQuery.queryName,
            containerPath,
            views: [{ ...ViewInfo.serialize(viewInfo), replace, session, inherit, shared, hidden: false }],
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

// save the current session view as a non session view, remove session view
export function saveSessionView(
    schemaQuery: SchemaQuery,
    containerPath: string,
    viewName: string,
    newName: string,
    inherit?: boolean,
    shared?: boolean,
    replace?: boolean
): Promise<void> {
    return new Promise((resolve, reject) => {
        Query.saveSessionView({
            schemaName: schemaQuery.schemaName,
            queryName: schemaQuery.queryName,
            containerPath,
            viewName,
            newName,
            inherit,
            shared,
            hidden: false,
            replace,
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

export function getGridViews(
    schemaQuery: SchemaQuery,
    sort?: boolean,
    viewName?: string,
    excludeSessionView?: boolean,
    includeHidden?: boolean
): Promise<ViewInfo[]> {
    return new Promise((resolve, reject) => {
        Query.getQueryViews({
            schemaName: schemaQuery.schemaName,
            queryName: schemaQuery.queryName,
            viewName,
            excludeSessionView,
            success: response => {
                const views = [];
                response.views?.forEach(view => {
                    if (includeHidden || view['hidden'] !== true) views.push(ViewInfo.create(view));
                });
                if (sort) {
                    views.sort((a, b) => {
                        if (a === ViewInfo.DEFAULT_NAME) return -1;
                        else if (b === '') return 1;

                        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
                    });
                }
                resolve(views);
            },
            failure: response => {
                console.error(response);
                reject('There was a problem loading the views for the data grid. ' + resolveErrorMessage(response));
            },
        });
    });
}

export function getGridView(
    schemaQuery: SchemaQuery,
    viewName?: string,
    excludeSessionView?: boolean
): Promise<ViewInfo> {
    return new Promise((resolve, reject) => {
        getGridViews(schemaQuery, false, viewName, excludeSessionView)
            .then(views => {
                if (views?.length > 0) resolve(views[0]);
                else reject('Unable to load the view.');
            })
            .catch(error => reject(error));
    });
}

export function revertViewEdit(schemaQuery: SchemaQuery, containerPath: string, viewName?: string): Promise<void> {
    return deleteView(schemaQuery, containerPath, viewName, true);
}

export function deleteView(
    schemaQuery: SchemaQuery,
    containerPath: string,
    viewName?: string,
    revert?: boolean
): Promise<void> {
    return new Promise((resolve, reject) => {
        Query.deleteQueryView({
            schemaName: schemaQuery.schemaName,
            queryName: schemaQuery.queryName,
            viewName,
            containerPath,
            revert,
            success: () => {
                invalidateQueryDetailsCache(schemaQuery, containerPath);
                resolve();
            },
            failure: response => {
                if (response.exceptionClass === VIEW_NOT_FOUND_EXCEPTION_CLASS) {
                    invalidateQueryDetailsCache(schemaQuery, containerPath);
                    resolve(); // view has already been deleted
                } else {
                    console.error(response);
                    reject('Unable to deleting the view for the data grid. ' + resolveErrorMessage(response));
                }
            },
        });
    });
}

/**
 * Rename a custom view from viewName to newName.
 * @param schemaQuery
 * @param containerPath
 * @param viewName The old custom view name to replace
 * @param newName The new custom view name
 */
export function renameGridView(
    schemaQuery: SchemaQuery,
    containerPath: string,
    viewName: string,
    newName: string
): Promise<void> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('query', 'renameQueryView.api', undefined, {
                container: containerPath,
            }),
            method: 'POST',
            jsonData: {
                schemaName: schemaQuery.schemaName,
                queryName: schemaQuery.queryName,
                viewName,
                newName,
            },
            success: Utils.getCallbackWrapper(response => {
                invalidateQueryDetailsCache(schemaQuery, containerPath);
                resolve();
            }),
            failure: Utils.getCallbackWrapper(error => {
                console.error(error);
                reject(resolveErrorMessage(error) ?? 'Failed to rename the custom view.');
            }),
        });
    });
}
