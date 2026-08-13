/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { ComponentType, FC, PureComponent, ReactNode } from 'react';
import { Filter } from '@labkey/api';
// eslint cannot find Draft for some reason, but Intellij can.

import { Draft, produce, WritableDraft } from 'immer';
import { SetURLSearchParams, useSearchParams } from 'react-router-dom';

import { getQueryParams } from '../../internal/util/URL';

import { SchemaQuery } from '../SchemaQuery';
import { QuerySort } from '../QuerySort';
import { isLoading, LoadingState } from '../LoadingState';
import { naturalSort } from '../sort';
import { resolveErrorMessage } from '../../internal/util/messaging';

import { selectRows } from '../../internal/query/selectRows';

import { incrementClientSideMetricCount } from '../../internal/actions';

import { filterArraysEqual, getSelectRowCountColumnsStr, sortArraysEqual } from './utils';
import { DefaultQueryModelLoader, QueryModelLoader } from './QueryModelLoader';
import { RequestHandler } from '../../internal/request';
import {
    getSettingsFromLocalStorage,
    GridMessage,
    locationHasQueryParamSettings,
    QueryConfig,
    QueryModel,
    removeSettingsFromLocalStorage,
    SavedSettings,
    saveSettingsToLocalStorage,
} from './QueryModel';

export interface SearchParamsProps {
    searchParams: URLSearchParams;
    setSearchParams: SetURLSearchParams;
}

type WithSearchParamsComponent<T> = ComponentType<SearchParamsProps & T>;

const DEFAULT_SEARCH_PARAMS = new URLSearchParams();
const DEFAULT_SET_SEARCH_PARAMS = () => {};

export function withSearchParams<T>(Component: WithSearchParamsComponent<T>): ComponentType<T> {
    const Wrapped: FC<SearchParamsProps & T> = (props: T) => {
        let searchParams;
        let setSearchParams;
        try {
            [searchParams, setSearchParams] = useSearchParams();
        } catch (error) {
            // We are not in a react router context, so we revert to injecting a default set of these props
            searchParams = DEFAULT_SEARCH_PARAMS;
            setSearchParams = DEFAULT_SET_SEARCH_PARAMS;
        }
        return <Component searchParams={searchParams} setSearchParams={setSearchParams} {...props} />;
    };

    return Wrapped;
}

function columnHasFilter(fieldKey: string, filters: Filter.IFilter[]): boolean {
    fieldKey = fieldKey.toLowerCase();
    return filters.some(filter => filter.getColumnName().toLowerCase() === fieldKey);
}

function columnsHaveFilter(columnFieldKeys: string[], filters: Filter.IFilter[]): boolean {
    return columnFieldKeys.some(fieldKey => columnHasFilter(fieldKey, filters));
}

export enum ChangeType {
    add = 'add',
    delete = 'delete',
    update = 'update',
}

interface BaseModelChange {
    changeType: ChangeType;
}

export interface AddChange extends BaseModelChange {
    changeType: ChangeType.add;
}

/**
 * selectionsForReplace: an optional set of row keys to select after the model is reset.
 */
export interface DeleteOptions {
    selectionsForReplace?: string[];
}

export interface DeleteChange extends BaseModelChange {
    changeType: ChangeType.delete;
    options?: DeleteOptions;
}

/**
 * columnsChanged: an optional list of fieldKeys used to check against the filters. If any of the columns have filters
 * on the QueryModel we will reset the model, if not we will only reload the model.
 */
export interface UpdateOptions {
    columnsChanged?: string[];
}

export interface UpdateChange extends BaseModelChange {
    changeType: ChangeType.update;
    options?: UpdateOptions;
}

export type ModelChange = AddChange | DeleteChange | UpdateChange;

export interface Actions {
    addMessage: (id: string, message: GridMessage, duration?: number) => void;
    addModel: (queryConfig: QueryConfig, load?: boolean, loadSelections?: boolean) => void;
    clearSelectedReports: (id: string) => void;
    clearSelections: (id: string) => void;
    loadAllModels: (loadSelections?: boolean, reloadTotalCount?: boolean) => void;
    loadCharts: (id: string) => void;
    loadFirstPage: (id: string) => void;
    loadLastPage: (id: string) => void;
    loadModel: (id: string, loadSelections?: boolean, reloadTotalCount?: boolean) => void;
    loadNextPage: (id: string) => void;
    loadPreviousPage: (id: string) => void;
    loadRows: (id: string) => void;
    onModelChange: (id: string, modelChange: ModelChange) => void;
    replaceSelections: (id: string, selections: string[]) => void;
    resetTotalCountState: () => void;
    selectAllRows: (id: string) => void;
    selectPage: (id: string, checked: boolean) => void;
    selectReport: (id: string, reportId: string, selected: boolean) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectRow: (id: string, checked: boolean, row: Record<string, any>, useSelectionPivot?: boolean) => void;
    setFilters: (id: string, filters: Filter.IFilter[], loadSelections?: boolean) => void;
    setMaxRows: (id: string, maxRows: number) => void;
    setOffset: (id: string, offset: number, reloadModel?: boolean) => void;
    setSchemaQuery: (id: string, schemaQuery: SchemaQuery, loadSelections?: boolean) => void;
    setSelections: (id: string, checked: boolean, selections: string[]) => void;
    setSorts: (id: string, sorts: QuerySort[]) => void;
    setView: (id: string, viewName: string, loadSelections?: boolean) => void;
}

export interface RequiresModelAndActions {
    actions: Actions;
    model: QueryModel;
}

export interface InjectedQueryModels {
    actions: Actions;
    queryModels: Record<string, QueryModel>;
}

export type QueryConfigMap = Record<string, QueryConfig>;
export type QueryModelMap = Record<string, QueryModel>;

export interface MakeQueryModels {
    autoLoad?: boolean;
    modelLoader?: QueryModelLoader;
    queryConfigs?: QueryConfigMap;
}

interface State {
    queryModels: QueryModelMap;
}

/**
 * Resets queryInfo state to initialized state. Use this when you need to load/reload QueryInfo.
 * Note: This method intentionally has side effects, it is only to be used inside of an Immer produce() callback.
 * @param model The model to reset queryInfo state on.
 */
const resetQueryInfoState = (model: Draft<QueryModel>): void => {
    model.queryInfo = undefined;
    model.queryInfoError = undefined;
    model.queryInfoLoadingState = LoadingState.INITIALIZED;
};

/**
 * Resets totalCount state to initialized state. Use this when you need to load/reload QueryInfo.
 * Note: This method intentionally has side effects, it is only to be used inside of an Immer produce() callback.
 * @param model The model to reset queryInfo state on.
 */
const resetTotalCountState = (model: Draft<QueryModel>): void => {
    model.rowCount = undefined;
    model.totalCountError = undefined;
    model.totalCountLoadingState = LoadingState.INITIALIZED;
};

/**
 * Resets rows state to initialized state. Use this when you need to load/reload selections.
 * Note: This method intentionally has side effects, it is only to be used inside of an Immer produce() callback.
 * @param model The model to reset selection state on.
 */
const resetRowsState = (model: Draft<QueryModel>): void => {
    model.messages = undefined;
    model.offset = 0;
    model.orderedRows = undefined;
    model.viewError = undefined;
    model.rowsError = undefined;
    model.rows = undefined;
    model.rowCount = undefined;
    model.rowsLoadingState = LoadingState.INITIALIZED;
};

/**
 * Resets selection state to initialized state. Use this when you need to load/reload selections.
 * Note: This method intentionally has side effects, it is only to be used inside of an Immer produce() callback.
 * @param model The model to reset selection state on.
 */
const resetSelectionState = (model: Draft<QueryModel>): void => {
    model.selections = undefined;
    model.selectionsError = undefined;
    model.selectionsLoadingState = LoadingState.INITIALIZED;
    model.selectionPivot = undefined;
};

/**
 * Resets the model to the first page, resets the selection state, and resets the total count state.
 * @param model The model to reset
 */
const resetModelState = (model: Draft<QueryModel>): void => {
    resetRowsState(model);
    resetSelectionState(model);
    resetTotalCountState(model);
};

/**
 * Compares two query params objects, returns true if they are equal, false otherwise.
 * @param oldParams
 * @param newParams
 */
const paramsEqual = (oldParams, newParams): boolean => {
    const keys = Object.keys(oldParams);
    const oldKeyStr = keys.sort(naturalSort).join(';');
    const newKeyStr = Object.keys(newParams).sort(naturalSort).join(';');

    if (oldKeyStr === newKeyStr) {
        // If the keys are the same we need to do a deep comparison
        for (const key of Object.keys(oldParams)) {
            if (oldParams[key] !== newParams[key]) {
                return false;
            }
        }

        return true;
    }

    // If the keys have changed we can assume the params are different.
    return false;
};

function applySavedSettings(id: string, model: QueryModel): QueryModel {
    const settings = getSettingsFromLocalStorage(id, model.containerPath);
    if (settings !== undefined) {
        const { filterArray, maxRows, sorts, viewName } = settings;
        const mutations: Partial<Draft<QueryModel>> = { maxRows, sorts };

        if (model.useSavedSettings === SavedSettings.all) {
            mutations.filterArray = filterArray;

            if (viewName !== undefined) {
                mutations.schemaQuery = new SchemaQuery(model.schemaName, model.queryName, viewName);
            }
        }

        const modelWithSavedSettings = model.mutate(mutations as Partial<QueryModel>);

        if (model.useSavedSettings === SavedSettings.noFilters) {
            // If we're retrieving saved settings, but ignoring filters, we need to resave the settings without the
            // filters or app behavior will be confusing. For example: you create a sample, and are navigated to a grid
            // with no filters, then you edit a sample on that grid. When you navigate back, after editing, the filter
            // that was removed after creation is now back.
            saveSettingsToLocalStorage(modelWithSavedSettings);
        }

        return modelWithSavedSettings;
    }
    return model;
}

export interface RequestTracker {
    /**
     * Pass to a request so that it is registered with the RequestManager, canceling any in-flight request of the same
     * type for the same QueryModel.
     */
    handler: RequestHandler;

    /**
     * Returns true if the request registered via this tracker's handler was canceled by the RequestManager.
     */
    wasCancelled: () => boolean;
}

// N.B. This is similar to useRequestHandler() but we cannot use a hook here, so we have to use class
// variables instead. Additionally, we cannot make use of React.createRef() since that returns an immutable
// reference unlike React.useRef() which is mutable.
// Exported for unit tests
export class RequestManager {
    _requests: Record<string, Record<string, undefined | XMLHttpRequest>> = {};
    _cancelledRequests = new WeakSet<XMLHttpRequest>();

    public cancelAllRequests = (): void => {
        Object.values(this._requests).forEach(allReq => {
            Object.values(allReq).forEach(req => {
                if (req) {
                    this._cancelledRequests.add(req);
                    req.abort();
                }
            });
        });
        this._requests = {};
    };

    /**
     * Tracks a single request of the given type for the given QueryModel. Pass the tracker's "handler" to the request,
     * then use "wasCancelled" to determine whether a failed request was canceled by this manager.
     * GH Issue 1364: Note that cancellation cannot be inferred from what is currently registered here,
     * since @labkey/api rejects from the XHR's 'readystatechange' handler, which runs before the 'loadend' listener
     * below has removed the failed request.
     * @param id The id of the QueryModel the request is made for
     * @param requestType The type of request (e.g. 'loadRows')
     */
    public trackRequest = (id: string, requestType: string): RequestTracker => {
        const register = this.getRequestHandler(id, requestType);
        let tracked: XMLHttpRequest;

        return {
            handler: request => {
                tracked = request;
                register(request);
            },
            wasCancelled: () => !!tracked && this._cancelledRequests.has(tracked),
        };
    };

    private getRequestHandler(id: string, requestType: string): RequestHandler {
        return request => {
            const bucket = this._requests[id] || (this._requests[id] = {});

            // Abort in-flight request
            const inFlight = bucket[requestType];
            if (inFlight) {
                this._cancelledRequests.add(inFlight);
                inFlight.abort();
            }

            // If the bucket was detached during the abort() call,
            // then re-attach it before assigning the new request.
            if (this._requests[id] !== bucket) {
                this._requests[id] = bucket;
            }

            bucket[requestType] = request;

            // Remove the request once the request has completed
            request.addEventListener(
                'loadend',
                () => {
                    const bucket_ = this._requests[id];
                    if (bucket_?.[requestType] === request) {
                        delete bucket_[requestType];

                        if (Object.keys(bucket_).length === 0) {
                            delete this._requests[id];
                        }
                    }
                },
                { once: true }
            );
        };
    }
}

/**
 * A wrapper for LabKey selectRows API. For in-depth documentation and examples see components/docs/QueryModel.md.
 * @param ComponentToWrap A component that implements generic Props and InjectedQueryModels.
 * @returns A react ComponentType that implements generic Props and MakeQueryModels.
 */
export function withQueryModels<Props>(
    ComponentToWrap: ComponentType<InjectedQueryModels & Props>
): ComponentType<MakeQueryModels & Props> {
    type WrappedProps = MakeQueryModels & Props & SearchParamsProps;

    const initModels = (props: WrappedProps): QueryModelMap => {
        const { searchParams, queryConfigs } = props;
        return Object.keys(queryConfigs).reduce((models, id) => {
            // We expect the key value for each QueryConfig to be the id. If a user were to mistakenly set the id
            // to something different on the QueryConfig then actions would break
            // e.g. actions.loadNextPage(model.id) would not work.
            let model = new QueryModel({ id, ...queryConfigs[id] });
            const hasQueryParamSettings = locationHasQueryParamSettings(model.urlPrefix, searchParams);

            if (model.bindURL && hasQueryParamSettings) {
                model = model.mutate(model.attributesForURLQueryParams(searchParams, true));
            } else if (model.useSavedSettings !== SavedSettings.none) {
                if (!model.containerPath) {
                    console.error('A model.containerPath is required when useSavedSettings is true: ' + model.id);
                } else {
                    model = applySavedSettings(model.id, model);
                }
            }

            models[id] = model;
            return models;
        }, {});
    };

    class ComponentWithQueryModels extends PureComponent<WrappedProps, State> {
        static defaultProps;

        private requestManager = new RequestManager();

        constructor(props: WrappedProps) {
            super(props);

            this.state = produce<State>({} as State, () => ({ queryModels: initModels(props) }));

            this.actions = {
                addModel: this.addModel,
                addMessage: this.addMessage,
                clearSelectedReports: this.clearSelectedReports,
                clearSelections: this.clearSelections,
                loadModel: this.loadModel,
                loadAllModels: this.loadAllModels,
                loadRows: this.loadRows,
                loadNextPage: this.loadNextPage,
                loadPreviousPage: this.loadPreviousPage,
                loadFirstPage: this.loadFirstPage,
                loadLastPage: this.loadLastPage,
                loadCharts: this.loadCharts,
                onModelChange: this.onModelChange,
                replaceSelections: this.replaceSelections,
                resetTotalCountState: this.resetTotalCountState,
                selectAllRows: this.selectAllRows,
                selectRow: this.selectRow,
                selectPage: this.selectPage,
                selectReport: this.selectReport,
                setFilters: this.setFilters,
                setOffset: this.setOffset,
                setMaxRows: this.setMaxRows,
                setSchemaQuery: this.setSchemaQuery,
                setSelections: this.setSelections,
                setSorts: this.setSorts,
                setView: this.setView,
            };
        }

        componentDidMount(): void {
            if (this.props.autoLoad) {
                // N.B. This is currently not an ideal solution in terms of performance as it causes us to
                // (a) load selections for all models when we likely want or need it for only the "active" model and
                // (b) load selections for models that aren't associated with the grid (e.g., on details pages).
                // This change was introduced to eliminate some redundant model data querying we had been doing as a
                // result of having both autoLoad true here and loadOnMount set to true for the GridPanel (Issue 48319)
                // Getting selections is now cheaper than getting the query data itself, so we're leaving this as is
                // for now. Attempts to coordinate better between these two settings have thus far not been successful
                // (or have seemed too invasive to be attractive). See Issue 48758.
                this.loadAllModels(!!this.props.modelLoader.loadSelections);
            } else {
                // Issue 48969: For purposes of export, at least, we want to know the queryInfo data for all models
                // without having to visit each model.
                this.loadAllQueryInfos();
            }
        }

        /**
         * componentDidUpdate only checks for changes to props.searchParams so it can update models when there are
         * changes to the URL (only for models with bindURL set to true).
         *
         * Currently, we do not listen for changes to props.queryConfigs. You may be tempted to try to diff queryConfigs
         * in the future and add/update/remove models as you see changes, but this introduces a bunch of other problems
         * for child components, so don't do this. Problems include:
         *  - Child components will no longer be guaranteed that there will always be a model, so they'll have to check
         *  if model is undefined before accessing any properties on it. This is annoying and error prone.
         *  - Child components will need to listen for when models are re-instantiated, and potentially re-initialize
         *  their state. For example, GridPanel will need to call loadSelections and ChartMenu will need to call
         *  loadCharts
         *
         * If you expect changes to props.queryConfigs to create new models you can pass a key prop to your wrapped
         * component. For Example:
         *      <GridPanelWithModel key={`grid.${schemaName}.${queryName}`} queryConfigs={queryConfigs} />
         * If you pass a unique key to the component then React will unmount and remount the component when the key
         * changes.
         */
        componentDidUpdate(prevProps: Readonly<WrappedProps>): void {
            const prevSearch = prevProps.searchParams;
            const currSearch = this.props.searchParams;

            if (prevSearch !== undefined && currSearch !== undefined && prevSearch !== currSearch) {
                Object.values(this.state.queryModels)
                    .filter(model => model.bindURL)
                    .forEach(model => {
                        const modelParamsFromURL = {};
                        for (const [key, value] of currSearch.entries()) {
                            if (key.startsWith(model.urlPrefix + '.')) {
                                modelParamsFromURL[key] = value;
                            }
                        }

                        // Issue 49019: Grid session filters/sorts/etc. are not applied as expected when model loads
                        // queryInfo from API instead of cache the additional render cycle from the query details API
                        // call causes the withQueryModels componentDidUpdate to detect a URL param change and then
                        // remove the filters/sorts/etc. that were just applied from the session state. So add a check
                        // for the queryInfo loading state in the if statement here.
                        if (
                            !isLoading(model.queryInfoLoadingState) &&
                            !paramsEqual(modelParamsFromURL, model.urlQueryParams)
                        ) {
                            // The params for the model have changed on the URL, so update the model.
                            this.updateModelFromURL(model.id);
                        }
                    });
            }
        }

        componentWillUnmount(): void {
            this.requestManager.cancelAllRequests();
        }

        actions: Actions;

        bindURL = (id: string): void => {
            const { setSearchParams } = this.props;

            if (setSearchParams === DEFAULT_SET_SEARCH_PARAMS) {
                // We're rendering a component outside a react-router context, so we can't bind to the URL
                return;
            }

            const model = this.state.queryModels[id];
            const { urlPrefix, urlQueryParams } = model;

            setSearchParams(
                currentParams => {
                    const queryParams = getQueryParams(currentParams);
                    return Object.keys(queryParams).reduce(
                        (result, key) => {
                            // Only copy params that aren't related to the current model, we initialize the result with the
                            // updated params below.
                            if (!key.startsWith(urlPrefix + '.')) {
                                result[key] = queryParams[key];
                            }
                            return result;
                        },
                        // QueryModel.urlQueryParams returns Record<string, string> but getQueryParams and setSearchParams
                        // use Record<string, string | string[]>
                        urlQueryParams as Record<string, string | string[]>
                    );
                },
                { replace: true }
            );
        };

        updateModelFromURL = (id: string): void => {
            const { searchParams } = this.props;
            let loadSelections = false;

            this.setState(
                produce<State>((draft: WritableDraft<State>) => {
                    const model = draft.queryModels[id];
                    Object.assign(model, model.attributesForURLQueryParams(searchParams));
                    // If we have selections or previously attempted to load them we'll want to reload them when the
                    // model is updated from the URL because it can affect selections.
                    loadSelections = !!model.selections || !!model.selectionsError;

                    // since URL param changes could change the filterArray, need to reload the totalCount (issue 47660)
                    model.totalCountLoadingState = LoadingState.INITIALIZED;
                }),
                () => {
                    this.maybeLoad(id, false, true, loadSelections);
                    saveSettingsToLocalStorage(this.state.queryModels[id]);
                }
            );
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setSelectionsError = (id: string, error: any, action: string): void => {
            this.setState(
                produce<State>((draft: WritableDraft<State>) => {
                    const model = draft.queryModels[id];
                    let selectionsError = resolveErrorMessage(error);

                    if (selectionsError === undefined) {
                        const schemaQuery = model.schemaQuery.toString();
                        selectionsError = `Error while ${action} selections for SchemaQuery: ${schemaQuery}`;
                    }

                    console.error(`Error setting selections for model ${id}:`, selectionsError);
                    model.selectionsError = selectionsError;
                    model.selectionsLoadingState = LoadingState.LOADED;
                    removeSettingsFromLocalStorage(this.state.queryModels[id]);
                })
            );
        };

        loadSelections = async (id: string): Promise<void> => {
            const { loadSelections } = this.props.modelLoader;
            const request = this.requestManager.trackRequest(id, 'loadSelections');

            this.setState(
                produce<State>((draft: WritableDraft<State>) => {
                    draft.queryModels[id].selectionsLoadingState = LoadingState.LOADING;
                })
            );

            try {
                const selections = await loadSelections(this.state.queryModels[id], request.handler);

                this.setState(
                    produce<State>((draft: WritableDraft<State>) => {
                        const model = draft.queryModels[id];
                        model.selections = selections;
                        model.selectionsLoadingState = LoadingState.LOADED;
                        model.selectionsError = undefined;
                    })
                );
            } catch (error) {
                // GitHub Issue 1364: only ignore the failure if we canceled the request ourselves, otherwise the
                // model is left loading selections forever.
                if (error?.status === 0 && request.wasCancelled()) return;
                this.setSelectionsError(id, error, 'loading');
            }
        };

        clearSelections = async (id: string): Promise<void> => {
            const { modelLoader } = this.props;
            const isLoading = this.state.queryModels[id].selectionsLoadingState === LoadingState.LOADING;

            if (!isLoading) {
                this.setState(
                    produce<State>((draft: WritableDraft<State>) => {
                        draft.queryModels[id].selectionsLoadingState = LoadingState.LOADING;
                    })
                );
            }

            try {
                await modelLoader.clearSelections(this.state.queryModels[id]);
                this.setState(
                    produce<State>((draft: WritableDraft<State>) => {
                        const model = draft.queryModels[id];
                        model.selections = new Set();
                        if (!isLoading) {
                            model.selectionsLoadingState = LoadingState.LOADED;
                        }
                        model.selectionPivot = undefined;
                        model.selectionsError = undefined;
                    })
                );
            } catch (error) {
                this.setSelectionsError(id, error, 'clearing');
            }
        };

        setSelections = async (id: string, checked: boolean, selections: string[]): Promise<void> => {
            const { modelLoader } = this.props;
            const isLoading = this.state.queryModels[id].selectionsLoadingState === LoadingState.LOADING;

            if (!isLoading) {
                this.setState(
                    produce<State>((draft: WritableDraft<State>) => {
                        draft.queryModels[id].selectionsLoadingState = LoadingState.LOADING;
                    })
                );
            }

            try {
                await modelLoader.setSelections(this.state.queryModels[id], checked, selections);
                this.setState(
                    produce<State>((draft: WritableDraft<State>) => {
                        const model = draft.queryModels[id];

                        // If there are selections made, then ensure the model.selections is initialized
                        if (!model.selections && selections.length > 0) {
                            model.selections = new Set();
                        }

                        selections.forEach(selection => {
                            if (checked) {
                                model.selections.add(selection);
                            } else {
                                model.selections.delete(selection);
                            }
                        });

                        // Set the selection pivot row iff a single row is selected
                        if (selections.length === 1) {
                            model.selectionPivot = { checked, selection: selections[0] };
                        }

                        model.selectionsError = undefined;
                        if (!isLoading) {
                            model.selectionsLoadingState = LoadingState.LOADED;
                        }
                    })
                );
            } catch (error) {
                this.setSelectionsError(id, error, 'setting');
            }
        };

        replaceSelections = async (id: string, selections: string[]): Promise<void> => {
            const { modelLoader } = this.props;

            this.setState(
                produce<State>((draft: WritableDraft<State>) => {
                    draft.queryModels[id].selectionsLoadingState = LoadingState.LOADING;
                })
            );

            try {
                await modelLoader.replaceSelections(this.state.queryModels[id], selections);
                this.setState(
                    produce<State>((draft: WritableDraft<State>) => {
                        const model = draft.queryModels[id];
                        model.selections = new Set(selections);
                        model.selectionsError = undefined;
                        model.selectionPivot = undefined;
                        model.selectionsLoadingState = LoadingState.LOADED;
                    })
                );
            } catch (error) {
                this.setSelectionsError(id, error, 'replace');
            }
        };

        selectAllRows = async (id: string): Promise<void> => {
            const { modelLoader } = this.props;

            this.setState(
                produce<State>((draft: WritableDraft<State>) => {
                    draft.queryModels[id].selectionsLoadingState = LoadingState.LOADING;
                })
            );

            try {
                const selections = await modelLoader.selectAllRows(this.state.queryModels[id]);
                this.setState(
                    produce<State>((draft: WritableDraft<State>) => {
                        const model = draft.queryModels[id];
                        model.selections = selections;
                        model.selectionsError = undefined;
                        model.selectionPivot = undefined;
                        model.selectionsLoadingState = LoadingState.LOADED;
                    })
                );
            } catch (error) {
                this.setSelectionsError(id, error, 'setting');
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        selectRow = (id: string, checked: boolean, row: Record<string, any>, useSelectionPivot?: boolean): void => {
            const model = this.state.queryModels[id];
            const pkCols = model.queryInfo.getPkCols();

            if (pkCols.length === 1) {
                const pkValue = row[pkCols[0].name]?.value?.toString();

                if (!pkValue) {
                    console.warn(`Unable to resolve PK value for model ${id} row`, row);
                    return;
                }

                if (useSelectionPivot && model.selectionPivot) {
                    const pivotIdx = model.orderedRows.findIndex(key => key === model.selectionPivot.selection);
                    const selectedIdx = model.orderedRows.findIndex(key => key === pkValue);

                    // If we cannot make sense of the indices then just treat this as a normal selection
                    if (pivotIdx === -1 || selectedIdx === -1 || pivotIdx === selectedIdx) {
                        this.setSelections(id, checked, [pkValue]);
                        return;
                    }

                    // Select all rows relative to/from the pivot row
                    let selections: string[];
                    if (pivotIdx < selectedIdx) {
                        selections = model.orderedRows.slice(pivotIdx + 1, selectedIdx + 1);
                    } else {
                        selections = model.orderedRows.slice(selectedIdx, pivotIdx);
                    }

                    this.setSelections(id, model.selectionPivot.checked, selections);
                } else {
                    this.setSelections(id, checked, [pkValue]);
                }
            } else {
                const msg = `Cannot set row selection for model ${id}. The model has multiple PK Columns.`;
                console.warn(msg, pkCols);
            }
        };

        selectPage = (id: string, checked: boolean): void => {
            this.setSelections(id, checked, this.state.queryModels[id].orderedRows);
        };

        selectReport = (id: string, reportId: string, selected: boolean): void => {
            this.setState(
                produce<State>((draft: WritableDraft<State>) => {
                    const model = draft.queryModels[id];
                    if (selected && !model.selectedReportIds.includes(reportId)) {
                        model.selectedReportIds.push(reportId);
                    } else if (!selected) {
                        model.selectedReportIds = model.selectedReportIds.filter(id => id !== reportId);
                    }
                }),
                () => {
                    if (this.state.queryModels[id].bindURL) {
                        this.bindURL(id);
                    }
                }
            );
        };

        clearSelectedReports = (id: string): void => {
            this.setState(
                produce<State>((draft: WritableDraft<State>) => {
                    const model = draft.queryModels[id];
                    model.selectedReportIds = [];
                }),
                () => {
                    if (this.state.queryModels[id].bindURL) {
                        this.bindURL(id);
                    }
                }
            );
        };

        loadRows = async (id: string, loadSelections = false, selectionsForReplace?: string[]): Promise<void> => {
            const { loadRows } = this.props.modelLoader;

            // Issue 53192
            if (!this.state.queryModels[id].isQueryInfoLoaded) {
                return;
            }

            // If we have selectionsForReplace, then skip request cancellation optimization
            const request = selectionsForReplace ? undefined : this.requestManager.trackRequest(id, 'loadRows');

            this.setState(
                produce<State>((draft: WritableDraft<State>) => {
                    const model = draft.queryModels[id];
                    model.rowsLoadingState = LoadingState.LOADING;
                    model.selectionsError = undefined;
                })
            );

            try {
                const result = await loadRows(this.state.queryModels[id], request?.handler);
                const { messages, rows, orderedRows, rowCount } = result;

                this.setState(
                    produce<State>((draft: WritableDraft<State>) => {
                        const model = draft.queryModels[id];
                        model.messages = messages;
                        model.rows = rows;
                        model.orderedRows = orderedRows;
                        model.rowCount = !model.includeTotalCount ? rowCount : model.rowCount; // only update the rowCount on the model if we aren't loading the totalCount
                        model.rowsLoadingState = LoadingState.LOADED;
                        model.rowsError = undefined;
                        model.selectionPivot = undefined;
                    }),
                    () => this.maybeLoad(id, false, false, loadSelections, false, selectionsForReplace)
                );
            } catch (error) {
                // GitHub Issue 1364: only ignore the failure if we canceled the request ourselves, otherwise the
                // model is left loading rows forever.
                if (error?.status === 0 && request?.wasCancelled()) return;
                let viewDoesNotExist = false;
                this.setState(
                    produce<State>((draft: WritableDraft<State>) => {
                        const model = draft.queryModels[id];
                        const calcFieldNames = model.queryInfo
                            .getAllColumns()
                            .filter(c => c.isCalculatedField)
                            .map(c => c.fieldKey); // Issue 53325
                        let rowsError = resolveErrorMessage(error, 'data', undefined, 'load');

                        if (rowsError === undefined) {
                            rowsError = `Error while loading rows for SchemaQuery: ${model.schemaQuery.toString()}`;
                        }

                        console.error(`Error loading rows for model ${id}: `, rowsError);
                        removeSettingsFromLocalStorage(this.state.queryModels[id]);

                        if (
                            rowsError?.indexOf('The requested view') === 0 &&
                            rowsError?.indexOf(' does not exist for this user.') > 0
                        ) {
                            // Issue 49378: if view doesn't exist, use default view
                            viewDoesNotExist = true;
                            model.schemaQuery = new SchemaQuery(model.schemaName, model.queryName);
                            resetRowsState(model);
                            resetTotalCountState(model);
                            resetSelectionState(model);
                            model.viewError = rowsError + ' Returning to the default view.';
                            incrementClientSideMetricCount('QueryModel', 'ViewDoesNotExist');
                        } else if (!model.viewError && calcFieldNames.length > 0) {
                            // Issue 51204: if we have a calculated field, they are likely causing the problem so retry without them
                            viewDoesNotExist = true;
                            model.omittedColumns = model.omittedColumns.concat(calcFieldNames);
                            resetRowsState(model);
                            resetTotalCountState(model);
                            resetSelectionState(model);
                            model.viewError =
                                rowsError +
                                (rowsError.endsWith('.') ? '' : '.') +
                                ' All calculated fields have been omitted from the view.';
                            incrementClientSideMetricCount('QueryModel', 'CalculatedFieldError');
                        } else {
                            model.rowsLoadingState = LoadingState.LOADED;
                            model.rowsError = rowsError;
                            model.selectionPivot = undefined;
                        }
                    }),
                    () => {
                        if (viewDoesNotExist) {
                            this.maybeLoad(id, false, true, true, true);
                            saveSettingsToLocalStorage(this.state.queryModels[id]);
                        }
                    }
                );
            }
        };

        loadTotalCount = async (id: string, reloadTotalCount = false): Promise<void> => {
            // Issue 53192
            if (!this.state.queryModels[id].isQueryInfoLoaded) {
                return;
            }

            // if we've already loaded the totalCount, no need to load it again
            if (!reloadTotalCount && this.state.queryModels[id].totalCountLoadingState === LoadingState.LOADED) {
                return;
            }

            // if usage didn't request loading the totalCount, skip it
            if (!this.state.queryModels[id].includeTotalCount) {
                this.setState(
                    produce<State>((draft: WritableDraft<State>) => {
                        draft.queryModels[id].totalCountLoadingState = LoadingState.LOADED;
                    })
                );
                return;
            }

            const request = this.requestManager.trackRequest(id, 'loadTotalCount');

            this.setState(
                produce<State>((draft: WritableDraft<State>) => {
                    draft.queryModels[id].totalCountLoadingState = LoadingState.LOADING;
                })
            );

            try {
                const loadRowsConfig = this.state.queryModels[id].loadRowsConfig;
                const queryInfo = this.state.queryModels[id].queryInfo;
                const columns = getSelectRowCountColumnsStr(
                    loadRowsConfig.columns,
                    loadRowsConfig.filterArray,
                    queryInfo?.getPkCols()
                );

                const { rowCount } = await selectRows({
                    ...loadRowsConfig,
                    columns,
                    includeDetailsColumn: false,
                    // includeMetadata: false, // TODO don't require metadata in selectRows response processing
                    includeTotalCount: true,
                    includeUpdateColumn: false,
                    maxRows: 1,
                    offset: 0,
                    sort: undefined,
                    requestHandler: request.handler,
                });

                this.setState(
                    produce<State>((draft: WritableDraft<State>) => {
                        const model = draft.queryModels[id];
                        model.rowCount = rowCount;
                        model.totalCountLoadingState = LoadingState.LOADED;
                        model.totalCountError = undefined;
                    })
                );
            } catch (error) {
                // GitHub Issue 1364: only ignore the failure if we canceled the request ourselves, otherwise the
                // model is left loading the total count forever.
                if (error?.status === 0 && request.wasCancelled()) return;
                this.setState(
                    produce<State>((draft: WritableDraft<State>) => {
                        const model = draft.queryModels[id];
                        let rowsError = resolveErrorMessage(error);

                        if (rowsError === undefined) {
                            rowsError = `Error while loading total count for SchemaQuery: ${model.schemaQuery.toString()}`;
                        }

                        console.error(`Error loading rows for model ${id}: `, rowsError);
                        removeSettingsFromLocalStorage(this.state.queryModels[id]);
                        model.totalCountLoadingState = LoadingState.LOADED;
                        model.totalCountError = rowsError;
                    })
                );
            }
        };

        loadQueryInfo = async (
            id: string,
            loadRows = false,
            loadSelections = false,
            reloadTotalCount = false
        ): Promise<void> => {
            const { loadQueryInfo } = this.props.modelLoader;

            this.setState(
                produce<State>((draft: WritableDraft<State>) => {
                    draft.queryModels[id].queryInfoLoadingState = LoadingState.LOADING;
                })
            );

            try {
                const queryInfo = await loadQueryInfo(this.state.queryModels[id]);
                this.setState(
                    produce<State>((draft: WritableDraft<State>) => {
                        const model = draft.queryModels[id];
                        model.queryInfo = queryInfo;
                        model.queryInfoLoadingState = LoadingState.LOADED;
                        model.queryInfoError = undefined;
                        model.viewError = undefined;
                    }),
                    () => this.maybeLoad(id, false, loadRows, loadSelections, reloadTotalCount)
                );
            } catch (error) {
                this.setState(
                    produce<State>((draft: WritableDraft<State>) => {
                        const model = draft.queryModels[id];
                        let queryInfoError = resolveErrorMessage(error);

                        if (queryInfoError === undefined) {
                            queryInfoError = `Error while loading QueryInfo for SchemaQuery: ${model.schemaQuery.toString()}`;
                        }

                        console.error(`Error loading QueryInfo for model ${id}:`, queryInfoError);
                        removeSettingsFromLocalStorage(this.state.queryModels[id]);
                        model.queryInfoLoadingState = LoadingState.LOADED;
                        model.queryInfoError = queryInfoError;
                    })
                );
            }
        };

        /**
         * Helper for various actions that may want to trigger loadQueryInfo, loadRows, or loadSelections.
         * @param id The id of the QueryModel you want to load
         * @param loadQueryInfo boolean, if true will load the QueryInfo before loading the model's rows.
         * @param loadRows boolean, if true will load the model's rows.
         * @param loadSelections boolean, if true will load selections after loading QueryInfo.
         * @param reloadTotalCount boolean, if true will reload totalCount after loading QueryInfo.
         * @param selectionsForReplace string[], if defined it will replace the existing selections via replaceSelections
         */
        maybeLoad = (
            id: string,
            loadQueryInfo = false,
            loadRows = false,
            loadSelections = false,
            reloadTotalCount = false,
            selectionsForReplace?: string[]
        ): void => {
            if (loadQueryInfo) {
                // Postpone loading any rows or selections if we're loading the QueryInfo.
                this.loadQueryInfo(id, loadRows, loadSelections);
            } else {
                if (loadRows) {
                    this.loadRows(id, loadSelections, selectionsForReplace);
                    this.loadTotalCount(id, reloadTotalCount);
                } else if (loadSelections) {
                    this.loadSelections(id);
                } else if (selectionsForReplace !== undefined) {
                    this.replaceSelections(id, selectionsForReplace);
                }
            }

            if (this.state.queryModels[id].bindURL) {
                this.bindURL(id);
            }
        };

        loadModel = (id: string, loadSelections = false, reloadTotalCount = false): void => {
            this.loadQueryInfo(id, true, loadSelections, reloadTotalCount);
        };

        loadAllModels = (loadSelections = false, reloadTotalCount = true): void => {
            Object.keys(this.state.queryModels).forEach(id => this.loadModel(id, loadSelections, reloadTotalCount));
        };

        loadAllQueryInfos = (): void => {
            Object.keys(this.state.queryModels).forEach(id => this.loadQueryInfo(id));
        };

        loadNextPage = (id: string): void => {
            let shouldLoad = false;
            this.setState(
                produce<State>((draft: WritableDraft<State>) => {
                    const model = draft.queryModels[id];

                    if (!model.isLastPage) {
                        shouldLoad = true;
                        model.offset = model.offset + model.maxRows;
                    }
                }),
                () => this.maybeLoad(id, false, shouldLoad)
            );
        };

        loadPreviousPage = (id: string): void => {
            let shouldLoad = false;
            this.setState(
                produce<State>((draft: WritableDraft<State>) => {
                    const model = draft.queryModels[id];

                    if (!model.isFirstPage) {
                        shouldLoad = true;
                        model.offset = model.offset - model.maxRows;
                    }
                }),
                () => this.maybeLoad(id, false, shouldLoad)
            );
        };

        loadFirstPage = (id: string): void => {
            let shouldLoad = false;
            this.setState(
                produce<State>((draft: WritableDraft<State>) => {
                    const model = draft.queryModels[id];

                    if (!model.isFirstPage) {
                        shouldLoad = true;
                        model.offset = 0;
                    }
                }),
                () => this.maybeLoad(id, false, shouldLoad)
            );
        };

        loadLastPage = (id: string): void => {
            let shouldLoad = false;
            this.setState(
                produce<State>((draft: WritableDraft<State>) => {
                    const model = draft.queryModels[id];

                    if (!model.isLastPage) {
                        shouldLoad = true;
                        model.offset = model.lastPageOffset;
                    }
                }),
                () => this.maybeLoad(id, false, shouldLoad)
            );
        };

        loadCharts = async (id: string): Promise<void> => {
            const { modelLoader } = this.props;

            this.setState(
                produce<State>((draft: WritableDraft<State>) => {
                    draft.queryModels[id].chartsLoadingState = LoadingState.LOADING;
                })
            );

            try {
                const charts = await modelLoader.loadCharts(this.state.queryModels[id]);
                this.setState(
                    produce<State>((draft: WritableDraft<State>) => {
                        const model = draft.queryModels[id];
                        model.charts = charts;
                        model.chartsLoadingState = LoadingState.LOADED;
                        model.chartsError = undefined;
                    })
                );
            } catch (error) {
                this.setState(
                    produce<State>((draft: WritableDraft<State>) => {
                        const model = draft.queryModels[id];
                        let chartsError = resolveErrorMessage(error);

                        if (chartsError === undefined) {
                            const schemaQuery = model.schemaQuery.toString();
                            chartsError = `Error while loading selections for SchemaQuery: ${schemaQuery}`;
                        }

                        console.error(`Error loading charts for model ${id}`, chartsError);
                        removeSettingsFromLocalStorage(this.state.queryModels[id]);
                        model.chartsLoadingState = LoadingState.LOADED;
                        model.chartsError = chartsError;
                    })
                );
            }
        };

        addModel = (queryConfig: QueryConfig, load = true, loadSelections = false): void => {
            const { searchParams } = this.props;
            let id;
            this.setState(
                produce<State>((draft: WritableDraft<State>) => {
                    // Instantiate the model first because queryConfig.id is optional and is auto-generated in the
                    // QueryModel constructor if not set.
                    let queryModel = new QueryModel(queryConfig);
                    id = queryModel.id;

                    const hasQueryParamSettings = locationHasQueryParamSettings(queryModel.urlPrefix, searchParams);
                    if (queryModel.bindURL && hasQueryParamSettings) {
                        queryModel = queryModel.mutate(queryModel.attributesForURLQueryParams(searchParams));
                    } else if (queryModel.useSavedSettings && queryModel.containerPath) {
                        queryModel = applySavedSettings(id, queryModel);
                    }

                    draft.queryModels[queryModel.id] = queryModel;
                }),
                () => this.maybeLoad(id, load, load, loadSelections)
            );
        };

        setOffset = (id: string, offset: number, reloadModel = true): void => {
            let shouldLoad = false;
            this.setState(
                produce<State>((draft: WritableDraft<State>) => {
                    const model = draft.queryModels[id];

                    if (model.offset !== offset) {
                        shouldLoad = true;
                        model.offset = offset;
                    }
                }),
                () => this.maybeLoad(id, false, reloadModel && shouldLoad)
            );
        };

        setMaxRows = (id: string, maxRows: number): void => {
            let shouldLoad = false;
            this.setState(
                produce<State>((draft: WritableDraft<State>) => {
                    const model = draft.queryModels[id];

                    if (model.maxRows !== maxRows) {
                        shouldLoad = true;
                        model.maxRows = maxRows;
                        model.offset = 0;
                    }
                }),
                () => {
                    this.maybeLoad(id, false, shouldLoad);
                    saveSettingsToLocalStorage(this.state.queryModels[id]);
                }
            );
        };

        setView = (id: string, viewName: string, loadSelections = false): void => {
            let shouldLoad = false;
            this.setState(
                produce<State>((draft: WritableDraft<State>) => {
                    const model = draft.queryModels[id];

                    if (model.viewName !== viewName) {
                        shouldLoad = true;
                        model.schemaQuery = new SchemaQuery(model.schemaName, model.queryName, viewName);
                        // We need to reset all data for the model because changing the view will change things such as
                        // columns and rowCount. If we don't do this we'll render a grid with empty rows/columns.
                        resetRowsState(model);
                        resetTotalCountState(model);
                        resetSelectionState(model);
                    }
                }),
                () => {
                    this.maybeLoad(id, false, shouldLoad, shouldLoad && loadSelections);
                    saveSettingsToLocalStorage(this.state.queryModels[id]);
                }
            );
        };

        /**
         * Reset the totalCount state for all models so that the next time loadModel or loadAllModels() is called,
         * it will also call the loadTotalCount().
         */
        resetTotalCountState = (): void => {
            this.setState(
                produce<State>((draft: WritableDraft<State>) => {
                    Object.keys(this.state.queryModels).forEach(id => {
                        const model = draft.queryModels[id];
                        resetTotalCountState(model);
                    });
                })
            );
        };

        setSchemaQuery = (id: string, schemaQuery: SchemaQuery, loadSelections = false): void => {
            let shouldLoad = false;
            this.setState(
                produce<State>((draft: WritableDraft<State>) => {
                    const model = draft.queryModels[id];

                    if (!model.schemaQuery.isEqual(schemaQuery)) {
                        shouldLoad = true;
                        // We assume that we'll need a new QueryInfo if we're changing the SchemaQuery, so we reset the
                        // QueryInfo and all rows related data.
                        model.schemaQuery = schemaQuery;
                        resetQueryInfoState(model);
                        resetRowsState(model);
                        resetTotalCountState(model);
                        resetSelectionState(model);
                    }
                }),
                () => this.maybeLoad(id, shouldLoad, shouldLoad, shouldLoad && loadSelections)
            );
        };

        setFilters = (id: string, filters: Filter.IFilter[], loadSelections = false): void => {
            let shouldLoad = false;
            this.setState(
                produce<State>((draft: WritableDraft<State>) => {
                    const model = draft.queryModels[id];
                    if (!filterArraysEqual(model.filterArray, filters)) {
                        shouldLoad = true;
                        model.filterArray = filters;
                        // Changing filters affects row count so we need to reset the offset or pagination can get into
                        // an impossible state (e.g. page 3 on a grid with one row of data).
                        model.offset = 0;
                        model.totalCountLoadingState = LoadingState.INITIALIZED;
                        if (shouldLoad && loadSelections) {
                            model.selectionsLoadingState = LoadingState.INITIALIZED;
                        }
                    }
                }),
                () => {
                    // When filters change we need to reload selections and counts.
                    this.maybeLoad(id, false, shouldLoad, shouldLoad && loadSelections, true);
                    saveSettingsToLocalStorage(this.state.queryModels[id]);
                }
            );
        };

        setSorts = (id: string, sorts: QuerySort[]): void => {
            let shouldLoad = false;
            this.setState(
                produce<State>((draft: WritableDraft<State>) => {
                    const model = draft.queryModels[id];
                    if (!sortArraysEqual(model.sorts, sorts)) {
                        shouldLoad = true;
                        model.sorts = sorts;
                    }
                }),
                () => {
                    this.maybeLoad(id, false, shouldLoad);
                    saveSettingsToLocalStorage(this.state.queryModels[id]);
                }
            );
        };

        addMessage = (id: string, message: GridMessage, duration?: number): void => {
            this.setState(
                produce<State>((draft: WritableDraft<State>) => {
                    const model = draft.queryModels[id];
                    if (model.messages === undefined) {
                        model.messages = [];
                    }
                    model.messages.push(message);

                    if (duration) {
                        setTimeout(() => {
                            this.removeMessage(id, message);
                        }, duration);
                    }
                })
            );
        };

        removeMessage = (id: string, message: GridMessage): void => {
            this.setState(
                produce<State>((draft: WritableDraft<State>) => {
                    const model = draft.queryModels[id];
                    if (model.messages !== undefined) {
                        model.messages = model.messages.filter(m => m.content !== message.content);
                    }
                })
            );
        };

        /**
         * A method used to indicate that a user has made a change to the underlying data of a QueryModel, e.g. added,
         * updated, or deleted rows. This method will at a minimum reload the model, but may also reset the pagination
         * if the change could result in a bad state. See Issue 51987.
         * @param id the id of the model
         * @param modelChange a ModelChange object describing the change
         */
        onModelChange = (id: string, modelChange: ModelChange): void => {
            let shouldLoadTotalCount = false;
            let selectionsForReplace: string[];

            this.setState(
                produce<State>((draft: WritableDraft<State>) => {
                    const model = draft.queryModels[id];

                    if (modelChange.changeType === ChangeType.add) {
                        shouldLoadTotalCount = true;
                    } else if (modelChange.changeType === ChangeType.delete) {
                        selectionsForReplace = modelChange.options?.selectionsForReplace ?? [];
                        shouldLoadTotalCount = true;
                        resetModelState(model);
                    } else if (modelChange.changeType === ChangeType.update) {
                        const columnsChanged = modelChange.options?.columnsChanged;
                        const hasChangeOnFilteredColumn =
                            columnsChanged !== undefined && columnsHaveFilter(columnsChanged, model.filters);
                        const unknownChangeWithFilters = columnsChanged === undefined && model.filters.length > 0;

                        // If we don't know what columns were changed, and we have filters, or there is a change on a
                        // column with filters, then we need to reset the model, otherwise the grid could be put in a
                        // bad state. See Issue 51897.
                        if (hasChangeOnFilteredColumn || unknownChangeWithFilters) {
                            shouldLoadTotalCount = true;
                            resetModelState(model);
                        }
                    }
                }),
                () => {
                    // Loading & replacing selections are mutually exclusive, if we aren't replacing anything then load
                    const loadSelections = selectionsForReplace === undefined;
                    this.maybeLoad(id, false, true, loadSelections, shouldLoadTotalCount, selectionsForReplace);
                }
            );
        };

        render(): ReactNode {
            // Intentionally not using queryConfigs and modelLoader, we don't want to pass them to children.
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { queryConfigs, modelLoader, ...props } = this.props;
            return (
                <ComponentToWrap actions={this.actions} queryModels={this.state.queryModels} {...(props as Props)} />
            );
        }
    }

    // If we override default props here then it compiles. If we define it above it does not compile. TypeScript cannot
    // handle Partial<T & U> where T is a generic and U is known, even if you're only setting attributes from U. In this
    // case defaultProps is Partial<Props & MakeQueryModels>.
    // https://stackoverflow.com/questions/59279796/typescript-partial-of-a-generic-type
    ComponentWithQueryModels.defaultProps = {
        autoLoad: false,
        modelLoader: DefaultQueryModelLoader,
        queryConfigs: {},
        useSavedSettings: SavedSettings.none,
    };

    return withSearchParams(ComponentWithQueryModels) as ComponentType<MakeQueryModels & Props>;
}
