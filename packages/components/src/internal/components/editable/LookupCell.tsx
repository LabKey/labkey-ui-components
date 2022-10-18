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
import React, { PureComponent, ReactNode } from 'react';
import { List } from 'immutable';

import { Filter, Query } from '@labkey/api';

import { ValueDescriptor } from '../../models';
import { LOOKUP_DEFAULT_SIZE, MODIFICATION_TYPES, SELECTION_TYPES } from '../../constants';
import { TextChoiceInput } from '../forms/input/TextChoiceInput';
import { QueryColumn } from '../../../public/QueryColumn';
import { QuerySelect } from '../forms/QuerySelect';
import { ViewInfo } from '../../ViewInfo';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { isAllSamplesSchema } from '../samples/utils';
import { SAMPLES_WITH_TYPES_FILTER } from '../samples/constants';

export const customStyles = {
    control: provided => ({
        ...provided,
        minHeight: 24,
        borderRadius: 0,
    }),
    valueContainer: provided => ({
        ...provided,
        minHeight: 24,
        padding: '0 4px',
    }),
    input: provided => ({
        ...provided,
        margin: '0px',
    }),
    indicatorsContainer: provided => ({
        ...provided,
        minHeight: 24,
        padding: '0 4px',
    }),
};

export const customTheme = theme => ({
    ...theme,
    colors: {
        ...theme.colors,
        danger: '#D9534F',
        primary: '#2980B9',
        primary75: '#009BF9',
        primary50: '#F2F9FC',
        primary25: 'rgba(41, 128, 185, 0.1)',
    },
    spacing: {
        ...theme.spacing,
        baseUnit: 2,
    },
});

export interface LookupCellProps {
    col: QueryColumn;
    colIdx: number;
    containerFilter?: Query.ContainerFilter;
    disabled?: boolean;
    filteredLookupKeys?: List<any>;
    filteredLookupValues?: List<string>;
    modifyCell: (colIdx: number, rowIdx: number, newValues: ValueDescriptor[], mod: MODIFICATION_TYPES) => void;
    rowIdx: number;
    select: (colIdx: number, rowIdx: number, selection?: SELECTION_TYPES, resetValue?: boolean) => void;
    values: List<ValueDescriptor>;
}

export class LookupCell extends PureComponent<LookupCellProps> {
    isMultiValue = (): boolean => {
        return this.props.col.isJunctionLookup();
    };

    onInputChange = (fieldName: string, formValue: string | any[], items: any): void => {
        const { colIdx, modifyCell, rowIdx, select } = this.props;
        if (this.isMultiValue()) {
            if (items.length === 0) {
                modifyCell(colIdx, rowIdx, undefined, MODIFICATION_TYPES.REMOVE_ALL);
            } else {
                const valueDescriptors = items.map(item => ({ raw: item.value, display: item.label }));
                modifyCell(colIdx, rowIdx, valueDescriptors, MODIFICATION_TYPES.REPLACE);
            }
        } else {
            modifyCell(colIdx, rowIdx, [{ raw: items?.value, display: items?.label }], MODIFICATION_TYPES.REPLACE);
        }

        if (!this.isMultiValue()) {
            select(colIdx, rowIdx);
        }
    };

    render(): ReactNode {
        const { col, containerFilter, disabled, values, filteredLookupKeys, filteredLookupValues } = this.props;

        const rawValues = values
            .filter(vd => vd.raw !== undefined)
            .map(vd => vd.raw)
            .toArray();

        if (col.validValues) {
            return (
                <TextChoiceInput
                    autoFocus
                    queryColumn={col}
                    disabled={disabled}
                    containerClass="select-input-cell-container"
                    customTheme={customTheme}
                    customStyles={customStyles}
                    menuPosition="fixed" // note that there is an open issue related to scrolling when the menu is open: https://github.com/JedWatson/react-select/issues/4088
                    openMenuOnFocus
                    inputClass="select-input-cell"
                    placeholder=""
                    onChange={this.onInputChange}
                    showLabel={false}
                    value={rawValues[0]}
                />
            );
        }

        const lookup = col.lookup;
        const isMultiple = this.isMultiValue();
        let queryFilters: List<Filter.IFilter> = List();
        if (filteredLookupValues) {
            queryFilters = queryFilters.push(Filter.create(lookup.displayColumn, filteredLookupValues.toArray(), Filter.Types.IN));
        }

        if (filteredLookupKeys) {
            queryFilters = queryFilters.push(Filter.create(lookup.keyColumn, filteredLookupKeys.toArray(), Filter.Types.IN));
        }

        if (lookup.hasQueryFilters()) {
            queryFilters = queryFilters.push(...lookup.getQueryFilters())
        }

        return (
            <QuerySelect
                autoFocus
                containerFilter={lookup.containerFilter ?? containerFilter}
                disabled={disabled}
                queryFilters={queryFilters}
                multiple={isMultiple}
                // use detail view to assure we get values that may have been filtered out in the default view
                schemaQuery={SchemaQuery.create(
                    lookup.schemaQuery.schemaName,
                    lookup.schemaQuery.queryName,
                    ViewInfo.DETAIL_NAME
                )}
                key={col.lookupKey}
                maxRows={LOOKUP_DEFAULT_SIZE}
                containerPath={lookup.containerPath}
                containerClass="select-input-cell-container"
                customTheme={customTheme}
                customStyles={customStyles}
                menuPosition="fixed" // note that there is an open issue related to scrolling when the menu is open: https://github.com/JedWatson/react-select/issues/4088
                openMenuOnFocus={!isMultiple} // If set to true for the multi-select case, it's not possible to tab out of the cell.
                inputClass="select-input-cell"
                placeholder=""
                onQSChange={this.onInputChange}
                preLoad
                showLabel={false}
                value={isMultiple ? rawValues : rawValues[0]}
            />
        );
    }
}
