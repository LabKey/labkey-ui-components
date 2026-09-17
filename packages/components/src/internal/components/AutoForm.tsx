/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { ChangeEvent, FC, useCallback } from 'react';

import { HelpIcon } from './HelpIcon';
import { DateInput } from './DateInput';
import { getDateFNSDateTimeFormat } from '../util/Date';

const INPUT_CLASSES = {
    checkbox: 'form-check',
    number: 'form-control',
    radio: 'radio-inline',
    select: 'form-control',
    text: 'form-control',
    textarea: 'form-control',
};

/**
 * See Option in platform/api/org/labkey/api/formSchema
 */
export interface Option<T> {
    label: string;
    value: T;
}

/**
 * See Field in platform/api/org/labkey/api/formSchema
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Field<T = any> {
    defaultValue?: T;
    helpText?: string;
    helpTextHref?: string;
    label: string;
    name: string;
    // Options are used in Select and Radio fields.
    options?: Option<T>[];
    placeholder?: string;
    required?: boolean;
    type: string;
}

/**
 * See FormSchema in platform/api/org/labkey/api/formSchema
 */
export interface FormSchema {
    fields: Field[];
}

export interface FieldClassProps {
    // className for the div that wraps each field component
    fieldWrapperCls?: string;
    // A map of input types to classNames (see INPUT_CLASSES for the default values)
    inputClasses?: Record<string, string>;
    // className for the div that wraps each input element
    inputWrapperCls?: string;
    // className for the label element
    labelCls?: string;
    // className for the div that wraps the label element
    labelWrapperCls?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface AutoFormFieldProps<T = any> extends FieldClassProps {
    field: Field<T>;
    id: string;
    onChange: (name: string, value: T) => void;
    value: T;
}

export interface LabelProps {
    cls?: string;
    field: Field;
    id: string;
    wrapperCls?: string;
}

const Label: FC<LabelProps> = ({ cls, field, id, wrapperCls }) => {
    const { helpText, helpTextHref, label, required } = field;
    const text = `${label}${required ? '*' : ''}`;
    let helpEl;

    if (helpText) {
        let helpLink;
        if (helpTextHref) {
            helpLink = (
                <p>
                    <a href={helpTextHref} rel="noopener noreferrer" target="_blank">
                        More info
                    </a>
                </p>
            );
        }
        helpEl = (
            <HelpIcon>
                <p>{helpText}</p>
                {helpLink}
            </HelpIcon>
        );
    }

    return (
        <div className={wrapperCls}>
            <label className={cls} htmlFor={id}>
                {text} {helpEl}
            </label>
        </div>
    );
};
Label.displayName = 'Label';

const TextInput: FC<AutoFormFieldProps> = ({ field, id, inputClasses, onChange, value }) => {
    const { name, placeholder } = field;
    const _onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => onChange(name, event.target.value), [name]);
    const className = inputClasses.text ?? '';
    const _value = value === null || value === undefined ? '' : value;
    return (
        <input
            className={className}
            id={id}
            name={name}
            onChange={_onChange}
            placeholder={placeholder}
            type="text"
            value={_value}
        />
    );
};
TextInput.displayName = 'TextInput';

const NumberInput: FC<AutoFormFieldProps> = ({ field, id, inputClasses, onChange, value }) => {
    const { name, placeholder } = field;
    const _onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => onChange(name, event.target.value), [name]);
    const className = inputClasses.number ?? '';
    const _value = value === null || value === undefined ? '' : value;
    return (
        <input
            className={className}
            id={id}
            inputMode="numeric"
            name={name}
            onChange={_onChange}
            pattern="[0-9]*"
            placeholder={placeholder}
            type="text"
            value={_value}
        />
    );
};
NumberInput.displayName = 'NumberInput';

const TextareaInput: FC<AutoFormFieldProps> = ({ field, id, inputClasses, onChange, value }) => {
    const { name, placeholder } = field;
    const _onChange = useCallback(
        (event: ChangeEvent<HTMLTextAreaElement>) => onChange(name, event.target.value),
        [name, onChange]
    );
    const className = inputClasses.textarea ?? '';
    const _value = value === null || value === undefined ? '' : value;
    return (
        <textarea
            className={className}
            id={id}
            name={field.name}
            onChange={_onChange}
            placeholder={placeholder}
            value={_value}
        />
    );
};
TextareaInput.displayName = 'TextareaInput';

const CheckboxInput: FC<AutoFormFieldProps> = ({ field, id, inputClasses, onChange, value }) => {
    const _onChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => onChange(field.name, event.target.checked === true),
        [field.name]
    );
    const className = inputClasses.checkbox ?? '';
    return (
        <input
            checked={value === true}
            className={className}
            id={id}
            name={field.name}
            onChange={_onChange}
            type="checkbox"
        />
    );
};
CheckboxInput.displayName = 'CheckboxInput';

const SelectInput: FC<AutoFormFieldProps> = ({ field, id, inputClasses, onChange, value }) => {
    const { name, options, placeholder } = field;
    const _onChange = useCallback(
        (event: ChangeEvent<HTMLSelectElement>) => {
            const value_ = event.target.value;
            onChange(name, value_ === '' ? null : value_);
        },
        [name]
    );
    const _value = value === null || value === undefined ? '' : value;
    const className = inputClasses.select ?? '';
    const hasPlaceholder = placeholder !== null && placeholder !== undefined;
    return (
        <select className={className} id={id} name={name} onChange={_onChange} value={_value}>
            {hasPlaceholder && <option value="">{placeholder}</option>}
            {options.map(option => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
};
SelectInput.displayName = 'SelectInput';

const RadioInput: FC<AutoFormFieldProps> = ({ field, inputClasses, onChange, value }) => {
    const { name, options } = field;
    const _onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => onChange(name, event.target.value), [name]);
    const className = inputClasses.radio ?? '';
    return (
        <div>
            {options.map(option => (
                <label className={className} key={option.value}>
                    <input
                        checked={value === option.value}
                        name={name}
                        onChange={_onChange}
                        type="radio"
                        value={option.value}
                    />
                    {option.label}
                </label>
            ))}
        </div>
    );
};
RadioInput.displayName = 'RadioInput';

/**
 * A DateTime input component for AutoForm. Currently only supported by our Client, the server is not aware of this input
 * type. Expects a Date object as the value, sends a Date object to the onChange callback. Does not use id or
 * inputClasses props from AutoFormFieldProps because our underlying DateInput component does not support overriding the
 * id or input className.
 */
const DateTimeInput: FC<AutoFormFieldProps<Date>> = ({ field, onChange, value }) => {
    const { name, placeholder } = field;
    const onDateChange = useCallback((date: Date) => onChange(name, date), [name, onChange]);
    return (
        <div className="auto-form-date-input">
            <DateInput
                dateFormat={getDateFNSDateTimeFormat()}
                name={name}
                onChange={onDateChange}
                placeholderText={placeholder}
                selected={value}
                showTimeSelect
            />
        </div>
    );
};
DateTimeInput.displayName = 'DateTimeInput';

const AutoFormField: FC<AutoFormFieldProps> = props => {
    const { field, id, inputWrapperCls, labelCls, labelWrapperCls, fieldWrapperCls } = props;
    const { type } = field;
    return (
        <div className={'auto-form-field ' + fieldWrapperCls}>
            <Label cls={labelCls} field={field} id={id} wrapperCls={labelWrapperCls} />
            <div className={inputWrapperCls}>
                {type === 'text' && <TextInput {...props} />}
                {type === 'textarea' && <TextareaInput {...props} />}
                {type === 'number' && <NumberInput {...props} />}
                {type === 'checkbox' && <CheckboxInput {...props} />}
                {type === 'select' && <SelectInput {...props} />}
                {type === 'radio' && <RadioInput {...props} />}
                {type === 'datetime' && <DateTimeInput {...props} />}
            </div>
        </div>
    );
};
AutoFormField.displayName = 'AutoFormField';

export interface Props extends FieldClassProps {
    formSchema: FormSchema;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange: (name: string, value: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    values: Record<string, any>;
    wrapperCls?: string;
}

/**
 * Generates a form given a FormSchema. FormSchemas are typically generated by LabKey Server, but can be constructed on
 * the client as well.
 * @param props
 * @constructor
 */
export const AutoForm: FC<Props> = props => {
    const {
        formSchema,
        inputClasses = INPUT_CLASSES,
        inputWrapperCls = 'col-sm-8',
        labelCls = 'control-label col-sm-4',
        labelWrapperCls,
        onChange,
        fieldWrapperCls = 'form-group',
        values,
        wrapperCls = 'form-horizontal',
    } = props;

    // Intentionally not wrapping the component in a <form> despite the name. This is because you may use multiple
    // FormSchemas to generate a single form, so it is up to the consumer to wrap in a <form> as appropriate.
    return (
        <div className={'auto-form ' + wrapperCls}>
            {formSchema.fields.map(field => (
                <AutoFormField
                    field={field}
                    fieldWrapperCls={fieldWrapperCls}
                    id={`auto-form-${field.name}`}
                    inputClasses={inputClasses}
                    inputWrapperCls={inputWrapperCls}
                    key={field.name}
                    labelCls={labelCls}
                    labelWrapperCls={labelWrapperCls}
                    onChange={onChange}
                    value={values[field.name]}
                />
            ))}
        </div>
    );
};
AutoForm.displayName = 'AutoForm';
