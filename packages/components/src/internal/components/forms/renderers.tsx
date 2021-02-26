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
import React from 'react';
import { List, Map } from 'immutable';
import { Input } from 'formsy-react-components';

import { QueryColumn } from '../../..';

import { LabelOverlay } from './LabelOverlay';
import { AliasInput } from './input/AliasInput';

export function resolveRenderer(column: QueryColumn) {
    let inputRenderer;

    if (column?.inputRenderer) {
        switch (column.inputRenderer.toLowerCase()) {
            case 'experimentalias':
                inputRenderer = (
                    col: QueryColumn,
                    key: any,
                    value?: string,
                    editing?: boolean,
                    allowFieldDisable = false,
                    initiallyDisabled = false,
                    onToggleDisable?: (disabled: boolean) => void
                ) => {
                    return (
                        <AliasInput
                            col={col}
                            editing={editing}
                            key={key}
                            value={value}
                            allowDisable={allowFieldDisable}
                            initiallyDisabled={initiallyDisabled}
                            onToggleDisable={onToggleDisable}
                        />
                    );
                };
                break;
            case 'appendunitsinput':
                inputRenderer = (
                    col: QueryColumn,
                    key: any,
                    val?: string,
                    editing?: boolean,
                    allowFieldDisable = false,
                    initiallyDisabled = false
                ) => {
                    return (
                        <Input
                            allowDisable={allowFieldDisable}
                            disabled={initiallyDisabled}
                            addonAfter={<span>{col.units}</span>}
                            changeDebounceInterval={0}
                            elementWrapperClassName={editing ? [{ 'col-sm-9': false }, 'col-sm-12'] : undefined}
                            id={col.name}
                            key={key}
                            label={<LabelOverlay column={col} inputId={col.name} />}
                            labelClassName="control-label text-left"
                            name={col.name}
                            required={col.required}
                            type="text"
                            value={val}
                            validations="isNumericWithError"
                        />
                    );
                };
                break;
            default:
                break;
        }
    }

    return inputRenderer;
}

interface FieldValue {
    displayValue?: any;
    formattedValue?: any;
    value: any;
}

type FieldArray = FieldValue[];
type FieldMap = Map<string, any>;
type FieldList = List<FieldMap>;

const isFieldList = (value: any): value is FieldList => List.isList(value);

const isFieldArray = (value: any): value is FieldArray => Array.isArray(value);

const isFieldMap = (value: any): value is FieldMap => Map.isMap(value);

const resolveFieldValue = (data: FieldValue, lookup?: boolean, ignoreFormattedValue?: boolean): string => {
    if (!ignoreFormattedValue && data.hasOwnProperty('formattedValue')) {
        return data.formattedValue;
    }

    const o = lookup !== true && data.hasOwnProperty('displayValue') ? data.displayValue : data.value;
    return o !== null && o !== undefined ? o : undefined;
};

export function resolveDetailFieldValue(
    data: FieldList | FieldArray | FieldMap | FieldValue,
    lookup?: boolean,
    ignoreFormattedValue?: boolean
): string | string[] {
    if (data) {
        if (isFieldList(data) && data.size) {
            return data.toJS().map(d => resolveFieldValue(d, lookup, ignoreFormattedValue));
        } else if (isFieldArray(data) && data.length) {
            return data.map(d => resolveFieldValue(d, lookup, ignoreFormattedValue));
        } else if (isFieldMap(data)) {
            return resolveFieldValue(data.toJS(), lookup, ignoreFormattedValue);
        }

        return resolveFieldValue(data as FieldValue, lookup, ignoreFormattedValue);
    }

    return undefined;
}
