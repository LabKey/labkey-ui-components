import React, { ComponentType, PureComponent } from 'react';
import { Draft, produce } from 'immer';

import { LoadingState, resolveErrorMessage, SchemaQuery } from '..';

import { QueryConfig, QueryModel } from './QueryModel';
import { DefaultQueryModelLoader, QueryModelLoader } from './QueryModelLoader';

export interface Actions {
    addModel: (queryConfig: QueryConfig, load?: boolean) => void;
    loadModel: (id: string) => void;
    loadAllModels: () => void;
    loadRows: (id: string) => void;
    loadNextPage: (id: string) => void;
    loadPreviousPage: (id: string) => void;
    loadFirstPage: (id: string) => void;
    loadLastPage: (id: string) => void;
    setOffset: (id: string, offset: number) => void;
    setMaxRows: (id: string, maxRows: number) => void;
    setView: (id: string, viewName: string) => void;
    setSchemaQuery: (id: string, schemaQuery: SchemaQuery) => void;
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

export function withQueryModels<Props>(
    ComponentToWrap: ComponentType<Props & InjectedQueryModels>
): ComponentType<Props & MakeQueryModels> {
    class ComponentWithQueryModels extends PureComponent<Props & MakeQueryModels, State> {
        actions: Actions;
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

            this.state = produce({ queryModels }, () => {});

            this.actions = {
                addModel: this.addModel,
                loadModel: this.loadModel,
                loadAllModels: this.loadAllModels,
                loadRows: this.loadRows,
                loadNextPage: this.loadNextPage,
                loadPreviousPage: this.loadPreviousPage,
                loadFirstPage: this.loadFirstPage,
                loadLastPage: this.loadLastPage,
                setOffset: this.setOffset,
                setMaxRows: this.setMaxRows,
                setView: this.setView,
                setSchemaQuery: this.setSchemaQuery,
            };
        }

        loadRows = async (id: string) => {
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
                        model.error = undefined;
                    })
                );
            } catch (error) {
                this.setState(
                    produce((draft: Draft<State>) => {
                        const model = draft.queryModels[id];
                        let err = resolveErrorMessage(error);

                        if (err === undefined) {
                            err = `Error while loading rows for SchemaQuery: ${model.schemaQuery.toString()}`;
                        }

                        console.error(`Error loading rows for model ${id}: `, err);

                        model.rowsLoadingState = LoadingState.LOADED;
                        model.error = err;
                    })
                );
            }
        };

        loadQueryInfo = async (id: string, loadRows = false) => {
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
                        model.error = undefined;
                    }),
                    () => this.maybeLoad(id, loadRows)
                );
            } catch (error) {
                this.setState(
                    produce((draft: Draft<State>) => {
                        const model = draft.queryModels[id];
                        let err = resolveErrorMessage(error);

                        if (err === undefined) {
                            err = `Error while loading QueryInfo for SchemaQuery: ${model.schemaQuery.toString()}`;
                        }

                        console.error(`Error loading QueryInfo for model ${id}:`, err);

                        model.queryInfoLoadingState = LoadingState.LOADED;
                        model.error = err;
                    })
                );
            }
        };

        /**
         * Helper for various actions that may or may want to trigger loadRows, useful for reducing boilerplate.
         * @param id: The id of the QueryModel you want to load
         * @param shouldLoad: boolean, if true will load the model's rows, if false does nothing.
         * @param loadQueryInfo: boolean, if true will load the QueryInfo before loading the model's rows.
         */
        maybeLoad = (id: string, shouldLoad: boolean, loadQueryInfo = false) => {
            if (shouldLoad) {
                if (loadQueryInfo) {
                    this.loadQueryInfo(id, true);
                } else {
                    this.loadRows(id);
                }
            }
        };

        loadModel = (id: string) => {
            this.loadQueryInfo(id, true);
        };

        loadAllModels = () => {
            Object.keys(this.state.queryModels).forEach(this.loadModel);
        };

        loadNextPage = (id: string) => {
            let shouldLoad = false;
            this.setState(
                produce((draft: Draft<State>) => {
                    const model = draft.queryModels[id];

                    if (!model.isLastPage) {
                        shouldLoad = true;
                        model.offset = model.offset + model.maxRows;
                    }
                }),
                () => this.maybeLoad(id, shouldLoad)
            );
        };

        loadPreviousPage = (id: string) => {
            let shouldLoad = false;
            this.setState(
                produce((draft: Draft<State>) => {
                    const model = draft.queryModels[id];

                    if (!model.isFirstPage) {
                        shouldLoad = true;
                        model.offset = model.offset - model.maxRows;
                    }
                }),
                () => this.maybeLoad(id, shouldLoad)
            );
        };

        loadFirstPage = (id: string) => {
            let shouldLoad = false;
            this.setState(
                produce((draft: Draft<State>) => {
                    const model = draft.queryModels[id];

                    if (!model.isFirstPage) {
                        shouldLoad = true;
                        model.offset = 0;
                    }
                }),
                () => this.maybeLoad(id, shouldLoad)
            );
        };

        loadLastPage = (id: string) => {
            let shouldLoad = false;
            this.setState(
                produce((draft: Draft<State>) => {
                    const model = draft.queryModels[id];

                    if (!model.isLastPage) {
                        shouldLoad = true;
                        model.offset = model.lastPageOffset;
                    }
                }),
                () => this.maybeLoad(id, shouldLoad)
            );
        };

        addModel = (queryConfig: QueryConfig, load = true) => {
            let id;
            this.setState(
                produce((draft: Draft<State>) => {
                    // Instantiate the model first because queryConfig.id is optional and is auto-generated in the
                    // QueryModel constructor if not set.
                    const queryModel = new QueryModel(queryConfig);
                    id = queryModel.id;
                    draft.queryModels[queryModel.id] = queryModel;
                }),
                () => this.maybeLoad(id, load, true)
            );
        };

        setOffset = (id: string, offset: number) => {
            let shouldLoad = false;
            this.setState(
                produce((draft: Draft<State>) => {
                    const model = draft.queryModels[id];

                    if (model.offset !== offset) {
                        shouldLoad = true;
                        model.offset = offset;
                    }
                }),
                () => this.maybeLoad(id, shouldLoad)
            );
        };

        setMaxRows = (id: string, maxRows: number) => {
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
                () => this.maybeLoad(id, shouldLoad)
            );
        };

        setView = (id: string, viewName: string) => {
            let shouldLoad = false;
            this.setState(
                produce((draft: Draft<State>) => {
                    const model = draft.queryModels[id];

                    if (model.viewName !== viewName) {
                        shouldLoad = true;
                        model.schemaQuery = SchemaQuery.create(model.schemaName, model.queryName, viewName);
                        // We need to reset all data for the model because changing the view will change things such as
                        // columns and rowCount. If we don't do this we'll render a grid with empty rows/columns.
                        model.error = undefined;
                        model.messages = undefined;
                        model.offset = 0;
                        model.orderedRows = undefined;
                        model.rows = undefined;
                        model.rowCount = undefined;
                        model.rowsLoadingState = LoadingState.INITIALIZED;
                    }
                }),
                () => this.maybeLoad(id, shouldLoad)
            );
        };

        setSchemaQuery = (id: string, schemaQuery: SchemaQuery) => {
            let shouldLoad = false;
            this.setState(
                produce((draft: Draft<State>) => {
                    const model = draft.queryModels[id];

                    if (!model.schemaQuery.isEqual(schemaQuery)) {
                        shouldLoad = true;
                        // We assume that we'll need a new QueryInfo if we're changing the SchemaQuery, so we reset the
                        // QueryInfo and all rows related data.
                        model.schemaQuery = schemaQuery;
                        model.queryInfo = undefined;
                        model.queryInfoLoadingState = LoadingState.INITIALIZED;
                        model.error = undefined;
                        model.messages = undefined;
                        model.offset = 0;
                        model.orderedRows = undefined;
                        model.rows = undefined;
                        model.rowCount = undefined;
                        model.rowsLoadingState = LoadingState.INITIALIZED;
                    }
                }),
                () => this.maybeLoad(id, shouldLoad, true)
            );
        };

        componentDidMount(): void {
            if (this.props.autoLoad) {
                this.loadAllModels();
            }
        }

        render() {
            // Intentionally not using queryConfigs and modelLoader, we don't want to pass them to children.
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
