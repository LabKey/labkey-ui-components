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

import { LabelOverlay } from './LabelOverlay';
import { SelectInput } from './input/SelectInput';
import { QueryColumn } from '../base/models/model';
import { generateId } from '../../util/utils';

interface AliasInputProps {
    col: QueryColumn
    editing?: boolean
    value?: string
    allowDisable?: boolean
}

class AliasInput extends React.Component<AliasInputProps, any> {

    _id: string;

    constructor(props: AliasInputProps) {
        super(props);

        this._id = generateId();
    }

    render() {
        const { allowDisable, col, editing, value } = this.props;

        return <SelectInput
            allowDisable={allowDisable}
            showLabel={true}
            addLabelText="Press enter to add '{label}'"
            allowCreate={true}
            id={this._id}
            inputClass={editing ? 'col-sm-12' : undefined}
            joinValues={true}
            label={col.caption}
            required={col.required}
            multiple={true}
            name={col.name}
            noResultsText="Enter alias name(s)"
            placeholder="Enter alias name(s)"
            promptTextCreator={(text: string) => `Create alias "${text}"`}
            saveOnBlur={true}
            value={value}
        />;
    }
}

export function resolveRenderer(column: QueryColumn) {

    let inputRenderer;

    if (column && column.inputRenderer) {
        switch (column.inputRenderer.toLowerCase()) {
            case 'experimentalias':
                inputRenderer = (col: QueryColumn, key: any, value?: string, editing?: boolean, allowFieldDisable: boolean = false) => {
                    return <AliasInput col={col} editing={editing} key={key} value={value} allowDisable={allowFieldDisable}/>;
                };
                break;
            case 'appendunitsinput':
                inputRenderer = (col: QueryColumn, key: any, val?: string, editing?: boolean, allowFieldDisable: boolean = false) => {
                    return <Input
                                allowDisable={allowFieldDisable}
                                addonAfter={<span>{col.units}</span>}
                                changeDebounceInterval={0}
                                elementWrapperClassName={editing ? [{"col-sm-9": false}, "col-sm-12"] : undefined}
                                id={col.name}
                                key={key}
                                label={<LabelOverlay column={col} inputId={col.name}/>}
                                labelClassName="control-label text-left"
                                name={col.name}
                                required={col.required}
                                type="text"
                                value={val}
                                validations='isNumericWithError'/>;
                };
                break;
            default:
                break;
        }
    }

    return inputRenderer;
}

function findValue(data: Map<string, any>, lookup?: boolean) {
    return data.has('displayValue') && lookup !== true ? data.get('displayValue') : data.get('value')
}

export function resolveDetailFieldValue(data: any, lookup?: boolean): string | Array<string> {
    let value;

    if (data) {
        if (List.isList(data) && data.size) {
            value = data.map(d => {
                if (d.has('formattedValue')) {
                    return d.get('formattedValue');
                }

                let o = findValue(d, lookup);
                return o !== null && o !== undefined ? o : undefined;
            }).toArray();
        }
        else if (data.has('formattedValue')) {
            value = data.get('formattedValue');
        }
        else {
            let o = findValue(data, lookup);
            value = o !== null && o !== undefined ? o : undefined;
        }
    }

    // avoid setting value to 'null' use 'undefined' instead
    return value === null ? undefined : value;
}
