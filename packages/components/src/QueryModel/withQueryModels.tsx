import React, { ComponentType, PureComponent } from 'react';
import produce from 'immer';

import { SchemaQuery } from '..';
import { LoadingState, QueryConfig, QueryModel } from './QueryModel';
import { DefaultQueryModelLoader, QueryModelLoader } from './QueryModelLoader';

export interface Actions {
    addModel: (queryConfig: QueryConfig, load?: boolean) => void;
    loadModel: (id: string) => void;
    loadAllModels: () => void;
    loadNextPage: (id: string) => void;
    loadPreviousPage: (id: string) => void;
    loadFirstPage: (id: string) => void;
    loadLastPage: (id: string) => void;
    setOffset: (id: string, offset: number, load?: boolean) => void;
    setMaxRows: (id: string, maxRows: number, load?: boolean) => void;
    setView: (id: string, viewName: string, load?: boolean) => void;
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
    queryConfigs: QueryConfigMap;
}

interface State {
    queryModels: QueryModelMap;
}

export function withQueryModels<Props>(ComponentToWrap: ComponentType<Props & InjectedQueryModels>)
    : ComponentType<Props & MakeQueryModels> {
    class ComponentWithQueryModels extends PureComponent<Props & MakeQueryModels, State> {
        actions: Actions;
        static defaultProps;

        constructor(props: Props & MakeQueryModels) {
            super(props);
            const { queryConfigs } = props;

            const queryModels = Object.keys(props.queryConfigs).reduce((models, id) => {
                const queryConfig = {id, ...queryConfigs[id]};
                models[id] = new QueryModel(queryConfig);
                return models;
            }, {});

            const initialState: State = {
                queryModels,
            };

            this.state = produce(initialState, () => {});

            this.actions = {
                addModel: this.addModel,
                loadModel: this.loadModel,
                loadAllModels: this.loadAllModels,
                loadNextPage: this.loadNextPage,
                loadPreviousPage: this.loadPreviousPage,
                loadFirstPage: this.loadFirstPage,
                loadLastPage: this.loadLastPage,
                setOffset: this.setOffset,
                setMaxRows: this.setMaxRows,
                setView: this.setView,
            };
        }

        setError = (id: string, error) => {
            this.setState(produce((draft: State) => {
                const model = draft.queryModels[id];
                model.error = error.toString();
                model.rowsLoadingState = LoadingState.LOADED;
            }));
        };

        loadRows = async (id: string) => {
            const { loadRows } = this.props.modelLoader;

            this.setState(produce((draft: State) => {
                draft.queryModels[id].rowsLoadingState = LoadingState.LOADING;
            }));

            try {
                const result = await loadRows(this.state.queryModels[id]);
                const { messages, rows, orderedRows, rowCount } = result;

                this.setState(produce((draft: State) => {
                    const model = draft.queryModels[id];
                    model.messages = messages;
                    model.rows = rows;
                    model.orderedRows = orderedRows;
                    model.rowCount = rowCount;
                    model.rowsLoadingState = LoadingState.LOADED;
                }));
            } catch(error) {
                this.setError(id, error);
            }
        };

        loadQueryInfo = async (id: string, loadRows: boolean = false) => {
            const { loadQueryInfo } = this.props.modelLoader;

            this.setState(produce((draft: State) => {
                draft.queryModels[id].queryInfoLoadingState = LoadingState.LOADING;
            }));

            try {
                const queryInfo = await loadQueryInfo(this.state.queryModels[id]);
                this.setState(produce((draft: State) => {
                    const model = draft.queryModels[id];
                    model.queryInfo = queryInfo;
                    model.queryInfoLoadingState = LoadingState.LOADED;
                }), () => {
                    if (loadRows) {
                        this.loadRows(id);
                    }
                });
            } catch(error) {
                this.setError(id, error);
            }
        };

        loadModel = async (id: string) => {
            this.loadQueryInfo(id, true);
        };

        loadAllModels = () => {
            Object.keys(this.state.queryModels).forEach(id => this.loadModel(id));
        };

        loadNextPage = (id: string) => {
            let shouldLoad = false;
            this.setState(produce((draft: State) => {
                const model = draft.queryModels[id];

                if (!model.isLastPage()) {
                    shouldLoad = true;
                    model.offset = model.offset + model.maxRows;
                }
            }), () => {
                if (shouldLoad) {
                    this.loadRows(id);
                }
            });
        };

        loadPreviousPage = (id: string) => {
            let shouldLoad = false;
            this.setState(produce((draft: State) => {
                const model = draft.queryModels[id];

                if (!model.isFirstPage()) {
                    shouldLoad = true;
                    model.offset = model.offset - model.maxRows;
                }
            }), () => {
                if (shouldLoad) {
                    this.loadRows(id);
                }
            });
        };

        loadFirstPage = (id: string) => {
            let shouldLoad = false;
            this.setState(produce((draft: State) => {
                const model = draft.queryModels[id];

                if (!model.isFirstPage()) {
                    shouldLoad = true;
                    model.offset = 0
                }
            }), () => {
                if (shouldLoad) {
                    this.loadRows(id);
                }
            });
        };

        loadLastPage = (id: string) => {
            let shouldLoad = false;
            this.setState(produce((draft: State) => {
                const model = draft.queryModels[id];

                if (!model.isLastPage()) {
                    shouldLoad = true;
                    model.offset = model.getLastPageOffset();
                }
            }), () => {
                if (shouldLoad) {
                    this.loadRows(id);
                }
            });
        };

        addModel = (queryConfig: QueryConfig, load: boolean = true) => {
            let id;
            this.setState(produce((draft: State) => {
                // Instantiate the model first because queryConfig.id is optional and is auto-generated in the
                // QueryModel constructor if not set.
                const queryModel = new QueryModel(queryConfig);
                id = queryModel.id;
                draft.queryModels[queryModel.id] = queryModel;
            }), () => {
                if (load) {
                    this.loadModel(id);
                }
            });
        };

        setOffset = (id: string, offset: number, load: boolean = true) => {
            this.setState(produce((draft: State) => {
                draft.queryModels[id].offset = offset;
            }), () => {
                if (load) {
                    this.loadRows(id);
                }
            });
        };

        setMaxRows = (id: string, maxRows: number, load: boolean = true) => {
            this.setState(produce((draft: State) => {
                const model = draft.queryModels[id];
                model.maxRows = maxRows;
                model.offset = 0;
            }), () => {
                if (load) {
                    this.loadRows(id);
                }
            });
        };

        setView = (id: string, viewName: string, load: boolean = true) => {
            if (this.state.queryModels[id].schemaQuery.viewName === viewName) {
                return;
            }

            this.setState(produce((draft: State) => {
                const model = draft.queryModels[id];
                const { schemaName, queryName } = model.schemaQuery;
                model.schemaQuery = SchemaQuery.create(schemaName, queryName, viewName);
            }), () => {
                if (load) {
                    this.loadRows(id);
                }
            });
        };

        componentDidMount(): void {
            if (this.props.autoLoad) {
                this.loadAllModels();
            }
        }

        render() {
            // Intentionally not using queryConfigs and modelLoader, we don't want to pass them to children.
            const { queryConfigs, modelLoader, ...props } = this.props;
            return <ComponentToWrap queryModels={this.state.queryModels} actions={this.actions} {...props as Props} />
        }
    }

    ComponentWithQueryModels.defaultProps = {
        autoLoad: false,
        modelLoader: DefaultQueryModelLoader,
    };

    return ComponentWithQueryModels;
}
