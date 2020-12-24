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
import { Checkbox, Input, Textarea } from 'formsy-react-components';

import { LabelOverlay } from '../LabelOverlay';
import {
    DateInput,
    DatePickerInput,
    MultiValueRenderer,
    AliasRenderer,
    AppendUnits,
    LookupSelectInput,
    QueryColumn,
    LabelColorRenderer,
} from '../../../..';

import { resolveDetailFieldValue, resolveRenderer } from '../renderers';

import { AssayRunReferenceRenderer } from '../../../renderers/AssayRunReferenceRenderer';

import { getUnFormattedNumber } from '../../../util/Date';

import { _defaultRenderer } from './DetailDisplay';

export function titleRenderer(col: QueryColumn): React.ReactNode {
    // If the column cannot be edited, return the label as is
    if (!col.isEditable()) {
        return <span className="field__un-editable">{col.caption}</span>;
    }

    return <LabelOverlay column={col} />;
}

export function resolveDetailEditRenderer(col: QueryColumn, useDatePicker: boolean): React.ReactNode {
    return data => {
        const editable = col.isEditable();

        // If the column cannot be edited, return as soon as possible
        // Render the value with the defaultRenderer and a class that grays it out
        if (!editable) {
            return <div className="field__un-editable">{_defaultRenderer(data)}</div>;
        }

        let value = resolveDetailFieldValue(data, false);

        if (col.inputRenderer) {
            const renderer = resolveRenderer(col);

            if (renderer) {
                return renderer(col, col.name, value, true);
            }

            throw new Error(`"${col.inputRenderer}" is not a valid inputRenderer.`);
        }

        if (col.isPublicLookup()) {
            // undefined 'displayAsLookup' just respects the lookup.
            // Must be explicitly false to prevent drop-down.
            if (col.displayAsLookup !== false) {
                // 29232: When displaying a lookup, always use the value
                const multiple = col.isJunctionLookup(),
                    joinValues = multiple && !col.isDataInput();
                return (
                    <LookupSelectInput
                        containerClass="form-group row"
                        inputClass="col-sm-12"
                        joinValues={joinValues}
                        key={col.name}
                        multiple={multiple}
                        queryColumn={col}
                        value={resolveDetailFieldValue(data, true)}
                        required={col.required}
                    />
                );
            }
        }

        if (col.inputType == 'textarea') {
            return (
                <Textarea
                    changeDebounceInterval={0}
                    cols={4}
                    elementWrapperClassName={[{ 'col-sm-9': false }, 'col-sm-12']}
                    name={col.name}
                    required={col.required}
                    rows={4}
                    validatePristine={true}
                    value={value}
                />
            );
        }

        switch (col.jsonType) {
            case 'boolean':
                // boolean checkbox state needs to be based off of the data value (not formattedValue)
                value = resolveDetailFieldValue(data, false, true);

                return (
                    <Checkbox
                        name={col.name}
                        required={col.required}
                        validatePristine={true}
                        value={value && value.toString().toLowerCase() === 'true'}
                    />
                );
            case 'date':
                if (useDatePicker && (!value || typeof value === 'string')) {
                    return (
                        <DatePickerInput
                            showLabel={false}
                            wrapperClassName="col-sm-12"
                            name={col.name}
                            queryColumn={col}
                            value={value}
                        />
                    );
                } else if (typeof value === 'string') {
                    return (
                        <DateInput
                            showLabel={false}
                            elementWrapperClassName={[{ 'col-sm-9': false }, 'col-sm-12']}
                            name={col.name}
                            queryColumn={col}
                            validatePristine={true}
                            value={value}
                        />
                    );
                }
            default:
                let validations, validationError;

                if (col.jsonType === 'int' || col.jsonType === 'float') {
                    const unformat = getUnFormattedNumber(value);
                    if (unformat !== undefined && unformat !== null) {
                        value = unformat.toString();
                    }
                    validations = col.jsonType === 'int' ? 'isInt' : 'isFloat';
                    validationError = 'Expected type: ' + col.jsonType;
                }

                return (
                    <Input
                        changeDebounceInterval={0}
                        type="text"
                        name={col.name}
                        validatePristine={true}
                        validations={validations}
                        validationError={validationError}
                        value={value}
                        required={col.required}
                        elementWrapperClassName={[{ 'col-sm-9': false }, 'col-sm-12']}
                    />
                );
        }
    };
}

export function resolveDetailRenderer(column: QueryColumn) {
    let renderer; // defaults to undefined -- leave it up to the details

    if (column && column.detailRenderer) {
        switch (column.detailRenderer.toLowerCase()) {
            case 'multivaluedetailrenderer':
                renderer = d => <MultiValueRenderer data={d} />;
                break;
            case 'aliasrenderer':
                renderer = d => <AliasRenderer data={d} view="detail" />;
                break;
            case 'appendunits':
                renderer = d => <AppendUnits data={d} col={column} />;
                break;
            case 'assayrunreference':
                renderer = d => <AssayRunReferenceRenderer data={d} />;
                break;
            case 'labelcolorrenderer':
                renderer = d => <LabelColorRenderer data={d} />;
                break;
            default:
                break;
        }
    }

    return renderer;
}
