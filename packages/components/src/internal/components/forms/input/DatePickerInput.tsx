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
import { getColDateFormat, getJsonDateTimeFormatString, isDateTimeCol, parseDate } from '../../../util/Date';

import { QueryColumn } from '../../../../public/QueryColumn';

import { DisableableInput, DisableableInputProps, DisableableInputState } from './DisableableInput';

export interface DatePickerInputProps extends DisableableInputProps {
    addLabelAsterisk?: boolean;
    autoFocus?: boolean;
    dateFormat?: string;
    disabled?: boolean;
    formsy?: boolean;
    getErrorMessage?: Function;// from formsy-react
    getValue?: Function;// from formsy-react
    initValueFormatted?: boolean;
    inputClassName?: string;
    inputWrapperClassName?: string;
    isClearable?: boolean;
    isFormInput?: boolean;
    label?: any;
    labelClassName?: string;
    name?: string;
    onChange?: (newDate?: Date) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void;
    placeholderText?: string;
    queryColumn: QueryColumn;
    renderFieldLabel?: (queryColumn: QueryColumn, label?: string, description?: string) => ReactNode;
    setValue?: Function;// from formsy-react
    showLabel?: boolean;
    showRequired?: Function;// from formsy-react
    value?: any;
    wrapperClassName?: string;
    hideTime?: boolean;
    validations?: any;// from formsy-react
}

interface DatePickerInputState extends DisableableInputState {
    selectedDate: any;
}

// export for jest testing
export class DatePickerInputImpl extends DisableableInput<DatePickerInputProps, DatePickerInputState> {
    static defaultProps = {
        allowDisable: false,
        initiallyDisabled: false,
        isClearable: true,
        wrapperClassName: 'col-sm-9 col-md-9 col-xs-12',
        inputClassName: 'form-control',
        inputWrapperClassName: 'block',
        showLabel: true,
        addLabelAsterisk: false,
        initValueFormatted: true,
        isFormInput: true,
        labelClassName: 'control-label col-sm-3 text-left col-xs-12',
    };

    constructor(props: DatePickerInputProps) {
        super(props);

        this.toggleDisabled = this.toggleDisabled.bind(this);

        // Issue 45140: formsy values will hold on to the initial formatted value until onChange.
        // We instead need to make sure that the unformatted Date value is passed to setValue if there is an init value.
        const initDate = this.getInitDate(props);
        if (props.formsy && Utils.isFunction(props.setValue)) props.setValue(initDate);

        this.state = {
            isDisabled: props.initiallyDisabled,
            selectedDate: initDate,
        };
    }

    toggleDisabled = (): void => {
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

    getInitDate(props: DatePickerInputProps): Date {
        // Issue 45140: props.value is the original formatted date, so pass the date format
        // to parseDate when getting the initial value.
        const dateFormat = props.initValueFormatted ? this.getDateFormat() : undefined;
        return props.value ? parseDate(props.value, dateFormat) : undefined;
    }

    onChange = (date: Date): void => {
        this.setState(() => {
            return {
                selectedDate: date,
            };
        });

        if (this.props.onChange && Utils.isFunction(this.props.onChange)) this.props.onChange(date);

        // Issue 44398: match JSON dateTime format provided by LK server when submitting date values back for insert/update
        const _date = getJsonDateTimeFormatString(date);
        if (this.props.formsy && Utils.isFunction(this.props.setValue)) this.props.setValue(_date);
    };

    getDateFormat(): string {
        const { dateFormat, queryColumn, hideTime } = this.props;
        return getColDateFormat(queryColumn, hideTime ? 'Date' : dateFormat);
    }

    shouldShowTime(): boolean {
        const { hideTime, queryColumn } = this.props;
        return !hideTime && isDateTimeCol(queryColumn);
    }

    render(): ReactNode {
        const {
            inputClassName,
            inputWrapperClassName,
            allowDisable,
            label,
            labelClassName,
            name,
            queryColumn,
            showLabel,
            addLabelAsterisk,
            renderFieldLabel,
            placeholderText,
            isClearable,
            wrapperClassName,
            autoFocus,
            isFormInput,
            onKeyDown,
        } = this.props;

        const { isDisabled, selectedDate } = this.state;

        const picker = (
            <DatePicker
                autoComplete="off"
                wrapperClassName={inputWrapperClassName}
                className={inputClassName}
                isClearable={isClearable}
                name={name ? name : queryColumn.fieldKey}
                id={queryColumn.fieldKey}
                disabled={isDisabled}
                selected={selectedDate}
                onChange={this.onChange}
                showTimeSelect={this.shouldShowTime()}
                placeholderText={placeholderText ? placeholderText : `Select ${queryColumn.caption.toLowerCase()}`}
                dateFormat={this.getDateFormat()}
                autoFocus={autoFocus}
                onKeyDown={onKeyDown}
            />
        );

        if (!isFormInput) return picker;

        return (
            <div className="form-group row">
                {renderFieldLabel ? (
                    <label className={labelClassName}>
                        {renderFieldLabel(queryColumn)}
                        {queryColumn?.required && <span className="required-symbol"> *</span>}
                    </label>
                ) : (
                    <FieldLabel
                        label={label}
                        labelOverlayProps={{
                            isFormsy: false,
                            inputId: queryColumn.name,
                            required: queryColumn.required,
                            addLabelAsterisk,
                            labelClass: allowDisable ? undefined : labelClassName,
                        }}
                        showLabel={showLabel}
                        showToggle={allowDisable}
                        column={queryColumn}
                        isDisabled={isDisabled}
                        toggleProps={{
                            onClick: this.toggleDisabled,
                        }}
                    />
                )}
                <div className={wrapperClassName}>{picker}</div>
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
