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

import { QueryColumn } from '../base/models/model';

import { LabelOverlay } from './LabelOverlay';
import { AliasInput } from './input/AliasInput';

export function resolveRenderer(column: QueryColumn) {
    let inputRenderer;

    if (column && column.inputRenderer) {
        switch (column.inputRenderer.toLowerCase()) {
            case 'experimentalias':
                inputRenderer = (
                    col: QueryColumn,
                    key: any,
                    value?: string,
                    editing?: boolean,
                    allowFieldDisable = false
                ) => {
                    return (
                        <AliasInput
                            col={col}
                            editing={editing}
                            key={key}
                            value={value}
                            allowDisable={allowFieldDisable}
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
                    allowFieldDisable = false
                ) => {
                    return (
                        <Input
                            allowDisable={allowFieldDisable}
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

function findValue(data: Map<string, any>, lookup?: boolean) {
    return data.has('displayValue') && lookup !== true ? data.get('displayValue') : data.get('value');
}

export function resolveDetailFieldValue(
    data: any,
    lookup?: boolean,
    ignoreFormattedValue?: boolean
): string | string[] {
    let value;

    if (data) {
        if (List.isList(data) && data.size) {
            value = data
                .map(d => {
                    if (!ignoreFormattedValue && d.has('formattedValue')) {
                        return d.get('formattedValue');
                    }

                    const o = findValue(d, lookup);
                    return o !== null && o !== undefined ? o : undefined;
                })
                .toArray();
        } else if (!ignoreFormattedValue && data.has('formattedValue')) {
            value = data.get('formattedValue');
        } else {
            const o = findValue(data, lookup);
            value = o !== null && o !== undefined ? o : undefined;
        }
    }

    // avoid setting value to 'null' use 'undefined' instead
    return value === null ? undefined : value;
}
