import React from 'react';
import { FormsyContext } from './FormsyContext';
import {
    ComponentWithStaticAttributes,
    FormsyContextInterface,
    InjectedProps,
    FormsyInjectedProps,
    RequiredValidation,
    ValidationError,
    Validations,
    WrappedComponentClass,
    WrapperInstanceMethods,
    WrapperProps,
    WrapperState,
} from './types';

import { isSame, isString } from './utils';
import { isDefaultRequiredValue } from './validationRules';

function convertValidationsToObject<V>(validations: false | Validations<V>): Validations<V> {
    if (isString(validations)) {
        return validations.split(/,(?![^{[]*[}\]])/g).reduce((validationsAccumulator, validation) => {
            let args: string[] = validation.split(':');
            const validateMethod: string = args.shift();

            args = args.map((arg) => {
                try {
                    return JSON.parse(arg);
                } catch (e) {
                    return arg; // It is a string if it can not parse it
                }
            });

            if (args.length > 1) {
                throw new Error(
                    'Formsy does not support multiple args on string validations. Use object format of validations instead.',
                );
            }

            // Avoid parameter reassignment
            const copy: Validations<V> = { ...validationsAccumulator };
            copy[validateMethod] = args.length ? args[0] : true;
            return copy;
        }, {});
    }

    return validations || {};
}

function getDisplayName(component: WrappedComponentClass) {
    return component.displayName || component.name || (isString(component) ? component : 'Component');
}

function isChanged(a: object, b: object): boolean {
    return Object.keys(a).some(k => a[k] !== b[k]);
}

export function withFormsy<T, V>(
    WrappedComponent: React.ComponentType<T & FormsyInjectedProps<V>>,
): React.ComponentType<Omit<T & WrapperProps<V>, keyof InjectedProps<V>>> {
    type WrappedProps = T & WrapperProps<V> & FormsyContextInterface;

    class WithFormsyWrapper extends React.Component<WrappedProps, WrapperState<V>> implements WrapperInstanceMethods<V> {
        public validations?: Validations<V>;
        public requiredValidations?: Validations<V>;
        public static displayName = `Formsy(${getDisplayName(WrappedComponent)})`;

        static defaultProps = {
            innerRef: null,
            required: false,
            validationError: '',
            validationErrors: {},
            validations: null,
            value: (WrappedComponent as ComponentWithStaticAttributes).defaultValue,
        };

        constructor(props: WrappedProps) {
            super(props);
            const { runValidation, validations, required, value } = props;

            this.state = { value } as any;

            this.setValidations(validations, required);

            this.state = {
                formSubmitted: false,
                isPristine: true,
                pristineValue: props.value,
                value: props.value,
                ...runValidation(this, props.value as any),
            };
        }

        componentDidMount() {
            const { name, attachToForm } = this.props;

            if (!name) {
                throw new Error('Form Input requires a name property when used');
            }

            attachToForm(this);
        }

        shouldComponentUpdate(nextProps, nextState): boolean {
            return isChanged(this.props, nextProps) || isChanged(this.state, nextState);
        }

        componentDidUpdate(prevProps) {
            const { value, validations, required, validate } = this.props;

            // If the value passed has changed, set it. If value is not passed it will
            // internally update, and this will never run
            if (!isSame(value, prevProps.value)) {
                this.setValue(value);
            }

            // If validations or required is changed, run a new validation
            if (!isSame(validations, prevProps.validations) || !isSame(required, prevProps.required)) {
                this.setValidations(validations, required);
                validate(this);
            }
        }

        componentWillUnmount() {
            this.props.detachFromForm(this);
        }

        getErrorMessage = (): ValidationError | null => {
            const messages = this.getErrorMessages();
            return messages.length ? messages[0] : null;
        };

        getErrorMessages = (): ValidationError[] => {
            if (!this.isValid() || this.showRequired()) {
                return this.state.validationError || [];
            }
            return [];
        };

        getValue = (): V => this.state.value;

        hasValue = () => isDefaultRequiredValue(this.state.value);

        isFormDisabled = (): boolean => this.props.isFormDisabled;

        isFormSubmitted = (): boolean => this.state.formSubmitted;

        isPristine = (): boolean => this.state.isPristine;

        isRequired = (): boolean => !!this.props.required;

        isValid = (): boolean => this.state.isValid;

        isValidValue = (value: V) => this.props.isValidValue(this, value);

        resetValue = (): void => {
            this.setState(state => ({ isPristine: true, value: state.pristineValue }), () => { this.props.validate(this); });
        };

        setValidations = (validations: Validations<V>, required: RequiredValidation<V>): void => {
            // Add validations to the store itself as the props object can not be modified
            this.validations = convertValidationsToObject(validations) || {};
            this.requiredValidations =
                required === true ? { isDefaultRequiredValue: required } : convertValidationsToObject(required);
        };

        // By default, we validate after the value has been set.
        // A user can override this and pass a second parameter of `false` to skip validation.
        setValue = (value: V, validate = true): void => {
            const { validate: validateForm } = this.props;

            if (!validate) {
                this.setState({ value });
            } else {
                this.setState({ isPristine: false, value }, () => { validateForm(this); });
            }
        };

        showError = (): boolean => !this.showRequired() && !this.isValid();

        showRequired = (): boolean => this.state.isRequired;

        render() {
            const { innerRef } = this.props;
            const propsForElement: T & FormsyInjectedProps<V> = {
                ...this.props,
                errorMessage: this.getErrorMessage(),
                errorMessages: this.getErrorMessages(),
                hasValue: this.hasValue(),
                isFormDisabled: this.isFormDisabled(),
                isFormSubmitted: this.isFormSubmitted(),
                isPristine: this.isPristine(),
                isRequired: this.isRequired(),
                isValid: this.isValid(),
                isValidValue: this.isValidValue,
                resetValue: this.resetValue,
                setValidations: this.setValidations,
                setValue: this.setValue,
                showError: this.showError(),
                showRequired: this.showRequired(),
                value: this.getValue(),
            };

            if (innerRef) {
                propsForElement.ref = innerRef;
            }

            return (
                <FormsyContext.Consumer>
                    {context => <WrappedComponent {...propsForElement as any} {...context} />}
                </FormsyContext.Consumer>
            );
        }
    }

    return WithFormsyWrapper as any;
}
