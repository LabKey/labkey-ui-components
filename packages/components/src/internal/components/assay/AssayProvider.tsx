import React, { ComponentType, createContext, PureComponent, ReactNode } from 'react';
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

export interface AssayProviderContext {
    assayDefinition: AssayDefinitionModel;
    assayProtocol: AssayProtocolModel;
}

export interface AssayProviderProps {
    displayLoading?: boolean;
    handleErrors?: boolean;
    loadProtocol?: boolean;
    waitForLoaded?: boolean;
}

export interface InjectedAssayModel extends AssayProviderContext {
    assayModel: AssayStateModel;
    reloadAssays: () => void;
}

interface State {
    context: AssayProviderContext;
    model: AssayStateModel;
}

const Context = createContext<AssayProviderContext>(undefined);
const AssayContextProvider = Context.Provider;
export const AssayContextConsumer = Context.Consumer;

export function AssayProvider<Props>(
    ComponentToWrap: ComponentType<Props & InjectedAssayModel>,
    defaultProps?: AssayProviderProps
): ComponentType<Props & AssayProviderProps> {
    type WrappedProps = Props & AssayProviderProps & WithRouterProps;

    class ComponentWithAssays extends PureComponent<WrappedProps, State> {
        static defaultProps;

        constructor(props: WrappedProps) {
            super(props);

            this.state = produce({}, () => ({
                context: { assayDefinition: undefined, assayProtocol: undefined },
                model: new AssayStateModel(),
            }));
        }

        componentDidMount = (): void => {
            this.load();
        };

        componentDidUpdate = (prevProps: WrappedProps): void => {
            if (this.props.loadProtocol && this.props.params?.protocol !== prevProps.params?.protocol) {
                this.load();
            }
        };

        load = async (): Promise<void> => {
            await this.loadDefinitions();
            await this.loadProtocol(this.props.params?.protocol);
        };

        loadDefinitions = async (): Promise<void> => {
            const { model } = this.state;

            if (model.definitionsLoadingState === LoadingState.LOADED) {
                return;
            }

            this.updateModel({ definitionsError: undefined, definitionsLoadingState: LoadingState.LOADING });

            try {
                const definitions = await fetchAllAssays();

                this.updateModel({
                    definitions: definitions.toArray(),
                    definitionsLoadingState: LoadingState.LOADED,
                });
            } catch (definitionsError) {
                console.error('definitions error', definitionsError);
                this.updateModel({ definitionsError, definitionsLoadingState: LoadingState.LOADED });
            }
        };

        loadProtocol = async (assayName: string): Promise<void> => {
            if (!this.props.loadProtocol) {
                return;
            }

            const { model } = this.state;

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
                const assayProtocol = await fetchProtocol(assayDefinition.id);

                this.update({
                    context: { assayDefinition, assayProtocol },
                    model: model.mutate({ protocolLoadingState: LoadingState.LOADED }),
                });
            } catch (protocolError) {
                console.error('protocol error', protocolError);
                this.updateModel({ protocolError, protocolLoadingState: LoadingState.LOADED });
            }
        };

        reload = (): void => {
            clearAssayDefinitionCache();

            this.update({
                context: { assayDefinition: undefined, assayProtocol: undefined },
                model: new AssayStateModel(),
            });

            this.load();
        };

        update = (newState: Partial<State>): void => {
            this.setState(
                produce((draft: Draft<State>) => {
                    Object.assign(draft, newState);
                })
            );
        };

        updateModel = (newModel: Partial<AssayStateModel>): void => {
            this.setState(
                produce((draft: Draft<State>) => {
                    Object.assign(draft.model, newModel);
                })
            );
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
        displayLoading: defaultProps?.displayLoading ?? true,
        handleErrors: defaultProps?.handleErrors ?? true,
        loadProtocol: defaultProps?.loadProtocol ?? true,
        waitForLoaded: defaultProps?.waitForLoaded ?? true,
    };

    return withRouter(ComponentWithAssays) as ComponentType<Props & AssayProviderProps>;
}
