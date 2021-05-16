/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';

import { LoadingSpinner } from '../../..';

import { SamplesSelectionProviderProps, SamplesSelectionResultProps } from './models';
import {
    getAliquotSampleIds,
    getGroupedSampleDomainFields,
    getNotInStorageSampleIds,
    getSampleSelectionStorageData,
} from './actions';

const Context = React.createContext<SamplesSelectionResultProps>(undefined);
const SamplesSelectionContextProvider = Context.Provider;
export const SamplesSelectionContextConsumer = Context.Consumer;

type Props = SamplesSelectionProviderProps;

type State = SamplesSelectionResultProps;

export const SamplesSelectionProvider = (Component: React.ComponentType) => {
    class SamplesSelectionProviderImpl extends React.Component<Props, State> {
        state: Readonly<State> = {
            sampleTypeDomainFields: undefined,
            aliquots: undefined,
            noStorageSamples: undefined,
            selectionInfoError: undefined,
            sampleItems: undefined,
        };

        componentDidMount() {
            this.loadSampleTypeDomain();
            this.loadAliquotData();
            this.loadStorageData();
        }

        componentDidUpdate(prevProps: Props): void {
            if (prevProps.selection !== this.props.selection) {
                this.loadAliquotData();
                this.loadStorageData();
            }
        }

        loadSampleTypeDomain() {
            getGroupedSampleDomainFields(this.props.sampleSet)
                .then(sampleTypeDomainFields => {
                    this.setState(() => ({
                        sampleTypeDomainFields,
                    }));
                })
                .catch(reason => {
                    this.setState(() => ({ selectionInfoError: reason }));
                });
        }

        loadAliquotData() {
            const { determineAliquot, selection, sampleSet } = this.props;
            if (determineAliquot && selection && selection.size > 0)
                getAliquotSampleIds(selection, sampleSet)
                    .then(aliquots => {
                        this.setState(() => ({
                            aliquots,
                        }));
                    })
                    .catch(error => {
                        this.setState(() => ({
                            aliquots: undefined,
                            selectionInfoError: error,
                        }));
                    });
        }

        loadStorageData() {
            const { determineStorage, selection, sampleSet } = this.props;
            if (determineStorage && selection && selection.size > 0)
                getNotInStorageSampleIds(selection, sampleSet)
                    .then(samples => {
                        this.setState(() => ({
                            noStorageSamples: samples,
                        }));
                    })
                    .catch(error => {
                        this.setState(() => ({
                            noStorageSamples: undefined,
                            selectionInfoError: error,
                        }));
                    });
            getSampleSelectionStorageData(selection)
                .then(sampleItems => {
                    this.setState(() => ({
                        sampleItems,
                    }));
                })
                .catch(error => {
                    this.setState(() => ({
                        sampleItems: undefined,
                        selectionInfoError: error,
                    }));
                });
        }

        render() {
            const { determineAliquot, determineStorage } = this.props;
            const { aliquots, noStorageSamples, selectionInfoError, sampleTypeDomainFields } = this.state;

            let isLoaded = !!sampleTypeDomainFields;
            if (isLoaded && !selectionInfoError) {
                if ((determineAliquot && !aliquots) || (determineStorage && !noStorageSamples)) isLoaded = false;
            }

            if (isLoaded) {
                return (
                    <SamplesSelectionContextProvider value={this.state}>
                        <Component {...this.props} {...this.state} />
                    </SamplesSelectionContextProvider>
                );
            } else {
                return <LoadingSpinner />;
            }
        }
    }

    return SamplesSelectionProviderImpl;
};
