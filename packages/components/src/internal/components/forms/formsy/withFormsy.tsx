// This file was originally derived from the "formsy-react" package, specifically, v2.3.2.
// Credit: Christian Alfoni and the Formsy Authors
// Repository: https://github.com/formsy/formsy-react/tree/0226fab133a25
import React from 'react';

import { FormsyContext } from './FormsyContext';
import {
    ComponentWithStaticAttributes,
    FormsyContextInterface,
    FormsyInjectedProps,
    InjectedProps,
    RequiredValidation,
    ValidationError,
    Validations,
    WrapperInstanceMethods,
    WrapperProps,
    WrapperState,
} from './types';

import { isSame, isShallowSame, isString } from './utils';
import { isDefaultRequiredValue } from './formsyRules';

function convertValidationsToObject<V>(validations: false | Validations<V>): Validations<V> {
    if (!isString(validations)) {
        return validations || {};
    }

    return validations.split(/,(?![^{[]*[}\]])/g).reduce((validations_, validation) => {
        let args: string[] = validation.split(':');
        const validateMethod: string = args.shift();

        args = args.map(arg => {
            try {
                return JSON.parse(arg);
            } catch (e) {
                return arg;
            }
        });

        if (args.length > 1) {
            throw new Error(
                'Formsy does not support multiple args on string validations. Use object format of validations instead.'
            );
        }

        // Avoid parameter reassignment
        const copy: Validations<V> = { ...validations_ };
        copy[validateMethod] = args.length ? args[0] : true;
        return copy;
    }, {});
}

function isChanged(a: object, b: object): boolean {
    return Object.keys(a).some(k => a[k] !== b[k]);
}

export function withFormsy<T, V>(
    WrappedComponent: React.ComponentType<FormsyInjectedProps<V> & T>
): React.ComponentType<Omit<T & WrapperProps<V>, keyof InjectedProps<V>>> {
    type WrappedProps = FormsyContextInterface & T & WrapperProps<V>;

    class WithFormsyWrapper
        extends React.Component<WrappedProps, WrapperState<V>>
        implements WrapperInstanceMethods<V>
    {
        validations?: Validations<V>;
        requiredValidations?: Validations<V>;

        static defaultProps = {
            innerRef: null,
            required: false,
            validationError: '',
            validationErrors: {},
            validations: null,
            value: (WrappedComponent as ComponentWithStaticAttributes).defaultValue,
        };

        private _mounted = true;

        constructor(props: WrappedProps) {
            super(props);
            const { runValidation, required, validations, value } = props;

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

        componentDidMount = (): void => {
            const { attachToForm, name } = this.props;

            if (!name) {
                throw new Error('Form Input requires a name property when used');
            }

            attachToForm(this);
        };

        shouldComponentUpdate = (nextProps: WrappedProps, nextState: WrapperState<V>): boolean => {
            return isChanged(this.props, nextProps) || isChanged(this.state, nextState);
        };

        componentDidUpdate = (prevProps: WrappedProps): void => {
            const { required, runValidation, value, validate, validationError, validationErrors, validations } =
                this.props;

            // If the value passed has changed, set it. If a value is not passed, it will internally update, and this
            // will never run. Skip when the input already holds the value: a parent that owns the value and echoes it
            // back would otherwise run a redundant validation pass and fire a duplicate onChange for a value that is
            // already applied.
            if (!isSame(value, prevProps.value) && !isSame(value, this.state.value)) {
                this.setValue(value);
            }

            // If validations or required is changed, run a new validation
            if (!isSame(validations, prevProps.validations) || !isSame(required, prevProps.required)) {
                this.setValidations(validations, required);
                // The rules changed, not the value: revalidate without emitting a change event
                validate(this, false);
                return;
            }

            // Validation messages are resolved when validation runs and are then held in state, so a change to the
            // messages alone -- a message whose content depends on data that loads asynchronously, for example --
            // would not reach the user until some later interaction happened to trigger the next validation pass.
            // Re-resolve the messages against the current props here. The rules and the value are unchanged, so this
            // cannot change the validity of this input and the form does not need to revalidate.
            if (
                !isShallowSame(validationError, prevProps.validationError) ||
                !isShallowSame(validationErrors, prevProps.validationErrors)
            ) {
                const validationState = runValidation(this);
                if (!isShallowSame(validationState.validationError, this.state.validationError)) {
                    this.setState(validationState);
                }
            }
        };

        componentWillUnmount = (): void => {
            this._mounted = false;
            this.props.detachFromForm(this);
        };

        getErrorMessage = (): null | ValidationError => {
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

        /**
         * Restores the input to a pristine state. A supplied value becomes the new pristine baseline, which is how
         * Formsy.resetModel() rebases the form (e.g., after a successful save) so it no longer reports as changed.
         * Called with no arguments, the existing baseline is restored. A rest parameter is used rather than an
         * optional one so that an explicit {undefined} baseline is distinguishable from "no baseline supplied".
         * @param args
         */
        resetValue = (...args: [] | [V]): void => {
            if (!this._mounted) return;
            this.setState(
                state => {
                    const pristineValue = args.length ? args[0] : state.pristineValue;
                    return { isPristine: true, pristineValue, value: pristineValue };
                },
                () => {
                    this.props.validate(this);
                }
            );
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
            if (!this._mounted) return;
            const { validate: validateForm } = this.props;

            if (!validate) {
                this.setState({ value });
            } else {
                this.setState({ isPristine: false, value }, () => {
                    validateForm(this);
                });
            }
        };

        showError = (): boolean => !this.showRequired() && !this.isValid();

        showRequired = (): boolean => this.state.isRequired;

        render() {
            const {
                attachToForm,
                detachFromForm,
                innerRef,
                isFormDisabled,
                isValidValue,
                runValidation,
                validate,
                ...rest
            } = this.props;

            return (
                // @ts-expect-error cannot correctly deduce types of wrapped component
                <WrappedComponent
                    {...rest}
                    errorMessage={this.getErrorMessage()}
                    errorMessages={this.getErrorMessages()}
                    hasValue={this.hasValue()}
                    isFormDisabled={this.isFormDisabled()}
                    isFormSubmitted={this.isFormSubmitted()}
                    isPristine={this.isPristine()}
                    isRequired={this.isRequired()}
                    isValid={this.isValid()}
                    isValidValue={this.isValidValue}
                    ref={innerRef}
                    resetValue={this.resetValue}
                    setValidations={this.setValidations}
                    setValue={this.setValue}
                    showError={this.showError()}
                    showRequired={this.showRequired()}
                    value={this.getValue()}
                />
            );
        }
    }

    return props => (
        <FormsyContext.Consumer>
            {context => <WithFormsyWrapper {...(props as any)} {...context} />}
        </FormsyContext.Consumer>
    );
}
