import React, { FC, useCallback } from 'react';

import { HelpIcon } from './HelpIcon';

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
    defaultValue: T;
    helpText: string;
    helpTextHref: string;
    label: string;
    name: string;
    // Options are used in Select and Radio fields.
    options?: Array<Option<T>>;
    placeholder: string;
    required: boolean;
    type: string;
}

/**
 * See FormSchema in platform/api/org/labkey/api/formSchema
 */
export interface FormSchema {
    fields: Field[];
}

export interface FieldClassProps {
    // A map of input types to classNames (see INPUT_CLASSES for the default values)
    inputClasses?: Record<string, string>;
    // className for the div that wraps each input element
    inputWrapperCls?: string;
    // className for the the label element
    labelCls?: string;
    // className for the div that wraps the label element
    labelWrapperCls?: string;
    // className for the div that wraps each field component
    fieldWrapperCls?: string;
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
                    <a href={helpTextHref} target="_blank" rel="noopener noreferrer">
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

const TextInput: FC<AutoFormFieldProps> = ({ field, id, inputClasses, onChange, value }) => {
    const { name, placeholder } = field;
    const _onChange = useCallback(event => onChange(name, event.target.value), [name]);
    const className = inputClasses.text ?? '';
    const _value = value === null || value === undefined ? '' : value;
    return (
        <input
            className={className}
            id={id}
            name={name}
            placeholder={placeholder}
            type="text"
            value={_value}
            onChange={_onChange}
        />
    );
};

const NumberInput: FC<AutoFormFieldProps> = ({ field, id, inputClasses, onChange, value }) => {
    const { name, placeholder } = field;
    const _onChange = useCallback(event => onChange(name, event.target.value), [name]);
    const className = inputClasses.number ?? '';
    const _value = value === null || value === undefined ? '' : value;
    return (
        <input
            className={className}
            id={id}
            inputMode="numeric"
            name={name}
            pattern="[0-9]*"
            placeholder={placeholder}
            type="text"
            value={_value}
            onChange={_onChange}
        />
    );
};

const TextareaInput: FC<AutoFormFieldProps> = ({ field, id, inputClasses, onChange, value }) => {
    const _onChange = useCallback(event => onChange(field.name, event.target.value), [field.name]);
    const className = inputClasses.textarea ?? '';
    const _value = value === null || value === undefined ? '' : value;
    return <textarea className={className} id={id} name={field.name} value={_value} onChange={_onChange} />;
};

const CheckboxInput: FC<AutoFormFieldProps> = ({ field, id, inputClasses, onChange, value }) => {
    const _onChange = useCallback(event => onChange(field.name, event.target.checked === true), [field.name]);
    const className = inputClasses.checkbox ?? '';
    return (
        <input
            className={className}
            id={id}
            name={field.name}
            type="checkbox"
            onChange={_onChange}
            checked={value === true}
        />
    );
};

const SelectInput: FC<AutoFormFieldProps> = ({ field, id, inputClasses, onChange, value }) => {
    const { name, options, placeholder } = field;
    const _onChange = useCallback(
        event => {
            const value_ = event.target.value;
            onChange(name, value_ === '' ? null : value_);
        },
        [name]
    );
    const _value = value === null || value === undefined ? '' : value;
    const className = inputClasses.select ?? '';
    return (
        <select className={className} id={id} name={name} value={_value} onChange={_onChange}>
            {placeholder !== null && <option value="">{placeholder}</option>}
            {options.map(option => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
};

const RadioInput: FC<AutoFormFieldProps> = ({ field, inputClasses, onChange, value }) => {
    const { name, options } = field;
    const _onChange = useCallback(event => onChange(name, event.target.value), [name]);
    const className = inputClasses.radio ?? '';
    return (
        <div>
            {options.map(option => (
                <label className={className} key={option.value}>
                    <input
                        name={name}
                        type="radio"
                        onChange={_onChange}
                        value={option.value}
                        checked={value === option.value}
                    />
                    {option.label}
                </label>
            ))}
        </div>
    );
};

const AutoFormField: FC<AutoFormFieldProps> = props => {
    const { field, id, inputWrapperCls, labelCls, labelWrapperCls, fieldWrapperCls } = props;
    const { type } = field;
    return (
        <div className={'auto-form-field ' + fieldWrapperCls}>
            <Label cls={labelCls} wrapperCls={labelWrapperCls} field={field} id={id} />
            <div className={inputWrapperCls}>
                {type === 'text' && <TextInput {...props} />}
                {type === 'textarea' && <TextareaInput {...props} />}
                {type === 'number' && <NumberInput {...props} />}
                {type === 'checkbox' && <CheckboxInput {...props} />}
                {type === 'select' && <SelectInput {...props} />}
                {type === 'radio' && <RadioInput {...props} />}
            </div>
        </div>
    );
};

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
                    key={field.name}
                    field={field}
                    id={`auto-form-${field.name}`}
                    inputClasses={inputClasses}
                    inputWrapperCls={inputWrapperCls}
                    labelCls={labelCls}
                    labelWrapperCls={labelWrapperCls}
                    onChange={onChange}
                    fieldWrapperCls={fieldWrapperCls}
                    value={values[field.name]}
                />
            ))}
        </div>
    );
};
