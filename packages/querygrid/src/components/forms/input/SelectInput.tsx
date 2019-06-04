/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { withFormsy } from 'formsy-react'
import ReactSelect from 'react-select'
import { Utils } from '@labkey/api'
import { generateId } from '@glass/base'

import { ReactSelectOption } from '../model'

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
    }
    else if (!Array.isArray(a) && typeof a !== 'object') {
        // string, number, boolean
        return a === b;
    }

    if (Array.isArray(a)) {
        if (a.length !== b.length) {
            return false;
        }

        // can assume equal length
        for (let i=0; i < a.length; i++) {
            if (!equalValues(a[i], b[i])) {
                return false;
            }
        }
    }
    else if (typeof a === 'object') {
        // can assume ReactSelectOption
        if (!equalValues(a.value, b.value) || !equalValues(a.label, b.label)) {
            return false;
        }
    }

    return true;
}

function initOptions(props: SelectInputProps): any {
    const { value } = props;
    let options = undefined;

    if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
            options = [];
            value.forEach(v => {
                if (v !== undefined && v !== null) {
                    if (typeof v === 'string') {
                        options.push({
                            label: v,
                            [props.valueKey]: v
                        });
                    }
                    else {
                        options.push(v);
                    }
                }
            });
        }
        else {
            options = value;
        }
    }

    return options;
}

export interface SelectInputProps {
    addLabelText?: string
    allowCreate?: boolean
    autoload?: boolean
    autoValue?: boolean
    backspaceRemoves?: boolean
    cache?: boolean
    clearCacheOnChange?: boolean
    clearable?: boolean
    containerClass?: string
    delimiter?: string
    disabled?: boolean
    filterOptions?: (options, filterString, values) => any // from ReactSelect
    formsy?: boolean
    ignoreCase?: boolean
    inputClass?: string
    isLoading?: boolean
    // FIXME: this is named incorrectly. I would expect that if this is true it would join the values, nope, it joins
    //   the values when false.
    joinValues?: boolean
    labelClass?: string
    labelKey?: string
    loadOptions?: any // no way to currently require one or the other, options/loadOptions
    multiple?: boolean
    name?: string
    noResultsText? : string
    onBlur?: (event) => any
    onFocus?: (event, selectRef) => void
    options?: Array<any>
    placeholder? : string
    promptTextCreator?: (filterText:string) => string;
    required?: boolean
    saveOnBlur?: boolean
    selectedOptions?: ReactSelectOption | Array<ReactSelectOption>
    showLabel?: boolean
    valueKey?: string
    onChange?: Function // this is getting confused with formsy on change, need to separate
    optionRenderer?: any

    id?: any
    label?: React.ReactNode
    value?: any

    // from formsy-react
    getErrorMessage?: Function
    getValue?: Function
    setValue?: Function
    showRequired?: Function
    validations?: any
}

interface SelectInputState {
    selectedOptions?: any
}

// Implementation exported only for tests
export class SelectInputImpl extends React.Component<SelectInputProps, SelectInputState> {

    static defaultProps = {
        allowCreate: false,
        autoload: true,
        autoValue: true,
        cache: false,
        clearCacheOnChange: true,
        containerClass: 'form-group row',
        delimiter: DELIMITER,
        inputClass: 'col-sm-9',
        labelClass: 'control-label col-sm-3 text-left',
        labelKey: 'label',
        saveOnBlur: false,
        showLabel: true,
        valueKey: 'value'
    };

    _cache = {};
    _id: string;
    change: boolean = false;

    constructor(props: SelectInputProps) {
        super(props);

        this._id = generateId('selectinput-');

        this.handleBlur = this.handleBlur.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleFocus = this.handleFocus.bind(this);

        this.state = {
            selectedOptions: props.autoValue === true ? initOptions(props): undefined
        };
    }

    refs: {
        reactSelect: any
    };

    componentWillReceiveProps(nextProps: SelectInputProps) {
        // This allows for "late-bound" value
        if (this.props.autoValue && !this.change && !equalValues(this.props.value, nextProps.value)) {
            this._setOptionsAndValue(initOptions(nextProps));
        }

        // Issue 36478: reset the select input cache object on prop change
        this._cache = {};

        this.change = false;
    }

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
                    }
                    else if (LABKEY.devMode) {
                        console.warn('ReactSelect.Async implementation may have changed. SelectInput "saveOnBlur" no longer working.');
                    }
                }
            }
            else if (this.isCreatable()) {
                // <ReactSelect.Creatable/>
                if (reactSelect.inputValue) {
                    if (Utils.isFunction(reactSelect.createNewOption)) {
                        reactSelect.createNewOption();
                    }
                    else if (LABKEY.devMode) {
                        console.warn('ReactSelect.Creatable implementation may have changed. SelectInput "saveOnBlur" no longer working.');
                    }
                }
            }
        }

        if (Utils.isFunction(onBlur)) {
            onBlur(event);
        }
    }

    handleChange(selectedOptions) {
        const { cache, clearCacheOnChange, name, onChange } = this.props;

        this.change = true;

        if (cache !== false && clearCacheOnChange) {
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
        }
        else {
            selectedOptions = options;
        }

        this.setState({
            selectedOptions
        });

        let formValue;

        if (selectedOptions !== undefined) {
            if (multiple) {
                if (Array.isArray(selectedOptions)) {
                    formValue = selectedOptions.reduce((arr, option) => {
                        arr.push(option.value);
                        return arr;
                    }, []);

                    if (!joinValues) { // consider removing altogether?
                        formValue = formValue.join(delimiter);
                    }
                }
                else {
                    formValue = selectedOptions;
                }
            }
            else {
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
                )
            }
        }

        return null;
    }

    renderLabel(inputProps: any) {
        const { label, labelClass, required, showLabel } = this.props;

        if (showLabel && label !== undefined) {

            if (Utils.isString(label)) {
                // TODO: Get this and <LabelOverlay> to be consistent/same
                return (
                    <label
                        className={labelClass}
                        htmlFor={inputProps.id}>
                        <span>{label}</span>
                        {required ? <span> *</span> : null}
                    </label>
                )
            }

            return label;
        }

        return null;
    }

    renderSelect(inputProps: any) {
        const {
            addLabelText,
            allowCreate,
            autoload,
            cache,
            clearable,
            delimiter,
            disabled,
            filterOptions,
            autoValue,
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
            clearable,
            delimiter,
            disabled,
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
            value: autoValue === true ? this.state.selectedOptions : this.props.selectedOptions,
            valueKey
        };

        if (Array.isArray(selectProps.value) && selectProps.value.length === 0) {
            selectProps.value = undefined;
        }
        else if (!selectProps.multi && Array.isArray(selectProps.value)) {
            console.warn('SelectInput: value is of type "array" but this component is NOT in "multiple" mode.' +
                ' Consider either putting in "multiple" mode or fix value to not be an array.');
        }

        if (this.isAsync()) {
            const asyncProps = Object.assign(selectProps, {
                cache: cache !== false ? this._cache : false,
                loadOptions
            });

            if (this.isCreatable()) {
                return <ReactSelect.AsyncCreatable {...asyncProps}/>;
            }

            return <ReactSelect.Async {...asyncProps}/>;
        }
        else if (this.isCreatable()) {
            return <ReactSelect.Creatable {...selectProps}/>;
        }

        return <ReactSelect {...selectProps}/>;
    }

    render() {
        const {
            containerClass,
            inputClass,
        } = this.props;

        const inputProps = {
            id: this.getId()
        };

        return (
            <div className={containerClass}>
                {this.renderLabel(inputProps)}
                <div className={inputClass}>
                    {this.renderSelect(inputProps)}
                    {this.renderError()}
                </div>
            </div>
        )
    }
}

/**
 * This class is a wrapper around ReactSelect to be able to bind formsy-react. It uses
 * the Formsy.Decorator to bind formsy-react so the element can be validated, submitted, etc.
 */
const SelectInputFormsy = withFormsy(SelectInputImpl);

export class SelectInput extends React.Component<SelectInputProps, any> {

    static defaultProps = {
        formsy: true
    };

    render() {
        if (this.props.formsy) {
            return <SelectInputFormsy {...this.props}/>
        }
        return <SelectInputImpl {...this.props} />
    }
}