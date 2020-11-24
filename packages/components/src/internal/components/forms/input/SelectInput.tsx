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
import { withFormsy } from 'formsy-react';
import ReactSelect, { Option } from 'react-select';
import { Utils } from '@labkey/api';

import { FieldLabel } from '../FieldLabel';

import { generateId, QueryColumn } from '../../../..';

import { DisableableInput, DisableableInputProps, DisableableInputState } from './DisableableInput';

// DO NOT CHANGE DELIMITER -- at least in react-select 1.0.0-rc.10
// any other delimiter value will break the "multiple" configuration parameter
export const DELIMITER = ',';

function equalValues(a: any, b: any): boolean {
    if (a === null || b === null) {
        if ((a === null && b !== null) || (a !== null && b === null)) {
            return false;
        }
        return true; // both null
    }

    if (typeof a !== typeof b) {
        return false;
    } else if (!Array.isArray(a) && typeof a !== 'object') {
        // string, number, boolean
        return a === b;
    }

    if (Array.isArray(a)) {
        if (a.length !== b.length) {
            return false;
        }

        // can assume equal length
        for (let i = 0; i < a.length; i++) {
            if (!equalValues(a[i], b[i])) {
                return false;
            }
        }
    } else if (typeof a === 'object') {
        // can assume ReactSelectOption
        if (!equalValues(a.value, b.value) || !equalValues(a.label, b.label)) {
            return false;
        }
    }

    return true;
}

function initOptions(props: SelectInputProps): any {
    const { value } = props;
    let options;

    if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
            options = [];
            value.forEach(v => {
                if (v !== undefined && v !== null) {
                    if (typeof v === 'string') {
                        options.push({
                            label: v,
                            [props.valueKey]: v,
                        });
                    } else {
                        options.push(v);
                    }
                }
            });
        } else {
            options = value;
        }
    }

    return options;
}

export interface SelectInputProps extends DisableableInputProps {
    addLabelText?: string;
    allowCreate?: boolean;
    autoload?: boolean;
    autoValue?: boolean;
    backspaceRemoves?: boolean;
    deleteRemoves?: boolean;
    clearCacheOnChange?: boolean;
    clearable?: boolean;
    containerClass?: string;
    delimiter?: string;
    description?: string;
    disabled?: boolean;
    filterOptions?: (options, filterString, values) => any; // from ReactSelect
    formsy?: boolean;
    ignoreCase?: boolean;
    inputClass?: string;
    isLoading?: boolean;
    // FIXME: this is named incorrectly. I would expect that if this is true it would join the values, nope, it joins
    //   the values when false.
    joinValues?: boolean;
    labelClass?: string;
    labelKey?: string;
    loadOptions?: any; // no way to currently require one or the other, options/loadOptions
    multiple?: boolean;
    name?: string;
    noResultsText?: string;
    onBlur?: (event) => any;
    onFocus?: (event, selectRef) => void;
    options?: any[];
    placeholder?: string;
    promptTextCreator?: (filterText: string) => string;
    required?: boolean;
    saveOnBlur?: boolean;
    selectedOptions?: Option | Option[];
    showLabel?: boolean;
    addLabelAsterisk?: boolean;
    renderFieldLabel?: (queryColumn: QueryColumn, label?: string, description?: string) => ReactNode;
    valueKey?: string;
    onChange?: Function; // this is getting confused with formsy on change, need to separate
    optionRenderer?: any;
    afterInputElement?: React.ReactNode; // this can be used to render an element to the right of the input

    id?: any;
    label?: React.ReactNode;
    value?: any;

    // from formsy-react
    getErrorMessage?: Function;
    getValue?: Function;
    setValue?: Function;
    showRequired?: Function;
    validations?: any;
}

export interface SelectInputState extends DisableableInputState {
    selectedOptions?: any;
    originalOptions?: any;
}

// Implementation exported only for tests
export class SelectInputImpl extends DisableableInput<SelectInputProps, SelectInputState> {
    static defaultProps = {
        ...DisableableInput.defaultProps,
        ...{
            allowCreate: false,
            autoload: true,
            autoValue: true,
            clearCacheOnChange: true,
            containerClass: 'form-group row',
            delimiter: DELIMITER,
            inputClass: 'col-sm-9 col-xs-12',
            labelClass: 'control-label col-sm-3 text-left col-xs-12',
            labelKey: 'label',
            saveOnBlur: false,
            showLabel: true,
            valueKey: 'value',
        },
    };

    _id: string;
    change = false; // indicates if the initial value has been changed or not

    constructor(props: SelectInputProps) {
        super(props);

        this._id = generateId('selectinput-');

        this.handleBlur = this.handleBlur.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleFocus = this.handleFocus.bind(this);

        this.initState(props);
    }

    refs: {
        reactSelect: any;
    };

    UNSAFE_componentWillReceiveProps(nextProps: SelectInputProps): void {
        // Issue 36478, Issue 38631: reset the reactSelect input cache object on prop change
        // We need to do this fairly aggressively and this may not catch all cases, but this is the best
        // bet yet.  It can happen, probably because of bad timing between loading and refreshing the display
        // here, that the cache value for the key LOAD_ON_FOCUS (from QuerySelect) will get set to an empty
        // list of options.  Once that is stashed in the ReactSelect cache, it's pretty much impossible to get
        // rid of it through normal component update operations, so we do this surgery here.
        this.refs.reactSelect._cache = {};

        if (!this.change && !equalValues(this.props.value, nextProps.value)) {
            if (nextProps.autoValue) {
                // This allows for "late-bound" value
                this._setOptionsAndValue(initOptions(nextProps));
            } else {
                this.setState({
                    selectedOptions: nextProps.selectedOptions,
                    originalOptions: nextProps.selectedOptions,
                });
            }
        }

        this.change = false;
    }

    initState(props: SelectInputProps) {
        const { autoValue, selectedOptions } = props;
        const originalOptions = autoValue === true ? initOptions(props) : selectedOptions;
        this.state = {
            selectedOptions: originalOptions,
            originalOptions,
            isDisabled: props.initiallyDisabled,
        };
    }

    toggleDisabled = () => {
        const { selectedOptions } = this.state;

        this.setState(
            state => {
                return {
                    isDisabled: !state.isDisabled,
                    selectedOptions: state.isDisabled ? selectedOptions : state.originalOptions,
                };
            },
            () => {
                if (this.props.onToggleDisable) {
                    this.props.onToggleDisable(this.state.isDisabled);
                }
            }
        );
    };

    getId() {
        if (this.props.id) {
            return this.props.id;
        }

        return this._id;
    }

    handleBlur(event: any) {
        const { onBlur, saveOnBlur } = this.props;

        // 33774: fields should be able to preserve input onBlur
        if (saveOnBlur) {
            // determine which ReactSelect version we are using
            // then get the associated inputValue
            const { reactSelect } = this.refs;

            if (this.isAsync()) {
                // <ReactSelect.Async/> || <ReactSelect.AsyncCreatable/>
                if (reactSelect.state.inputValue) {
                    if (reactSelect.select && Utils.isFunction(reactSelect.select.selectFocusedOption)) {
                        reactSelect.select.selectFocusedOption();
                    } else if (LABKEY.devMode) {
                        console.warn(
                            'ReactSelect.Async implementation may have changed. SelectInput "saveOnBlur" no longer working.'
                        );
                    }
                }
            } else if (this.isCreatable()) {
                // <ReactSelect.Creatable/>
                if (reactSelect.inputValue) {
                    if (Utils.isFunction(reactSelect.createNewOption)) {
                        reactSelect.createNewOption();
                    } else if (LABKEY.devMode) {
                        console.warn(
                            'ReactSelect.Creatable implementation may have changed. SelectInput "saveOnBlur" no longer working.'
                        );
                    }
                }
            }
        }

        if (Utils.isFunction(onBlur)) {
            onBlur(event);
        }
    }

    handleChange(selectedOptions) {
        const { clearCacheOnChange, name, onChange } = this.props;

        this.change = true;

        if (clearCacheOnChange) {
            this.refs.reactSelect._cache = {};
        }

        // set the formsy value from the selected options
        const formValue = this._setOptionsAndValue(selectedOptions);

        if (onChange) {
            onChange(name, formValue, selectedOptions, this.refs.reactSelect);
        }
    }

    handleFocus(event) {
        const { onFocus } = this.props;

        if (onFocus) {
            onFocus(event, this.refs.reactSelect);
        }
    }

    isAsync(): boolean {
        return Utils.isFunction(this.props.loadOptions);
    }

    isCreatable(): boolean {
        return this.props.allowCreate === true;
    }

    _setOptionsAndValue(options: any): any {
        const { delimiter, formsy, multiple, joinValues, setValue } = this.props;
        let selectedOptions;

        if (options === undefined || options === null || (Array.isArray(options) && options.length === 0)) {
            selectedOptions = undefined;
        } else {
            selectedOptions = options;
        }

        this.setState({
            selectedOptions,
        });

        let formValue;

        if (selectedOptions !== undefined) {
            if (multiple) {
                if (Array.isArray(selectedOptions)) {
                    formValue = selectedOptions.reduce((arr, option) => {
                        arr.push(option.value);
                        return arr;
                    }, []);

                    if (!joinValues) {
                        // consider removing altogether?
                        formValue = formValue.join(delimiter);
                    }
                } else {
                    formValue = selectedOptions;
                }
            } else {
                formValue = selectedOptions.value;
            }
        }

        if (formsy && Utils.isFunction(setValue)) {
            setValue(formValue);
        }

        return formValue;
    }

    renderError() {
        const { formsy, getErrorMessage } = this.props;

        if (formsy && Utils.isFunction(getErrorMessage)) {
            const error = getErrorMessage();

            if (error) {
                return (
                    <div className="has-error">
                        <span className="error-message help-block">{error}</span>
                    </div>
                );
            }
        }

        return null;
    }

    renderLabel(inputProps: any) {
        const {
            allowDisable,
            label,
            multiple,
            name,
            required,
            showLabel,
            addLabelAsterisk,
            renderFieldLabel,
        } = this.props;
        const { isDisabled } = this.state;

        if (showLabel && label !== undefined) {
            if (Utils.isString(label)) {
                let description = this.props.description;
                if (!description) {
                    description = 'Select ' + (multiple ? ' one or more values for ' : ' a ') + label;
                }

                if (renderFieldLabel) {
                    return (
                        <label className="control-label col-sm-3 text-left col-xs-12">
                            {renderFieldLabel(undefined, label, description)}
                        </label>
                    );
                }

                return (
                    <FieldLabel
                        id={inputProps.id}
                        fieldName={name}
                        labelOverlayProps={{
                            inputId: name,
                            description,
                            label,
                            addLabelAsterisk,
                            isFormsy: false,
                            required,
                            labelClass: !allowDisable ? this.props.labelClass : undefined,
                        }}
                        showLabel={showLabel}
                        showToggle={allowDisable}
                        isDisabled={isDisabled}
                        toggleProps={{
                            onClick: this.toggleDisabled,
                        }}
                    />
                );
            }

            return label;
        }

        return null;
    }

    renderSelect(inputProps: any) {
        const {
            addLabelText,
            autoload,
            backspaceRemoves,
            deleteRemoves,
            clearable,
            delimiter,
            disabled,
            filterOptions,
            ignoreCase,
            isLoading,
            labelKey,
            loadOptions,
            multiple,
            name,
            noResultsText,
            optionRenderer,
            options,
            placeholder,
            promptTextCreator,
            required,
            valueKey,
        } = this.props;

        const selectProps = {
            addLabelText,
            autoload,
            backspaceRemoves,
            deleteRemoves,
            clearable,
            delimiter,
            disabled: disabled || this.state.isDisabled,
            filterOptions,
            ignoreCase,
            inputProps,
            isLoading,
            labelKey,
            multi: multiple,
            name,
            noResultsText,
            onBlur: this.handleBlur,
            onChange: this.handleChange,
            onFocus: this.handleFocus,
            optionRenderer,
            options,
            placeholder,
            promptTextCreator,
            ref: 'reactSelect',
            required,
            value: this.state.selectedOptions,
            valueKey,
        };

        if (Array.isArray(selectProps.value) && selectProps.value.length === 0) {
            selectProps.value = undefined;
        } else if (!selectProps.multi && Array.isArray(selectProps.value)) {
            console.warn(
                'SelectInput: value is of type "array" but this component is NOT in "multiple" mode.' +
                    ' Consider either putting in "multiple" mode or fix value to not be an array.'
            );
        }

        if (this.isAsync()) {
            const asyncProps = Object.assign(selectProps, {
                cache: false, // Issue 38631 and Issue 36478 we say no to the cache so it will get cleared of all intermittent results.
                loadOptions,
            });

            if (this.isCreatable()) {
                return <ReactSelect.AsyncCreatable {...asyncProps} />;
            }

            return <ReactSelect.Async {...asyncProps} />;
        } else if (this.isCreatable()) {
            return <ReactSelect.Creatable {...selectProps} />;
        }

        return <ReactSelect {...selectProps} />;
    }

    render() {
        const { containerClass, inputClass, afterInputElement } = this.props;

        const inputProps = {
            id: this.getId(),
        };

        return (
            <div className={containerClass}>
                {this.renderLabel(inputProps)}
                <div className={inputClass}>
                    {this.renderSelect(inputProps)}
                    {this.renderError()}
                </div>
                {afterInputElement}
            </div>
        );
    }
}

/**
 * This class is a wrapper around ReactSelect to be able to bind formsy-react. It uses
 * the Formsy.Decorator to bind formsy-react so the element can be validated, submitted, etc.
 */
const SelectInputFormsy = withFormsy(SelectInputImpl);

export class SelectInput extends React.Component<SelectInputProps, any> {
    static defaultProps = {
        formsy: true,
    };

    render() {
        if (this.props.formsy) {
            return <SelectInputFormsy {...this.props} />;
        }
        return <SelectInputImpl {...this.props} />;
    }
}
