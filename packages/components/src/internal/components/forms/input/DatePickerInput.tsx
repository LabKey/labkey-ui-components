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
import React, { FC, ReactNode, RefObject } from 'react';
import { withFormsy } from 'formsy-react';
import DatePicker, { ReactDatePickerProps } from 'react-datepicker';

import { FieldLabel } from '../FieldLabel';
import {
    getFormattedStringFromDate,
    getJsonDateFormatString,
    getJsonDateTimeFormatString,
    getJsonTimeFormatString,
    getPickerDateAndTimeFormat,
    isDateTimeCol,
    isRelativeDateFilterValue,
    parseDate,
} from '../../../util/Date';

import { QueryColumn } from '../../../../public/QueryColumn';
import { WithFormsyProps } from '../constants';

import { DisableableInput, DisableableInputProps, DisableableInputState } from './DisableableInput';

export interface DatePickerInputProps extends DisableableInputProps, WithFormsyProps {
    addLabelAsterisk?: boolean;
    allowRelativeInput?: boolean;
    autoFocus?: boolean;
    disabled?: boolean;
    formsy?: boolean;
    hideTime?: boolean;
    initValueFormatted?: boolean;
    inputClassName?: string;
    inputWrapperClassName?: string;
    isClearable?: boolean;
    isFormInput?: boolean;
    label?: any;
    labelClassName?: string;
    name?: string;
    onCalendarClose?: () => void;
    onChange?: (rawDate?: Date | string, dateStr?: string) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void;
    placeholderText?: string;
    queryColumn: QueryColumn;
    renderFieldLabel?: (queryColumn: QueryColumn, label?: string, description?: string) => ReactNode;
    showLabel?: boolean;
    value?: any;
    wrapperClassName?: string;
    inlineEdit?: boolean;
    onBlur?: () => void;
}

interface DatePickerInputState extends DisableableInputState {
    invalid: boolean;
    relativeInputValue?: string;
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
        initValueFormatted: false,
        isFormInput: true,
        labelClassName: 'control-label col-sm-3 text-left col-xs-12',
    };

    input: RefObject<DatePicker>;

    constructor(props: DatePickerInputProps) {
        super(props);

        const { queryColumn } = props;
        const isTimeOnly = queryColumn.isTimeColumn;

        this.toggleDisabled = this.toggleDisabled.bind(this);

        // Issue 45140: formsy values will hold on to the initial formatted value until onChange.
        // We instead need to make sure that the unformatted Date value is passed to setValue if there is an init value.
        const initDate = this.getInitDate(props);
        if (props.formsy && !isTimeOnly) {
            props.setValue?.(initDate);
        }

        let invalid = false;
        if (props.value && !isRelativeDateFilterValue(props.value)) {
            // Issue 46767: DatePicker valid dates start at year 1000 (i.e. new Date('1000-01-01'))
            invalid = this.getInitDate(props, new Date('1000-01-01')) === null;
        }

        this.input = React.createRef();

        this.state = {
            isDisabled: props.initiallyDisabled,
            selectedDate: initDate,
            invalid,
            relativeInputValue: undefined,
        };
    }

    toggleDisabled = (): void => {
        this.setState(
            state => ({
                isDisabled: !state.isDisabled,
                selectedDate: state.isDisabled ? state.selectedDate : this.getInitDate(this.props),
            }),
            () => {
                this.props.onToggleDisable?.(this.state.isDisabled);
            }
        );
    };

    getInitDate(props: DatePickerInputProps, minDate?: Date): Date {
        const { queryColumn } = props;
        const isTimeOnly = queryColumn.isTimeColumn;
        const isDateOnly = queryColumn.isDateOnlyColumn;
        // Issue 45140: props.value is the original formatted date, so pass the date format
        // to parseDate when getting the initial value.
        const dateFormat = props.initValueFormatted ? this.getDateFormat() : undefined;

        if (props.allowRelativeInput && isRelativeDateFilterValue(props.value)) return undefined;

        return props.value ? parseDate(props.value, dateFormat, minDate, isTimeOnly, isDateOnly) : undefined;
    }

    onChange = (date: Date, event?: any): void => {
        const { hideTime, queryColumn } = this.props;
        const isTimeOnly = queryColumn.isTimeColumn;
        const isDateOnly = queryColumn.isDateOnlyColumn;
        this.setState({ selectedDate: date, invalid: false });

        if (this.state.relativeInputValue) {
            this.props.onChange?.(this.state.relativeInputValue, this.state.relativeInputValue);
        } else {
            const formatted = getFormattedStringFromDate(date, queryColumn, hideTime);

            if (isTimeOnly) {
                this.props.onChange?.(formatted, formatted);

                // Issue 44398: match JSON dateTime format provided by LK server when submitting date values back for insert/update
                if (this.props.formsy) {
                    this.props.setValue?.(getJsonTimeFormatString(date));
                }
            } else {
                this.props.onChange?.(date, formatted);

                // Issue 44398: match JSON dateTime format provided by LK server when submitting date values back for insert/update
                if (this.props.formsy) {
                    this.props.setValue?.(
                        isDateOnly ? getJsonDateFormatString(date) : getJsonDateTimeFormatString(date)
                    );
                }
            }
        }

        // event is null when selecting time picker
        if (!event && this.props.inlineEdit)
            this.input.current.setFocus();
    };

    onChangeRaw = (event?: any): void => {
        const value = event?.target?.value;
        if (isRelativeDateFilterValue(value)) {
            this.setState({ relativeInputValue: value });
            this.props.onChange?.(value);
        } else {
            this.setState({ relativeInputValue: undefined });
        }
    };

    getDateFormat(): string {
        const { queryColumn, hideTime } = this.props;
        return getPickerDateAndTimeFormat(queryColumn, hideTime).dateFormat;
    }

    onIconClick = (): void => {
        this.input.current?.setFocus();
    };

    onSelect = (date: Date, event: React.SyntheticEvent<any> | undefined): void => {
        // focus the input so an onBlur action gets triggered after selection has been made
        this.input.current?.setFocus();
    };


    getAdditionalConfig = () : Partial<ReactDatePickerProps> => {
        const { inlineEdit, onBlur } = this.props;
        if (inlineEdit)
            return {
                onSelect: this.onSelect,
                onBlur: onBlur,
                shouldCloseOnSelect: false,
            }

        return {};
    }

    render(): ReactNode {
        const {
            addLabelAsterisk,
            allowDisable,
            allowRelativeInput,
            autoFocus,
            hideTime,
            inputClassName,
            inputWrapperClassName,
            isClearable,
            isFormInput,
            label,
            labelClassName,
            name,
            onCalendarClose,
            onKeyDown,
            placeholderText,
            queryColumn,
            renderFieldLabel,
            showLabel,
            value,
            wrapperClassName,
        } = this.props;
        const { isDisabled, selectedDate, invalid } = this.state;
        const { dateFormat, timeFormat } = getPickerDateAndTimeFormat(queryColumn, hideTime);

        const isTimeOnly = queryColumn.isTimeColumn;
        const picker = (
            <DatePicker
                {...this.getAdditionalConfig()}
                ref={this.input}
                autoComplete="off"
                autoFocus={autoFocus}
                className={inputClassName}
                dateFormat={dateFormat}
                disabled={isDisabled || invalid}
                id={queryColumn.fieldKey}
                isClearable={isClearable}
                name={name ? name : queryColumn.fieldKey}
                onCalendarClose={onCalendarClose}
                onChange={this.onChange}
                onChangeRaw={allowRelativeInput || isTimeOnly ? this.onChangeRaw : undefined}
                onKeyDown={onKeyDown}
                onMonthChange={this.onChange}
                placeholderText={placeholderText ?? `Select ${queryColumn.caption.toLowerCase()}`}
                selected={selectedDate}
                showTimeSelect={!hideTime && (isDateTimeCol(queryColumn) || isTimeOnly)}
                showTimeSelectOnly={!hideTime && isTimeOnly}
                timeIntervals={isTimeOnly ? 10 : 30}
                timeFormat={timeFormat}
                value={allowRelativeInput && !isTimeOnly && isRelativeDateFilterValue(value) ? value : undefined}
                wrapperClassName={inputWrapperClassName}
            />
        );

        if (this.props.inlineEdit)
            return (
                <span className="input-group date-input">
                    {picker}
                    <span className="input-group-addon" onClick={this.onIconClick}>
                        <i className="fa fa-calendar" />
                    </span>
                </span>
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

export const DatePickerInput: FC<DatePickerInputProps> = props => {
    if (props.formsy) {
        return <DatePickerInputFormsy name={props.name ?? props.queryColumn.name} {...props} />;
    }
    return <DatePickerInputImpl {...props} />;
};

DatePickerInput.defaultProps = {
    formsy: true,
};

DatePickerInput.displayName = 'DatePickerInput';
