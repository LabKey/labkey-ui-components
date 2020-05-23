import React from 'react';

import { WithRouterProps } from 'react-router';

import { Alert, AssayDefinitionModel, AssayProtocolModel, getActionErrorMessage, LoadingPage, NotFound } from '../..';

import { AssayStateModel } from './models';

interface IContext {
    assayDefinition: AssayDefinitionModel;
    assayProtocol: AssayProtocolModel;
}

interface AssayLoadProps {
    loadAssay: (protocolName: string) => any;
    assay: AssayStateModel;
}

export interface AssayProviderProps extends WithRouterProps {
    assayDefinition: AssayDefinitionModel;
    assayProtocol: AssayProtocolModel;
}

type Props = AssayProviderProps & AssayLoadProps;

interface State extends IContext {}

const Context = React.createContext<IContext>(undefined);
const AssayContextProvider = Context.Provider;
export const AssayContextConsumer = Context.Consumer;

export const AssayProvider = (Component: React.ComponentType) => {
    return class AssayProviderImpl extends React.Component<Props, State> {
        constructor(props: Props) {
            super(props);

            this.state = {
                assayDefinition: undefined,
                assayProtocol: undefined,
            };
        }

        static getDerivedStateFromProps(nextProps: Props, prevState: State): State {
            const { assay, params } = nextProps;
            const { protocol } = params;
            const assayDefinition = assay.getByName(protocol);

            if (assay.isLoaded && assayDefinition) {
                const assayProtocol = assay.getProtocol(assayDefinition.id);
                // we need to load the assay protocol if it has changed
                if (!assayProtocol && prevState.assayProtocol)
                    nextProps.loadAssay(nextProps.params.protocol);

                return {
                    assayDefinition,
                    assayProtocol,
                }
            } else {
                return {
                    assayDefinition,
                    assayProtocol: undefined,
                }
            }
        }

        componentDidMount() {
            this.props.loadAssay(this.props.params.protocol);
        }

        componentDidUpdate(nextProps: Props) {
            if (this.props.params.protocol !== nextProps.params.protocol) {
                this.props.loadAssay(nextProps.params.protocol);
            }
        }

        render() {
            const { assay, params } = this.props;
            const { protocol } = params;
            const assayDefinition = assay.getByName(protocol);

            if (assay.isLoaded && assayDefinition) {
                if (!assay.getProtocol(assayDefinition.id)) {
                    return <LoadingPage />;
                }

                return (
                    <AssayContextProvider value={this.state}>
                        <Component {...this.props} {...this.state}/>
                    </AssayContextProvider>
                );
            }
            else if (assay.isLoading || !assay.isLoaded) {
                return <LoadingPage/>;
            }
            else if (assay.hasError) {
                console.error(assay.errorMsg);
                return (
                    <Alert>
                        {getActionErrorMessage('There was a problem loading the assay design.', 'assay design')}
                    </Alert>
                )
            }

            return <NotFound />;
        }
    };
};
