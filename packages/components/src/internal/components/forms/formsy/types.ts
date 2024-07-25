import React, { ComponentClass } from 'react';

export interface Values {
    [key: string]: any;
}

export type IModel = any;
export type IResetModel = (model?: IModel) => void;
export type IUpdateInputsWithValue<V> = (values: { [key: string]: V }, validate?: boolean) => void;
export type IUpdateInputsWithError = (errors: { [key: string]: ValidationError }, invalidate?: boolean) => void;

export type ValidationError = string | React.ReactNode;

export type ValidationFunction<V> = (values: Values, value: V, extra?: any) => boolean | ValidationError;

export type Validation<V> = string | boolean | ValidationFunction<V>;

export type Validations<V> = ValidationsStructure<V> | string | object;

export interface ValidationsStructure<V> {
    [key: string]: Validation<V>;
}

export type RequiredValidation<V> = boolean | Validations<V>;

export interface ComponentWithStaticAttributes extends ComponentClass {
    defaultValue?: any;
}

export type WrappedComponentClass = React.FC | ComponentWithStaticAttributes;

export interface WrapperProps<V> {
    innerRef?: (ref: React.Ref<any>) => void;
    name: string;
    required?: RequiredValidation<V>;
    validationError?: ValidationError;
    validationErrors?: { [key: string]: ValidationError };
    validations?: Validations<V>;
    value?: V;
}

export interface WrapperState<V> {
    [key: string]: unknown;

    formSubmitted: boolean;
    isPristine: boolean;
    isRequired: boolean;
    isValid: boolean;
    pristineValue: V;
    validationError: ValidationError[];
    value: V;
}

export interface InjectedProps<V> {
    errorMessage: ValidationError;
    errorMessages: ValidationError[];
    hasValue: boolean;
    isFormDisabled: boolean;
    isFormSubmitted: boolean;
    isPristine: boolean;
    isRequired: boolean;
    isValid: boolean;
    isValidValue: (value: V) => boolean;
    ref?: React.Ref<any>;
    resetValue: () => void;
    setValidations: (validations: Validations<V>, required: RequiredValidation<V>) => void;
    setValue: (value: V, validate?: boolean) => void;
    showError: boolean;
    showRequired: boolean;
}

export interface WrapperInstanceMethods<V> {
    getErrorMessage: () => null | ValidationError;
    getErrorMessages: () => ValidationError[];
    getValue: () => V;
    isFormDisabled: () => boolean;
    isFormSubmitted: () => boolean;
    isValid: () => boolean;
    isValidValue: (value: V) => boolean;
    setValue: (value: V, validate?: boolean) => void;
}

export type FormsyInjectedProps<V> = WrapperProps<V> & InjectedProps<V>;

export interface InputComponent<V> extends React.Component<WrapperProps<V>, WrapperState<V>> {
    validations?: Validations<V>;
    requiredValidations?: Validations<V>;
}

export type RunValidationResponse = {
    isRequired: boolean;
    isValid: boolean;
    validationError: ValidationError[];
};

export interface FormsyContextInterface {
    attachToForm: (component: InputComponent<any>) => void;
    detachFromForm: (component: InputComponent<any>) => void;
    isFormDisabled: boolean;
    isValidValue: (component: InputComponent<any>, value: any) => boolean;
    validate: (component: InputComponent<any>) => void;
    runValidation: (component: InputComponent<any>, value?: any) => RunValidationResponse;
}

export type OnSubmitCallback = (
    model: IModel,
    resetModel: IResetModel,
    updateInputsWithError: IUpdateInputsWithError,
    event: React.SyntheticEvent<HTMLFormElement>
) => void;
