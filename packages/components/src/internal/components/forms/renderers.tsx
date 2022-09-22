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
import React, { ReactNode, ReactText } from 'react';
import { Query } from '@labkey/api';
import { Input } from 'formsy-react-components';
import { addValidationRule, validationRules } from 'formsy-react';

import { QueryColumn } from '../../../public/QueryColumn';

import { AssayTaskInput } from './input/AssayTaskInput';

import { LabelOverlay } from './LabelOverlay';
import { AliasInput } from './input/AliasInput';
import { SampleStatusInput } from './input/SampleStatusInput';
import { Map } from "immutable";
import { encodePart } from "../../../public/SchemaQuery";

type InputRenderer = (
    col: QueryColumn,
    key: ReactText,
    data: any, // The data for the entire row/form section
    value: any,
    isDetailInput: boolean, // Indicates whether or not the input is being rendered inside an EditableDetailPanel
    allowFieldDisable?: boolean,
    initiallyDisabled?: boolean,
    onToggleDisable?: (disabled: boolean) => void,
    onQSChange?: (name: string, value: string | any[], items: any) => void,
    renderLabelField?: (col: QueryColumn) => ReactNode,
    showAsteriskSymbol?: boolean,
    onAdditionalFormDataChange?: (name: string, value: any) => any,
    inputClass?: string,
    containerPath?: string,
    containerFilter?: Query.ContainerFilter,
    isGridInput?: boolean
) => ReactNode;

const AliasInputRenderer: InputRenderer = (
    col: QueryColumn,
    key: ReactText,
    data: any,
    value: any,
    isDetailInput: boolean,
    allowFieldDisable = false,
    initiallyDisabled = false,
    onToggleDisable?: (disabled: boolean) => void
) => (
    <AliasInput
        col={col}
        data={data}
        isDetailInput={isDetailInput}
        key={key}
        allowDisable={allowFieldDisable}
        initiallyDisabled={initiallyDisabled}
        onToggleDisable={onToggleDisable}
    />
);

const AppendUnitsInputRenderer: InputRenderer = (
    col: QueryColumn,
    key: ReactText,
    data: any,
    value: any,
    isDetailInput: boolean,
    allowFieldDisable = false,
    initiallyDisabled = false
) => (
    <Input
        allowDisable={allowFieldDisable}
        disabled={initiallyDisabled}
        addonAfter={<span>{col.units}</span>}
        changeDebounceInterval={0}
        elementWrapperClassName={isDetailInput ? [{ 'col-sm-9': false }, 'col-sm-12'] : undefined}
        id={col.name}
        key={key}
        label={<LabelOverlay column={col} inputId={col.name} />}
        labelClassName="control-label text-left"
        name={col.name}
        required={col.required}
        type="text"
        value={value}
        validations="isNumericWithError"
    />
);

const SampleStatusInputRenderer: InputRenderer = (
    col: QueryColumn,
    key: ReactText,
    data: any, // The data for the entire row/form section
    value: any,
    isDetailInput: boolean, // Indicates whether or not the input is being rendered inside an EditableDetailPanel, always false for SampleStatusInputRenderer
    allowFieldDisable?: boolean,
    initiallyDisabled?: boolean,
    onToggleDisable?: (disabled: boolean) => void,
    onQSChange?: (name: string, value: string | any[], items: any) => void,
    renderLabelField?: (col: QueryColumn) => ReactNode,
    showAsteriskSymbol?: boolean,
    onAdditionalFormDataChange?: (name: string, value: any) => any,
    inputClass?: string,
    containerPath?: string,
    containerFilter?: Query.ContainerFilter
) => {
    return (
        <SampleStatusInput
            col={col}
            key={key}
            data={data}
            value={value}
            allowDisable={allowFieldDisable}
            initiallyDisabled={initiallyDisabled}
            onToggleDisable={onToggleDisable}
            onQSChange={onQSChange}
            renderLabelField={renderLabelField}
            showAsteriskSymbol={showAsteriskSymbol}
            onAdditionalFormDataChange={onAdditionalFormDataChange}
            inputClass={inputClass}
            containerFilter={containerFilter}
            containerPath={containerPath}
        />
    );
};

const ASSAY_ID_INDEX = 'Protocol/RowId';

const AssayTaskInputRenderer: InputRenderer = (
    col: QueryColumn,
    key: ReactText,
    data: any,
    value: any,
    isDetailInput: boolean,
    allowFieldDisable?: boolean,
    initiallyDisabled?: boolean,
    onToggleDisable?: (disabled: boolean) => void,
    onQSChange?: (name: string, value: string | any[], items: any) => void,
    renderLabelField?: (col: QueryColumn) => ReactNode,
    showAsteriskSymbol?: boolean,
    onAdditionalFormDataChange?: (name: string, value: any) => any,
    inputClass?: string,
    containerPath?: string,
    containerFilter?: Query.ContainerFilter,
    isGridInput?: boolean
) =>
{
    // Used in multiple contexts so need to check various data formats
    let assayId = Map.isMap(data) ? data.get(ASSAY_ID_INDEX) : data[ASSAY_ID_INDEX];
    if (!assayId)
        assayId = Map.isMap(data) ? data.get(encodePart(ASSAY_ID_INDEX)) : data[encodePart(ASSAY_ID_INDEX)];
    assayId = assayId?.value ?? assayId;

    return <AssayTaskInput
        assayId={assayId}
        isDetailInput={isDetailInput}
        name={col.name}
        value={value}
        allowFieldDisable={allowFieldDisable}
        initiallyDisabled={initiallyDisabled}
        onToggleDisable={onToggleDisable}
        onChange={onQSChange}
        isGridInput={isGridInput}
    />
}

export function resolveRenderer(column: QueryColumn): InputRenderer {
    // 23462: Global Formsy validation rule for numbers
    if (!validationRules.isNumericWithError) {
        addValidationRule('isNumericWithError', (values: any, value: string | number) => {
            return validationRules.isNumeric(values, value) || 'Please enter a number.';
        });
    }

    if (column?.inputRenderer) {
        switch (column.inputRenderer.toLowerCase()) {
            case 'experimentalias':
                return AliasInputRenderer;
            case 'appendunitsinput':
                return AppendUnitsInputRenderer;
            case 'workflowtask':
                return AssayTaskInputRenderer;
            case 'samplestatusinput':
                return SampleStatusInputRenderer;
            default:
                break;
        }
    }

    return undefined;
}
