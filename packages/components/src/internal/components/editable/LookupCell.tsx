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
import { List, Map } from 'immutable';

import { Filter } from '@labkey/api';

import { modifyCell } from '../../actions';
import { ValueDescriptor } from '../../models';
import { LOOKUP_DEFAULT_SIZE, MODIFICATION_TYPES, SELECTION_TYPES } from '../../constants';
import { QueryColumn, QuerySelect, SchemaQuery } from '../../..';
import { TextChoiceInput } from '../forms/input/TextChoiceInput';

const customStyles = {
    control: (provided, state) => ({
        ...provided,
        minHeight: 24,
        borderRadius: 0,
    }),
    valueContainer: (provided, state) => ({
        ...provided,
        minHeight: 24,
        padding: '0 4px',
    }),
    input: (provided, state) => ({
        ...provided,
        margin: '0px',
    }),
    indicatorsContainer: (provided, state) => ({
        ...provided,
        minHeight: 24,
    }),
};

const customTheme = theme => ({
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
    disabled?: boolean;
    modelId: string;
    rowIdx: number;
    select: (modelId: string, colIdx: number, rowIdx: number, selection?: SELECTION_TYPES, resetValue?: boolean) => any;
    values: List<ValueDescriptor>;
    onCellModify?: () => any;
    filteredLookupValues?: List<string>;
    filteredLookupKeys?: List<any>;
}

export class LookupCell extends PureComponent<LookupCellProps> {
    isMultiValue = (): boolean => {
        return this.props.col.isJunctionLookup();
    };

    onInputChange = (
        fieldName: string,
        formValue: string | any[],
        items: any,
        selectedItems: Map<string, any>
    ): void => {
        const { colIdx, modelId, rowIdx, onCellModify } = this.props;
        if (this.isMultiValue()) {
            if (items.length == 0) {
                modifyCell(modelId, colIdx, rowIdx, undefined, MODIFICATION_TYPES.REMOVE_ALL);
            } else {
                const valueDescriptors = items.map(item => ({ raw: item.value, display: item.label }));
                modifyCell(modelId, colIdx, rowIdx, valueDescriptors, MODIFICATION_TYPES.REPLACE);
            }
        } else {
            modifyCell(
                modelId,
                colIdx,
                rowIdx,
                [
                    {
                        raw: items?.value,
                        display: items?.label,
                    },
                ],
                MODIFICATION_TYPES.REPLACE
            );
        }
        onCellModify?.();

        if (!this.isMultiValue()) {
            this.props.select(modelId, colIdx, rowIdx);
        }
    };

    render(): ReactNode {
        const { col, values, filteredLookupKeys, filteredLookupValues } = this.props;

        const rawValues = values
            .filter(vd => vd.raw !== undefined)
            .map(vd => vd.raw)
            .toArray();

        if (col.validValues) {
            return (
                <TextChoiceInput
                    autoFocus
                    queryColumn={col}
                    disabled={this.props.disabled}
                    containerClass="select-input-cell-container"
                    customTheme={customTheme}
                    customStyles={customStyles}
                    menuPosition="fixed" // note that there is an open issue related to scrolling when the menu is open: https://github.com/JedWatson/react-select/issues/4088
                    openMenuOnFocus={true}
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
        let queryFilters;
        if (filteredLookupValues) {
            queryFilters = List([Filter.create(lookup.displayColumn, filteredLookupValues.toArray(), Filter.Types.IN)]);
        }

        if (filteredLookupKeys) {
            queryFilters = List([Filter.create(lookup.keyColumn, filteredLookupKeys.toArray(), Filter.Types.IN)]);
        }

        return (
            <QuerySelect
                autoFocus
                disabled={this.props.disabled}
                queryFilters={queryFilters}
                multiple={isMultiple}
                schemaQuery={SchemaQuery.create(lookup.schemaName, lookup.queryName)}
                componentId={col.lookupKey}
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
                label={null}
                preLoad={true}
                value={isMultiple ? rawValues : rawValues[0]}
            />
        );
    }
}
