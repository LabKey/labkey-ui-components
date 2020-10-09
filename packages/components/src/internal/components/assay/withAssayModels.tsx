import React, { ComponentType, createContext, FC, PureComponent, ReactNode } from 'react';
import { List } from 'immutable';
import { Draft, produce } from 'immer';
import { withRouter, WithRouterProps } from 'react-router';

import {
    Alert,
    AssayDefinitionModel,
    AssayProtocolModel,
    AssayStateModel,
    clearAssayDefinitionCache,
    fetchAllAssays,
    fetchProtocol,
    getActionErrorMessage,
    isLoading,
    LoadingPage,
    LoadingState,
    NotFound,
} from '../../..';

export interface AssayLoader {
    loadDefinitions: () => Promise<List<AssayDefinitionModel>>;
    loadProtocol: (protocolId: number) => Promise<AssayProtocolModel>;
}

export interface AssayContext {
    assayDefinition: AssayDefinitionModel;
    assayProtocol: AssayProtocolModel;
}

export interface WithAssayModelProps {
    assayLoader?: AssayLoader;
    assayName?: string;
}

export interface InjectedAssayModel extends AssayContext {
    assayModel: AssayStateModel;
    reloadAssays: () => void;
}

interface State {
    context: AssayContext;
    model: AssayStateModel;
}

const Context = createContext<AssayContext>(undefined);
const AssayContextProvider = Context.Provider;
export const AssayContextConsumer = Context.Consumer;

const DefaultAssayLoader: AssayLoader = {
    loadDefinitions: fetchAllAssays,
    loadProtocol: fetchProtocol,
};

export function withAssayModels<Props>(
    ComponentToWrap: ComponentType<Props & InjectedAssayModel>,
    defaultProps?: WithAssayModelProps
): ComponentType<Props & WithAssayModelProps> {
    type WrappedProps = Props & WithAssayModelProps;

    class ComponentWithAssays extends PureComponent<WrappedProps, State> {
        static defaultProps;

        state: Readonly<State> = produce({}, () => ({
            context: { assayDefinition: undefined, assayProtocol: undefined },
            model: new AssayStateModel(),
        }));

        private _mounted = false;

        componentDidMount = (): void => {
            this._mounted = true;
            this.load();
        };

        componentDidUpdate = (prevProps: WrappedProps): void => {
            if (this.props.assayName !== prevProps.assayName) {
                this.load();
            }
        };

        componentWillUnmount = (): void => {
            this._mounted = false;
        };

        load = async (): Promise<void> => {
            await this.loadDefinitions();
            await this.loadProtocol();
        };

        loadDefinitions = async (): Promise<void> => {
            const { assayLoader } = this.props;
            const { model } = this.state;

            if (model.definitionsLoadingState === LoadingState.LOADED) {
                return;
            }

            this.updateModel({ definitionsError: undefined, definitionsLoadingState: LoadingState.LOADING });

            try {
                const definitions = await assayLoader.loadDefinitions();

                this.updateModel({
                    definitions: definitions?.toArray(),
                    definitionsLoadingState: LoadingState.LOADED,
                });
            } catch (definitionsError) {
                console.error('definitions error', definitionsError);
                this.updateModel({ definitionsError, definitionsLoadingState: LoadingState.LOADED });
            }
        };

        loadProtocol = async (): Promise<void> => {
            const { assayLoader, assayName } = this.props;
            const { model } = this.state;

            if (!assayName && model.protocolLoadingState === LoadingState.INITIALIZED) {
                return;
            }

            const assayDefinition = model.getByName(assayName);
            let modelProps: Partial<AssayStateModel>;

            if (assayDefinition) {
                modelProps = { protocolError: undefined, protocolLoadingState: LoadingState.LOADING };
            } else {
                modelProps = {
                    protocolError: `Load protocol failed. Unable to resolve assay definition for assay name "${assayName}".`,
                    protocolLoadingState: LoadingState.LOADED,
                };
            }

            this.update({
                context: { assayDefinition, assayProtocol: undefined },
                model: model.mutate(modelProps),
            });

            if (!assayDefinition) {
                return;
            }

            try {
                const assayProtocol = await assayLoader.loadProtocol(assayDefinition.id);

                this.update({
                    context: { assayDefinition, assayProtocol },
                    model: model.mutate({ protocolLoadingState: LoadingState.LOADED }),
                });
            } catch (protocolError) {
                console.error('protocol error', protocolError);
                this.updateModel({ protocolError, protocolLoadingState: LoadingState.LOADED });
            }
        };

        reload = async (): Promise<void> => {
            clearAssayDefinitionCache();

            await this.update({
                context: { assayDefinition: undefined, assayProtocol: undefined },
                model: new AssayStateModel(),
            });

            await this.load();
        };

        update = (newState: Partial<State>): Promise<void> => {
            return new Promise(resolve => {
                if (this._mounted) {
                    this.setState(
                        produce((draft: Draft<State>) => {
                            Object.assign(draft, newState);
                        }),
                        () => {
                            resolve();
                        }
                    );
                }
            });
        };

        updateModel = (newModel: Partial<AssayStateModel>): Promise<void> => {
            return new Promise(resolve => {
                if (this._mounted) {
                    this.setState(
                        produce((draft: Draft<State>) => {
                            Object.assign(draft.model, newModel);
                        }),
                        () => {
                            resolve();
                        }
                    );
                }
            });
        };

        render = (): ReactNode => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { assayLoader, assayName, ...props } = this.props;
            const { context, model } = this.state;

            return (
                <AssayContextProvider value={context}>
                    <ComponentToWrap assayModel={model} reloadAssays={this.reload} {...context} {...(props as Props)} />
                </AssayContextProvider>
            );
        };
    }

    ComponentWithAssays.defaultProps = {
        assayLoader: defaultProps?.assayLoader ?? DefaultAssayLoader,
    };

    return ComponentWithAssays;
}

export function withAssayModelsFromLocation<Props>(
    ComponentToWrap: ComponentType<Props & InjectedAssayModel>
): ComponentType<Props & WithRouterProps> {
    const WrappedComponent = withAssayModels<Props>(ComponentToWrap);

    const AssayFromLocation: FC<Props & WithRouterProps> = props => {
        return <WrappedComponent {...props} assayName={props.params?.protocol} />;
    };

    return withRouter(AssayFromLocation);
}

export function assayPage<Props>(
    ComponentToWrap: ComponentType<Props & InjectedAssayModel>
): ComponentType<Props & WithRouterProps> {
    const AssayPageImpl: FC<Props & InjectedAssayModel & WithRouterProps> = props => {
        const { assayModel, params } = props;
        const assayName = params?.protocol;
        const hasProtocol = assayName !== undefined;

        if (isLoading(assayModel.definitionsLoadingState) || (hasProtocol && isLoading(assayModel.protocolLoadingState))) {
            return <LoadingPage />;
        }

        if (assayModel.definitionsError || assayModel.protocolError) {
            if (hasProtocol && assayModel.getByName(assayName) === undefined) {
                return <NotFound />;
            }

            return (
                <Alert>{getActionErrorMessage('There was a problem loading the assay design.', 'assay design')}</Alert>
            );
        }

        return <ComponentToWrap {...props} />;
    };

    return withAssayModelsFromLocation(AssayPageImpl);
}
