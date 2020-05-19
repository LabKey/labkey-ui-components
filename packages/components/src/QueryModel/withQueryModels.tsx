import React, { ComponentType, PureComponent, ReactNode } from 'react';
import { Filter } from '@labkey/api';
// eslint cannot find Draft for some reason, but Intellij can.
// eslint-disable-next-line import/named
import { Draft, produce } from 'immer';

import { LoadingState, QuerySort, resolveErrorMessage, SchemaQuery } from '..';

import { QueryConfig, QueryModel } from './QueryModel';
import { DefaultQueryModelLoader, QueryModelLoader } from './QueryModelLoader';
import { filterArraysEqual, sortArraysEqual } from './utils';

export interface Actions {
    addModel: (queryConfig: QueryConfig, load?: boolean, loadSelections?: boolean) => void;
    clearSelections: (id: string) => void;
    loadModel: (id: string, loadSelections?: boolean) => void;
    loadAllModels: (loadSelections?: boolean) => void;
    loadRows: (id: string) => void;
    loadNextPage: (id: string) => void;
    loadPreviousPage: (id: string) => void;
    loadFirstPage: (id: string) => void;
    loadLastPage: (id: string) => void;
    loadCharts: (id: string, includeSampleComparison: boolean) => void;
    selectAllRows: (id: string) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectRow: (id: string, checked, row: { [key: string]: any }) => void;
    selectPage: (id: string, checked) => void;
    setFilters: (id: string, filters: Filter.IFilter[], loadSelections?: boolean) => void;
    setMaxRows: (id: string, maxRows: number) => void;
    setOffset: (id: string, offset: number) => void;
    setSchemaQuery: (id: string, schemaQuery: SchemaQuery, loadSelections?: boolean) => void;
    setSorts: (id: string, sorts: QuerySort[]) => void;
    setView: (id: string, viewName: string, loadSelections?: boolean) => void;
}

export interface RequiresModelAndActions {
    model: QueryModel;
    actions: Actions;
}

export interface InjectedQueryModels {
    queryModels: { [key: string]: QueryModel };
    actions: Actions;
}

export type QueryConfigMap = { [id: string]: QueryConfig };
export type QueryModelMap = { [id: string]: QueryModel };

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
 * @param model: Draft<QueryModel> the model to reset queryInfo state on.
 */
const resetQueryInfoState = (model: Draft<QueryModel>): void => {
    model.queryInfo = undefined;
    model.queryInfoError = undefined;
    model.queryInfoLoadingState = LoadingState.INITIALIZED;
};

/**
 * Resets rows state to initialized state. Use this when you need to load/reload selections.
 * Note: This method intentionally has side effects, it is only to be used inside of an Immer produce() callback.
 * @param model: Draft<QueryModel> the model to reset selection state on.
 */
const resetRowsState = (model: Draft<QueryModel>): void => {
    model.rowsError = undefined;
    model.messages = undefined;
    model.offset = 0;
    model.orderedRows = undefined;
    model.rows = undefined;
    model.rowCount = undefined;
    model.rowsLoadingState = LoadingState.INITIALIZED;
};

/**
 * Resets selection state to initialized state. Use this when you need to load/reload selections.
 * Note: This method intentionally has side effects, it is only to be used inside of an Immer produce() callback.
 * @param model: Draft<QueryModel> the model to reset selection state on.
 */
const resetSelectionState = (model: Draft<QueryModel>): void => {
    model.selections = undefined;
    model.selectionsError = undefined;
    model.selectionsLoadingState = LoadingState.INITIALIZED;
};

export function withQueryModels<Props>(
    ComponentToWrap: ComponentType<Props & InjectedQueryModels>
): ComponentType<Props & MakeQueryModels> {
    class ComponentWithQueryModels extends PureComponent<Props & MakeQueryModels, State> {
        static defaultProps;

        constructor(props: Props & MakeQueryModels) {
            super(props);
            const { queryConfigs } = props;
            const queryModels = Object.keys(props.queryConfigs).reduce((models, id) => {
                // We expect the key value for each QueryConfig to be the id. If a user were to mistakenly set the id
                // to something different on the QueryConfig then actions would break
                // e.g. actions.loadNextPage(model.id) would not work.
                models[id] = new QueryModel({ id, ...queryConfigs[id] });
                return models;
            }, {});

            this.state = produce({}, () => ({ queryModels }));

            this.actions = {
                addModel: this.addModel,
                clearSelections: this.clearSelections,
                loadModel: this.loadModel,
                loadAllModels: this.loadAllModels,
                loadRows: this.loadRows,
                loadNextPage: this.loadNextPage,
                loadPreviousPage: this.loadPreviousPage,
                loadFirstPage: this.loadFirstPage,
                loadLastPage: this.loadLastPage,
                loadCharts: this.loadCharts,
                selectAllRows: this.selectAllRows,
                selectRow: this.selectRow,
                selectPage: this.selectPage,
                setFilters: this.setFilters,
                setOffset: this.setOffset,
                setMaxRows: this.setMaxRows,
                setSchemaQuery: this.setSchemaQuery,
                setSorts: this.setSorts,
                setView: this.setView,
            };
        }

        componentDidMount(): void {
            if (this.props.autoLoad) {
                this.loadAllModels();
            }
        }

        actions: Actions;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setSelectionsError = (id: string, error: any, action: string): void => {
            this.setState(
                produce((draft: Draft<State>) => {
                    const model = draft.queryModels[id];
                    let selectionsError = resolveErrorMessage(error);

                    if (selectionsError === undefined) {
                        const schemaQuery = model.schemaQuery.toString();
                        selectionsError = `Error while ${action} selections for SchemaQuery: ${schemaQuery}`;
                    }

                    console.error(`Error setting selections for model ${id}:`, selectionsError);
                    model.selectionsError = selectionsError;
                })
            );
        };

        loadSelections = async (id: string): Promise<void> => {
            const { loadSelections } = this.props.modelLoader;

            this.setState(
                produce((draft: Draft<State>) => {
                    draft.queryModels[id].selectionsLoadingState = LoadingState.LOADING;
                })
            );

            try {
                const selections = await loadSelections(this.state.queryModels[id]);

                this.setState(
                    produce((draft: Draft<State>) => {
                        const model = draft.queryModels[id];
                        model.selections = selections;
                        model.selectionsLoadingState = LoadingState.LOADED;
                        model.selectionsError = undefined;
                    })
                );
            } catch (error) {
                this.setSelectionsError(id, error, 'loading');
            }
        };

        clearSelections = async (id: string): Promise<void> => {
            const { modelLoader } = this.props;

            try {
                await modelLoader.clearSelections(this.state.queryModels[id]);
                this.setState(
                    produce((draft: Draft<State>) => {
                        const model = draft.queryModels[id];
                        model.selections = new Set();
                        model.selectionsError = undefined;
                    })
                );
            } catch (error) {
                this.setSelectionsError(id, error, 'clearing');
            }
        };

        setSelections = async (id: string, checked: boolean, selections: string[]): Promise<void> => {
            const { modelLoader } = this.props;

            try {
                await modelLoader.setSelections(this.state.queryModels[id], checked, selections);
                this.setState(
                    produce((draft: Draft<State>) => {
                        const model = draft.queryModels[id];
                        selections.forEach(selection => {
                            if (checked) {
                                model.selections.add(selection);
                            } else {
                                model.selections.delete(selection);
                            }
                        });
                        model.selectionsError = undefined;
                    })
                );
            } catch (error) {
                this.setSelectionsError(id, error, 'setting');
            }
        };

        selectAllRows = async (id: string): Promise<void> => {
            const { modelLoader } = this.props;

            this.setState(
                produce((draft: Draft<State>) => {
                    draft.queryModels[id].selectionsLoadingState = LoadingState.LOADING;
                })
            );

            try {
                const selections = await modelLoader.selectAllRows(this.state.queryModels[id]);
                this.setState(
                    produce((draft: Draft<State>) => {
                        const model = draft.queryModels[id];
                        model.selections = selections;
                        model.selectionsError = undefined;
                        model.selectionsLoadingState = LoadingState.LOADED;
                    })
                );
            } catch (error) {
                this.setSelectionsError(id, error, 'setting');
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        selectRow = (id: string, checked: boolean, row: { [key: string]: any }): void => {
            const model = this.state.queryModels[id];
            const pkCols = model.queryInfo.getPkCols();

            if (pkCols.size === 1) {
                const pkValue = row[pkCols.first().name]?.value?.toString();

                if (!pkValue) {
                    console.warn(`Unable to resolve PK value for model ${id} row`, row);
                    return;
                }

                this.setSelections(id, checked, [pkValue]);
            } else {
                const msg = `Cannot set row selection for model ${id}. The model has multiple PK Columns.`;
                console.warn(msg, pkCols.toJS());
            }
        };

        selectPage = (id: string, checked: boolean): void => {
            this.setSelections(id, checked, this.state.queryModels[id].orderedRows);
        };

        loadRows = async (id: string): Promise<void> => {
            const { loadRows } = this.props.modelLoader;

            this.setState(
                produce((draft: Draft<State>) => {
                    draft.queryModels[id].rowsLoadingState = LoadingState.LOADING;
                })
            );

            try {
                const result = await loadRows(this.state.queryModels[id]);
                const { messages, rows, orderedRows, rowCount } = result;

                this.setState(
                    produce((draft: Draft<State>) => {
                        const model = draft.queryModels[id];
                        model.messages = messages;
                        model.rows = rows;
                        model.orderedRows = orderedRows;
                        model.rowCount = rowCount;
                        model.rowsLoadingState = LoadingState.LOADED;
                        model.rowsError = undefined;
                    })
                );
            } catch (error) {
                this.setState(
                    produce((draft: Draft<State>) => {
                        const model = draft.queryModels[id];
                        let rowsError = resolveErrorMessage(error);

                        if (rowsError === undefined) {
                            rowsError = `Error while loading rows for SchemaQuery: ${model.schemaQuery.toString()}`;
                        }

                        console.error(`Error loading rows for model ${id}: `, rowsError);
                        model.rowsLoadingState = LoadingState.LOADED;
                        model.rowsError = rowsError;
                    })
                );
            }
        };

        loadQueryInfo = async (id: string, loadRows = false, loadSelections = false): Promise<void> => {
            const { loadQueryInfo } = this.props.modelLoader;

            this.setState(
                produce((draft: Draft<State>) => {
                    draft.queryModels[id].queryInfoLoadingState = LoadingState.LOADING;
                })
            );

            try {
                const queryInfo = await loadQueryInfo(this.state.queryModels[id]);
                this.setState(
                    produce((draft: Draft<State>) => {
                        const model = draft.queryModels[id];
                        model.queryInfo = queryInfo;
                        model.queryInfoLoadingState = LoadingState.LOADED;
                        model.queryInfoError = undefined;
                    }),
                    () => this.maybeLoad(id, false, loadRows, loadSelections)
                );
            } catch (error) {
                this.setState(
                    produce((draft: Draft<State>) => {
                        const model = draft.queryModels[id];
                        let queryInfoError = resolveErrorMessage(error);

                        if (queryInfoError === undefined) {
                            queryInfoError = `Error while loading QueryInfo for SchemaQuery: ${model.schemaQuery.toString()}`;
                        }

                        console.error(`Error loading QueryInfo for model ${id}:`, queryInfoError);

                        model.queryInfoLoadingState = LoadingState.LOADED;
                        model.queryInfoError = queryInfoError;
                    })
                );
            }
        };

        /**
         * Helper for various actions that may want to trigger loadQueryInfo, loadRows, or loadSelections.
         * @param id: The id of the QueryModel you want to load
         * @param loadQueryInfo: boolean, if true will load the QueryInfo before loading the model's rows.
         * @param loadRows: boolean, if true will load the model's rows.
         * @param loadSelections: boolean, if true will load selections after loading QueryInfo.
         */
        maybeLoad = (id: string, loadQueryInfo = false, loadRows = false, loadSelections = false): void => {
            if (loadQueryInfo) {
                // Postpone loading any rows or selections if we're loading the QueryInfo.
                this.loadQueryInfo(id, loadRows, loadSelections);
            } else {
                // It's safe to load selections and rows in parallel.

                if (loadRows) {
                    this.loadRows(id);
                }

                if (loadSelections) {
                    this.loadSelections(id);
                }
            }
        };

        loadModel = (id: string, loadSelections = false): void => {
            this.loadQueryInfo(id, true, loadSelections);
        };

        loadAllModels = (loadSelections = false): void => {
            Object.keys(this.state.queryModels).forEach(id => this.loadModel(id, loadSelections));
        };

        loadNextPage = (id: string): void => {
            let shouldLoad = false;
            this.setState(
                produce((draft: Draft<State>) => {
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
                produce((draft: Draft<State>) => {
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
                produce((draft: Draft<State>) => {
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
                produce((draft: Draft<State>) => {
                    const model = draft.queryModels[id];

                    if (!model.isLastPage) {
                        shouldLoad = true;
                        model.offset = model.lastPageOffset;
                    }
                }),
                () => this.maybeLoad(id, false, shouldLoad)
            );
        };

        loadCharts = async (id: string, includeSampleComparison): Promise<void> => {
            const { modelLoader } = this.props;

            this.setState(
                produce((draft: Draft<State>) => {
                    draft.queryModels[id].chartsLoadingState = LoadingState.LOADING;
                })
            );

            try {
                const charts = await modelLoader.loadCharts(this.state.queryModels[id], includeSampleComparison);
                this.setState(
                    produce((draft: Draft<State>) => {
                        const model = draft.queryModels[id];
                        model.charts = charts;
                        model.chartsLoadingState = LoadingState.LOADED;
                        model.chartsError = undefined;
                    })
                );
            } catch (error) {
                this.setState(
                    produce((draft: Draft<State>) => {
                        const model = draft.queryModels[id];
                        let chartsError = resolveErrorMessage(error);

                        if (chartsError === undefined) {
                            const schemaQuery = model.schemaQuery.toString();
                            chartsError = `Error while loading selections for SchemaQuery: ${schemaQuery}`;
                        }

                        console.error(`Error loading charts for model ${id}`, chartsError);
                        model.chartsLoadingState = LoadingState.LOADED;
                        model.chartsError = chartsError;
                    })
                );
            }
        };

        addModel = (queryConfig: QueryConfig, load = true, loadSelections = false): void => {
            let id;
            this.setState(
                produce((draft: Draft<State>) => {
                    // Instantiate the model first because queryConfig.id is optional and is auto-generated in the
                    // QueryModel constructor if not set.
                    const queryModel = new QueryModel(queryConfig);
                    id = queryModel.id;
                    draft.queryModels[queryModel.id] = queryModel;
                }),
                () => this.maybeLoad(id, load, load, loadSelections)
            );
        };

        setOffset = (id: string, offset: number): void => {
            let shouldLoad = false;
            this.setState(
                produce((draft: Draft<State>) => {
                    const model = draft.queryModels[id];

                    if (model.offset !== offset) {
                        shouldLoad = true;
                        model.offset = offset;
                    }
                }),
                () => this.maybeLoad(id, false, shouldLoad)
            );
        };

        setMaxRows = (id: string, maxRows: number): void => {
            let shouldLoad = false;
            this.setState(
                produce((draft: Draft<State>) => {
                    const model = draft.queryModels[id];

                    if (model.maxRows !== maxRows) {
                        shouldLoad = true;
                        model.maxRows = maxRows;
                        model.offset = 0;
                    }
                }),
                () => this.maybeLoad(id, false, shouldLoad)
            );
        };

        setView = (id: string, viewName: string, loadSelections = false): void => {
            let shouldLoad = false;
            this.setState(
                produce((draft: Draft<State>) => {
                    const model = draft.queryModels[id];

                    if (model.viewName !== viewName) {
                        shouldLoad = true;
                        model.schemaQuery = SchemaQuery.create(model.schemaName, model.queryName, viewName);
                        // We need to reset all data for the model because changing the view will change things such as
                        // columns and rowCount. If we don't do this we'll render a grid with empty rows/columns.
                        resetRowsState(model);
                        resetSelectionState(model);
                    }
                }),
                () => this.maybeLoad(id, false, shouldLoad, shouldLoad && loadSelections)
            );
        };

        setSchemaQuery = (id: string, schemaQuery: SchemaQuery, loadSelections = false): void => {
            let shouldLoad = false;
            this.setState(
                produce((draft: Draft<State>) => {
                    const model = draft.queryModels[id];

                    if (!model.schemaQuery.isEqual(schemaQuery)) {
                        shouldLoad = true;
                        // We assume that we'll need a new QueryInfo if we're changing the SchemaQuery, so we reset the
                        // QueryInfo and all rows related data.
                        model.schemaQuery = schemaQuery;
                        resetQueryInfoState(model);
                        resetRowsState(model);
                        resetSelectionState(model);
                    }
                }),
                () => this.maybeLoad(id, shouldLoad, shouldLoad, shouldLoad && loadSelections)
            );
        };

        setFilters = (id: string, filters: Filter.IFilter[], loadSelections = false): void => {
            let shouldLoad = false;
            this.setState(
                produce((draft: Draft<State>) => {
                    const model = draft.queryModels[id];
                    if (!filterArraysEqual(model.filterArray, filters)) {
                        shouldLoad = true;
                        model.filterArray = filters;
                    }
                }),
                // When filters change we need to reload selections.
                () => this.maybeLoad(id, false, shouldLoad, shouldLoad && loadSelections)
            );
        };

        setSorts = (id: string, sorts: QuerySort[]): void => {
            let shouldLoad = false;
            this.setState(
                produce((draft: Draft<State>) => {
                    const model = draft.queryModels[id];
                    if (!sortArraysEqual(model.sorts, sorts)) {
                        shouldLoad = true;
                        model.sorts = sorts;
                    }
                }),
                () => this.maybeLoad(id, false, shouldLoad)
            );
        };

        render(): ReactNode {
            // Intentionally not using queryConfigs and modelLoader, we don't want to pass them to children.
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { queryConfigs, modelLoader, ...props } = this.props;
            return (
                <ComponentToWrap queryModels={this.state.queryModels} actions={this.actions} {...(props as Props)} />
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
    };

    return ComponentWithQueryModels;
}
