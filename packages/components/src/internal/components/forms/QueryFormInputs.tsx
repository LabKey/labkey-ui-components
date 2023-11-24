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
import { List, Map } from 'immutable';
import { Filter, Query } from '@labkey/api';

import { ExtendedMap } from '../../../public/ExtendedMap';

import { insertColumnFilter, Operation, QueryColumn } from '../../../public/QueryColumn';

import { QueryInfo } from '../../../public/QueryInfo';

import { caseInsensitive } from '../../util/utils';

import { FormsyInput } from './input/FormsyReactComponents';
import { resolveInputRenderer } from './input/InputRenderFactory';
import { QuerySelect } from './QuerySelect';
import { SelectInputChange } from './input/SelectInput';
import { TextInput } from './input/TextInput';
import { CheckboxInput } from './input/CheckboxInput';
import { TextAreaInput } from './input/TextAreaInput';
import { FileInput } from './input/FileInput';
import { DatePickerInput } from './input/DatePickerInput';
import { TextChoiceInput } from './input/TextChoiceInput';

import { getQueryFormLabelFieldName, isQueryFormLabelField } from './utils';

export interface QueryFormInputsProps {
    allowFieldDisable?: boolean;
    // this can be used when you want a form to supply a set of values to populate a grid, which will be filled in with additional data
    // (e.g., if you want to generate a set of samples with common properties but need to provide the individual, unique ids)
    checkRequiredFields?: boolean;
    columnFilter?: (col?: QueryColumn) => boolean;
    // this can be used when you want to keep certain columns always filtered out (e.g., aliquot- or sample-only columns)
    isIncludedColumn?: (col: QueryColumn) => boolean;
    componentKey?: string; // unique key to add to QuerySelect to avoid duplication w/ transpose
    /** A container filter that will be applied to all query-based inputs in this form */
    containerFilter?: Query.ContainerFilter;
    disabledFields?: List<string>;
    fieldValues?: any;
    fireQSChangeOnInit?: boolean;
    includeLabelField?: boolean;
    initiallyDisableFields?: boolean;
    lookups?: Map<string, number>;
    onAdditionalFormDataChange?: (name: string, value: any) => void;
    onFieldsEnabledChange?: (numEnabled: number) => void;
    operation?: Operation;
    onSelectChange?: SelectInputChange;
    queryColumns?: ExtendedMap<string, QueryColumn>;
    queryFilters?: Record<string, List<Filter.IFilter>>;
    queryInfo?: QueryInfo;
    renderFieldLabel?: (queryColumn: QueryColumn, label?: string, description?: string) => ReactNode;
    renderFileInputs?: boolean;
    // only used if checkRequiredFields is false, to show * for fields that are originally required
    showLabelAsterisk?: boolean;
}

interface State {
    labels: any;
}

// TODO: Merge this functionality with resolveDetailEditRenderer()
export class QueryFormInputs extends React.Component<QueryFormInputsProps, State> {
    static defaultProps: Partial<QueryFormInputsProps> = {
        checkRequiredFields: true,
        includeLabelField: false,
        renderFileInputs: false,
        allowFieldDisable: false,
        initiallyDisableFields: false,
        disabledFields: List<string>(),
    };

    private _fieldEnabledCount = 0;

    constructor(props: QueryFormInputsProps) {
        super(props);

        const { queryInfo, queryColumns } = this.props;

        if (!queryInfo && !queryColumns) {
            throw new Error('QueryFormInputs: If queryInfo is not provided, queryColumns is required.');
        }

        this.state = {
            labels: {},
        };
    }

    static cleanValues(fieldValues: any, customValues?: any): any {
        const cleanValues = { ...fieldValues, ...customValues };

        return Object.keys(cleanValues)
            .filter(fieldKey => !isQueryFormLabelField(fieldKey))
            .reduce((newFieldValues, fieldKey) => {
                newFieldValues[fieldKey] = cleanValues[fieldKey];
                return newFieldValues;
            }, {});
    }

    onSelectChange: SelectInputChange = (name, value, selectedOptions, props): void => {
        const { includeLabelField } = this.props;

        if (includeLabelField) {
            const allItems = Array.isArray(selectedOptions) ? selectedOptions : [selectedOptions];

            this.setState((prevState: State) => ({
                labels: {
                    ...prevState.labels,
                    ...{
                        [getQueryFormLabelFieldName(name)]: allItems
                            .map(item => (item ? item.label : '(label not found)'))
                            .join(', '),
                    },
                },
            }));
        }

        this.props.onSelectChange?.(name, value, selectedOptions, props);
    };

    onToggleDisable = (disabled: boolean): void => {
        if (disabled) {
            this._fieldEnabledCount--;
        } else {
            this._fieldEnabledCount++;
        }
        this.props.onFieldsEnabledChange?.(this._fieldEnabledCount);
    };

    renderLabelField = (col: QueryColumn): ReactNode => {
        const { includeLabelField } = this.props;

        if (includeLabelField) {
            const fieldName = getQueryFormLabelFieldName(col.name);
            return <FormsyInput name={fieldName} type="hidden" value={this.state.labels[fieldName]} />;
        }

        return null;
    };

    render() {
        const {
            columnFilter,
            containerFilter,
            fieldValues,
            fireQSChangeOnInit,
            checkRequiredFields,
            showLabelAsterisk,
            initiallyDisableFields,
            lookups,
            operation,
            queryColumns,
            queryInfo,
            renderFileInputs,
            allowFieldDisable,
            disabledFields,
            renderFieldLabel,
            onAdditionalFormDataChange,
            queryFilters,
        } = this.props;

        const filter = columnFilter ?? insertColumnFilter;
        const columns = queryInfo ? queryInfo.columns : queryColumns;

        // CONSIDER: separately establishing the set of columns and allow
        // QueryFormInputs to be a rendering factory for the columns that are in the set.
        if (columns) {
            return columns.valueArray
                .filter(col => filter(col))
                .map((col, i) => {
                    const shouldDisableField =
                        initiallyDisableFields || disabledFields.contains(col.name.toLowerCase());
                    if (!shouldDisableField) {
                        this._fieldEnabledCount++;
                    }
                    let showAsteriskSymbol = false;
                    if (!checkRequiredFields && col.required) {
                        col = col.mutate({ required: false });
                        showAsteriskSymbol = showLabelAsterisk;
                    }

                    let value = caseInsensitive(fieldValues, col.name);
                    if (!value && lookups) {
                        value = lookups.get(col.name) || lookups.get(col.name.toLowerCase());
                    }
                    if (!value && col.jsonType === 'string') {
                        value = '';
                    }

                    if (!value && col.jsonType === 'boolean') {
                        value = false;
                    }

                    const ColumnInputRenderer = resolveInputRenderer(col);
                    if (ColumnInputRenderer) {
                        return (
                            <ColumnInputRenderer
                                allowFieldDisable={allowFieldDisable}
                                col={col}
                                data={fieldValues}
                                formsy
                                initiallyDisabled={shouldDisableField}
                                key={i}
                                onAdditionalFormDataChange={onAdditionalFormDataChange}
                                onSelectChange={this.onSelectChange}
                                onToggleDisable={this.onToggleDisable}
                                renderLabelField={this.renderLabelField}
                                showAsteriskSymbol={showAsteriskSymbol}
                                showLabel
                                value={value}
                            />
                        );
                    }

                    if (col.isPublicLookup()) {
                        // undefined 'displayAsLookup' just respects the lookup.
                        // Must be explicitly false to prevent drop-down.
                        if (col.displayAsLookup !== false) {
                            const multiple = col.isJunctionLookup();
                            const joinValues = multiple;
                            const queryFilter = col.lookup.hasQueryFilters(operation)
                                ? List(col.lookup.getQueryFilters(operation))
                                : queryFilters?.[col.fieldKey];
                            return (
                                <React.Fragment key={i}>
                                    {this.renderLabelField(col)}
                                    <QuerySelect
                                        addLabelAsterisk={showAsteriskSymbol}
                                        allowDisable={allowFieldDisable}
                                        containerFilter={col.lookup.containerFilter ?? containerFilter}
                                        containerPath={col.lookup.containerPath}
                                        description={col.description}
                                        displayColumn={col.lookup.displayColumn}
                                        fireQSChangeOnInit={fireQSChangeOnInit}
                                        formsy
                                        initiallyDisabled={shouldDisableField}
                                        joinValues={joinValues}
                                        label={col.caption}
                                        loadOnFocus
                                        maxRows={10}
                                        multiple={multiple}
                                        name={col.fieldKey}
                                        onQSChange={this.onSelectChange}
                                        onToggleDisable={this.onToggleDisable}
                                        placeholder="Select or type to search..."
                                        queryFilters={queryFilter}
                                        renderFieldLabel={renderFieldLabel}
                                        required={col.required}
                                        schemaQuery={col.lookup.schemaQuery}
                                        showLabel
                                        value={value}
                                        valueColumn={col.lookup.keyColumn}
                                    />
                                </React.Fragment>
                            );
                        }
                    }

                    if (col.validValues) {
                        return (
                            <TextChoiceInput
                                addLabelAsterisk={showAsteriskSymbol}
                                allowDisable={allowFieldDisable}
                                formsy
                                initiallyDisabled={shouldDisableField}
                                key={i}
                                onChange={this.onSelectChange}
                                onToggleDisable={this.onToggleDisable}
                                placeholder="Select or type to search..."
                                queryColumn={col}
                                renderFieldLabel={renderFieldLabel}
                                value={value}
                            />
                        );
                    }

                    if (col.inputType === 'textarea') {
                        return (
                            <TextAreaInput
                                key={i}
                                queryColumn={col}
                                value={value}
                                allowDisable={allowFieldDisable}
                                initiallyDisabled={shouldDisableField}
                                onToggleDisable={this.onToggleDisable}
                                addLabelAsterisk={showAsteriskSymbol}
                                renderFieldLabel={renderFieldLabel}
                            />
                        );
                    } else if (col.inputType === 'file' && renderFileInputs) {
                        return (
                            <FileInput
                                formsy
                                key={i}
                                queryColumn={col}
                                initialValue={value}
                                name={col.fieldKey}
                                allowDisable={allowFieldDisable}
                                initiallyDisabled={shouldDisableField}
                                onToggleDisable={this.onToggleDisable}
                                addLabelAsterisk={showAsteriskSymbol}
                                renderFieldLabel={renderFieldLabel}
                                showLabel
                            />
                        );
                    }
                    switch (col.jsonType) {
                        case 'date':
                            return (
                                <DatePickerInput
                                    key={i}
                                    queryColumn={col}
                                    value={value}
                                    initValueFormatted={false}
                                    allowDisable={allowFieldDisable}
                                    initiallyDisabled={shouldDisableField}
                                    onToggleDisable={this.onToggleDisable}
                                    addLabelAsterisk={showAsteriskSymbol}
                                    renderFieldLabel={renderFieldLabel}
                                />
                            );
                        case 'boolean':
                            return (
                                <CheckboxInput
                                    key={i}
                                    queryColumn={col}
                                    value={value}
                                    allowDisable={allowFieldDisable}
                                    initiallyDisabled={shouldDisableField}
                                    onToggleDisable={this.onToggleDisable}
                                    addLabelAsterisk={showAsteriskSymbol}
                                    renderFieldLabel={renderFieldLabel}
                                />
                            );
                        default:
                            return (
                                <TextInput
                                    key={i}
                                    queryColumn={col}
                                    value={value ? String(value) : value}
                                    allowDisable={allowFieldDisable}
                                    initiallyDisabled={shouldDisableField}
                                    onToggleDisable={this.onToggleDisable}
                                    addLabelAsterisk={showAsteriskSymbol}
                                    renderFieldLabel={renderFieldLabel}
                                />
                            );
                    }
                });
        }
    }
}
