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
import React, { KeyboardEvent, PureComponent, ReactNode } from 'react';
import { Filter, Query } from '@labkey/api';
import { List } from 'immutable';

import { Operation, QueryColumn } from '../../../public/QueryColumn';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { LOOKUP_DEFAULT_SIZE } from '../../constants';

import { getContainerFilterForLookups } from '../../query/api';
import { ViewInfo } from '../../ViewInfo';
import { SelectInputChange } from '../forms/input/SelectInput';
import { TextChoiceInput } from '../forms/input/TextChoiceInput';
import { QuerySelect } from '../forms/QuerySelect';

import { getQueryColumnRenderers } from '../../global';

import { MODIFICATION_TYPES, SELECTION_TYPES } from './constants';
import { ValueDescriptor } from './models';

import { gridCellSelectInputProps, onCellSelectChange } from './utils';

export interface LookupCellProps {
    col: QueryColumn;
    colIdx: number;
    containerFilter?: Query.ContainerFilter;
    defaultInputValue?: string;
    disabled?: boolean;
    filteredLookupKeys?: List<any>;
    filteredLookupValues?: List<string>;
    forUpdate: boolean;
    lookupValueFilters?: Filter.IFilter[];
    modifyCell: (colIdx: number, rowIdx: number, newValues: ValueDescriptor[], mod: MODIFICATION_TYPES) => void;
    onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
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
        const {
            col,
            containerFilter,
            defaultInputValue,
            disabled,
            filteredLookupKeys,
            filteredLookupValues,
            forUpdate,
            lookupValueFilters,
            onKeyDown,
            values,
        } = this.props;

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
                    onKeyDown={onKeyDown}
                    queryColumn={col}
                    value={rawValues[0]}
                />
            );
        }

        const lookup = col.lookup;
        const isMultiple = this.isMultiValue();
        let queryFilters: List<Filter.IFilter> = List();

        if (lookupValueFilters?.length > 0) queryFilters = queryFilters.push(...lookupValueFilters);

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

        const operation = forUpdate ? Operation.update : Operation.insert;
        if (lookup.hasQueryFilters(operation)) {
            queryFilters = queryFilters.push(...lookup.getQueryFilters(operation));
        }

        let selectValue = isMultiple ? rawValues : rawValues[0];

        // Some column types have special handling of raw data, i.e. StoredAmount and Units (issue 49502)
        if (col.columnRenderer) {
            const renderer = getQueryColumnRenderers()[col.columnRenderer.toLowerCase()];
            if (renderer?.getEditableRawValue) {
                selectValue = renderer.getEditableRawValue(values);
            }
        }

        return (
            <QuerySelect
                {...gridCellSelectInputProps}
                containerFilter={lookup.containerFilter ?? containerFilter ?? getContainerFilterForLookups()}
                containerPath={lookup.containerPath}
                disabled={disabled}
                defaultInputValue={defaultInputValue}
                maxRows={LOOKUP_DEFAULT_SIZE}
                multiple={isMultiple}
                onKeyDown={onKeyDown}
                onQSChange={this.onSelectChange}
                preLoad
                queryFilters={queryFilters}
                // use detail view to assure we get values that may have been filtered out in the default view
                schemaQuery={
                    new SchemaQuery(lookup.schemaQuery.schemaName, lookup.schemaQuery.queryName, ViewInfo.DETAIL_NAME)
                }
                value={selectValue}
            />
        );
    }
}
