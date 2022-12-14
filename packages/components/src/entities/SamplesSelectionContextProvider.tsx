/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { ComponentType, ReactNode } from 'react';

import { getSampleOperationConfirmationData } from '../internal/components/entities/actions';

import { SCHEMAS } from '../internal/schemas';

import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';

import { SamplesSelectionProviderProps, SamplesSelectionResultProps } from '../internal/components/samples/models';
import {
    getAliquotSampleIds,
    getGroupedSampleDomainFields,
    getNotInStorageSampleIds,
    getSampleSelectionStorageData,
    getSelectionLineageData,
} from '../internal/components/samples/actions';
import { SampleOperation } from '../internal/components/samples/constants';

const Context = React.createContext<SamplesSelectionResultProps>(undefined);
const SamplesSelectionContextProvider = Context.Provider;
export const SamplesSelectionContextConsumer = Context.Consumer;

type Props = SamplesSelectionProviderProps;

export function SamplesSelectionProvider<T>(
    WrappedComponent: ComponentType<T & Props & SamplesSelectionResultProps>
): ComponentType<T> {
    class SamplesSelectionProviderImpl extends React.Component<T & Props, SamplesSelectionResultProps> {
        state: Readonly<SamplesSelectionResultProps> = {
            sampleTypeDomainFields: undefined,
            aliquots: undefined,
            noStorageSamples: undefined,
            selectionInfoError: undefined,
            sampleItems: undefined,
            sampleLineageKeys: undefined,
            sampleLineage: undefined,
            editStatusData: undefined,
        };

        componentDidMount(): void {
            this.loadSampleTypeDomain();
            this.loadEditConfirmationData();
            this.loadAliquotData();
            this.loadStorageData();
            this.loadLineageData();
        }

        componentDidUpdate(prevProps: T & Props): void {
            if (prevProps.selection !== this.props.selection) {
                this.loadEditConfirmationData();
                this.loadAliquotData();
                this.loadStorageData();
                this.loadLineageData();
            }
        }

        loadSampleTypeDomain(): void {
            getGroupedSampleDomainFields(this.props.sampleSet)
                .then(sampleTypeDomainFields => {
                    this.setState({
                        sampleTypeDomainFields,
                    });
                })
                .catch(reason => {
                    this.setState({ selectionInfoError: reason });
                });
        }

        loadEditConfirmationData(): void {
            const { selection, determineSampleData } = this.props;
            if (determineSampleData) {
                getSampleOperationConfirmationData(SampleOperation.EditMetadata, selection.toArray())
                    .then(editConfirmationData => {
                        this.setState({
                            editStatusData: editConfirmationData,
                        });
                    })
                    .catch(error => {
                        this.setState({
                            selectionInfoError: error,
                            editStatusData: undefined,
                        });
                    });
            }
        }

        loadAliquotData(): void {
            const { determineSampleData, selection, sampleSet, viewName } = this.props;
            if (determineSampleData && selection && selection.size > 0) {
                getAliquotSampleIds(selection, sampleSet, viewName)
                    .then(aliquots => {
                        this.setState({
                            aliquots,
                        });
                    })
                    .catch(error => {
                        this.setState({
                            aliquots: undefined,
                            selectionInfoError: error,
                        });
                    });
            }
        }

        loadStorageData(): void {
            const { selection, sampleSet, determineStorage, viewName } = this.props;
            if (determineStorage && selection && selection.size > 0) {
                getNotInStorageSampleIds(selection, sampleSet, viewName)
                    .then(samples => {
                        this.setState({
                            noStorageSamples: samples,
                        });
                    })
                    .catch(error => {
                        this.setState({
                            noStorageSamples: undefined,
                            selectionInfoError: error,
                        });
                    });
                getSampleSelectionStorageData(selection)
                    .then(sampleItems => {
                        this.setState(() => ({
                            sampleItems,
                        }));
                    })
                    .catch(error => {
                        this.setState({
                            sampleItems: undefined,
                            selectionInfoError: error,
                        });
                    });
            }
        }

        loadLineageData(): void {
            const { selection, sampleSet, determineLineage, viewName } = this.props;
            if (determineLineage && selection && selection.size > 0) {
                getSelectionLineageData(selection, SCHEMAS.SAMPLE_SETS.SCHEMA, sampleSet, viewName)
                    .then(response => {
                        const { key, models, orderedModels } = response;
                        this.setState(() => ({
                            sampleLineageKeys: orderedModels[key].toArray(),
                            sampleLineage: models[key],
                        }));
                    })
                    .catch(error => {
                        this.setState({
                            sampleLineageKeys: undefined,
                            sampleLineage: undefined,
                            selectionInfoError: error,
                        });
                    });
            }
        }

        render(): ReactNode {
            const { determineSampleData, determineStorage, determineLineage } = this.props;
            const {
                aliquots,
                noStorageSamples,
                selectionInfoError,
                sampleTypeDomainFields,
                sampleLineage,
                editStatusData,
            } = this.state;

            let isLoaded = !!sampleTypeDomainFields;
            if (isLoaded && !selectionInfoError) {
                if (
                    (determineSampleData && !editStatusData) ||
                    (determineSampleData && !aliquots) ||
                    (determineStorage && !noStorageSamples) ||
                    (determineLineage && !sampleLineage)
                ) {
                    isLoaded = false;
                }
            }

            if (isLoaded) {
                return (
                    <SamplesSelectionContextProvider value={this.state}>
                        <WrappedComponent {...this.props} {...this.state} />
                    </SamplesSelectionContextProvider>
                );
            } else {
                return <LoadingSpinner />;
            }
        }
    }

    return SamplesSelectionProviderImpl;
}
