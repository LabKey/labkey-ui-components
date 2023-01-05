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

import { LOOKUP_DEFAULT_SIZE, MODIFICATION_TYPES, SELECTION_TYPES } from '../../constants';
import { TextChoiceInput } from '../forms/input/TextChoiceInput';
import { QueryColumn } from '../../../public/QueryColumn';
import { QuerySelect } from '../forms/QuerySelect';
import { SelectInputChange } from '../forms/input/SelectInput';
import { ViewInfo } from '../../ViewInfo';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { getContainerFilterForLookups } from '../../query/api';

import { ValueDescriptor } from './models';

import { gridCellSelectInputProps, onCellSelectChange } from './utils';

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

    onSelectChange: SelectInputChange = (fieldName, formValue, selectedOptions, props_): void => {
        const { colIdx, modifyCell, rowIdx, select } = this.props;
        onCellSelectChange({ modifyCell, selectCell: select }, colIdx, rowIdx, selectedOptions, props_.multiple);
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
                    {...gridCellSelectInputProps}
                    autoFocus
                    disabled={disabled}
                    onChange={this.onSelectChange}
                    openMenuOnFocus
                    queryColumn={col}
                    value={rawValues[0]}
                />
            );
        }

        const lookup = col.lookup;
        const isMultiple = this.isMultiValue();
        let queryFilters: List<Filter.IFilter> = List();
        if (filteredLookupValues) {
            queryFilters = queryFilters.push(
                Filter.create(lookup.displayColumn, filteredLookupValues.toArray(), Filter.Types.IN)
            );
        }

        if (filteredLookupKeys) {
            queryFilters = queryFilters.push(
                Filter.create(lookup.keyColumn, filteredLookupKeys.toArray(), Filter.Types.IN)
            );
        }

        if (lookup.hasQueryFilters()) {
            queryFilters = queryFilters.push(...lookup.getQueryFilters());
        }

        return (
            <QuerySelect
                {...gridCellSelectInputProps}
                containerFilter={lookup.containerFilter ?? containerFilter ?? getContainerFilterForLookups()}
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
                openMenuOnFocus={!isMultiple} // If set to true for the multi-select case, it's not possible to tab out of the cell.
                onQSChange={this.onSelectChange}
                preLoad
                value={isMultiple ? rawValues : rawValues[0]}
            />
        );
    }
}
