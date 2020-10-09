import React, { ComponentType, createContext, PureComponent, ReactNode } from 'react';
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
    displayLoading?: boolean;
    handleErrors?: boolean;
    loadProtocol?: boolean;
    waitForLoaded?: boolean;
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
    type WrappedProps = Props & WithAssayModelProps & WithRouterProps;

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
            if (this.props.loadProtocol && this.props.params?.protocol !== prevProps.params?.protocol) {
                this.load();
            }
        };

        componentWillUnmount = (): void => {
            this._mounted = false;
        };

        load = async (): Promise<void> => {
            await this.loadDefinitions();
            await this.loadProtocol(this.props.params?.protocol);
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

        loadProtocol = async (assayName: string): Promise<void> => {
            const { assayLoader, loadProtocol } = this.props;
            const { model } = this.state;

            if (!loadProtocol) {
                return;
            }

            const assayDefinition = model.getByName(assayName);
            let modelProps: Partial<AssayStateModel>;

            // TODO: This is the "not found" case. Determine if this provider should provide handling or just report as error
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
            const { displayLoading, handleErrors, loadProtocol, waitForLoaded, ...props } = this.props;
            const { context, model } = this.state;

            if (
                waitForLoaded &&
                (isLoading(model.definitionsLoadingState) || (loadProtocol && isLoading(model.protocolLoadingState)))
            ) {
                return displayLoading ? <LoadingPage /> : null;
            }

            if (handleErrors && (model.definitionsError || model.protocolError)) {
                return (
                    <Alert>
                        {getActionErrorMessage('There was a problem loading the assay design.', 'assay design')}
                    </Alert>
                );
            }

            return (
                <AssayContextProvider value={context}>
                    <ComponentToWrap assayModel={model} reloadAssays={this.reload} {...context} {...(props as Props)} />
                </AssayContextProvider>
            );
        };
    }

    ComponentWithAssays.defaultProps = {
        assayLoader: defaultProps?.assayLoader ?? DefaultAssayLoader,
        displayLoading: defaultProps?.displayLoading ?? true,
        handleErrors: defaultProps?.handleErrors ?? true,
        loadProtocol: defaultProps?.loadProtocol ?? true,
        waitForLoaded: defaultProps?.waitForLoaded ?? true,
    };

    return withRouter(ComponentWithAssays) as ComponentType<Props & WithAssayModelProps>;
}
