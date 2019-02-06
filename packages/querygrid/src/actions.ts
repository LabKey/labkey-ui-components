/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List, Map, Set } from 'immutable'
import { Location } from 'history'
import { Ajax, Filter, Utils } from '@labkey/api'

import { getQueryDetails } from './query/api'
import { CHECKBOX_OPTIONS } from './query/constants'
import { isEqual } from './query/filter'
import { QueryColumn, QueryInfo, SchemaQuery } from './query/model'
import { buildURL, getSortFromUrl } from './util/ActionURL'
import { QueryGridModel } from './model'
import { bindColumnRenderers } from './renderers'
import { getQueryGridModelsForSchema, getQueryGridModelsForSchemaQuery, updateQueryGridModel } from './reducers'

export function init(model: QueryGridModel, location?: Location) {
    let newModel = updateQueryGridModel(model, {}, false);

    if (!newModel.isLoaded) {
        if (newModel.bindURL) {
            newModel = updateQueryGridModel(newModel, {
                isLoading: true,
                ...bindURLProps(newModel, location)
            });
        }
        else {
            newModel = updateQueryGridModel(newModel, {isLoading: true});
        }

        fetchQueryInfo(newModel).then(queryInfo => {
            newModel = updateQueryGridModel(newModel, {
                queryInfo: bindQueryInfo(queryInfo)
            });

            // TODO not yet ready to handle the editable case for the shared component
            // if (newModel.editable) {
            //     initEditorModel(newModel);
            // }

            load(newModel, location);
        });
    }
    else if (hasURLChange(newModel, location) && newModel.bindURL) {
        newModel = updateQueryGridModel(newModel, bindURLProps(newModel, location));
        load(newModel, location);
    }
}

export function sort(model: QueryGridModel, columnIndex: string, dir: string, location: Location) {
    // TODO how to handle this routing case from within the shared component?
    // if (model.bindURL) {
    //     const urlDir = dir == '+' ? '' : '-';
    //     replaceParameters(location, Map<string, any>({
    //         [model.createParam('sort')]: `${urlDir}${columnIndex}`
    //     }));
    // }
    // else {
        let newModel = updateQueryGridModel(model, {
            sorts: dir + columnIndex // TODO: Support multiple sorts
        });

        load(newModel, location)
    // }
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
            let selectedState: CHECKBOX_OPTIONS;

            if (checked) {
                // if one is checked, value cannot be 'NONE'
                const allSelected: boolean = model.data.every(d => {
                    // compare if item is already 'checked' or will be 'checked' by this action
                    let keyVal = d.getIn([pkCol.name, 'value']) !== undefined ? d.getIn([pkCol.name, 'value']).toString() : undefined;

                    return keyVal === stringKey || selected.indexOf(keyVal) !== -1;
                });

                selectedState = allSelected ? CHECKBOX_OPTIONS.ALL : CHECKBOX_OPTIONS.SOME;
            }
            else {
                // if unchecking, value cannot be 'ALL'
                const someSelected: boolean = model.data.some(d => {
                    // compare if item is already 'checked' or will be 'unchecked' by this action
                    let keyVal = d.getIn([pkCol.name, 'value']) !== undefined ? d.getIn([pkCol.name, 'value']).toString() : undefined;
                    return keyVal !== stringKey && selected.indexOf(keyVal) !== -1;
                });

                selectedState = someSelected ? CHECKBOX_OPTIONS.SOME : CHECKBOX_OPTIONS.NONE;
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

export function schemaInvalidate(schemaName: string) {
    getQueryGridModelsForSchema(schemaName).map((model) => invalidate(model));
}

export function queryInvalidate(schemaQuery: SchemaQuery) {
    getQueryGridModelsForSchemaQuery(schemaQuery).map((model) => invalidate(model));
}

export function invalidate(model: QueryGridModel): QueryGridModel {
    return updateQueryGridModel(model, {
        data: Map<any, List<any>>(),
        dataIds: List<any>(),
        isError: false,
        isLoaded: false,
        isLoading: false,
        message: undefined
    });
}

export function loadPage(model: QueryGridModel, pageNumber: number, location: Location) {
    if (pageNumber !== model.pageNumber) {
        // TODO how to handle this routing case from within the shared component?
        // if (model.bindURL) {
        //     dispatch(replaceParameters(getLocation(getState), Map<string, any>({
        //         [model.createParam('p')]: pageNumber > 1 ? pageNumber : undefined
        //     })));
        // }
        // else {
            let newModel = updateQueryGridModel(model, {pageNumber: pageNumber > 1 ? pageNumber : 1});
            load(newModel, location);
        // }
    }
}

export function refresh(model: QueryGridModel, location: Location) {
    let newModel = invalidate(model);

    if (model.allowSelection) {
        setGridUnselected(newModel);
    }

    load(newModel, location);
}

// Takes a List<Filter.Filter> and remove each filter from the grid model
// Alternately, the 'all' flag can be set to true to remove all filters. This
// setting takes precedence over the filters list.
export function removeFilters(model: QueryGridModel, location: Location, filters?: List<any>, all: boolean = false) {
    // TODO how to handle this routing case from within the shared component?
    // if (model.bindURL) {
    //     dispatch(replaceParameters(getLocation(getState), getFilterParameters(filters, true)));
    // }
    // else {
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

        load(newModel, location);
    // }
}

export function addFilters(model: QueryGridModel, filters: List<Filter.Filter>, location: Location) {
    // TODO how to handle this routing case from within the shared component?
    // if (model.bindURL) {
    //     dispatch(replaceParameters(getLocation(getState), getFilterParameters(filters)));
    // }
    // else {
        if (filters.count()) {
            let newModel = updateQueryGridModel(model, {filterArray: model.filterArray.merge(filters)});
            load(newModel, location);
        }
    // }
}

export function load(model: QueryGridModel, location: Location) {
    // validate view exists prior to initiating request
    if (model.view && model.queryInfo && !model.queryInfo.getView(model.view)) {
        setError(model, `Unable to find view "${model.view}".`);
        return;
    }

    let newModel = updateQueryGridModel(model, {isLoading: true});

    newModel.loader.fetch(newModel, location).then(response => {
        // TODO not yet ready to handle the editable case for the shared component
        // load data into editor
        // if (newModel.editable) {
        //     dispatch({
        //         type: TYPES.GRID_EDITOR_LOAD_DATA,
        //         model: newModel,
        //         response
        //     });
        // }

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
        });

        if (newModel.allowSelection) {
            fetchSelectedIfNeeded(newModel);
        }
    }, payload => {
        handleQueryErrorAction(payload.model, payload.error);
    });
}

function bindURLProps(model: QueryGridModel, location: Location): Partial<QueryGridModel> {
    let props = {
        filterArray: List<Filter.Filter>(),
        pageNumber: 1,
        sorts: model.sorts || undefined,
        urlParamValues: Map<string, any>().asMutable(),
        view: undefined
    };

    if (location) {
        const queryString = location.search;
        const p = location.query[model.createParam('p')];
        const q = location.query[model.createParam('q')];
        const view = location.query[model.createParam('view')];

        props.filterArray = List<Filter.Filter>(Filter.getFiltersFromUrl(queryString, model.urlPrefix))
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
                const value = location.query[model.createParam(paramName)];
                if (value !== undefined) {
                    props.urlParamValues.set(paramName, value);
                }
            });
        }

        props.urlParamValues = props.urlParamValues.asImmutable();
    }

    return props;
}

function bindSearch(searchTerm: string): List<Filter.Filter> {
    let searchFilters = List<Filter.Filter>().asMutable();

    if (searchTerm) {
        searchTerm.split(';').forEach((term) => {
            if (term) {
                searchFilters.push(Filter.create('*', term, Filter.Types.Q));
            }
        });
    }

    return searchFilters.asImmutable();
}

function hasURLChange(model: QueryGridModel, location: Location): boolean {
    if (!model || !model.bindURL || !location) {
        return false;
    }

    const nextProps = bindURLProps(model, location);

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

function getSelectedState(dataIds: List<string>, selected: List<string>, maxRows: number, totalRows: number): CHECKBOX_OPTIONS {

    const selectedOnPage: number = dataIds.filter((id) => selected.indexOf(id) !== -1).size,
        totalSelected: number = selected.size;

    if (
        maxRows === selectedOnPage ||
        totalRows === totalSelected && totalRows !== 0 ||
        selectedOnPage === dataIds.size && selectedOnPage > 0
    ) {
        return CHECKBOX_OPTIONS.ALL;
    }
    else if (totalSelected > 0) {
        // if model has any selected show checkbox as indeterminate
        return CHECKBOX_OPTIONS.SOME;
    }

    return CHECKBOX_OPTIONS.NONE;
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
            handleQueryErrorAction(payload.model, payload.error);
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
            selectedState: checked ? CHECKBOX_OPTIONS.ALL : CHECKBOX_OPTIONS.NONE
        });
    });
}

function setGridUnselected(model: QueryGridModel) {
    clearSelected(model.getId()).then(() => {
        updateQueryGridModel(model, {
            selectedIds: List<string>(),
            selectedQuantity: 0,
            selectedState: CHECKBOX_OPTIONS.NONE
        });
    }).catch(err => {
        const error = err ? err : {message: 'Something went wrong'};
        handleQueryErrorAction(model, error);
    })
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

function setError(model: QueryGridModel, message: string) {
    updateQueryGridModel(model, {
        isLoading: false,
        isLoaded: true,
        isError: true,
        message
    })
}

function handleQueryErrorAction(model: QueryGridModel, error: any) {
    setError(model, error ? (error.status ? error.status + ': ' : '') + (error.message ? error.message : error.exception) : 'Query error');
}