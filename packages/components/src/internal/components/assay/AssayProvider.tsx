import React, { ComponentType, createContext, PureComponent, ReactNode } from 'react';
import { Draft, produce } from 'immer';
import { withRouter, WithRouterProps } from 'react-router';

import {
    Alert,
    AssayDefinitionModel,
    AssayProtocolModel,
    AssayStateModel,
    fetchAllAssays,
    fetchProtocol,
    getActionErrorMessage,
    isLoading,
    LoadingPage,
    LoadingState,
    NotFound,
} from '../../..';

interface AssayProviderContext {
    assayDefinition: AssayDefinitionModel;
    assayProtocol: AssayProtocolModel;
}

interface OwnProps {
    loadProtocol?: boolean;
}

export type AssayProviderProps = AssayProviderContext & WithRouterProps;

export interface InjectedAssayModel extends AssayProviderContext {
    assays: AssayStateModel;
}

interface State {
    context: AssayProviderContext;
    definitions: AssayStateModel;
    definitionsLoadingState: LoadingState;
    loadError?: string;
    protocolLoadingState: LoadingState;
}

const Context = createContext<AssayProviderContext>(undefined);
const AssayContextProvider = Context.Provider;
export const AssayContextConsumer = Context.Consumer;

export function AssayProvider<Props>(
    ComponentToWrap: ComponentType<Props & InjectedAssayModel>,
    defaultProps?: OwnProps
): ComponentType<Props & OwnProps> {
    type WrappedProps = Props & OwnProps & WithRouterProps;

    class ComponentWithAssays extends PureComponent<WrappedProps, State> {
        static defaultProps;

        constructor(props: WrappedProps) {
            super(props);

            this.state = produce({}, () => ({
                context: {
                    assayDefinition: undefined,
                    assayProtocol: undefined,
                },
                definitions: undefined,
                definitionsLoadingState: LoadingState.INITIALIZED,
                loadError: undefined,
                protocolLoadingState: LoadingState.INITIALIZED,
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
            if (this.state.definitionsLoadingState === LoadingState.LOADED) {
                return;
            }

            this.update({ loadError: undefined, definitionsLoadingState: LoadingState.LOADING });

            try {
                const definitionsList = await fetchAllAssays();

                this.update({
                    definitions: AssayStateModel.create(definitionsList.toArray()),
                    definitionsLoadingState: LoadingState.LOADED,
                });
            } catch (error) {
                this.update({ loadError: error, definitionsLoadingState: LoadingState.LOADED });
            }
        };

        loadProtocol = async (assayName: string): Promise<void> => {
            if (!this.props.loadProtocol) {
                return;
            }

            this.update({ protocolLoadingState: LoadingState.LOADING, loadError: undefined });

            try {
                const assayDefinition = this.state.definitions.getByName(assayName);
                const assayProtocol = await fetchProtocol(assayDefinition.id);

                this.update({
                    context: {
                        assayDefinition,
                        assayProtocol,
                    },
                    protocolLoadingState: LoadingState.LOADED,
                });
            } catch (error) {
                this.update({ loadError: error, protocolLoadingState: LoadingState.LOADED });
            }
        };

        update = (newState: Partial<State>): void => {
            this.setState(
                produce((draft: Draft<State>) => {
                    Object.assign(draft, newState);
                })
            );
        };

        render = (): ReactNode => {
            const { loadProtocol } = this.props;
            const { context, definitions, definitionsLoadingState, loadError, protocolLoadingState } = this.state;

            if (isLoading(definitionsLoadingState) || (loadProtocol && isLoading(protocolLoadingState))) {
                return <LoadingPage />;
            }

            if (loadError) {
                return (
                    <Alert>
                        {getActionErrorMessage('There was a problem loading the assay design.', 'assay design')}
                    </Alert>
                );
            }

            return (
                <AssayContextProvider value={context}>
                    <ComponentToWrap {...this.props} {...context} assays={definitions} />
                </AssayContextProvider>
            );

            // TODO: Consider not found
            // return <NotFound />;
        };
    }

    ComponentWithAssays.defaultProps = {
        loadProtocol: defaultProps?.loadProtocol ?? true,
    };

    return withRouter(ComponentWithAssays) as ComponentType<Props & OwnProps>;
}
