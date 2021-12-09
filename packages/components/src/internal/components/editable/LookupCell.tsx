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
import React, { ReactNode } from 'react';
import ReactN from 'reactn';
import { List, Map } from 'immutable';

import { modifyCell } from '../../actions';
import { LookupStore, ValueDescriptor } from '../../models';
import { LOOKUP_DEFAULT_SIZE, MODIFICATION_TYPES, SELECTION_TYPES } from '../../constants';
import { QueryColumn, QuerySelect, SchemaQuery } from '../../..';
import { GlobalAppState } from '../../global';

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

export class LookupCell extends ReactN.Component<LookupCellProps, undefined, GlobalAppState> {
    isMultiValue = (): boolean => {
        return this.props.col.isJunctionLookup();
    };

    onInputChange = (fieldName: string, formValue: string | any[], items: any, selectedItems: Map<string, any>): void => {
        const { colIdx, modelId, rowIdx, onCellModify } = this.props;
        if (this.isMultiValue())
        {
            if (items.length == 0) {
                modifyCell(
                    modelId,
                    colIdx,
                    rowIdx,
                    undefined,
                    MODIFICATION_TYPES.REMOVE_ALL
                );
            }
            else {
                const valueDescriptors = []
                for (let i = 0; i < items.length; i++) {
                    valueDescriptors.push({
                        raw: items[i].value,
                        display: items[i].label
                    });
                }
                modifyCell(
                    modelId,
                    colIdx,
                    rowIdx,
                    valueDescriptors,
                    MODIFICATION_TYPES.REPLACE
                );
            }
        } else {
            modifyCell(
                modelId,
                colIdx,
                rowIdx,
                [{
                    raw: items?.value,
                    display: items?.label
                }],
                MODIFICATION_TYPES.REPLACE
            );
        }
        if (onCellModify) onCellModify();

        if (!this.isMultiValue()) {
            this.props.select(modelId, colIdx, rowIdx);
            return;
        }
    };


    render(): ReactNode {
        const { col, values } = this.props;

        const lookup = col.lookup;
        const isMultiple = this.isMultiValue();
        lookup.keyColumn
        const rawValues = values.filter(vd => vd.raw !== undefined).map(vd => (
            vd.raw
        )).toArray()

        return (
            <QuerySelect
                autoFocus
                disabled={this.props.disabled}
                multiple={isMultiple}
                schemaQuery={SchemaQuery.create(lookup.schemaName, lookup.queryName)}
                componentId={LookupStore.key(col)}
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

