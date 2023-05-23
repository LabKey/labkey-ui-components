/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { Component, ReactNode } from 'react';

import { Filter } from '@labkey/api';

import { isSampleAliquotSelectorEnabled } from '../../app/utils';
import { ALIQUOT_FILTER_MODE, IS_ALIQUOT_COL } from '../samples/constants';
import { Actions } from '../../../public/QueryModel/withQueryModels';
import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { SampleAliquotViewSelector } from './SampleAliquotViewSelector';

interface Props {
    actions?: Actions;
    initAliquotMode?: ALIQUOT_FILTER_MODE; // allow to set aliquot filter from a init value
    queryModel?: QueryModel;
    updateFilter?: (
        filter: Filter.IFilter,
        filterColumnToRemove?: string,
        newModel?: ALIQUOT_FILTER_MODE,
        queryModel?: QueryModel
    ) => void;
}

interface State {
    initAliquotModeSynced: boolean;
}

export class GridAliquotViewSelector extends Component<Props, State> {
    state: Readonly<State> = {
        initAliquotModeSynced: false,
    };

    componentDidMount(): void {
        this.syncInitMode();
    }

    componentDidUpdate = (): void => {
        this.syncInitMode();
    };

    syncInitMode = () => {
        const { initAliquotMode, queryModel } = this.props;
        const { initAliquotModeSynced } = this.state;
        // if bindURL = true, rely on url param to set aliquot filter and ignore the initAliquotMode prop
        if (!initAliquotModeSynced && initAliquotMode && !queryModel.bindURL && !queryModel?.isLoading) {
            const currentMode = this.getAliquotFilterMode();
            if (initAliquotMode != currentMode) this.updateAliquotFilter(initAliquotMode);
            this.setState(() => ({ initAliquotModeSynced: true }));
        }
    };

    getAliquotColName = (): string => {
        // account for the case where the aliquot column is in the queryModel via a lookup from the sample ID
        const { queryModel } = this.props;
        let aliquotColName;
        if (!queryModel.getColumnByFieldKey(IS_ALIQUOT_COL)) {
            aliquotColName = queryModel.allColumns?.find(
                c => c.fieldKey.toLowerCase().indexOf('/' + IS_ALIQUOT_COL.toLowerCase()) > -1
            )?.fieldKey;
        }

        return aliquotColName ?? IS_ALIQUOT_COL;
    };

    updateAliquotFilter = (newMode: ALIQUOT_FILTER_MODE): void => {
        const { queryModel, actions, updateFilter } = this.props;
        const aliquotColName = this.getAliquotColName();

        let newFilter: Filter.IFilter;
        if (newMode === ALIQUOT_FILTER_MODE.all || newMode === ALIQUOT_FILTER_MODE.none) {
            newFilter = null;
        } else {
            newFilter = Filter.create(aliquotColName, newMode === ALIQUOT_FILTER_MODE.aliquots);
        }

        if (updateFilter) {
            updateFilter(newFilter, aliquotColName, newMode, queryModel);
        }

        if (queryModel?.queryInfo && actions) {
            // keep any existing filters that do not match the aliquot column name
            const updatedFilters = queryModel.filterArray.filter(filter => {
                return aliquotColName.toLowerCase() !== filter.getColumnName().toLowerCase();
            });

            if (newFilter) updatedFilters.push(newFilter);

            actions.setFilters(queryModel.id, updatedFilters, true);
        }
    };

    getAliquotFilterMode = (): ALIQUOT_FILTER_MODE => {
        const { queryModel } = this.props;
        let mode = ALIQUOT_FILTER_MODE.all;
        const filterArray = queryModel?.filterArray;
        if (filterArray) {
            const aliquotColName = this.getAliquotColName();

            filterArray.forEach(filter => {
                if (filter.getColumnName().toLowerCase() === aliquotColName?.toLowerCase()) {
                    const filterType = filter.getFilterType();
                    const value = filter.getValue();

                    if (filterType == Filter.Types.ISBLANK || filterType == Filter.Types.MISSING) {
                        mode = ALIQUOT_FILTER_MODE.none;
                    } else if (filterType == Filter.Types.EQUAL || filterType.getURLSuffix() == 'eq') {
                        if (value === '') return;
                        mode =
                            value === 'true' || value === true
                                ? ALIQUOT_FILTER_MODE.aliquots
                                : ALIQUOT_FILTER_MODE.samples;
                    } else if (
                        filterType == Filter.Types.NOT_EQUAL ||
                        filterType == Filter.Types.NEQ ||
                        filterType == Filter.Types.NEQ_OR_NULL
                    ) {
                        if (value === '') return;
                        mode =
                            value === 'true' || value === true
                                ? ALIQUOT_FILTER_MODE.samples
                                : ALIQUOT_FILTER_MODE.aliquots;
                    }
                }
            });
        }

        return mode;
    };

    render(): ReactNode {
        const { queryModel } = this.props;

        if (!queryModel) return null;

        if (!isSampleAliquotSelectorEnabled()) return null;

        return (
            <SampleAliquotViewSelector
                aliquotFilterMode={this.getAliquotFilterMode()}
                updateAliquotFilter={this.updateAliquotFilter}
            />
        );
    }
}
