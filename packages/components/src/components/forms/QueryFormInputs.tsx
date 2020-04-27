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
import { List, Map, OrderedMap } from 'immutable';
import { Input } from 'formsy-react-components';
import { Utils } from '@labkey/api';

import { initLookup } from '../../actions';

import { QueryInfo } from '../base/models/QueryInfo';

import { insertColumnFilter, QueryColumn, SchemaQuery } from '../base/models/model';

import { caseInsensitive } from '../../util/utils';

import { resolveRenderer } from './renderers';
import { QuerySelect } from './QuerySelect';
import { TextInput } from './input/TextInput';
import { DateInput } from './input/DateInput';
import { CheckboxInput } from './input/CheckboxInput';
import { TextAreaInput } from './input/TextAreaInput';
import { FileInput } from './input/FileInput';

import { DatePickerInput } from './input/DatePickerInput';

const LABEL_FIELD_SUFFIX = '::label';

export const getQueryFormLabelFieldName = function (name: string): string {
    return name + LABEL_FIELD_SUFFIX;
};

export const isQueryFormLabelField = function (name: string): boolean {
    return name.endsWith(LABEL_FIELD_SUFFIX);
};

export const getFieldEnabledFieldName = function (column: QueryColumn, fieldName?: string): string {
    const name = fieldName ? fieldName : column ? column.fieldKey : 'unknownField';
    return name + '::enabled';
};

interface QueryFormInputsProps {
    columnFilter?: (col?: QueryColumn) => boolean;
    componentKey?: string; // unique key to add to QuerySelect to avoid duplication w/ transpose
    destroyOnDismount?: boolean;
    fieldValues?: any;
    fireQSChangeOnInit?: boolean;
    checkRequiredFields?: boolean;
    showLabelAsterisk?: boolean; // only used if checkRequiredFields is false, to show * for fields that are originally required
    includeLabelField?: boolean;
    onQSChange?: (name: string, value: string | any[], items: any) => any;
    queryColumns?: OrderedMap<string, QueryColumn>;
    queryInfo?: QueryInfo;
    lookups?: Map<string, number>;
    onChange?: Function;
    renderFileInputs?: boolean;
    allowFieldDisable?: boolean;
    onFieldsEnabledChange?: (numEnabled: number) => void;
    initiallyDisableFields?: boolean;
    useDatePicker?: boolean;
    disabledFields?: List<string>;
}

interface State {
    labels: any;
}

export class QueryFormInputs extends React.Component<QueryFormInputsProps, State> {
    static defaultProps: Partial<QueryFormInputsProps> = {
        checkRequiredFields: true,
        useDatePicker: true,
        includeLabelField: false,
        renderFileInputs: false,
        allowFieldDisable: false,
        initiallyDisableFields: false,
        disabledFields: List<string>(),
    };

    private _fieldEnabledCount: number = 0;

    constructor(props: QueryFormInputsProps) {
        super(props);

        const { queryInfo, queryColumns } = this.props;

        if (!queryInfo && !queryColumns) {
            throw new Error('QueryFormInputs: If queryInfo is not provided, queryColumns is required.');
        }

        this.onQSChange = this.onQSChange.bind(this);

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

    onQSChange(name: string, value: string | any[], items: any) {
        const { includeLabelField, onQSChange } = this.props;

        if (includeLabelField) {
            let allItems: any[] = items;
            if (!Utils.isArray(allItems)) {
                allItems = [allItems];
            }

            this.setState({
                labels: {
                    ...this.state.labels,
                    ...{
                        [getQueryFormLabelFieldName(name)]: allItems
                            .map(item => (item ? item.label : '(label not found)'))
                            .join(', '),
                    },
                },
            });
        }

        if (onQSChange) {
            onQSChange(name, value, items);
        }
    }

    onToggleDisable = (disabled: boolean) => {
        if (disabled) {
            this._fieldEnabledCount--;
        }
        else {
            this._fieldEnabledCount++;
        }
        if (this.props.onFieldsEnabledChange) {
            this.props.onFieldsEnabledChange(this._fieldEnabledCount);
        }
    }

    renderLabelField(col: QueryColumn) {
        const { includeLabelField } = this.props;

        if (includeLabelField) {
            const fieldName = getQueryFormLabelFieldName(col.name);
            return <Input name={fieldName} type="hidden" value={this.state.labels[fieldName]} />;
        }

        return null;
    }

    render() {
        const {
            columnFilter,
            componentKey,
            fieldValues,
            fireQSChangeOnInit,
            checkRequiredFields,
            showLabelAsterisk,
            initiallyDisableFields,
            lookups,
            queryColumns,
            queryInfo,
            onChange,
            renderFileInputs,
            allowFieldDisable,
            disabledFields,
            useDatePicker,
        } = this.props;

        const filter = columnFilter ? columnFilter : insertColumnFilter;
        const columns = queryInfo ? queryInfo.columns : queryColumns;

        // CONSIDER: separately establishing the set of columns and allow
        // QueryFormInputs to be a rendering factory for the columns that are in the set.
        if (columns) {
            return columns
                .filter(filter)
                .valueSeq()
                .map((col: QueryColumn, i: number) => {
                    const shouldDisableField =
                        initiallyDisableFields || disabledFields.contains(col.name.toLowerCase());
                    if (!shouldDisableField) {
                        this._fieldEnabledCount++;
                    }
                    let showAsteriskSymbol = false;
                    if (!checkRequiredFields && col.required) {
                        col = col.set('required', false) as QueryColumn;
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

                    if (col.inputRenderer) {
                        const renderer = resolveRenderer(col);
                        if (renderer) {
                            return renderer(col, i, value, false, allowFieldDisable);
                        }

                        throw new Error(`"${col.inputRenderer}" is not a valid inputRenderer.`);
                    }

                    if (col.isPublicLookup()) {
                        initLookup(col, undefined);
                        // undefined 'displayAsLookup' just respects the lookup.
                        // Must be explicitly false to prevent drop-down.
                        if (col.displayAsLookup !== false) {
                            const multiple = col.isJunctionLookup();
                            const joinValues = multiple;
                            const id = col.fieldKey + i + (componentKey ? componentKey : '');

                            return (
                                <React.Fragment key={i}>
                                    {this.renderLabelField(col)}
                                    <QuerySelect
                                        allowDisable={allowFieldDisable}
                                        onToggleDisable={this.onToggleDisable}
                                        initiallyDisabled={shouldDisableField}
                                        componentId={id}
                                        fireQSChangeOnInit={fireQSChangeOnInit}
                                        joinValues={joinValues}
                                        label={col.caption}
                                        addLabelAsterisk={showAsteriskSymbol}
                                        loadOnChange
                                        loadOnFocus
                                        maxRows={10}
                                        multiple={multiple}
                                        name={col.name}
                                        onQSChange={this.onQSChange}
                                        placeholder="Select or type to search..."
                                        preLoad
                                        previewOptions={true}
                                        required={col.required}
                                        schemaQuery={SchemaQuery.create(col.lookup.schemaName, col.lookup.queryName)}
                                        displayColumn={col.lookup.displayColumn}
                                        valueColumn={col.lookup.keyColumn}
                                        value={value}
                                    />
                                </React.Fragment>
                            );
                        }
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
                            />
                        );
                    } else if (col.inputType === 'file' && renderFileInputs) {
                        return (
                            <FileInput
                                key={i}
                                queryColumn={col}
                                value={value}
                                onChange={onChange}
                                allowDisable={allowFieldDisable}
                                initiallyDisabled={shouldDisableField}
                                onToggleDisable={this.onToggleDisable}
                                addLabelAsterisk={showAsteriskSymbol}
                            />
                        );
                    }
                    switch (col.jsonType) {
                        case 'date':
                            return useDatePicker ? (
                                <DatePickerInput
                                    key={i}
                                    queryColumn={col}
                                    value={value}
                                    allowDisable={allowFieldDisable}
                                    initiallyDisabled={shouldDisableField}
                                    onToggleDisable={this.onToggleDisable}
                                    addLabelAsterisk={showAsteriskSymbol}
                                />
                            ) : (
                                <DateInput
                                    key={i}
                                    queryColumn={col}
                                    value={value}
                                    allowDisable={allowFieldDisable}
                                    initiallyDisabled={shouldDisableField}
                                    onToggleDisable={this.onToggleDisable}
                                    addLabelAsterisk={showAsteriskSymbol}
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
                                />
                            );
                    }
                })
                .toArray();
        }
    }
}
