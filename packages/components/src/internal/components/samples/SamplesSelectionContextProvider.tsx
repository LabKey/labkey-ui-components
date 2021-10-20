/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';

import { LoadingSpinner, SampleOperation } from '../../..';

import { SamplesSelectionProviderProps, SamplesSelectionResultProps } from './models';
import {
    getAliquotSampleIds,
    getGroupedSampleDomainFields,
    getNotInStorageSampleIds,
    getNotPermittedSampleIds,
    getSampleSelectionLineageData,
    getSampleSelectionStorageData,
} from './actions';

const Context = React.createContext<SamplesSelectionResultProps>(undefined);
const SamplesSelectionContextProvider = Context.Provider;
export const SamplesSelectionContextConsumer = Context.Consumer;

type Props = SamplesSelectionProviderProps;

type State = SamplesSelectionResultProps;

export const SamplesSelectionProvider = (Component: React.ComponentType) => {
    return class SamplesSelectionProviderImpl extends React.Component<Props, State> {
        state: Readonly<State> = {
            sampleTypeDomainFields: undefined,
            aliquots: undefined,
            noStorageSamples: undefined,
            selectionInfoError: undefined,
            sampleItems: undefined,
            sampleLineageKeys: undefined,
            sampleLineage: undefined,
            notEditableSamples: undefined,
            noLineageUpdateSamples: undefined,
            noStorageUpdateSamples: undefined,
        };

        _storageUpdateNotPermittedIds = undefined;
        _editNotPermittedIds = undefined;
        _editLineageNotPermittedIds = undefined;

        componentDidMount() {
            this.loadSampleTypeDomain();
            this.loadEditNotPermittedData();
            this.loadAliquotData();
            this.loadStorageData();
            this.loadLineageData();
        }

        componentDidUpdate(prevProps: Props): void {
            if (prevProps.selection !== this.props.selection) {
                this.loadEditNotPermittedData();
                this.loadAliquotData();
                this.loadStorageData();
                this.loadLineageData();
            }
        }

        loadSampleTypeDomain(): void {
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

        loadEditNotPermittedData(): void {
            const { selection, sampleSet } = this.props;
            getNotPermittedSampleIds(selection, sampleSet, SampleOperation.EditMetadata)
                .then(samples => {
                    this._editNotPermittedIds = samples;
                    this.setNotEditableIds();
                })
                .catch(error => {
                    this._editNotPermittedIds = undefined;
                    this.setState({
                        selectionInfoError: error,
                    });
                });
        }

        setNotEditableIds(): void {
            if (this._editNotPermittedIds && this.state.aliquots) {
                let idSet = new Set(this._editNotPermittedIds);
                this.state.aliquots.forEach(id => idSet.add(id));

                this.setState({
                    notEditableSamples: Array.from(idSet)
                });
            }
        }

        loadAliquotData(): void {
            const { determineAliquot, selection, sampleSet } = this.props;
            if (determineAliquot && selection && selection.size > 0) {
                getAliquotSampleIds(selection, sampleSet)
                    .then(aliquots => {
                        this.setState(() => ({
                            aliquots,
                        }), () => {
                            this.setNotEditableIds();
                            this.setLineageNotEditableIds();
                        });
                    })
                    .catch(error => {
                        this.setState(() => ({
                            aliquots: undefined,
                            selectionInfoError: error,
                        }));
                    });
            }
        }

        setStorageNotEditableIds(): void {
            if (this._storageUpdateNotPermittedIds && this.state.noStorageSamples) {
                let idSet = new Set(this._storageUpdateNotPermittedIds);
                this.state.noStorageSamples.forEach(id => idSet.add(id));
                this.setState({
                    noStorageUpdateSamples: Array.from(idSet)
                });
            }
        }

        loadStorageData(): void {
            const { determineStorage, selection, sampleSet } = this.props;
            if (determineStorage && selection && selection.size > 0) {
                getNotInStorageSampleIds(selection, sampleSet)
                    .then(samples => {
                        this.setState(() => ({
                            noStorageSamples: samples,
                        }), () => this.setStorageNotEditableIds());
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
                getNotPermittedSampleIds(selection, sampleSet, SampleOperation.UpdateStorageMetadata)
                    .then(samples => {
                        this._storageUpdateNotPermittedIds = samples;
                        this.setStorageNotEditableIds()
                    })
                    .catch(error => {
                        this._storageUpdateNotPermittedIds = undefined;
                        this.setState({
                            selectionInfoError: error,
                        });
                    });
            }
        }

        setLineageNotEditableIds(): void {
            if (this._editLineageNotPermittedIds && this.state.aliquots) {
                let idSet = new Set(this._editLineageNotPermittedIds);
                this.state.aliquots.forEach(id => idSet.add(id));
                this.setState({
                    noLineageUpdateSamples: Array.from(idSet)
                });
            }
        }

        loadLineageData(): void {
            const { determineLineage, selection, sampleSet } = this.props;
            if (determineLineage && selection && selection.size > 0) {
                getSampleSelectionLineageData(selection, sampleSet)
                    .then(response => {
                        const { key, models, orderedModels } = response;
                        this.setState(() => ({
                            sampleLineageKeys: orderedModels[key].toArray(),
                            sampleLineage: models[key],
                        }));
                    })
                    .catch(error => {
                        this.setState(() => ({
                            sampleLineageKeys: undefined,
                            sampleLineage: undefined,
                            selectionInfoError: error,
                        }));
                    });
                getNotPermittedSampleIds(selection, sampleSet, SampleOperation.EditLineage)
                    .then(samples => {
                        this._editLineageNotPermittedIds = samples;
                        this.setLineageNotEditableIds();
                    })
                    .catch(error => {
                        this._editLineageNotPermittedIds = undefined;
                        this.setState({
                            selectionInfoError: error,
                        });
                    });
            }
        }

        render() {
            const { determineAliquot, determineStorage, determineLineage } = this.props;
            const {
                aliquots,
                noStorageSamples,
                selectionInfoError,
                sampleTypeDomainFields,
                sampleLineage,
                notEditableSamples,
                noLineageUpdateSamples,
                noStorageUpdateSamples,
            } = this.state;

            let isLoaded = !!sampleTypeDomainFields;
            if (isLoaded && !selectionInfoError) {
                if (
                    !notEditableSamples ||
                    (determineAliquot && !aliquots) ||
                    (determineStorage && (!noStorageSamples || !noStorageUpdateSamples)) ||
                    (determineLineage && (!sampleLineage || !noLineageUpdateSamples ))
                ) {
                    isLoaded = false;
                }
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
};
