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
import { withFormsy } from 'formsy-react';
import DatePicker from 'react-datepicker';

import { Utils } from '@labkey/api';

import {DisableableInput, DisableableInputProps, DisableableInputState} from "./DisableableInput";
import { FieldLabel } from "../FieldLabel";
import { QueryColumn } from '../../base/models/model';
import { formatDate, parseDate } from '../../../util/Date';

export interface DatePickerInputProps extends DisableableInputProps {
    formsy?: boolean
    inputClassName?: string
    inputWrapperClassName?:string
    disabled?: boolean
    isClearable?: boolean
    placeholderText?: string
    name?: string
    label?: any
    onChange?: any

    queryColumn: QueryColumn
    showLabel?: boolean
    value?: any
    addLabelAsterisk?: boolean

    // from formsy-react
    getErrorMessage?: Function
    getValue?: Function
    setValue?: Function
    showRequired?: Function
    validations?: any
}

interface DatePickerInputState extends DisableableInputState {
    selectedDate: any
    selectedDateStr: string
}

class DatePickerInputImpl extends DisableableInput<DatePickerInputProps, DatePickerInputState> {

    static defaultProps = {
        allowDisable: false,
        initiallyDisabled: false,
        isClearable: true,
        inputClassName: 'form-control',
        inputWrapperClassName: 'block',
        showLabel: true,
        addLabelAsterisk: false
    };

    constructor(props: DatePickerInputProps) {
        super(props);

        this.onChange = this.onChange.bind(this);
        this.toggleDisabled = this.toggleDisabled.bind(this);

        this.state = {
            isDisabled: props.initiallyDisabled,
            selectedDate: props.value ? parseDate(props.value) : undefined,
            selectedDateStr: props.value
        }
    }

    onChange(date) {
        const selectedDateStr = date ? formatDate(date): undefined;
        this.setState(() => {
            return {
                selectedDate: date,
                selectedDateStr
            }
        });

        if (this.props.onChange && Utils.isFunction(this.props.onChange))
            this.props.onChange(date);

        if (this.props.formsy && Utils.isFunction(this.props.setValue))
            this.props.setValue(selectedDateStr);
    }

    render() {
        const {
            inputClassName,
            inputWrapperClassName,
            allowDisable,
            label,
            name,
            queryColumn,
            showLabel,
            addLabelAsterisk,
            placeholderText,
            formsy
        } = this.props;

       const { isDisabled, selectedDate, selectedDateStr } = this.state;

       console.log(this.props.getValue());
       return (
            <div className="form-group row">
                <FieldLabel
                    label={label}
                    labelOverlayProps={{
                        isFormsy: false,
                        inputId: queryColumn.name,
                        addLabelAsterisk: addLabelAsterisk,
                        labelClass: 'control-label text-left col-sm-3 col-xs-12'
                    }}
                    showLabel={showLabel}
                    showToggle={allowDisable}
                    column={queryColumn}
                    isDisabled = {isDisabled}
                    toggleProps = {{
                        onClick: this.toggleDisabled,
                    }}/>
                <div className={"col-sm-9 col-md-9 col-xs-12"}>
                    <DatePicker
                        wrapperClassName={inputWrapperClassName}
                        className={inputClassName}
                        isClearable={true}
                        name={name ? name : queryColumn.name}
                        disabled={isDisabled}
                        selected={selectedDate}
                        value={formsy ? this.props.getValue() : selectedDateStr}
                        onChange={this.onChange}
                        placeholderText={placeholderText ? placeholderText : `Select ${queryColumn.caption.toLowerCase()}`}
                        dateFormat={LABKEY.container.formats.dateFormat}/>
                </div>
            </div>
        );
    }
}


/**
 * This class is a wrapper around ReactSelect to be able to bind formsy-react. It uses
 * the Formsy.Decorator to bind formsy-react so the element can be validated, submitted, etc.
 */
const DatePickerInputFormsy = withFormsy(DatePickerInputImpl);

export class DatePickerInput extends React.Component<DatePickerInputProps, any> {

    static defaultProps = {
        formsy: true
    };

    constructor(props: DatePickerInputProps) {
        super(props);
    }

    render() {
        if (this.props.formsy) {
            return <DatePickerInputFormsy name={this.props.name ? this.props.name : this.props.queryColumn.name} {...this.props}/>
        }
        return <DatePickerInputImpl {...this.props} />
    }
}
