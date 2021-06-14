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
import { DropdownButton, MenuItem } from 'react-bootstrap';
import { List } from 'immutable';

import { Filter } from '@labkey/api';

import { generateId, QueryGridModel, QueryModel } from '../../..';
import { replaceFilter } from '../../util/URL';

interface Props {
    queryGridModel?: QueryGridModel;
    queryModel?: QueryModel;
    updateFilter?: (filter: Filter.IFilter, filterColumnToRemove?: string) => void;
}

enum MODE {
    all,
    samples,
    aliquots,
    none, // when using omni filter with 'is blank'
}

const IS_ALIQUOT_COL = 'IsAliquot';

export class GridAliquotViewSelector extends Component<Props> {
    dropId: string;

    constructor(props: Props) {
        super(props);

        this.dropId = generateId('aliquotviewselector-');
    }

    updateAliquotFilter(newMode: MODE) {
        const { queryGridModel, updateFilter } = this.props;

        let newFilter : Filter.IFilter;
        if (newMode === MODE.all || newMode === MODE.none)
            newFilter = null
        else
            newFilter = Filter.create(IS_ALIQUOT_COL, newMode === MODE.aliquots);

        if (queryGridModel) {
            replaceFilter(queryGridModel, IS_ALIQUOT_COL, newFilter);
        } else if (updateFilter) {
            updateFilter(newFilter, IS_ALIQUOT_COL);
        }
    }

    getTitle(mode: MODE) {
        switch (mode) {
            case MODE.samples:
                return 'Samples Only';
            case MODE.aliquots:
                return 'Aliquots Only';
            case MODE.none:
                return 'None';
            default:
                return 'All Samples';
        }
    }

    getAliquotFilterMode = (): MODE => {
        const { queryGridModel, queryModel } = this.props;
        let mode = MODE.all;
        const filterArray = queryGridModel ? queryGridModel.filterArray : queryModel?.filterArray;
        if (filterArray) {
            filterArray.forEach(filter => {
                if (filter.getColumnName().toLowerCase() === IS_ALIQUOT_COL.toLowerCase()) {
                    const filterType = filter.getFilterType();
                    const value = filter.getValue();

                    if (filterType == Filter.Types.ISBLANK || filterType == Filter.Types.MISSING) {
                        mode = MODE.none;
                    } else if (filterType == Filter.Types.EQUAL) {
                        if (value === '') return;
                        mode = value === 'true' || value === true ? MODE.aliquots : MODE.samples;
                    } else if (
                        filterType == Filter.Types.NOT_EQUAL ||
                        filterType == Filter.Types.NEQ ||
                        filterType == Filter.Types.NEQ_OR_NULL
                    ) {
                        if (value === '') return;
                        mode = value === 'true' || value === true ? MODE.samples : MODE.aliquots;
                    }
                }
            });
        }

        return mode;
    };

    createItem(key: string, label: string, targetMode: MODE, active: boolean): ReactNode {
        return (
            <MenuItem
                active={active}
                key={key}
                onSelect={this.updateAliquotFilter.bind(this, targetMode)}>
                {label}
            </MenuItem>
        );
    }

    createMenuItems(filterMode: MODE): List<ReactNode> {
        const items = List<ReactNode>().asMutable();
        items.push(
            <MenuItem header key="aliquot-selector-header">
                Show Samples
            </MenuItem>
        );

        items.push(this.createItem('all', 'Samples and Aliquots', MODE.all, filterMode == MODE.all));
        items.push(this.createItem('sample', 'Samples Only', MODE.samples, filterMode == MODE.samples));
        items.push(this.createItem('aliquot', 'Aliquots Only', MODE.aliquots, filterMode == MODE.aliquots));

        return items.asImmutable();
    }

    render(): ReactNode {
        const { queryGridModel, queryModel } = this.props;

        if (!queryGridModel && !queryModel) return null;

        const filterMode = this.getAliquotFilterMode();

        const viewItems = this.createMenuItems(filterMode);

        return (
            <span className="gridbar-button-spacer">
                <DropdownButton id={this.dropId} pullRight title={this.getTitle(filterMode)}>
                    {viewItems.toArray()}
                </DropdownButton>
            </span>
        );
    }
}
