import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Draft, produce } from 'immer';
import { SetURLSearchParams, useSearchParams } from 'react-router-dom';
import { Filter } from '@labkey/api';

import {
    Actions,
    GridMessage,
    InjectedQueryModels,
    locationHasQueryParamSettings,
    ModelChange,
    QueryConfig,
    QueryConfigMap,
    QueryModel,
    saveSettingsToLocalStorage,
} from './QueryModel';
import { applySavedSettings, bindURL, initModels, paramsEqual, RequestManager, sortArraysEqual } from './utils';
import { SchemaQuery } from '../SchemaQuery';
import { QuerySort } from '../QuerySort';
import { isLoading, LoadingState } from '../LoadingState';

const NOOP = () => {};
const DEFAULT_SEARCH_PARAMS = new URLSearchParams();
const DEFAULT_SET_SEARCH_PARAMS = () => {};

type ModelUpdater = (model: Draft<QueryModel>) => void;
type VoidFn = () => void;
type StateUpdater = (state: InjectedQueryModels) => InjectedQueryModels;

class QueryModelManager {
    actions: Actions;
    state: InjectedQueryModels;

    private onStateChange: VoidFn;
    private requestManager: RequestManager;
    private searchParams: URLSearchParams;
    private setSearchParams: SetURLSearchParams;

    constructor(queryConfigs: QueryConfigMap, searchParams: URLSearchParams, setSearchParams: SetURLSearchParams) {
        this.requestManager = new RequestManager();
        this.searchParams = searchParams;
        this.setSearchParams = setSearchParams;
        this.actions = {
            addMessage: this.addMessage,
            addModel: this.addModel,
            clearSelectedReports: this.clearSelectedReports,
            clearSelections: this.clearSelections,
            loadAllModels: this.loadAllModels,
            loadCharts: this.loadCharts,
            loadFirstPage: this.loadFirstPage,
            loadLastPage: this.loadLastPage,
            loadNextPage: this.loadNextPage,
            loadModel: this.loadModel,
            loadPreviousPage: this.loadPreviousPage,
            loadRows: this.loadRows,
            onModelChange: this.onModelChange,
            replaceSelections: this.replaceSelections,
            resetTotalCountState: this.resetTotalCountState,
            selectAllRows: this.selectAllRows,
            selectPage: this.selectPage,
            selectReport: this.selectReport,
            selectRow: this.selectRow,
            setFilters: this.setFilters,
            setMaxRows: this.setMaxRows,
            setOffset: this.setOffset,
            setSchemaQuery: this.setSchemaQuery,
            setSelections: this.setSelections,
            setSorts: this.setSorts,
            setView: this.setView,
        };
        this.state = {
            queryModels: initModels(queryConfigs, searchParams),
            actions: this.actions,
        };
    }

    updateRouter = (searchParams: URLSearchParams, setSearchParams: SetURLSearchParams) => {
        this.setSearchParams = setSearchParams;

        if (searchParams !== this.searchParams) {
            this.searchParams = searchParams;
            this.updateModelsFromURL();
        }
    };

    cleanup = () => {
        this.onStateChange = NOOP;
    };

    destroy = () => {
        this.requestManager.cancelAllRequests();
    };

    subscribe = (onStateChange: VoidFn): VoidFn => {
        this.onStateChange = onStateChange;
        return this.cleanup;
    };

    getSnapshot = (): InjectedQueryModels => {
        return this.state;
    };

    setState = (updater: StateUpdater): void => {
        const updatedState = updater(this.state);

        if (this.state !== updatedState) {
            this.state = updatedState;
            this.onStateChange();
        }
    };

    updateModel = (id: string, updater: ModelUpdater): void => {
        this.setState((currentState: InjectedQueryModels) => {
            const model = currentState.queryModels[id];

            if (!model) return currentState;

            const newModel = produce(model, updater);

            if (newModel === model) return currentState;

            return {
                ...currentState,
                queryModels: { ...currentState.queryModels, [id]: newModel },
            };
        });
    };

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
    };

    bindURL = (id: string): void => {
        const { setSearchParams } = this;

        // We're rendering a component outside a react-router context, so we can't bind to the URL
        if (setSearchParams === DEFAULT_SET_SEARCH_PARAMS) return;

        const model = this.state.queryModels[id];
        bindURL(setSearchParams, model.urlPrefix, model.urlQueryParams);
    };

    syncURL = (id: string): void => {
        if (this.state.queryModels[id]?.bindURL) this.bindURL(id);
    };

    updateModelFromURL = (id: string) => {
        const { searchParams } = this;

        if (searchParams === DEFAULT_SEARCH_PARAMS) return;

        let loadModel = false;
        let loadSelections = false;

        this.updateModel(id, (model: Draft<QueryModel>) => {
            const modelParamsFromURL = {};
            for (const [key, value] of searchParams.entries()) {
                if (key.startsWith(model.urlPrefix + '.')) {
                    modelParamsFromURL[key] = value;
                }
            }

            if (!isLoading(model.queryInfoLoadingState) && !paramsEqual(modelParamsFromURL, model.urlQueryParams)) {
                Object.assign(model, model.attributesForURLQueryParams(searchParams));
                loadModel = true;
                // If we have selections or previously attempted to load them, we'll want to reload them when the model
                // is updated from the URL because it can affect selections.
                loadSelections = !!model.selections || !!model.selectionsError;

                // since URL param changes could change the filterArray, need to reload the totalCount (issue 47660)
                model.totalCountLoadingState = LoadingState.INITIALIZED;
            }
        });

        if (loadModel) {
            this.maybeLoad(id, false, true, loadSelections);
            this.saveSettings(id);
        }
    };

    updateModelsFromURL = () => {
        Object.values(this.state.queryModels)
            .filter(model => model.bindURL)
            .forEach(model => this.updateModelFromURL(model.id));
    };

    addMessage = (id: string, message: GridMessage, duration?: number): void => {
        this.updateModel(id, (model: Draft<QueryModel>) => {
            if (model.messages === undefined) {
                model.messages = [];
            }
            model.messages.push(message);
        });

        if (duration) setTimeout(() => this.removeMessage(id, message), duration);
    };

    addModel = (queryConfig: QueryConfig, load = true, loadSelections = false): void => {
        const { searchParams } = this;
        let queryModel = new QueryModel(queryConfig);
        const id = queryModel.id;

        this.setState(currentState => {
            const hasQueryParamSettings = locationHasQueryParamSettings(queryModel.urlPrefix, searchParams);

            if (queryModel.bindURL && hasQueryParamSettings) {
                queryModel = queryModel.mutate(queryModel.attributesForURLQueryParams(searchParams));
            } else if (queryModel.useSavedSettings && queryModel.containerPath) {
                queryModel = applySavedSettings(id, queryModel);
            }

            return {
                ...currentState,
                queryModels: {
                    ...currentState.queryModels,
                    [id]: queryModel,
                },
            };
        });

        this.maybeLoad(id, load, load, loadSelections);
        this.syncURL(id);
    };

    clearSelectedReports = (id: string): void => {
        this.updateModel(id, (model: Draft<QueryModel>) => {
            model.selectedReportIds = [];
        });
        this.syncURL(id);
    };

    clearSelections = (id: string): void => {
        // TODO: implement
    };

    loadAllModels = (loadSelections?: boolean, reloadTotalCount?: boolean): void => {
        // TODO: implement
    };

    loadCharts = (id: string): void => {
        // TODO: implement
    };

    loadFirstPage = (id: string): void => {
        let shouldLoad = false;
        this.updateModel(id, (model: Draft<QueryModel>) => {
            if (!model.isFirstPage) {
                shouldLoad = true;
                model.offset = 0;
            }
        });

        this.maybeLoad(id, false, shouldLoad);
        this.syncURL(id);
    };

    loadLastPage = (id: string): void => {
        let shouldLoad = false;
        this.updateModel(id, (model: Draft<QueryModel>) => {
            if (!model.isLastPage) {
                shouldLoad = true;
                model.offset = model.lastPageOffset;
            }
        });
        this.maybeLoad(id, false, shouldLoad);
        this.syncURL(id);
    };

    loadModel = (id: string, loadSelections?: boolean, reloadTotalCount?: boolean): void => {
        // TODO: implement
    };

    loadNextPage = (id: string): void => {
        let shouldLoad = false;
        this.updateModel(id, (model: Draft<QueryModel>) => {
            if (!model.isLastPage) {
                shouldLoad = true;
                model.offset = model.offset + model.maxRows;
            }
        });
        this.maybeLoad(id, false, shouldLoad);
        this.syncURL(id);
    };

    loadPreviousPage = (id: string): void => {
        let shouldLoad = false;
        this.updateModel(id, (model: Draft<QueryModel>) => {
            if (!model.isFirstPage) {
                shouldLoad = true;
                model.offset = model.offset - model.maxRows;
            }
        });
        this.maybeLoad(id, false, shouldLoad);
        this.syncURL(id);
    };

    loadQueryInfo = (id: string, loadRows: boolean, loadSelections: boolean): void => {
        // TODO: implement
    };

    loadRows = (id: string, loadSelections = false, selectionsForReplace?: string[]): void => {
        // TODO: implement
    };

    loadSelections = (id: string): void => {
        // TODO: implement
    };

    loadTotalCount = (id: string, reloadTotalCount: boolean): void => {
        // TODO: implement
    };

    onModelChange = (id: string, modelChange: ModelChange): void => {
        // TODO: implement
    };

    removeMessage = (id: string, message: GridMessage) => {
        this.updateModel(id, (model: Draft<QueryModel>) => {
            if (model.messages !== undefined) {
                model.messages = model.messages.filter(m => m.content !== message.content);
            }
        });
    };

    replaceSelections = (id: string, selections: string[]): void => {
        // TODO: implement
    };

    resetTotalCountState = (): void => {
        // TODO: implement
    };

    saveSettings = (id: string): void => {
        saveSettingsToLocalStorage(this.state.queryModels[id]);
    };

    selectAllRows = (id: string): void => {
        // TODO: implement
    };

    selectPage = (id: string, checked: boolean): void => {
        // TODO: implement
    };

    selectReport = (id: string, reportId: string, selected: boolean): void => {
        // TODO: implement
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectRow = (id: string, checked: boolean, row: Record<string, any>, useSelectionPivot?: boolean): void => {
        // TODO: implement
    };

    setFilters = (id: string, filters: Filter.IFilter[], loadSelections?: boolean): void => {
        // TODO: implement
    };

    setMaxRows = (id: string, maxRows: number): void => {
        let shouldLoad = false;
        this.updateModel(id, (model: Draft<QueryModel>) => {
            if (model.maxRows !== maxRows) {
                model.maxRows = maxRows;
                model.offset = 0;
                shouldLoad = true;
            }
        });
        this.maybeLoad(id, false, shouldLoad);
        this.saveSettings(id);
        this.syncURL(id);
    };

    setOffset = (id: string, offset: number, reloadModel = true): void => {
        let shouldLoad = false;
        this.updateModel(id, (model: Draft<QueryModel>) => {
            if (model.offset !== offset) {
                model.offset = offset;
                shouldLoad = true;
            }
        });
        this.maybeLoad(id, false, reloadModel && shouldLoad);
        this.syncURL(id);
    };

    setSchemaQuery = (id: string, schemaQuery: SchemaQuery, loadSelections?: boolean): void => {
        // TODO: implement
    };

    setSelections = (id: string, checked: boolean, selections: string[]): void => {
        // TODO: implement
    };

    setSorts = (id: string, sorts: QuerySort[]): void => {
        let shouldLoad = false;
        this.updateModel(id, (model: Draft<QueryModel>) => {
            if (!sortArraysEqual(model.sorts, sorts)) {
                shouldLoad = true;
                model.sorts = sorts;
            }
        });
        this.maybeLoad(id, false, shouldLoad);
        this.saveSettings(id);
        this.syncURL(id);
    };

    setView = (id: string, viewName: string, loadSelections?: boolean): void => {
        // TODO: implement
    };
}

type OptionalSearchParams = [URLSearchParams, SetURLSearchParams];

function useOptionalSearchParams(): OptionalSearchParams {
    let searchParams;
    let setSearchParams;
    try {
        [searchParams, setSearchParams] = useSearchParams();
    } catch (error) {
        // We are not in a react-router context, so we revert to injecting a default set of these props
        searchParams = DEFAULT_SEARCH_PARAMS;
        setSearchParams = DEFAULT_SET_SEARCH_PARAMS;
    }

    return [searchParams, setSearchParams];
}

export function useQueryModels(queryConfigs: QueryConfigMap) {
    const [searchParams, setSearchParams] = useOptionalSearchParams();
    const manager = useRef<QueryModelManager>(null);

    /* eslint-disable react-hooks/refs */
    if (!manager.current) {
        manager.current = new QueryModelManager(queryConfigs, searchParams, setSearchParams);
    }

    const state = useSyncExternalStore(manager.current.subscribe, manager.current.getSnapshot);

    useEffect(() => {
        return () => {
            manager.current.destroy();
        };
    }, []);

    useEffect(() => {
        manager.current.updateRouter(searchParams, setSearchParams);
    }, [searchParams, setSearchParams]);
    /* eslint-enable react-hooks/refs */

    return state;
}
