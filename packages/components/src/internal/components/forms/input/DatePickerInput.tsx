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
import DatePicker from 'react-datepicker';

import { Utils } from '@labkey/api';

import { FieldLabel } from '../FieldLabel';
import { QueryColumn } from '../../../..';
import { datePlaceholder, formatDate, isDateTimeCol, parseDate } from '../../../util/Date';

import { DisableableInput, DisableableInputProps, DisableableInputState } from './DisableableInput';

export interface DatePickerInputProps extends DisableableInputProps {
    formsy?: boolean;
    wrapperClassName?: string;
    inputClassName?: string;
    inputWrapperClassName?: string;
    disabled?: boolean;
    isClearable?: boolean;
    placeholderText?: string;
    name?: string;
    label?: any;
    onChange?: any;
    dateFormat?: string;
    showTime?: boolean;

    queryColumn: QueryColumn;
    showLabel?: boolean;
    value?: any;
    addLabelAsterisk?: boolean;
    renderFieldLabel?: (queryColumn: QueryColumn) => ReactNode;

    // from formsy-react
    getErrorMessage?: Function;
    getValue?: Function;
    setValue?: Function;
    showRequired?: Function;
    validations?: any;
}

interface DatePickerInputState extends DisableableInputState {
    selectedDate: any;
    selectedDateStr: string;
}

class DatePickerInputImpl extends DisableableInput<DatePickerInputProps, DatePickerInputState> {
    static defaultProps = {
        allowDisable: false,
        initiallyDisabled: false,
        isClearable: true,
        wrapperClassName: 'col-sm-9 col-md-9 col-xs-12',
        inputClassName: 'form-control',
        inputWrapperClassName: 'block',
        showLabel: true,
        addLabelAsterisk: false,
    };

    constructor(props: DatePickerInputProps) {
        super(props);

        this.toggleDisabled = this.toggleDisabled.bind(this);

        this.state = {
            isDisabled: props.initiallyDisabled,
            selectedDate: this.getInitDate(props),
            selectedDateStr: props.value,
        };
    }

    toggleDisabled = () => {
        const { selectedDate } = this.state;

        this.setState(
            state => {
                return {
                    isDisabled: !state.isDisabled,
                    selectedDate: state.isDisabled ? selectedDate : this.getInitDate(this.props),
                };
            },
            () => {
                if (this.props.onToggleDisable) {
                    this.props.onToggleDisable(this.state.isDisabled);
                }
            }
        );
    };

    getInitDate(props: DatePickerInputProps) {
        return props.value ? parseDate(props.value, this.getDateFormat(false)) : undefined;
    }

    onChange = date => {
        const selectedDateStr = date ? formatDate(date, null, this.getDateFormat(false)) : undefined;
        this.setState(() => {
            return {
                selectedDate: date,
                selectedDateStr,
            };
        });

        if (this.props.onChange && Utils.isFunction(this.props.onChange)) this.props.onChange(date);

        if (this.props.formsy && Utils.isFunction(this.props.setValue)) this.props.setValue(selectedDateStr);
    };

    getDateFormat(isDatePicker: boolean) {
        const { dateFormat, queryColumn } = this.props;
        if (dateFormat) return this.ensureDateFormat(dateFormat, isDatePicker);

        return this.ensureDateFormat(datePlaceholder(queryColumn), isDatePicker);
    }

    ensureDateFormat(rawFormat: string, isDatePicker: boolean) {
        if (!isDatePicker) return rawFormat;

        // Moment.js and react datepicker date format is different
        // https://github.com/Hacker0x01/react-datepicker/issues/1609
        return rawFormat.replace('YYYY', 'yyyy').replace('DD', 'dd');
    }

    shouldShowTime() {
        const { showTime, queryColumn } = this.props;
        return showTime || isDateTimeCol(queryColumn);
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
            renderFieldLabel,
            placeholderText,
            isClearable,
            wrapperClassName,
        } = this.props;

        const { isDisabled, selectedDate } = this.state;

        return (
            <div className="form-group row">
                {renderFieldLabel
                    ? <label className={'control-label col-sm-3 text-left col-xs-12'}>
                        {renderFieldLabel(queryColumn)}
                    </label>
                    : <FieldLabel
                        label={label}
                        labelOverlayProps={{
                            isFormsy: false,
                            inputId: queryColumn.name,
                            addLabelAsterisk,
                        }}
                        showLabel={showLabel}
                        showToggle={allowDisable}
                        column={queryColumn}
                        isDisabled={isDisabled}
                        toggleProps={{
                            onClick: this.toggleDisabled,
                        }}
                    />
                }
                <div className={wrapperClassName}>
                    <DatePicker
                        autoComplete="off"
                        wrapperClassName={inputWrapperClassName}
                        className={inputClassName}
                        isClearable={isClearable}
                        name={name ? name : queryColumn.name}
                        id={queryColumn.name}
                        disabled={isDisabled}
                        selected={selectedDate}
                        onChange={this.onChange}
                        showTimeSelect={this.shouldShowTime()}
                        placeholderText={
                            placeholderText ? placeholderText : `Select ${queryColumn.caption.toLowerCase()}`
                        }
                        dateFormat={this.getDateFormat(true)}
                    />
                </div>
            </div>
        );
    }
}

/**
 * This class is a wrapper around DatePickerInput to be able to bind formsy-react. It uses
 * the Formsy.Decorator to bind formsy-react so the element can be validated, submitted, etc.
 */
const DatePickerInputFormsy = withFormsy(DatePickerInputImpl);

export class DatePickerInput extends React.Component<DatePickerInputProps, any> {
    static defaultProps = {
        formsy: true,
    };

    constructor(props: DatePickerInputProps) {
        super(props);
    }

    render() {
        if (this.props.formsy) {
            return (
                <DatePickerInputFormsy
                    name={this.props.name ? this.props.name : this.props.queryColumn.name}
                    {...this.props}
                />
            );
        }
        return <DatePickerInputImpl {...this.props} />;
    }
}
