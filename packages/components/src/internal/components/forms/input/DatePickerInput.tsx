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
import DatePicker from 'react-datepicker';

import { FormsyInjectedProps, withFormsy } from '../formsy';
import { FieldLabel } from '../FieldLabel';
import {
    getAltParseFormats,
    getDateFromISO,
    getDateTimeDisplayValue,
    getJsonDateFormatString,
    getJsonDateTimeFormatString,
    getJsonTimeFormatString,
    getPickerDateAndTimeFormat,
    isDateTimeCol,
    isRelativeDateFilterValue,
    parseTime,
} from '../../../util/Date';

import { QueryColumn } from '../../../../public/QueryColumn';
import {
    INPUT_CONTAINER_CLASS_NAME,
    INPUT_LABEL_CLASS_NAME,
    INPUT_WRAPPER_CLASS_NAME,
    MIXED_VALUE_DISPLAY
} from '../constants';

import { DisableableInput, DisableableInputProps, DisableableInputState } from './DisableableInput';

export interface DatePickerInputProps extends DisableableInputProps {
    addLabelAsterisk?: boolean;
    allowRelativeInput?: boolean;
    autoFocus?: boolean;
    containerClassName?: string;
    disabled?: boolean;
    formsy?: boolean;
    hideTime?: boolean;
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
    onChange?: (rawDate?: Date | string, formatted?: string) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void;
    placeholderText?: string;
    queryColumn: QueryColumn;
    renderFieldLabel?: (queryColumn: QueryColumn, label?: string, description?: string) => ReactNode;
    showLabel?: boolean;
    wrapperClassName?: string;
}

type DatePickerInputImplProps = DatePickerInputProps & FormsyInjectedProps<string>;

interface DatePickerInputState extends DisableableInputState {
    invalid: boolean; // not a date/time value
    invalidStart: boolean; // is a date/time, but start before year 1000
    relativeInputValue?: string;
    selectedDate: any;
}

// export for jest testing
export class DatePickerInputImpl extends DisableableInput<DatePickerInputImplProps, DatePickerInputState> {
    static defaultProps = {
        addLabelAsterisk: false,
        allowDisable: false,
        containerClassName: INPUT_CONTAINER_CLASS_NAME,
        initiallyDisabled: false,
        inputClassName: 'form-control',
        inputWrapperClassName: 'block',
        isClearable: true,
        isFormInput: true,
        labelClassName: INPUT_LABEL_CLASS_NAME,
        showLabel: true,
        wrapperClassName: INPUT_WRAPPER_CLASS_NAME,
    };

    input: RefObject<DatePicker>;

    constructor(props: DatePickerInputImplProps) {
        super(props);

        this.toggleDisabled = this.toggleDisabled.bind(this);

        const initDate = this.getInitDate(props);
        let invalidStart = false;
        let invalid = false;
        if (props.value && !isRelativeDateFilterValue(props.value)) {
            // Issue 46767: DatePicker valid dates start at year 1000 (i.e. new Date('1000-01-01'))
            invalidStart = this.getInitDate(props, new Date('1000-01-01')) === null;
            invalid = initDate === null;
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

    // Issue 51864: Calling formsy setValue() from component constructor can result in infinite recursion.
    // Instead, we wait until the component has mounted and then call setValue() to not interrupt initialization.
    componentDidMount(): void {
        // Issue 45140: formsy values will hold on to the initial formatted value until onChange.
        // We instead need to make sure that the unformatted Date value is passed to setValue if there is an init value.
        if (this.props.formsy && !this.props.queryColumn.isTimeColumn) {
            const { selectedDate } = this.state;
            this.props.setValue?.(selectedDate ? this.getFormsyValue(selectedDate) : undefined);
        }
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

    getFormsyValue = (date: Date): string => {
        const { queryColumn } = this.props;
        let value: string;

        // Issue 44398: match JSON dateTime format provided by LK server when submitting date values back for insert/update
        if (queryColumn.isTimeColumn) {
            value = getJsonTimeFormatString(date);
        } else if (queryColumn.isDateOnlyColumn) {
            value = getJsonDateFormatString(date);
        } else {
            value = getJsonDateTimeFormatString(date);
        }

        return value;
    };

    getInitDate(props: DatePickerInputProps, minDate?: Date): Date {
        const { allowRelativeInput, queryColumn, value } = props;
        return getDateFromISO(value, queryColumn, allowRelativeInput, minDate);
    }

    onChange = (date: Date, event?: any): void => {
        const { onChange, formsy, inlineEdit, queryColumn } = this.props;

        this.setState({ selectedDate: date, invalid: false, invalidStart: false });

        if (this.state.relativeInputValue) {
            onChange?.(this.state.relativeInputValue);
        } else {
            const formatted = getDateTimeDisplayValue(date, queryColumn);
            onChange?.(queryColumn.isTimeColumn ? formatted : date, formatted);

            if (formsy) {
                this.props.setValue?.(this.getFormsyValue(date));
            }
        }

        // event is null when selecting time picker
        if (!event && inlineEdit) this.input.current.setFocus();
    };

    onChangeRaw = (event?: any): void => {
        const { queryColumn } = this.props;
        const value = event?.target?.value;

        if (queryColumn.isTimeColumn) {
            // Issue 50010: Time picker enters the wrong time if a time field has a format set
            this.onChange(parseTime(value), undefined);
        } else if (isRelativeDateFilterValue(value)) {
            this.setState({ relativeInputValue: value });
            this.props.onChange?.(value);
        } else {
            this.setState({ relativeInputValue: undefined });
        }
    };

    onIconClick = (): void => {
        this.input.current?.setFocus();
    };

    onSelect = (): void => {
        // focus the input so an onBlur action gets triggered after selection has been made
        this.input.current?.setFocus();
    };

    /**
     * This method returns the current value OR the current date with seconds and milliseconds set to zero. It is
     * important to set milliseconds to zero because there is a bug in react-datepicker that causes it to set the
     * milliseconds to the current milliseconds when the user first selects a value, even if the UI shows 0
     * milliseconds. If there is a pre-existing value, or openToDate has zero ms, then the selections will always be
     * correct.
     *
     * See Issue 53577
     */
    getOpenToDate = (): Date => {
        const { selectedDate } = this.state;

        if (selectedDate) return selectedDate;

        const now = new Date();
        now.setSeconds(0);
        now.setMilliseconds(0);
        return now;
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
            hasMixedValue
        } = this.props;
        const { isDisabled, selectedDate, invalid, invalidStart } = this.state;
        const { dateFormat, timeFormat } = getPickerDateAndTimeFormat(queryColumn, hideTime, selectedDate);
        const altDateFormats = getAltParseFormats(dateFormat);
        const validValueInvalidStart = !invalid && invalidStart;
        const isTimeOnly = queryColumn.isTimeColumn;
        const placeHolderText = hasMixedValue && isDisabled ? MIXED_VALUE_DISPLAY : (placeholderText ?? `Select ${queryColumn.caption.toLowerCase()}`);
        const picker = (
            <DatePicker
                autoComplete="off"
                autoFocus={autoFocus}
                className={inputClassName}
                dateFormat={altDateFormats.length > 1 ? altDateFormats : dateFormat}
                disabled={isDisabled}
                id={queryColumn.fieldKey}
                isClearable={isClearable}
                name={name ? name : queryColumn.fieldKey}
                onBlur={inlineEdit ? onBlur : undefined}
                onCalendarClose={onCalendarClose}
                onChange={this.onChange}
                onChangeRaw={allowRelativeInput || isTimeOnly ? this.onChangeRaw : undefined}
                onKeyDown={onKeyDown}
                onMonthChange={this.onChange}
                onSelect={inlineEdit ? this.onSelect : undefined}
                openToDate={this.getOpenToDate()}
                placeholderText={placeHolderText}
                ref={this.input}
                selected={invalid ? null : selectedDate}
                shouldCloseOnSelect={inlineEdit ? false : undefined}
                showTimeSelect={!hideTime && (isDateTimeCol(queryColumn) || isTimeOnly) && !validValueInvalidStart}
                showTimeSelectOnly={!hideTime && isTimeOnly}
                timeFormat={timeFormat}
                timeIntervals={isTimeOnly ? 10 : 30}
                value={allowRelativeInput && !isTimeOnly && isRelativeDateFilterValue(value) ? value : undefined}
                wrapperClassName={inputWrapperClassName}
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
                    <label className={labelClassName} htmlFor={queryColumn.fieldKey}>
                        {renderFieldLabel(queryColumn)}
                        {queryColumn?.required && <span className="required-symbol"> *</span>}
                    </label>
                ) : (
                    <FieldLabel
                        column={queryColumn}
                        isDisabled={isDisabled}
                        label={label}
                        labelOverlayProps={{
                            isFormsy: false,
                            inputId: queryColumn.fieldKey,
                            required: queryColumn.required,
                            addLabelAsterisk,
                            labelClass: allowDisable ? undefined : labelClassName,
                        }}
                        showLabel={showLabel}
                        showToggle={allowDisable}
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
const DatePickerInputFormsy = withFormsy<DatePickerInputProps, string>(DatePickerInputImpl);

export const DatePickerInput: FC<DatePickerInputProps> = props => {
    const { formsy = true } = props;
    if (formsy) {
        return <DatePickerInputFormsy name={props.name ?? props.queryColumn.fieldKey} {...props} formsy />;
    }
    return <DatePickerInputImpl {...(props as DatePickerInputImplProps)} formsy={false} />;
};

DatePickerInput.displayName = 'DatePickerInput';
