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

import { QueryGridModel, QueryModel } from '../../..';
import { replaceFilter } from '../../util/URL';
import { ALIQUOT_FILTER_MODE, SampleAliquotViewSelector } from "../samples/SampleAliquotViewSelector";

interface Props {
    queryGridModel?: QueryGridModel;
    queryModel?: QueryModel;
    updateFilter?: (filter: Filter.IFilter, filterColumnToRemove?: string) => void;
}

const IS_ALIQUOT_COL = 'IsAliquot';

export class GridAliquotViewSelector extends Component<Props> {

    updateAliquotFilter = (newMode: ALIQUOT_FILTER_MODE) => {
        const { queryGridModel, updateFilter } = this.props;

        let newFilter: Filter.IFilter;
        if (newMode === ALIQUOT_FILTER_MODE.all || newMode === ALIQUOT_FILTER_MODE.none) newFilter = null;
        else newFilter = Filter.create(IS_ALIQUOT_COL, newMode === ALIQUOT_FILTER_MODE.aliquots);

        if (queryGridModel) {
            replaceFilter(queryGridModel, IS_ALIQUOT_COL, newFilter);
        } else if (updateFilter) {
            updateFilter(newFilter, IS_ALIQUOT_COL);
        }
    };

    getAliquotFilterMode = (): ALIQUOT_FILTER_MODE => {
        const { queryGridModel, queryModel } = this.props;
        let mode = ALIQUOT_FILTER_MODE.all;
        const filterArray = queryGridModel ? queryGridModel.filterArray : queryModel?.filterArray;
        if (filterArray) {
            filterArray.forEach(filter => {
                if (filter.getColumnName().toLowerCase() === IS_ALIQUOT_COL.toLowerCase()) {
                    const filterType = filter.getFilterType();
                    const value = filter.getValue();

                    if (filterType == Filter.Types.ISBLANK || filterType == Filter.Types.MISSING) {
                        mode = ALIQUOT_FILTER_MODE.none;
                    } else if (filterType == Filter.Types.EQUAL) {
                        if (value === '') return;
                        mode = value === 'true' || value === true ? ALIQUOT_FILTER_MODE.aliquots : ALIQUOT_FILTER_MODE.samples;
                    } else if (
                        filterType == Filter.Types.NOT_EQUAL ||
                        filterType == Filter.Types.NEQ ||
                        filterType == Filter.Types.NEQ_OR_NULL
                    ) {
                        if (value === '') return;
                        mode = value === 'true' || value === true ? ALIQUOT_FILTER_MODE.samples : ALIQUOT_FILTER_MODE.aliquots;
                    }
                }
            });
        }

        return mode;
    };

    render(): ReactNode {
        const { queryGridModel, queryModel } = this.props;

        if (!queryGridModel && !queryModel) return null;

        return (
            <SampleAliquotViewSelector
                aliquotFilterMode={this.getAliquotFilterMode()}
                updateAliquotFilter={this.updateAliquotFilter}
            />
        );
    }
}
