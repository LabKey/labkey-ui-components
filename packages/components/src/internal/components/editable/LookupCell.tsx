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
import React, { FC, memo, useCallback, useMemo, KeyboardEvent } from 'react';
import { Filter, Query } from '@labkey/api';
import { List } from 'immutable';

import { QueryColumn } from '../../../public/QueryColumn';
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

import { getLookupFilters, gridCellSelectInputProps, onCellSelectChange } from './utils';

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
    containerPath?: string;
}

interface QueryLookupCellProps extends LookupCellProps {
    onSelectChange: SelectInputChange;
    rawValues: any[];
}

const QueryLookupCell: FC<QueryLookupCellProps> = memo(props => {
    const {
        col,
        containerFilter,
        disabled,
        defaultInputValue,
        filteredLookupKeys,
        filteredLookupValues,
        forUpdate,
        lookupValueFilters,
        onKeyDown,
        onSelectChange,
        rawValues,
        values,
        containerPath,
    } = props;
    const { columnRenderer, lookup } = col;
    const isMultiple = col.isJunctionLookup();

    const queryFilters = useMemo(() => {
        return List(
            getLookupFilters(
                col,
                filteredLookupKeys?.toArray(),
                filteredLookupValues?.toArray(),
                lookupValueFilters,
                forUpdate
            )
        );
    }, [col, filteredLookupKeys, filteredLookupValues, forUpdate, lookupValueFilters]);

    const schemaQuery = useMemo(
        () => new SchemaQuery(lookup.schemaQuery.schemaName, lookup.schemaQuery.queryName, ViewInfo.DETAIL_NAME),
        [lookup]
    );

    let selectValue = isMultiple ? rawValues : rawValues[0];

    // Issue 49502: Some column types have special handling of raw data, i.e. StoredAmount and Units
    if (columnRenderer) {
        const renderer = getQueryColumnRenderers()[columnRenderer.toLowerCase()];
        if (renderer?.getEditableRawValue) {
            selectValue = renderer.getEditableRawValue(values);
        }
    }

    return (
        <QuerySelect
            {...gridCellSelectInputProps}
            containerFilter={lookup.containerFilter ?? containerFilter ?? getContainerFilterForLookups()}
            containerPath={lookup.containerPath ?? containerPath}
            defaultInputValue={defaultInputValue}
            disabled={disabled}
            maxRows={LOOKUP_DEFAULT_SIZE}
            multiple={isMultiple}
            onKeyDown={onKeyDown}
            onQSChange={onSelectChange}
            preLoad
            queryFilters={queryFilters}
            schemaQuery={schemaQuery}
            value={selectValue}
        />
    );
});

QueryLookupCell.displayName = 'QueryLookupCell';

export const LookupCell: FC<LookupCellProps> = memo(props => {
    const { col, colIdx, disabled, modifyCell, onKeyDown, rowIdx, select, values } = props;

    const onSelectChange = useCallback<SelectInputChange>(
        (fieldName, formValue, options, props_) => {
            onCellSelectChange({ modifyCell, selectCell: select }, colIdx, rowIdx, options, props_.multiple);
        },
        [colIdx, modifyCell, rowIdx, select]
    );

    const rawValues = useMemo(
        () =>
            values
                .filter(vd => vd.raw !== undefined)
                .map(vd => vd.raw)
                .toArray(),
        [values]
    );

    if (col.validValues) {
        return (
            <TextChoiceInput
                {...gridCellSelectInputProps}
                autoFocus
                disabled={disabled}
                onChange={onSelectChange}
                onKeyDown={onKeyDown}
                queryColumn={col}
                value={rawValues[0]}
            />
        );
    }

    return <QueryLookupCell {...props} onSelectChange={onSelectChange} rawValues={rawValues} />;
});

LookupCell.displayName = 'LookupCell';
