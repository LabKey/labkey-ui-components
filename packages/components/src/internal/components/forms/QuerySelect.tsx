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
import { fromJS, List } from 'immutable';
import { Option } from 'react-select';
import { Filter, Utils } from '@labkey/api';

import { QueryColumn, SchemaQuery } from '../../..';

import { DELIMITER, SelectInput } from './input/SelectInput';
import { resolveDetailFieldValue } from './renderers';
import { initSelect } from './actions';
import { FOCUS_FLAG } from './constants';
import { QuerySelectModel } from './model';

function getValue(model: QuerySelectModel, props: any): any {
    const { rawSelectedValue } = model;

    if (rawSelectedValue !== undefined && !Utils.isString(rawSelectedValue)) {
        if (List.isList(rawSelectedValue)) {
            return rawSelectedValue.toArray();
        } else if (isNaN(rawSelectedValue)) {
            console.warn('QuerySelect: NaN is not a valid value', rawSelectedValue);
            return undefined;
        }
    }

    if (rawSelectedValue === null) {
        return undefined;
    }

    // Issue 37352
    // For reasons not entirely clear we cannot pass in an array of values to QuerySelect when we initialize it
    // while multiple is also set to true. Instead we can only pass in one pre-populated value. We then need to
    // convert that value to an array here, or Formsy will only return a single value if the input is never touched
    // by the user. Converting it to an array right here gets us the best of both worlds: a pre-populated value that
    // is returned as an array when the user hits submit.
    if (
        rawSelectedValue !== undefined &&
        rawSelectedValue !== '' &&
        props.multiple &&
        !Array.isArray(rawSelectedValue)
    ) {
        return [rawSelectedValue];
    }

    return rawSelectedValue;
}

// 33775: Provide a default no-op filter to a React Select to prevent "normal" filtering on the input when fetching
// async query results. They have already been filtered.
function noopFilterOptions(options: Option[]): Option[] {
    return options;
}

function renderPreviewOption(option: Option, model: QuerySelectModel): React.ReactNode {
    const { allResults, queryInfo } = model;

    if (queryInfo && allResults.size) {
        const item = allResults.find(result => {
            return option.value === result.getIn([model.valueColumn, 'value']);
        });

        return (
            <div className="wizard--select-option">
                {queryInfo.getDisplayColumns(model.schemaQuery.viewName).map((column: QueryColumn, i: number) => {
                    if (item !== undefined) {
                        let text = resolveDetailFieldValue(item.get(column.name));
                        if (!Utils.isString(text)) {
                            text = text ? text.toString() : '';
                        }

                        return (
                            <div key={i} className="text__truncate">
                                <strong>{column.caption}: </strong>
                                <span>{text}</span>
                            </div>
                        );
                    }

                    return (
                        <div key={i} className="text__truncate">
                            <span>{option.label}</span>
                        </div>
                    );
                })}
            </div>
        );
    }

    return null;
}

/**
 * This is a subset of SelectInputProps that are passed through to the SelectInput. Mainly, this set should
 * represent all props of SelectInput that are not overridden by QuerySelect for it's own
 * purposes (e.g. "options" are populated from the QuerySelect's model and thus are not allowed to
 * be specified by the user).
 */
interface InheritedSelectInputProps {
    addLabelText?: string;
    allowCreate?: boolean;
    allowDisable?: boolean;
    onToggleDisable?: (disabled: boolean) => void;
    backspaceRemoves?: boolean;
    clearCacheOnChange?: boolean;
    clearable?: boolean;
    delimiter?: string;
    description?: string;
    disabled?: boolean;
    filterOptions?: (options, filterString, values) => any; // from ReactSelect
    formsy?: boolean;
    initiallyDisabled?: boolean;
    inputClass?: string;
    joinValues?: boolean;
    label?: React.ReactNode;
    labelClass?: string;
    multiple?: boolean;
    name?: string;
    noResultsText?: string;
    placeholder?: string;
    required?: boolean;
    saveOnBlur?: boolean;
    showLabel?: boolean;
    addLabelAsterisk?: boolean;
    validations?: any;
    value?: any;
}

export interface QuerySelectOwnProps extends InheritedSelectInputProps {
    // required
    componentId: string;
    schemaQuery: SchemaQuery;

    // optional
    containerClass?: string; // The css class used by SelectInput, has nothing to do with LK containers.
    containerPath?: string; // The path to the LK container that the queries should be scoped to.
    displayColumn?: string;
    fireQSChangeOnInit?: boolean;
    loadOnChange?: boolean;
    loadOnFocus?: boolean;
    maxRows?: number;
    onQSChange?: (name: string, value: string | any[], items: any) => any;
    onInitValue?: (value: any, selectedValues: List<any>) => any;
    preLoad?: boolean;
    previewOptions?: boolean;
    queryFilters?: List<Filter.IFilter>;
    showLoading?: boolean;
    valueColumn?: string;
}

interface QuerySelectStateProps {
    model: QuerySelectModel;
    error: any;
}

export class QuerySelect extends React.Component<QuerySelectOwnProps, QuerySelectStateProps> {
    static defaultProps = {
        delimiter: DELIMITER,
        fireQSChangeOnInit: false,
        loadOnChange: false,
        loadOnFocus: false,
        preLoad: false,
        previewOptions: false,
        showLoading: true,
    };

    _mounted: boolean;
    querySelectTimer: number;

    constructor(props: QuerySelectOwnProps) {
        super(props);

        this.filterOptions = this.filterOptions.bind(this);
        this.loadOptions = this.loadOptions.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onFocus = this.onFocus.bind(this);

        this.state = {
            model: undefined,
            error: undefined,
        };
    }

    componentDidMount() {
        this._mounted = true;
        this.initModel(this.props);
    }

    UNSAFE_componentWillReceiveProps(nextProps: QuerySelectOwnProps): void {
        if (nextProps.componentId !== this.props.componentId) {
            this.initModel(nextProps);
        }
    }

    initModel(props: QuerySelectOwnProps) {
        initSelect(props).then(
            model => {
                this.setState(() => ({ error: undefined, model }));
            },
            reason => {
                this.setState(() => ({ error: reason }));
            }
        );
    }

    componentWillUnmount() {
        this._mounted = false;
        clearTimeout(this.querySelectTimer);
    }

    filterOptions(options: Option[], inputValue: string, currentValue: Option[]): Option[] {
        return this.props.filterOptions(options, inputValue, currentValue);
    }

    loadOptions(input: string, callback) {
        const { model } = this.state;

        const token = model.parseSearch(input);
        clearTimeout(this.querySelectTimer);

        if (token !== false) {
            this.querySelectTimer = window.setTimeout(() => {
                this.querySelectTimer = undefined;
                const v = token === true ? input : token;
                model.search(v).then(data => {
                    const { model } = this.state;

                    // prevent stale state updates of ReactSelect
                    // -- yes, a cancelable promise would work as well
                    if (this._mounted !== true) {
                        return;
                    }

                    const key = data.key,
                        models = fromJS(data.models[key]);

                    callback(null, {
                        options: model.formatSavedResults(models, v),
                    });

                    this.setState(() => ({
                        model: model.saveSearchResults(models),
                    }));
                });
            }, 250);
        } else {
            callback(null, {
                options: model.formatSavedResults(),
            });
        }
    }

    onChange(name: string, value: any, selectedOptions, selectRef: any) {
        const { loadOnChange, onQSChange } = this.props;
        const { model } = this.state;

        this.setState(
            () => ({
                model: model.setSelection(value),
            }),
            () => {
                if (loadOnChange && Utils.isFunction(selectRef.loadOptions)) {
                    selectRef.loadOptions(FOCUS_FLAG);
                }

                if (Utils.isFunction(onQSChange)) {
                    onQSChange(name, value, selectedOptions);
                }
            }
        );
    }

    optionRenderer(option) {
        const { model } = this.state;
        return renderPreviewOption(option, model);
    }

    onFocus(event: Event, selectRef: any) {
        const { loadOnFocus } = this.props;
        const { model } = this.state;

        if ((model.preLoad || loadOnFocus) && Utils.isFunction(selectRef.loadOptions)) {
            selectRef.loadOptions(FOCUS_FLAG);
        }
    }

    render() {
        const {
            allowDisable,
            onToggleDisable,
            description,
            filterOptions,
            initiallyDisabled,
            label,
            previewOptions,
            required,
            showLoading,
        } = this.props;
        const { error, model } = this.state;

        if (error) {
            const inputProps = {
                allowDisable,
                onToggleDisable,
                description,
                initiallyDisabled,
                disabled: true,
                formsy: this.props.formsy,
                containerClass: this.props.containerClass,
                inputClass: this.props.inputClass,
                labelClass: this.props.labelClass,
                isLoading: false,
                label,
                name: this.props.name || this.props.componentId + '-error',
                placeholder: 'Error: ' + error.message,
                required,
                type: 'text',
            };

            return <SelectInput {...inputProps} />;
        } else if (model && model.isInit) {
            const inputProps = Object.assign(
                {
                    id: model.id,
                    label: label !== undefined ? label : model.queryInfo.title,
                },
                this.props,
                {
                    allowCreate: false,
                    autoValue: false, // QuerySelect will directly control value of ReactSelect via selectedOptions
                    autoload: true,
                    cache: true,
                    description,
                    filterOptions: Utils.isFunction(filterOptions) ? this.filterOptions : noopFilterOptions,
                    ignoreCase: false,
                    loadOptions: this.loadOptions,
                    onChange: this.onChange,
                    onFocus: this.onFocus,
                    options: undefined, // prevent override
                    optionRenderer: previewOptions ? this.optionRenderer.bind(this) : undefined,
                    selectedOptions: model.getSelectedOptions(),
                    value: getValue(model, this.props), // needed to initialize the Formsy "value" properly
                }
            );

            return <SelectInput {...inputProps} />;
        } else if (showLoading) {
            // This <Input/> is used as a placeholder for fields while the model
            // is initialized. The intent is to allow normal required validation to work
            // even while QuerySelects are being initialized
            const inputProps = {
                allowDisable,
                containerClass: this.props.containerClass,
                inputClass: this.props.inputClass,
                labelClass: this.props.labelClass,
                description,
                initiallyDisabled,
                onToggleDisable,
                disabled: true,
                formsy: this.props.formsy,
                label,
                name: this.props.name || this.props.componentId + '-loader',
                placeholder: 'Loading...',
                required,
                type: 'text',
                value: undefined,
            };

            return <SelectInput {...inputProps} />;
        }

        return null;
    }
}
