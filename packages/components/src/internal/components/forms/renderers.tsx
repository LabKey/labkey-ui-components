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
import React, { FC, memo, ReactNode, useEffect } from 'react';
import { Query } from '@labkey/api';
import { Input } from 'formsy-react-components';
import { addValidationRule, validationRules } from 'formsy-react';

import { Map, List } from 'immutable';

import { QueryColumn } from '../../../public/QueryColumn';

import { encodePart } from '../../../public/SchemaQuery';

import { AssayTaskInput } from './input/AssayTaskInput';

import { LabelOverlay } from './LabelOverlay';
import { AliasInput } from './input/AliasInput';
import { SampleStatusInput } from './input/SampleStatusInput';

const ASSAY_ID_INDEX = 'Protocol/RowId';

// TODO: Rethink how this is resolved. The input renderer should not be responsible for processing this data.
function resolveAssayId(data: any): any {
    // Used in multiple contexts so need to check various data formats
    let assayId = Map.isMap(data) ? data.get(ASSAY_ID_INDEX) : data[ASSAY_ID_INDEX];
    if (!assayId) {
        assayId = Map.isMap(data) ? data.get(encodePart(ASSAY_ID_INDEX)) : data[encodePart(ASSAY_ID_INDEX)];
    }
    if (List.isList(assayId)) {
        assayId = assayId.get(0);
    }
    return assayId?.get?.('value') ?? assayId?.value ?? assayId;
}

interface InputRendererProps {
    allowFieldDisable?: boolean;
    col: QueryColumn;
    containerFilter?: Query.ContainerFilter;
    containerPath?: string;
    // The data for the entire row/form section
    data: any;
    initiallyDisabled?: boolean;
    inputClass?: string;
    // Indicates whether or not the input is being rendered inside an EditableDetailPanel
    isDetailInput?: boolean;
    // Indicates whether or not the input is being rendered inside an EditableGrid
    isGridInput?: boolean;
    onAdditionalFormDataChange?: (name: string, value: any) => void;
    onQSChange?: (name: string, value: string | any[], items: any) => void;
    onToggleDisable?: (disabled: boolean) => void;
    renderLabelField?: (col: QueryColumn) => ReactNode;
    showAsteriskSymbol?: boolean;
    value: any;
}

export const InputRenderer: FC<InputRendererProps> = memo(props => {
    const {
        allowFieldDisable = false,
        col,
        containerFilter,
        containerPath,
        data,
        isDetailInput = false,
        isGridInput = false,
        initiallyDisabled = false,
        inputClass,
        onAdditionalFormDataChange,
        onQSChange,
        onToggleDisable,
        renderLabelField,
        showAsteriskSymbol,
        value,
    } = props;

    useEffect(() => {
        // Issue 23462: Global Formsy validation rule for numbers
        if (!validationRules.isNumericWithError) {
            addValidationRule(
                'isNumericWithError',
                (values: any, v: string | number) => validationRules.isNumeric(values, v) || 'Please enter a number.'
            );
        }
    }, []);

    if (!col.inputRenderer) {
        return null;
    }

    switch (col.inputRenderer.toLowerCase()) {
        case 'appendunitsinput':
            return (
                <Input
                    allowDisable={allowFieldDisable}
                    disabled={initiallyDisabled}
                    addonAfter={<span>{col.units}</span>}
                    changeDebounceInterval={0}
                    elementWrapperClassName={isDetailInput ? [{ 'col-sm-9': false }, 'col-sm-12'] : undefined}
                    id={col.name}
                    label={<LabelOverlay column={col} inputId={col.name} />}
                    labelClassName="control-label text-left"
                    name={col.name}
                    required={col.required}
                    type="text"
                    value={value}
                    validations="isNumericWithError"
                />
            );
        case 'experimentalias':
            return (
                <AliasInput
                    col={col}
                    data={data}
                    isDetailInput={isDetailInput}
                    allowDisable={allowFieldDisable}
                    initiallyDisabled={initiallyDisabled}
                    onToggleDisable={onToggleDisable}
                />
            );
        case 'samplestatusinput':
            return (
                <SampleStatusInput
                    addLabelAsterisk={showAsteriskSymbol}
                    col={col}
                    data={data}
                    value={value}
                    allowDisable={allowFieldDisable}
                    initiallyDisabled={initiallyDisabled}
                    onToggleDisable={onToggleDisable}
                    onQSChange={onQSChange}
                    renderLabelField={renderLabelField}
                    onAdditionalFormDataChange={onAdditionalFormDataChange}
                    inputClass={inputClass}
                    containerFilter={containerFilter}
                    containerPath={containerPath}
                    isGridInput={isGridInput}
                />
            );
        case 'workflowtask':
            return (
                <AssayTaskInput
                    assayId={resolveAssayId(data)}
                    isDetailInput={isDetailInput}
                    name={col.name}
                    value={value}
                    allowDisable={allowFieldDisable}
                    initiallyDisabled={initiallyDisabled}
                    onToggleDisable={onToggleDisable}
                    onChange={onQSChange}
                    isGridInput={isGridInput}
                />
            );
        default:
            throw new Error(`InputRenderer: Does not support the inputRenderer "${col.inputRenderer}"`);
    }
});

InputRenderer.displayName = 'InputRenderer';
