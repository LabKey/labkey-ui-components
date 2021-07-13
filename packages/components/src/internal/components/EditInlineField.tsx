import React, { FC, memo, ReactNode, useCallback, useMemo, useReducer, useRef, useState } from 'react';
import moment from 'moment';

import { getDateFormat } from '../util/Date';

import { Key, useEnterEscape } from '../../public/useEnterEscape';

import { DateInput } from './DateInput';

interface EditInlineField {
    allowBlank?: boolean;
    allowEdit?: boolean;
    dateFormat?: string; // Moment date format
    emptyText?: string;
    label?: string;
    name: string;
    onChange?: (name: string, newValue: any) => void;
    placeholder?: string;
    type: 'date' | 'text' | 'textarea';
    value: any;
}

export const EditInlineField: FC<EditInlineField> = memo(props => {
    const { allowBlank, allowEdit, emptyText, label, name, onChange, placeholder, type, value } = props;
    const dateFormat = props.dateFormat ? props.dateFormat : getDateFormat();
    const isDate = type === 'date';
    const isText = type === 'text';
    const isTextArea = type === 'textarea';
    const inputRef = useRef(null);
    const [dateValue, setDateValue] = useState<Date>(isDate && value !== undefined ? new Date(value) : undefined);

    // Utilizing useReducer here so multiple state attributes can be updated at once
    const [state, setState] = useReducer((currentState, newState) => ({ ...currentState, ...newState }), {
        editing: false,
        ignoreBlur: false,
    });

    const displayValue = useMemo<ReactNode>(() => {
        // value is of type "any" so it could be a number, boolean, etc. Use explicit value checks.
        if (value !== undefined && value !== null && value !== '') {
            if (isDate) return moment(value).format(dateFormat);
            return value;
        }

        return <span className="edit-inline-field__placeholder">{emptyText}</span>;
    }, [dateFormat, emptyText, isDate, value]);

    const getInputValue = useCallback((): any => {
        if (isDate) return dateValue?.valueOf();
        return inputRef.current?.value;
    }, [dateValue, isDate]);

    const onCancel = (): void => {
        setState({ editing: false, ignoreBlur: true });
    };

    const saveEdit = useCallback(() => {
        const inputValue = getInputValue();

        if (allowBlank === false && !isDate && inputValue.trim() === '') {
            return;
        }

        if (inputValue !== value) {
            onChange?.(name, inputValue);
        }
        setState({ editing: false });
    }, [allowBlank, getInputValue, isDate, name, onChange, value]);

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

    const onKeyDown = useEnterEscape(saveEdit, onCancel);

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
        <div className="edit-inline-field">
            {state.editing && isDate && (
                <DateInput
                    autoFocus
                    name={name}
                    onBlur={onBlur}
                    onKeyDown={onKeyDown}
                    onChange={onDateChange}
                    placeholderText={placeholder}
                    selected={dateValue}
                />
            )}
            {state.editing && isTextArea && (
                <span className="input-group">
                    <textarea
                        autoFocus
                        className="form-control"
                        cols={50}
                        defaultValue={value}
                        onBlur={onBlur}
                        onFocus={onTextAreaFocus}
                        onKeyDown={onKeyDown}
                        name={name}
                        ref={inputRef}
                        rows={5}
                    />
                </span>
            )}
            {state.editing && isText && (
                <span className="input-group">
                    <input
                        autoFocus
                        className="form-control"
                        defaultValue={value}
                        onBlur={onBlur}
                        onKeyDown={onKeyDown}
                        name={name}
                        ref={inputRef}
                        type="text"
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
                        className="edit-inline-field__toggle"
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
