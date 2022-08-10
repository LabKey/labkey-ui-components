import React, { FC, FormEvent, memo, ReactNode, useCallback, useMemo, useReducer, useRef, useState } from 'react';
import moment from 'moment';
import classNames from 'classnames';
import Formsy from 'formsy-react';

import { getColDateFormat, getDateFormat, getJsonDateTimeFormatString } from '../util/Date';
import { Key, useEnterEscape } from '../../public/useEnterEscape';
import { DateInput } from './DateInput';
import { useServerContext } from './base/ServerContext';
import { QueryColumn } from '../../public/QueryColumn';
import { resolveDetailEditRenderer } from './forms/detail/DetailEditRenderer';

interface Props {
    allowBlank?: boolean;
    allowEdit?: boolean;
    className?: string;
    column?: QueryColumn;
    emptyText?: string;
    label?: string;
    name: string;
    onChange?: (name: string, newValue: any) => void;
    placeholder?: string;
    type: string;
    value: any; // could be a primitive value or a RowValue (from internal/query/selectRows)
    useJsonDateFormat?: boolean;
}

export const EditInlineField: FC<Props> = memo(props => {
    const {
        allowBlank,
        allowEdit,
        className,
        emptyText,
        label,
        name,
        onChange,
        placeholder,
        type,
        value,
        column,
        useJsonDateFormat,
    } = props;
    const { container } = useServerContext();
    const dateFormat = getDateFormat(container);
    const isDate = type === 'date';
    const isTextArea = type === 'textarea';
    const isText = !isDate && !isTextArea;
    const inputRef = useRef(null);
    const _value = typeof value === 'object' ? value?.value : value;
    const [dateValue, setDateValue] = useState<Date>(isDate && _value ? new Date(_value) : undefined);
    const [columnBasedValue, setColumnBasedValue] = useState();

    // Utilizing useReducer here so multiple state attributes can be updated at once
    const [state, setState] = useReducer((currentState, newState) => ({ ...currentState, ...newState }), {
        editing: false,
        ignoreBlur: false,
    });

    const displayValue = useMemo<ReactNode>(() => {
        if (value?.formattedValue) return value.formattedValue;
        if (value?.displayValue) return value.displayValue;

        // value is of type "any" so it could be a number, boolean, etc. Use explicit value checks.
        if (_value !== undefined && _value !== null && _value !== '') {
            if (isDate) return moment(_value).format(dateFormat);
            return _value?.toString();
        }

        return <span className="edit-inline-field__placeholder">{emptyText}</span>;
    }, [dateFormat, emptyText, isDate, value, _value]);

    const getInputValue = useCallback((): any => {
        if (isDate) {
            if (useJsonDateFormat) return getJsonDateTimeFormatString(dateValue);
            return dateValue?.valueOf();
        }
        if (column) return columnBasedValue;
        return inputRef.current?.value;
    }, [dateValue, isDate, columnBasedValue, column, useJsonDateFormat]);

    const onCancel = (): void => {
        setState({ editing: false, ignoreBlur: true });
    };

    const saveEdit = useCallback(() => {
        const inputValue = getInputValue();

        if (allowBlank === false && !isDate && inputValue.trim() === '') {
            return;
        }

        if (inputValue !== _value) {
            onChange?.(name, inputValue);
        }
        setState({ editing: false });
    }, [allowBlank, getInputValue, isDate, name, onChange, _value]);

    const onBlur = useCallback((): void => {
        if (!state.ignoreBlur) {
            if (allowBlank === false && !isDate && getInputValue().trim() === '') {
                onCancel();
            } else {
                saveEdit();
            }
        }
        setState({ ignoreBlur: false });
    }, [allowBlank, getInputValue, isDate, saveEdit, state.ignoreBlur]);

    const onDateChange = useCallback((date: Date | [Date, Date]) => {
        if (date instanceof Array) throw new Error('Unsupported date type');
        setDateValue(date);
    }, []);

    const onFormsyColumnChange = useCallback((data: Record<string, any>) => {
        setColumnBasedValue(data[column.fieldKey]);
    }, [column]);

    const onKeyDown = useEnterEscape(saveEdit, onCancel);

    // This is used in conjunction with the input-resizer class  to get the input field to resize based on the size of the value.
    const onInputChange = useCallback((event: FormEvent<HTMLInputElement>) => {
        event.currentTarget.parentElement.dataset.value = event.currentTarget.value + '';
    }, []);

    const toggleEdit = useCallback(() => {
        if (allowEdit) {
            setState({ editing: !state.editing });
        }
    }, [allowEdit, state.editing]);

    const toggleKeyDown = useCallback(
        (evt: React.KeyboardEvent) => {
            if (evt.key === Key.ENTER) toggleEdit();
        },
        [toggleEdit]
    );

    // When focusing on a <textarea /> the default browser behavior is to set the cursor
    // to the beginning of the text. For <input type="text" /> the default browser behavior
    // is to set the cursor to the end of the text. This makes the <textarea /> utilized by
    // this component behave like an <input /> and sets the cursor to the end.
    const onTextAreaFocus = useCallback((evt: React.FocusEvent<HTMLTextAreaElement>) => {
        const valueLength = evt.target.value.length;

        if (valueLength > 0) {
            evt.target.setSelectionRange(valueLength, valueLength);
        }
    }, []);

    return (
        <div className={className}>
            {state.editing && isDate && (
                <DateInput
                    autoFocus
                    name={name}
                    onBlur={onBlur}
                    onKeyDown={onKeyDown}
                    onChange={onDateChange}
                    placeholderText={placeholder}
                    selected={dateValue}
                    showTimeSelect={!!column}
                    dateFormat={getColDateFormat(column, column ? undefined : getDateFormat())}
                />
            )}
            {state.editing && isTextArea && (
                <span className="input-group">
                    <textarea
                        autoFocus
                        className="form-control"
                        cols={50}
                        defaultValue={_value}
                        onBlur={onBlur}
                        onFocus={onTextAreaFocus}
                        onKeyDown={onKeyDown}
                        name={name}
                        placeholder={placeholder}
                        ref={inputRef}
                        rows={5}
                    />
                </span>
            )}
            {state.editing && column && !isDate && (
                <Formsy className="form-horizontal" onChange={onFormsyColumnChange}>
                    {resolveDetailEditRenderer(column, { hideLabel: true, onBlur, placeholder })(value)}
                </Formsy>
            )}
            {state.editing && !column && isText && (
                <span className="input-group input-sizer">
                    <input
                        autoFocus
                        className="form-control"
                        defaultValue={_value}
                        onBlur={onBlur}
                        onKeyDown={onKeyDown}
                        name={name}
                        placeholder={placeholder}
                        ref={inputRef}
                        type="text"
                        size={Math.max(_value?.length, 20)}
                        onInput={onInputChange}
                    />
                </span>
            )}
            {!state.editing && (
                <>
                    {label && (
                        <span className="edit-inline-field__label" unselectable="on">
                            {label}:
                        </span>
                    )}
                    <span
                        className={classNames({'edit-inline-field__toggle': allowEdit, 'ws-pre-wrap': isTextArea})}
                        onClick={toggleEdit}
                        onKeyDown={toggleKeyDown}
                        tabIndex={1}
                    >
                        {isTextArea && ( // Edit pencil sits to the right of label for textarea with value below
                            <>
                                {allowEdit && <i className="fa fa-pencil" />}
                                <div />
                            </>
                        )}
                        {displayValue}
                        {!isTextArea && allowEdit && <i className="fa fa-pencil" />}
                    </span>
                </>
            )}
        </div>
    );
});

EditInlineField.defaultProps = {
    className: 'edit-inline-field',
};
