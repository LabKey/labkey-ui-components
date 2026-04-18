import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Draft, produce } from 'immer';
import { SetURLSearchParams, useSearchParams } from 'react-router-dom';
import { Filter } from '@labkey/api';

import {
    Actions,
    ChangeType,
    GridMessage,
    InjectedQueryModels,
    locationHasQueryParamSettings,
    ModelChange,
    QueryConfig,
    QueryConfigMap,
    QueryModel,
    removeSettingsFromLocalStorage,
    saveSettingsToLocalStorage,
} from './QueryModel';
import {
    applySavedSettings,
    bindURL,
    columnsHaveFilter,
    filterArraysEqual,
    initModels,
    paramsEqual,
    RequestManager,
    resetModelState,
    resetRowsState,
    resetSelectionState,
    resetTotalCountState,
    sortArraysEqual,
} from './utils';
import { SchemaQuery } from '../SchemaQuery';
import { QuerySort } from '../QuerySort';
import { isLoading, LoadingState } from '../LoadingState';
import { DefaultQueryModelLoader, QueryModelLoader } from './QueryModelLoader';
import { resolveErrorMessage } from '../../internal/util/messaging';
import { incrementClientSideMetricCount } from '../../internal/actions';

const NOOP = () => {};
const DEFAULT_SEARCH_PARAMS = new URLSearchParams();
const DEFAULT_SET_SEARCH_PARAMS = () => {};

type ModelUpdater = (model: Draft<QueryModel>) => void;
type VoidFn = () => void;
type StateUpdater = (state: InjectedQueryModels) => InjectedQueryModels;

export class QueryModelManager {
    actions: Actions;
    state: InjectedQueryModels;

    private modelLoader: QueryModelLoader;
    private onStateChange: VoidFn;
    private requestManager: RequestManager;
    private searchParams: URLSearchParams;
    private setSearchParams: SetURLSearchParams;

    constructor(
        queryConfigs: QueryConfigMap,
        searchParams: URLSearchParams,
        setSearchParams: SetURLSearchParams,
        modelLoader?: QueryModelLoader
    ) {
        this.onStateChange = NOOP;
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
        this.modelLoader = modelLoader ?? DefaultQueryModelLoader;
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
            const modelParamsFromURL: Record<string, string> = {};
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

    clearSelections = async (id: string): Promise<void> => {
        const loading = this.state.queryModels[id].selectionsLoadingState === LoadingState.LOADING;

        if (!loading) {
            this.updateModel(id, (model: Draft<QueryModel>) => {
                model.selectionsLoadingState = LoadingState.LOADING;
            });
        }

        try {
            await this.modelLoader.clearSelections(this.state.queryModels[id]);

            this.updateModel(id, (model: Draft<QueryModel>) => {
                model.selections = new Set();
                model.selectionPivot = undefined;
                model.selectionsError = undefined;

                if (!loading) {
                    model.selectionsLoadingState = LoadingState.LOADED;
                }
            });
        } catch (error) {
            this.setSelectionsError(id, error, 'clearing');
        }
    };

    loadAllModels = (loadSelections = false, reloadTotalCount = true): void => {
        Object.keys(this.state.queryModels).forEach(id => this.loadModel(id, loadSelections, reloadTotalCount));
    };

    loadCharts = async (id: string): Promise<void> => {
        this.updateModel(id, (model: Draft<QueryModel>) => {
            model.chartsLoadingState = LoadingState.LOADING;
        });

        try {
            const charts = await this.modelLoader.loadCharts(this.state.queryModels[id]);
            this.updateModel(id, (model: Draft<QueryModel>) => {
                model.charts = charts;
                model.chartsLoadingState = LoadingState.LOADED;
                model.chartsError = undefined;
            });
        } catch (error) {
            this.updateModel(id, (model: Draft<QueryModel>) => {
                let chartsError = resolveErrorMessage(error);

                if (chartsError === undefined) {
                    const schemaQuery = model.schemaQuery.toString();
                    chartsError = `Error while loading selections for SchemaQuery: ${schemaQuery}`;
                }

                console.error(`Error loading charts for model ${id}`, chartsError);
                removeSettingsFromLocalStorage(this.state.queryModels[id]);
                model.chartsLoadingState = LoadingState.LOADED;
                model.chartsError = chartsError;
            });
        }
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

    loadModel = (id: string, loadSelections = false, reloadTotalCount = false): void => {
        this.loadQueryInfo(id, true, loadSelections, reloadTotalCount);
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

    loadQueryInfo = async (
        id: string,
        loadRows = false,
        loadSelections = false,
        reloadTotalCount = false
    ): Promise<void> => {
        if (!this.state.queryModels[id]) return;

        this.updateModel(id, (model: Draft<QueryModel>) => {
            model.queryInfoLoadingState = LoadingState.LOADING;
        });

        try {
            const queryInfo = await this.modelLoader.loadQueryInfo(this.state.queryModels[id]);
            this.updateModel(id, (model: Draft<QueryModel>) => {
                model.queryInfo = queryInfo;
                model.queryInfoLoadingState = LoadingState.LOADED;
                model.queryInfoError = undefined;
                model.viewError = undefined;
            });
            this.maybeLoad(id, false, loadRows, loadSelections, reloadTotalCount);
        } catch (error) {
            this.updateModel(id, (model: Draft<QueryModel>) => {
                let queryInfoError = resolveErrorMessage(error);

                if (queryInfoError === undefined) {
                    queryInfoError = `Error while loading QueryInfo for SchemaQuery: ${model.schemaQuery.toString()}`;
                }

                console.error(`Error loading QueryInfo for model ${id}:`, queryInfoError);
                removeSettingsFromLocalStorage(this.state.queryModels[id]);
                model.queryInfoLoadingState = LoadingState.LOADED;
                model.queryInfoError = queryInfoError;
            });
        }
    };

    loadAllQueryInfos = (): void => {
        Object.keys(this.state.queryModels).forEach(id => this.loadQueryInfo(id, false, false));
    };

    loadRows = async (id: string, loadSelections = false, selectionsForReplace?: string[]): Promise<void> => {
        // Issue 53192
        if (!this.state.queryModels[id].isQueryInfoLoaded) return;

        this.updateModel(id, (model: Draft<QueryModel>) => {
            model.rowsLoadingState = LoadingState.LOADING;
            model.selectionsError = undefined;
        });

        try {
            // If we have selectionsForReplace, then skip request cancellation optimization
            const requestHandler = selectionsForReplace
                ? undefined
                : this.requestManager.getRequestHandler(id, 'loadRows');
            const { messages, rows, orderedRows, rowCount } = await this.modelLoader.loadRows(
                this.state.queryModels[id],
                requestHandler
            );
            this.updateModel(id, (model: Draft<QueryModel>) => {
                model.messages = messages;
                model.rows = rows;
                model.orderedRows = orderedRows;
                // only update the rowCount on the model if we aren't loading the totalCount
                model.rowCount = !model.includeTotalCount ? rowCount : model.rowCount;
                model.rowsLoadingState = LoadingState.LOADED;
                model.rowsError = undefined;
                model.selectionPivot = undefined;
            });
            this.maybeLoad(id, false, false, loadSelections, false, selectionsForReplace);
        } catch (error) {
            if (error?.status === 0) return;

            let shouldAttemptLoadAgain = false;
            this.updateModel(id, (model: Draft<QueryModel>) => {
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
                    // Issue 49378: if the view doesn't exist, use the default view
                    shouldAttemptLoadAgain = true;
                    model.schemaQuery = new SchemaQuery(model.schemaName, model.queryName);
                    resetRowsState(model);
                    resetTotalCountState(model);
                    resetSelectionState(model);
                    model.viewError = rowsError + ' Returning to the default view.';
                    incrementClientSideMetricCount('QueryModel', 'ViewDoesNotExist');
                } else if (!model.viewError && calcFieldNames.length > 0) {
                    // Issue 51204: if we have a calculated field, they are likely causing the problem so retry without them
                    shouldAttemptLoadAgain = true;
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
            });

            if (shouldAttemptLoadAgain) {
                this.maybeLoad(id, false, true, true, true);
                this.syncURL(id);
                this.saveSettings(id);
            }
        }
    };

    setSelectionsError = (id: string, error: any, action: string): void => {
        this.updateModel(id, (model: Draft<QueryModel>) => {
            let selectionsError = resolveErrorMessage(error);

            if (selectionsError === undefined) {
                const schemaQuery = model.schemaQuery.toString();
                selectionsError = `Error while ${action} selections for SchemaQuery: ${schemaQuery}`;
            }

            console.error(`Error setting selections for model ${id}:`, selectionsError);
            model.selectionsError = selectionsError;
            model.selectionsLoadingState = LoadingState.LOADED;
            removeSettingsFromLocalStorage(this.state.queryModels[id]);
        });
    };

    loadSelections = async (id: string): Promise<void> => {
        this.updateModel(id, (model: Draft<QueryModel>) => {
            model.selectionsLoadingState = LoadingState.LOADING;
        });

        try {
            const selections = await this.modelLoader.loadSelections(
                this.state.queryModels[id],
                this.requestManager.getRequestHandler(id, 'loadSelections')
            );

            this.updateModel(id, (model: Draft<QueryModel>) => {
                model.selections = selections;
                model.selectionsLoadingState = LoadingState.LOADED;
                model.selectionsError = undefined;
            });
        } catch (error) {
            if (error?.status === 0) return;
            this.setSelectionsError(id, error, 'loading');
        }
    };

    loadTotalCount = async (id: string, reloadTotalCount = false): Promise<void> => {
        // Issue 53192
        if (!this.state.queryModels[id].isQueryInfoLoaded) return;

        // if we've already loaded the totalCount, no need to load it again
        if (!reloadTotalCount && this.state.queryModels[id].totalCountLoadingState === LoadingState.LOADED) {
            return;
        }

        // if usage didn't request loading the totalCount, skip it
        if (!this.state.queryModels[id].includeTotalCount) {
            this.updateModel(id, (model: Draft<QueryModel>) => {
                model.totalCountLoadingState = LoadingState.LOADED;
            });
            return;
        }

        this.updateModel(id, (model: Draft<QueryModel>) => {
            model.totalCountLoadingState = LoadingState.LOADING;
        });

        try {
            const rowCount = await this.modelLoader.loadTotalCount(
                this.state.queryModels[id],
                this.requestManager.getRequestHandler(id, 'loadTotalCount')
            );
            this.updateModel(id, (model: Draft<QueryModel>) => {
                model.rowCount = rowCount;
                model.totalCountLoadingState = LoadingState.LOADED;
                model.totalCountError = undefined;
            });
        } catch (error) {
            if (error?.status === 0) return;
            this.updateModel(id, (model: Draft<QueryModel>) => {
                let rowsError = resolveErrorMessage(error);

                if (rowsError === undefined) {
                    rowsError = `Error while loading total count for SchemaQuery: ${model.schemaQuery.toString()}`;
                }

                console.error(`Error loading rows for model ${id}: `, rowsError);
                removeSettingsFromLocalStorage(this.state.queryModels[id]);
                model.totalCountLoadingState = LoadingState.LOADED;
                model.totalCountError = rowsError;
            });
        }
    };

    onModelChange = (id: string, modelChange: ModelChange): void => {
        let shouldLoadTotalCount = false;
        let selectionsForReplace: string[];

        this.updateModel(id, (model: Draft<QueryModel>) => {
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
        });

        // Loading & replacing selections are mutually exclusive, if we aren't replacing anything then load
        const loadSelections = selectionsForReplace === undefined;
        this.maybeLoad(id, false, true, loadSelections, shouldLoadTotalCount, selectionsForReplace);
        this.syncURL(id);
    };

    removeMessage = (id: string, message: GridMessage) => {
        this.updateModel(id, (model: Draft<QueryModel>) => {
            if (model.messages !== undefined) {
                model.messages = model.messages.filter(m => m.content !== message.content);
            }
        });
    };

    replaceSelections = async (id: string, selections: string[]): Promise<void> => {
        this.updateModel(id, (model: Draft<QueryModel>) => {
            model.selectionsLoadingState = LoadingState.LOADING;
        });

        try {
            await this.modelLoader.replaceSelections(this.state.queryModels[id], selections);
            this.updateModel(id, (model: Draft<QueryModel>) => {
                model.selections = new Set(selections);
                model.selectionsError = undefined;
                model.selectionPivot = undefined;
                model.selectionsLoadingState = LoadingState.LOADED;
            });
        } catch (error) {
            this.setSelectionsError(id, error, 'replace');
        }
    };

    /**
     * Reset the totalCount state for all models so that the next time loadModel or loadAllModels() is called,
     * it will also call the loadTotalCount().
     */
    resetTotalCountState = (): void => {
        this.setState(state => {
            const queryModels = {};
            Object.keys(state.queryModels).forEach(id => {
                const model = state.queryModels[id];
                queryModels[id] = produce(model, resetTotalCountState);
            });
            return { ...state, queryModels };
        });
    };

    saveSettings = (id: string): void => {
        saveSettingsToLocalStorage(this.state.queryModels[id]);
    };

    selectAllRows = async (id: string): Promise<void> => {
        this.updateModel(id, (model: Draft<QueryModel>) => {
            model.selectionsLoadingState = LoadingState.LOADING;
        });

        try {
            const selections = await this.modelLoader.selectAllRows(this.state.queryModels[id]);
            this.updateModel(id, (model: Draft<QueryModel>) => {
                model.selections = selections;
                model.selectionsError = undefined;
                model.selectionPivot = undefined;
                model.selectionsLoadingState = LoadingState.LOADED;
            });
        } catch (error) {
            this.setSelectionsError(id, error, 'setting');
        }
    };

    selectPage = (id: string, checked: boolean): void => {
        this.setSelections(id, checked, this.state.queryModels[id].orderedRows);
    };

    selectReport = (id: string, reportId: string, selected: boolean): void => {
        this.updateModel(id, (model: Draft<QueryModel>) => {
            if (selected && !model.selectedReportIds.includes(reportId)) {
                model.selectedReportIds.push(reportId);
            } else if (!selected) {
                model.selectedReportIds = model.selectedReportIds.filter(id => id !== reportId);
            }
        });
        this.syncURL(id);
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

                // If we cannot make sense of the indices, then just treat this as a normal selection
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

    setFilters = (id: string, filters: Filter.IFilter[], loadSelections = false): void => {
        let shouldLoad = false;
        this.updateModel(id, (model: Draft<QueryModel>) => {
            if (!filterArraysEqual(model.filterArray, filters)) {
                shouldLoad = true;
                model.filterArray = filters;
                // Changing filters affects row count, so we need to reset the offset, or pagination can get into an
                // impossible state (e.g., page 3 on a grid with one row of data).
                model.offset = 0;
                model.totalCountLoadingState = LoadingState.INITIALIZED;
                if (shouldLoad && loadSelections) {
                    model.selectionsLoadingState = LoadingState.INITIALIZED;
                }
            }
        });
        // When filters change, we need to reload selections and counts.
        this.maybeLoad(id, false, shouldLoad, shouldLoad && loadSelections, true);
        this.saveSettings(id);
        this.syncURL(id);
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

    setSchemaQuery = (id: string, schemaQuery: SchemaQuery, loadSelections = false): void => {
        // Note: we don't use the setSchemaQuery method anywhere, we should remove it from Actions
        throw new Error('setSchemaQuery is not implemented');
    };

    setSelections = async (id: string, checked: boolean, selections: string[]): Promise<void> => {
        const loading = this.state.queryModels[id].selectionsLoadingState === LoadingState.LOADING;

        if (!loading) {
            this.updateModel(id, (model: Draft<QueryModel>) => {
                model.selectionsLoadingState = LoadingState.LOADING;
            });
        }

        try {
            await this.modelLoader.setSelections(this.state.queryModels[id], checked, selections);
            this.updateModel(id, (model: Draft<QueryModel>) => {
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

                if (!loading) model.selectionsLoadingState = LoadingState.LOADED;
            });
        } catch (error) {
            this.setSelectionsError(id, error, 'setting');
        }
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

    setView = (id: string, viewName: string, loadSelections = false): void => {
        let shouldLoad = false;
        this.updateModel(id, (model: Draft<QueryModel>) => {
            if (model.viewName !== viewName) {
                shouldLoad = true;
                model.schemaQuery = new SchemaQuery(model.schemaName, model.queryName, viewName);
                // We need to reset all data for the model because changing the view will change things such as
                // columns and rowCount. If we don't do this, we'll render a grid with empty rows/columns.
                resetRowsState(model);
                resetTotalCountState(model);
                resetSelectionState(model);
            }
        });
        this.maybeLoad(id, false, shouldLoad, shouldLoad && loadSelections);
        this.saveSettings(id);
        this.syncURL(id);
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

interface UseQueryModelsOptions {
    autoLoad?: boolean;
    modelLoader?: QueryModelLoader;
}

export function useQueryModels(queryConfigs: QueryConfigMap, options: UseQueryModelsOptions = {}): InjectedQueryModels {
    const { autoLoad = false, modelLoader } = options;
    const [searchParams, setSearchParams] = useOptionalSearchParams();
    const manager = useRef<QueryModelManager>(null);

    /* eslint-disable react-hooks/refs */
    if (!manager.current) {
        manager.current = new QueryModelManager(queryConfigs, searchParams, setSearchParams, modelLoader);
    }

    const state = useSyncExternalStore(manager.current.subscribe, manager.current.getSnapshot);

    useEffect(() => {
        // Note: It's not ideal because it will try to load selections for models that aren't active or aren't used in
        // grids (e.g., details models). We should add a loadSelections attribute to QueryModel so we can opt in to
        // loading selections for our grid models only. See Issue 48758 for additional context.
        if (autoLoad) manager.current.loadAllModels(true);
        else manager.current.loadAllQueryInfos();

        return () => {
            manager.current.destroy();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only run on mount

    useEffect(() => {
        manager.current.updateRouter(searchParams, setSearchParams);
    }, [searchParams, setSearchParams]);
    /* eslint-enable react-hooks/refs */

    return state;
}
