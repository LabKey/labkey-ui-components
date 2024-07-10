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
import DatePicker from 'react-datepicker';

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
    parseSimpleTime,
} from '../../../util/Date';

import { QueryColumn } from '../../../../public/QueryColumn';
import {
    INPUT_CONTAINER_CLASS_NAME,
    INPUT_LABEL_CLASS_NAME,
    INPUT_WRAPPER_CLASS_NAME,
    WithFormsyProps,
} from '../constants';

import { DisableableInput, DisableableInputProps, DisableableInputState } from './DisableableInput';

export interface DatePickerInputProps extends DisableableInputProps, WithFormsyProps {
    addLabelAsterisk?: boolean;
    allowRelativeInput?: boolean;
    autoFocus?: boolean;
    containerClassName?: string;
    disabled?: boolean;
    formsy?: boolean;
    hideTime?: boolean;
    initValueFormatted?: boolean;
    inlineEdit?: boolean;
    inputClassName?: string;
    inputWrapperClassName?: string;
    isClearable?: boolean;
    isFormInput?: boolean;
    label?: ReactNode;
    labelClassName?: string;
    name?: string;
    onBlur?: () => void;
    onCalendarClose?: () => void;
    onChange?: (rawDate?: Date | string, dateStr?: string) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void;
    placeholderText?: string;
    queryColumn: QueryColumn;
    renderFieldLabel?: (queryColumn: QueryColumn, label?: string, description?: string) => ReactNode;
    showLabel?: boolean;
    value?: any;
    wrapperClassName?: string;
}

interface DatePickerInputState extends DisableableInputState {
    invalid: boolean; // not a date/time value
    invalidStart: boolean; // is a date/time, but start before year 1000
    relativeInputValue?: string;
    selectedDate: any;
}

// export for jest testing
export class DatePickerInputImpl extends DisableableInput<DatePickerInputProps, DatePickerInputState> {
    static defaultProps = {
        addLabelAsterisk: false,
        allowDisable: false,
        containerClassName: INPUT_CONTAINER_CLASS_NAME,
        initiallyDisabled: false,
        initValueFormatted: false,
        inputClassName: 'form-control',
        inputWrapperClassName: 'block',
        isClearable: true,
        isFormInput: true,
        labelClassName: INPUT_LABEL_CLASS_NAME,
        showLabel: true,
        wrapperClassName: INPUT_WRAPPER_CLASS_NAME,
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

        let invalidStart = false,
            invalid = false;
        if (props.value && !isRelativeDateFilterValue(props.value)) {
            // Issue 46767: DatePicker valid dates start at year 1000 (i.e. new Date('1000-01-01'))
            invalidStart = this.getInitDate(props, new Date('1000-01-01')) === null;
            invalid = this.getInitDate(props) === null;
        }

        this.input = React.createRef();

        this.state = {
            isDisabled: props.initiallyDisabled,
            selectedDate: initDate,
            invalid,
            invalidStart,
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
        this.setState({ selectedDate: date, invalid: false, invalidStart: false });

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
        if (!event && this.props.inlineEdit) this.input.current.setFocus();
    };

    onChangeRaw = (event?: any): void => {
        const { queryColumn } = this.props;
        const isTime = queryColumn.isTimeColumn;
        const value = event?.target?.value;

        if (isTime) {
            if (!value) {
                this.onChange(null);
            } else {
                // Issue 50010: Time picker enters the wrong time if a time field has a format set
                const time = parseSimpleTime(value);
                if (time instanceof Date && !isNaN(time.getTime())) {
                    // Issue 50102: LKSM: When bulk updating a time-only field and entering a value with PM results in the AM time being selected
                    this.setState({ selectedDate: time, invalid: false, invalidStart: false });

                    const formatted = getFormattedStringFromDate(time, queryColumn, false);
                    this.props.onChange?.(formatted, formatted);

                    // Issue 44398: match JSON dateTime format provided by LK server when submitting date values back for insert/update
                    if (this.props.formsy) {
                        this.props.setValue?.(getJsonTimeFormatString(time));
                    }
                }
            }
        } else if (isRelativeDateFilterValue(value)) {
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

    onSelect = (): void => {
        // focus the input so an onBlur action gets triggered after selection has been made
        this.input.current?.setFocus();
    };

    render(): ReactNode {
        const {
            addLabelAsterisk,
            allowDisable,
            allowRelativeInput,
            containerClassName,
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
            onBlur,
            inlineEdit,
        } = this.props;
        const { isDisabled, selectedDate, invalid, invalidStart } = this.state;
        const { dateFormat, timeFormat } = getPickerDateAndTimeFormat(queryColumn, hideTime);
        const validValueInvalidStart = !invalid && invalidStart;
        const isTimeOnly = queryColumn.isTimeColumn;
        const picker = (
            <DatePicker
                ref={this.input}
                autoComplete="off"
                autoFocus={autoFocus}
                className={inputClassName}
                dateFormat={dateFormat}
                disabled={isDisabled}
                id={queryColumn.fieldKey}
                isClearable={isClearable}
                name={name ? name : queryColumn.fieldKey}
                onCalendarClose={onCalendarClose}
                onChange={this.onChange}
                onChangeRaw={allowRelativeInput || isTimeOnly ? this.onChangeRaw : undefined}
                onKeyDown={onKeyDown}
                onMonthChange={this.onChange}
                placeholderText={placeholderText ?? `Select ${queryColumn.caption.toLowerCase()}`}
                selected={invalid ? null : selectedDate}
                showTimeSelect={!hideTime && (isDateTimeCol(queryColumn) || isTimeOnly) && !validValueInvalidStart}
                showTimeSelectOnly={!hideTime && isTimeOnly}
                timeIntervals={isTimeOnly ? 10 : 30}
                timeFormat={timeFormat}
                value={allowRelativeInput && !isTimeOnly && isRelativeDateFilterValue(value) ? value : undefined}
                wrapperClassName={inputWrapperClassName}
                onSelect={inlineEdit ? this.onSelect : undefined}
                onBlur={inlineEdit ? onBlur : undefined}
                shouldCloseOnSelect={inlineEdit ? false : undefined}
            />
        );

        if (inlineEdit) {
            return (
                <span className="input-group date-input">
                    {picker}
                    <span className="input-group-addon" onClick={this.onIconClick}>
                        <i className="fa fa-calendar" />
                    </span>
                </span>
            );
        }

        if (!isFormInput) return picker;

        return (
            <div className={containerClassName}>
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
