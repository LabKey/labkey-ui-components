import React, { Component } from 'react';

import { FormsyContext } from './FormsyContext';
import {
    FormsyContextInterface,
    IModel,
    InputComponent,
    IResetModel,
    IUpdateInputsWithError,
    IUpdateInputsWithValue,
    OnSubmitCallback,
    FormsyInjectedProps,
    RunValidationResponse,
    Values,
} from './types';
import { debounce, isObject, isSame, isString, protectAgainstParamReassignment, runRules } from './utils';
import { validationRules } from './validationRules';

export type FormHTMLAttributesCleaned = Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onChange' | 'onSubmit'>;

export interface FormsyProps extends FormHTMLAttributesCleaned {
    disabled: boolean;
    mapping?: (model: IModel) => IModel;
    onChange: (model: IModel, isChanged: boolean) => void;
    onInvalid: () => void;
    onReset?: () => void;
    onSubmit?: OnSubmitCallback;
    onValidSubmit?: OnSubmitCallback;
    onInvalidSubmit: OnSubmitCallback;
    onValid: () => void;
    preventDefaultSubmit?: boolean;
    preventExternalInvalidation?: boolean;
    validationErrors?: null | object;
}

export interface FormsyState {
    canChange: boolean;
    contextValue: FormsyContextInterface;
    formSubmitted?: boolean;
    isPristine?: boolean;
    isSubmitting: boolean;
    isValid: boolean;
}

const ONE_RENDER_FRAME = 66;

function noop(): void {
    // do nothing.
}

export class Formsy extends Component<FormsyProps, FormsyState> {

    static defaultProps: Partial<FormsyProps> = {
        disabled: false,
        onChange: noop,
        onInvalid: noop,
        onInvalidSubmit: noop,
        onReset: noop,
        onValid: noop,
        preventDefaultSubmit: true,
        preventExternalInvalidation: false,
        validationErrors: {},
    };

    public inputs: InstanceType<any & FormsyInjectedProps<any>>[];
    public emptyArray: any[];
    private _mounted = true;
    public prevInputNames: any[] | null = null;
    private readonly debouncedValidateForm: () => void;

    constructor(props: FormsyProps) {
        super(props);

        this.inputs = [];
        this.emptyArray = [];

        this.state = {
            canChange: false,
            contextValue: {
                attachToForm: this.attachToForm,
                detachFromForm: this.detachFromForm,
                isFormDisabled: props.disabled,
                isValidValue: this.isValidValue,
                validate: this.validate,
                runValidation: this.runValidation,
            },
            isSubmitting: false,
            isValid: true,
        };

        this.debouncedValidateForm = debounce(this.validateForm, ONE_RENDER_FRAME);
    }

    componentDidMount() {
        this.prevInputNames = this.inputs.map(c => c.props.name);
        this.validateForm();
    }

    componentDidUpdate(prevProps: FormsyProps) {
        const { validationErrors, disabled } = this.props;

        if (validationErrors && isObject(validationErrors) && Object.keys(validationErrors).length > 0) {
            this.setInputValidationErrors(validationErrors);
        }

        const newInputNames = this.inputs.map(c => c.props.name);
        if (this.prevInputNames && !isSame(this.prevInputNames, newInputNames)) {
            this.prevInputNames = newInputNames;
            this.validateForm();
        }

        // Keep the disabled value in state/context the same as from props
        if (disabled !== prevProps.disabled) {
            if (!this._mounted) return;
            // eslint-disable-next-line
            this.setState(state => ({
                contextValue: { ...state.contextValue, isFormDisabled: disabled },
            }));
        }
    }

    componentWillUnmount(): void {
        this._mounted = false;
    }

    // Method put on each input component to register itself to the form
    attachToForm = (component: InputComponent<any>): void => {
        if (this.inputs.indexOf(component) === -1) {
            this.inputs.push(component);
        }

        this.triggerChange();
        this.debouncedValidateForm();
    };

    // Method put on each input component to unregister itself from the form
    detachFromForm = (component: InputComponent<any>): void => {
        this.inputs = this.inputs.filter(i => i !== component);
        this.debouncedValidateForm();
    };

    getCurrentValues = (): Values => {
        return this.inputs.reduce<Values>((values, component) => {
            const { props: { name }, state: { value } } = component;
            values[name] = protectAgainstParamReassignment(value);
            return values;
        }, {});
    };

    getModel = (): IModel => this.mapModel(this.getCurrentValues());

    getPristineValues = () => {
        return this.inputs.reduce((values, component) => {
            const { props: { name, value } } = component;
            values[name] = protectAgainstParamReassignment(value);
            return values;
        }, {});
    };

    // Checks if the values have changed from their initial value
    isChanged = (): boolean => !isSame(this.getPristineValues(), this.getCurrentValues());

    isFormDisabled = () => this.props.disabled;

    isValidValue = (component, value) => this.runValidation(component, value).isValid;

    mapModel = (model: IModel): IModel => {
        const { mapping } = this.props;

        if (mapping) {
            return mapping(model);
        }

        const returnModel = {};
        Object.keys(model).forEach((key) => {
            returnModel[key] = model[key];
        });
        return returnModel;
    };

    reset = (model?: IModel): void => {
        this.setFormPristine(true);
        this.resetModel(model);
    };

    resetInternal = (event): void => {
        const { onReset } = this.props;
        event.preventDefault();
        this.reset();
        onReset?.();
    };

    // Reset each key in the model to the original / initial / specified value
    resetModel: IResetModel = (data): void => {
        this.inputs.forEach(component => {
            const { name } = component.props;
            if (data && data.hasOwnProperty(name)) {
                component.setValue(data[name]);
            } else {
                component.resetValue();
            }
        });
        this.validateForm();
    };

    // Checks validation on current value or a passed value
    runValidation = (component: InputComponent<any>, value = component.state.value): RunValidationResponse => {
        const { validationErrors } = this.props;
        const { validationError, validationErrors: componentValidationErrors, name } = component.props;
        const currentValues = this.getCurrentValues();
        const validationResults = runRules(value, currentValues, component.validations, validationRules);
        const requiredResults = runRules(value, currentValues, component.requiredValidations, validationRules);
        const isRequired = Object.keys(component.requiredValidations).length ? !!requiredResults.success.length : false;
        const isValid = !validationResults.failed.length && !(validationErrors && validationErrors[component.props.name]);

        return {
            isRequired,
            isValid: isRequired ? false : isValid,
            validationError: (() => {
                if (isValid && !isRequired) {
                    return this.emptyArray;
                }

                if (validationResults.errors.length) {
                    return validationResults.errors;
                }

                if (validationErrors && validationErrors[name]) {
                    return isString(validationErrors[name]) ? [validationErrors[name]] : validationErrors[name];
                }

                if (isRequired) {
                    const error = componentValidationErrors[requiredResults.success[0]] || validationError;
                    return error ? [error] : null;
                }

                if (validationResults.failed.length) {
                    return validationResults.failed
                        .map((failed) => (componentValidationErrors[failed] ? componentValidationErrors[failed] : validationError))
                        .filter((x, pos, arr) => arr.indexOf(x) === pos); // remove duplicates
                }

                return undefined;
            })(),
        };
    };

    setFormPristine = (isPristine: boolean): void => {
        if (!this._mounted) return;

        this.setState({ formSubmitted: !isPristine });

        // Iterate through each component and set it as pristine
        // or "dirty".
        this.inputs.forEach(component => {
            component.setState({ formSubmitted: !isPristine, isPristine });
        });
    };

    setFormValidState = (isValid: boolean): void => {
        if (!this._mounted) return;
        const { onValid, onInvalid } = this.props;

        this.setState({ isValid });

        isValid ? onValid() : onInvalid();
    };

    setInputValidationErrors = (errors): void => {
        if (!this._mounted) return;
        const { preventExternalInvalidation } = this.props;
        const { isValid } = this.state;

        this.inputs.forEach((component) => {
            const { name } = component.props;
            component.setState({
                isValid: !(name in errors),
                validationError: isString(errors[name]) ? [errors[name]] : errors[name],
            });
        });
        if (!preventExternalInvalidation && isValid) {
            this.setFormValidState(false);
        }
    };

    // Update model, submit to url prop and send the model
    submit = (event?: React.SyntheticEvent<HTMLFormElement>): void => {
        const { onSubmit, onValidSubmit, onInvalidSubmit, preventDefaultSubmit } = this.props;
        const { isValid } = this.state;

        if (preventDefaultSubmit && event && event.preventDefault) {
            event.preventDefault();
        }

        // Trigger form as not pristine.
        // If any inputs have not been touched yet this will make them dirty
        // so validation becomes visible (if based on isPristine)
        this.setFormPristine(false);
        const model = this.getModel();
        onSubmit?.(model, this.resetModel, this.updateInputsWithError, event);

        if (isValid) {
            onValidSubmit?.(model, this.resetModel, this.updateInputsWithError, event);
        } else {
            onInvalidSubmit(model, this.resetModel, this.updateInputsWithError, event);
        }
    };

    triggerChange = (): void => {
        if (this.state.canChange) {
            this.props.onChange(this.getModel(), this.isChanged());
        }
    };

    // Go through errors from server and grab the components
    // stored in the inputs map. Change their state to invalid
    // and set the serverError message
    updateInputsWithError: IUpdateInputsWithError = (errors, invalidate): void => {
        if (!this._mounted) return;
        const { preventExternalInvalidation } = this.props;
        const { isValid } = this.state;

        Object.entries(errors).forEach(([name, error]) => {
            const component = this.inputs.find((input) => input.props.name === name);
            if (!component) {
                throw new Error(
                    `You are trying to update an input that does not exist. Verify errors object with input names. ${JSON.stringify(errors)}`,
                );
            }
            component.setState({
                isValid: preventExternalInvalidation,
                validationError: isString(error) ? [error] : error,
            });
        });

        if (invalidate && isValid) {
            this.setFormValidState(false);
        }
    };

    // Set the value of components
    updateInputsWithValue: IUpdateInputsWithValue<any> = (data, validate): void => {
        this.inputs.forEach(component => {
            const { name } = component.props;
            if (data && data.hasOwnProperty(name)) {
                component.setValue(data[name], validate);
            }
        });
    };

    // Use the binded values and the actual input value to
    // validate the input and set its state. Then check the
    // state of the form itself
    validate = (component: InputComponent<any>): void => {
        if (!this._mounted) return;
        this.triggerChange();

        // Run through the validations, split them up and call
        // the validator IF there is a value or it is required
        component.setState(this.runValidation(component), this.validateForm);
    };

    // We need a callback as we are validating all inputs again.
    // This will run when the last input has set its state
    onValidationComplete = (): void => {
        if (!this._mounted) return;
        this.setFormValidState(this.inputs.every(c => c.state.isValid));

        // Tell the form that it can start to trigger change events
        this.setState({ canChange: true });
    };

    validateForm = (): void => {
        if (!this._mounted) return;
        if (this.inputs.length === 0) {
            this.onValidationComplete();
            return;
        }

        // Run validation again in case affected by other inputs. The
        // last component validated will run the onValidationComplete callback
        this.inputs.forEach((component, index) => {
            const validationState = this.runValidation(component);
            const isLastInput = index === this.inputs.length - 1;
            const callback = isLastInput ? this.onValidationComplete : undefined;
            component.setState(validationState, callback);
        });
    };

    render() {
        const {
            /* eslint-disable @typescript-eslint/no-unused-vars */
            children,
            disabled,
            mapping,
            onChange,
            onInvalid,
            onInvalidSubmit,
            onReset,
            onSubmit,
            onValid,
            onValidSubmit,
            preventDefaultSubmit,
            preventExternalInvalidation,
            validationErrors,
            ...formProps
        } = this.props;
        const { contextValue } = this.state;

        return (
            <FormsyContext.Provider value={contextValue}>
                <form onReset={this.resetInternal} onSubmit={this.submit} {...formProps}>
                    {children}
                </form>
            </FormsyContext.Provider>
        );
    }
}
