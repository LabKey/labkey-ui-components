import React from 'react';
import { SampleOperation } from './constants';
import { ComponentsAPIWrapper } from '../../APIWrapper';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { OperationConfirmationData } from '../entities/models';

interface SampleOperationProps {
    operation: SampleOperation,
    selectionKey: string,
    api?: ComponentsAPIWrapper,
}

interface SampleOperationConfirmationProps {
    confirmationData: OperationConfirmationData,
    error: boolean,
}

const Context = React.createContext<SampleOperationConfirmationProps>(undefined);
const SampleOperationContextProvider = Context.Provider;

type Props = SampleOperationProps;
type State = SampleOperationConfirmationProps;

export const SampleOperationConfirmationProvider = (Component: React.ComponentType) => {
    return class SampleOperationConfirmationProviderImpl extends React.Component<Props, State> {
        state: Readonly<State> = {
            confirmationData: undefined,
            error: false
        }

        componentDidMount() {
            const { api, selectionKey, operation } = this.props;
            api.samples.getSampleOperationConfirmationData(operation, selectionKey)
                .then(confirmationData => {
                    this.setState({
                        confirmationData,
                        error: false
                    })
                })
                .catch(reason => {
                    this.setState({error: true})
                });
        }

        render() {
            const { confirmationData, error } = this.state;

            const isLoaded = confirmationData || error;
            if (isLoaded) {
                return (
                    <SampleOperationContextProvider value={this.state}>
                        <Component {...this.props} {...this.state} />
                    </SampleOperationContextProvider>
                )
            } else {
                return <LoadingSpinner />;
            }
        }
    }

}
