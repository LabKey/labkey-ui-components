// This file was originally derived from the "formsy-react" package, specifically, v2.3.2.
// Credit: Christian Alfoni and the Formsy Authors
// Repository: https://github.com/formsy/formsy-react/tree/0226fab133a25
import React, { act, FC, memo, PropsWithChildren, useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createEvent, fireEvent, render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { FormsyInjectedProps, ValidationError } from './types';
import { Formsy } from './Formsy';
import { withFormsy } from './withFormsy';
import { addFormsyRule } from './formsyRules';

type FormsyInputProps = FormsyInjectedProps<string> &
    Omit<React.HTMLProps<HTMLInputElement>, 'required' | 'value'> & { testId?: string };

const TestInput = withFormsy<FormsyInputProps, any>(props => {
    const { setValue, type } = props;
    const onChange = useCallback(
        evt => {
            setValue(evt.target[type === 'checkbox' ? 'checked' : 'value']);
        },
        [setValue, type]
    );

    return (
        <input
            data-error-message={props.errorMessage}
            data-error-messages={props.errorMessages.join(';')}
            data-is-form-disabled={props.isFormDisabled}
            data-is-form-submitted={props.isFormSubmitted}
            data-is-pristine={props.isPristine}
            data-is-valid={props.isValid}
            data-testid={props.testId}
            data-value={JSON.stringify(props.value)}
            onChange={onChange}
            type={type || 'text'}
            value={props.value || ''}
        />
    );
});

interface DynamicInputFormProps extends PropsWithChildren {
    inputName?: string;
    onSubmit: (model: any) => void;
}

const DynamicInputForm: FC<DynamicInputFormProps> = props => {
    const { children, inputName, onSubmit } = props;
    const [input, setInput] = useState<React.ReactNode>(null);

    const addInput = useCallback(() => {
        setInput(<TestInput name={inputName} testId="test-input" value="" />);
    }, [inputName]);

    return (
        <>
            <Formsy data-testid="form" onSubmit={onSubmit}>
                {input}
                {children}
            </Formsy>
            <button data-testid="add-input-btn" onClick={addInput} type="button">
                Add input
            </button>
        </>
    );
};

type TestComponentProps = FormsyInjectedProps<string> & { name?: string; testId?: string };

class TestComponent extends React.Component<TestComponentProps> {
    render() {
        const { testId, name } = this.props;
        return <input data-testid={testId} name={name} />;
    }
}

const TestInputHoc = withFormsy<TestComponentProps, any>(TestComponent);

// Mirrors the <QuerySelect/> + <SelectInput/> arrangement: on change the input calls setValue() and notifies its
// parent, and the parent owns the value and feeds it back down through the "value" prop in the same React batch.
type ControlledInputProps = FormsyInjectedProps<string> & {
    onValueChange: (value: string) => void;
    testId?: string;
};

const ControlledInput = withFormsy<ControlledInputProps, string>(props => {
    const { onValueChange, setValue, testId, value } = props;

    const onChange = useCallback(
        evt => {
            setValue(evt.target.value);
            onValueChange(evt.target.value);
        },
        [onValueChange, setValue]
    );

    return <input data-testid={testId} onChange={onChange} value={value ?? ''} />;
});

interface ControlledFormProps {
    initialValue?: string;
    onChange: (model: any, isChanged: boolean) => void;
}

const ControlledForm: FC<ControlledFormProps> = props => {
    const { initialValue, onChange } = props;
    const [value, setValue] = useState<string>(initialValue);

    return (
        <Formsy onChange={onChange}>
            <ControlledInput name="one" onValueChange={setValue} testId="test-input" value={value} />
        </Formsy>
    );
};

describe('Formsy', () => {
    describe('Setting up a form', () => {
        it('should expose the users DOM node through an innerRef prop', () => {
            const refSpy = jest.fn();

            class TestForm extends React.Component {
                render() {
                    return (
                        <Formsy>
                            <TestInputHoc
                                innerRef={(ref: any) => {
                                    if (!ref) {
                                        return;
                                    }

                                    refSpy(ref.constructor.name);
                                }}
                                name="name"
                                testId="test-input"
                            />
                        </Formsy>
                    );
                }
            }

            render(<TestForm />);

            expect(refSpy).toHaveBeenCalledWith('TestComponent');
        });

        it('should render a form into the document', () => {
            const screen = render(<Formsy data-testid="form" />);
            const form = screen.getByTestId('form') as HTMLFormElement;

            expect(form.tagName.toLowerCase()).toEqual('form');
        });

        it('should set a class name if passed', () => {
            const screen = render(<Formsy className="foo" data-testid="form" />);
            const form = screen.getByTestId('form') as HTMLFormElement;

            expect(form.classList.contains('foo')).toBe(true);
        });

        it('should allow for null/undefined children', () => {
            const submitSpy = jest.fn();

            function TestForm() {
                return (
                    <Formsy data-testid="form" onSubmit={formModel => submitSpy(formModel)}>
                        <h1>Test</h1>
                        {null}
                        {undefined}
                        <TestInput name="name" value="foo" />
                    </Formsy>
                );
            }

            const screen = render(<TestForm />);
            const form = screen.getByTestId('form');

            fireEvent.submit(form);

            expect(submitSpy).toHaveBeenCalledWith({ name: 'foo' });
        });

        it('should allow for inputs being added dynamically', () => {
            const submitSpy = jest.fn();

            const screen = render(<DynamicInputForm inputName="test" onSubmit={formModel => submitSpy(formModel)} />);
            const form = screen.getByTestId('form');
            const addInputBtn = screen.getByTestId('add-input-btn');

            fireEvent.click(addInputBtn);
            fireEvent.submit(form);

            expect(submitSpy).toHaveBeenCalledWith({ test: '' });
        });

        it('should allow dynamically added inputs to update the form-model', () => {
            const submitSpy = jest.fn();

            const screen = render(<DynamicInputForm inputName="test" onSubmit={formModel => submitSpy(formModel)} />);
            const form = screen.getByTestId('form');
            const addInputBtn = screen.getByTestId('add-input-btn');

            fireEvent.click(addInputBtn);

            fireEvent.change(screen.getByTestId('test-input'), {
                target: { value: 'foo' },
            });

            fireEvent.submit(form);

            expect(submitSpy).toHaveBeenCalledWith({ test: 'foo' });
        });

        it('should allow a dynamically updated input to update the form-model', () => {
            const submitSpy = jest.fn();

            class TestForm extends React.Component<{ inputValue: any }, { inputValue: any }> {
                constructor(props) {
                    super(props);
                    this.state = { inputValue: props.inputValue };
                }

                updateInputValue = () => this.setState({ inputValue: 'bar' });

                render() {
                    const { inputValue } = this.state;
                    return (
                        <Formsy data-testid="form" onSubmit={formModel => submitSpy(formModel)}>
                            <TestInput name="test" testId="test-input" value={inputValue} />
                            <button data-testid="update-btn" onClick={this.updateInputValue} type="button">
                                Update
                            </button>
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm inputValue="foo" />);
            const form = screen.getByTestId('form');
            const updateBtn = screen.getByTestId('update-btn');

            fireEvent.submit(form);

            expect(submitSpy).toHaveBeenCalledWith({ test: 'foo' });

            fireEvent.click(updateBtn);
            fireEvent.submit(form);

            expect(submitSpy).toHaveBeenCalledWith({ test: 'bar' });
        });
    });

    describe('mapModel', () => {
        it('should honor mapModel transformations', () => {
            const mapping = jest.fn(model => ({
                ...model,
                testChange: true,
            }));
            const onSubmit = jest.fn();

            function TestForm() {
                return (
                    <Formsy data-testid="form" mapping={mapping} onSubmit={onSubmit}>
                        <TestInput name="parent.child" value="test" />
                    </Formsy>
                );
            }

            const screen = render(<TestForm />);
            const form = screen.getByTestId('form');

            fireEvent.submit(form);

            expect(mapping).toHaveBeenCalledWith({ 'parent.child': 'test' });
            expect(onSubmit).toHaveBeenCalledWith(
                { 'parent.child': 'test', testChange: true },
                expect.any(Function),
                expect.any(Function),
                expect.any(Object)
            );
        });
    });

    describe('validations', () => {
        it('should run when the input changes', () => {
            const runRule = jest.fn();
            const notRunRule = jest.fn();

            addFormsyRule('runRule', runRule);
            addFormsyRule('notRunRule', notRunRule);

            const screen = render(
                <Formsy>
                    <TestInput name="one" testId="test-input" validations="runRule" value="foo" />
                </Formsy>
            );

            const input = screen.getByTestId('test-input');
            fireEvent.change(input, {
                target: { value: 'bar' },
            });

            expect(runRule).toHaveBeenCalledWith({ one: 'bar' }, 'bar', true);
            expect(notRunRule).not.toHaveBeenCalled();
        });

        it('should allow the validation to be changed', () => {
            const ruleA = jest.fn();
            const ruleB = jest.fn();
            addFormsyRule('ruleA', ruleA);
            addFormsyRule('ruleB', ruleB);

            class TestForm extends React.Component<{}, { rule: string }> {
                constructor(props) {
                    super(props);
                    this.state = { rule: 'ruleA' };
                }

                changeRule = () => {
                    this.setState({
                        rule: 'ruleB',
                    });
                };

                render() {
                    return (
                        <Formsy>
                            <TestInput name="one" testId="test-input" validations={this.state.rule} value="foo" />
                            <button data-testid="change-rule-btn" onClick={this.changeRule} type="button" />
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm />);
            const changeRuleBtn = screen.getByTestId('change-rule-btn');
            const input = screen.getByTestId('test-input');

            fireEvent.click(changeRuleBtn);

            fireEvent.change(input, {
                target: { value: 'bar' },
            });

            expect(ruleB).toHaveBeenCalledWith({ one: 'bar' }, 'bar', true);
        });

        it('should invalidate a form if dynamically inserted input is invalid', () => {
            const isInValidSpy = jest.fn();
            const isValidSpy = jest.fn();

            class TestForm extends React.Component<{}, { showSecondInput: boolean }> {
                formRef = React.createRef<Formsy>();

                constructor(props) {
                    super(props);
                    this.state = { showSecondInput: false };
                }

                addInput = () => {
                    this.setState({
                        showSecondInput: true,
                    });
                };

                render() {
                    return (
                        <Formsy onInvalid={isInValidSpy} onValid={isValidSpy} ref={this.formRef}>
                            <TestInput name="one" validations="isEmail" value="foo@bar.com" />
                            {this.state.showSecondInput ? (
                                <TestInput name="two" validations="isEmail" value="foo@bar" />
                            ) : null}
                            <button data-testid="add-input-btn" onClick={this.addInput} type="button" />
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm />);
            const addInputBtn = screen.getByTestId('add-input-btn');

            expect(isValidSpy).toHaveBeenCalled();

            fireEvent.click(addInputBtn);

            expect(isInValidSpy).toHaveBeenCalled();
        });

        it('should validate a form when removing an invalid input', () => {
            const isValidSpy = jest.fn();
            const isInValidSpy = jest.fn();

            class TestForm extends React.Component<{}, { showSecondInput: boolean }> {
                formRef = React.createRef<Formsy>();

                constructor(props) {
                    super(props);
                    this.state = { showSecondInput: true };
                }

                removeInput = () => {
                    this.setState({
                        showSecondInput: false,
                    });
                };

                render() {
                    return (
                        <Formsy onInvalid={isInValidSpy} onValid={isValidSpy} ref={this.formRef}>
                            <TestInput name="one" validations="isEmail" value="foo@bar.com" />
                            {this.state.showSecondInput ? (
                                <TestInput name="two" validations="isEmail" value="foo@bar" />
                            ) : null}
                            <button data-testid="remove-input-btn" onClick={this.removeInput} type="button" />
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm />);
            const removeInputBtn = screen.getByTestId('remove-input-btn');

            expect(isInValidSpy).toHaveBeenCalled();

            fireEvent.click(removeInputBtn);

            expect(isValidSpy).toHaveBeenCalled();
        });

        it('runs multiple validations', () => {
            const ruleA = jest.fn();
            const ruleB = jest.fn();
            addFormsyRule('ruleA', ruleA);
            addFormsyRule('ruleB', ruleB);

            const screen = render(
                <Formsy>
                    <TestInput name="one" testId="test-input" validations="ruleA,ruleB" value="foo" />
                </Formsy>
            );

            const input = screen.getByTestId('test-input');

            fireEvent.change(input, { target: { value: 'bar' } });

            expect(ruleA).toHaveBeenCalledWith({ one: 'bar' }, 'bar', true);
            expect(ruleB).toHaveBeenCalledWith({ one: 'bar' }, 'bar', true);
        });
    });

    describe('onChange', () => {
        it('should not trigger onChange when form is mounted', () => {
            const hasChanged = jest.fn();

            function TestForm() {
                return <Formsy data-testid="form" onChange={hasChanged} />;
            }

            render(<TestForm />);
            expect(hasChanged).not.toHaveBeenCalled();
        });

        it('should trigger onChange once when form element is changed', () => {
            const hasChanged = jest.fn();
            const screen = render(
                <Formsy onChange={hasChanged}>
                    <TestInput name="foo" testId="test-input" value="" />
                </Formsy>
            );

            fireEvent.change(screen.getByTestId('test-input'), { target: { value: 'bar' } });

            expect(hasChanged).toHaveBeenCalledTimes(1);
        });

        it('should trigger onChange once when new input is added to form', () => {
            const hasChanged = jest.fn();

            class TestForm extends React.Component<{}, { showInput: boolean }> {
                constructor(props) {
                    super(props);
                    this.state = {
                        showInput: false,
                    };
                }

                showInput = () => {
                    this.setState({
                        showInput: true,
                    });
                };

                render() {
                    return (
                        <Formsy onChange={hasChanged}>
                            {this.state.showInput ? <TestInput name="test" /> : null}
                            <button data-testid="show-input-btn" onClick={this.showInput} type="button" />
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm />);
            const showInputBtn = screen.getByTestId('show-input-btn');

            fireEvent.click(showInputBtn);

            expect(hasChanged).toHaveBeenCalledTimes(1);
        });
    });

    describe('Update a form', () => {
        it('should allow elements to check if the form is disabled', () => {
            class TestForm extends React.Component<{}, { disabled: boolean }> {
                constructor(props) {
                    super(props);
                    this.state = {
                        disabled: true,
                    };
                }

                enableForm = () => {
                    this.setState({ disabled: false });
                };

                render() {
                    return (
                        <Formsy disabled={this.state.disabled}>
                            <TestInput name="foo" testId="test-input" />
                            <button data-testid="enable-form-btn" onClick={this.enableForm} type="button" />
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm />);
            const input = screen.getByTestId('test-input');
            const enableFormBtn = screen.getByTestId('enable-form-btn');

            expect(input.dataset.isFormDisabled).toEqual('true');

            fireEvent.click(enableFormBtn);

            expect(input.dataset.isFormDisabled).toEqual('false');
        });

        it('should be possible to pass error state of elements by changing an errors attribute', () => {
            class TestForm extends React.Component<
                {},
                { validationErrors: Record<string, React.ReactNode>; value: string }
            > {
                constructor(props) {
                    super(props);
                    this.state = {
                        validationErrors: { foo: 'bar' },
                        value: '',
                    };
                }

                onChange = values => {
                    this.setState(values.foo ? { validationErrors: {} } : { validationErrors: { foo: 'bar' } });
                };

                changeValue = () => {
                    this.setState({ value: 'new value' });
                };

                render() {
                    return (
                        <Formsy onChange={this.onChange} validationErrors={this.state.validationErrors}>
                            <TestInput name="foo" testId="test-input" value={this.state.value} />
                            <button data-testid="change-value-btn" onClick={this.changeValue} type="button" />
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm />);
            const input = screen.getByTestId('test-input');
            const changeValueBtn = screen.getByTestId('change-value-btn');
            expect(input.dataset.errorMessage).toEqual('bar');

            fireEvent.click(changeValueBtn);

            expect(input.dataset.errorMessage).toEqual(undefined);
        });

        it('should prevent a default submit', () => {
            function TestForm() {
                return (
                    <Formsy data-testid="form">
                        <TestInput name="foo" validations="isEmail" value="foo@bar.com" />
                    </Formsy>
                );
            }

            const screen = render(<TestForm />);
            const form = screen.getByTestId('form');

            const event = createEvent.submit(form);
            event.preventDefault = jest.fn();

            fireEvent(form, event);

            expect(event.preventDefault).toHaveBeenCalled();
        });

        it('should not prevent a default submit when preventDefaultSubmit is passed', () => {
            function TestForm() {
                return (
                    <Formsy data-testid="form" preventDefaultSubmit={false}>
                        <TestInput name="foo" validations="isEmail" value="foo@bar.com" />
                    </Formsy>
                );
            }

            const screen = render(<TestForm />);
            const form = screen.getByTestId('form');

            const event = createEvent.submit(form);
            event.preventDefault = jest.fn();

            fireEvent(form, event);

            expect(event.preventDefault).not.toHaveBeenCalled();
        });

        it('should trigger an onValidSubmit when submitting a valid form', () => {
            const isCalled = jest.fn();

            function TestForm() {
                return (
                    <Formsy data-testid="form" onValidSubmit={isCalled}>
                        <TestInput name="foo" validations="isEmail" value="foo@bar.com" />
                    </Formsy>
                );
            }

            const screen = render(<TestForm />);
            const form = screen.getByTestId('form');

            fireEvent.submit(form);

            expect(isCalled).toHaveBeenCalled();
        });

        it('should trigger an onInvalidSubmit when submitting an invalid form', () => {
            const isCalled = jest.fn();

            function TestForm() {
                return (
                    <Formsy data-testid="form" onInvalidSubmit={isCalled}>
                        <TestInput name="foo" validations="isEmail" value="foo@bar" />
                    </Formsy>
                );
            }

            const screen = render(<TestForm />);
            const form = screen.getByTestId('form');

            fireEvent.submit(form);

            expect(isCalled).toHaveBeenCalled();
        });

        it('should ignore submit events bubbled from a nested form rendered in a portal', () => {
            const onOuterSubmit = jest.fn();
            const onInnerSubmit = jest.fn();

            function TestForm() {
                return (
                    <Formsy data-testid="outer-form" onValidSubmit={onOuterSubmit}>
                        <TestInput name="foo" validations="isEmail" value="foo@bar.com" />
                        {createPortal(
                            <Formsy data-testid="inner-form" onValidSubmit={onInnerSubmit}>
                                <TestInput name="bar" value="baz" />
                            </Formsy>,
                            document.body
                        )}
                    </Formsy>
                );
            }

            const screen = render(<TestForm />);

            fireEvent.submit(screen.getByTestId('inner-form'));

            expect(onInnerSubmit).toHaveBeenCalled();
            expect(onOuterSubmit).not.toHaveBeenCalled();
        });
    });

    describe('value === false', () => {
        it('should call onSubmit correctly', () => {
            const onSubmit = jest.fn();

            function TestForm() {
                return (
                    <Formsy data-testid="form" onSubmit={onSubmit}>
                        <TestInput name="foo" type="checkbox" value={false} />
                        <button type="submit">Save</button>
                    </Formsy>
                );
            }

            const screen = render(<TestForm />);
            const form = screen.getByTestId('form');

            fireEvent.submit(form);

            expect(onSubmit).toHaveBeenCalledWith(
                { foo: false },
                expect.any(Function),
                expect.any(Function),
                expect.any(Object)
            );
        });

        it('should allow dynamic changes to false', () => {
            const onSubmit = jest.fn();

            class TestForm extends React.Component<{}, { value: boolean }> {
                constructor(props) {
                    super(props);
                    this.state = {
                        value: true,
                    };
                }

                changeValue = () => {
                    this.setState({
                        value: false,
                    });
                };

                render() {
                    return (
                        <Formsy data-testid="form" onSubmit={onSubmit}>
                            <TestInput name="foo" type="checkbox" value={this.state.value} />
                            <button data-testid="change-value-btn" onClick={this.changeValue} type="button">
                                Save
                            </button>
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm />);
            const form = screen.getByTestId('form');
            const changeValueBtn = screen.getByTestId('change-value-btn');

            fireEvent.click(changeValueBtn);
            fireEvent.submit(form);

            expect(onSubmit).toHaveBeenCalledWith(
                { foo: false },
                expect.any(Function),
                expect.any(Function),
                expect.any(Object)
            );
        });

        it('should say the form is submitted', () => {
            function TestForm() {
                return (
                    <Formsy>
                        <TestInput name="foo" testId="test-input" type="checkbox" value />
                        <button data-testid="submit-btn" type="submit">
                            Save
                        </button>
                    </Formsy>
                );
            }

            const screen = render(<TestForm />);
            const input = screen.getByTestId('test-input');
            const submitBtn = screen.getByTestId('submit-btn');

            expect(input.dataset.isFormSubmitted).toEqual('false');

            fireEvent.click(submitBtn);

            expect(input.dataset.isFormSubmitted).toEqual('true');
        });

        it('should be able to reset the form to its pristine state', () => {
            class TestForm extends React.Component<{}, { value: boolean }> {
                constructor(props) {
                    super(props);
                    this.state = {
                        value: true,
                    };
                }

                changeValue = () => {
                    this.setState({
                        value: false,
                    });
                };

                render() {
                    return (
                        <Formsy>
                            <TestInput name="foo" testId="test-input" type="checkbox" value={this.state.value} />
                            <button data-testid="change-value-btn" onClick={this.changeValue} type="button">
                                Change value
                            </button>
                            <button data-testid="reset-btn" type="reset">
                                Rest value
                            </button>
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm />);
            const input = screen.getByTestId('test-input') as HTMLInputElement;
            const changeValueBtn = screen.getByTestId('change-value-btn');
            const resetBtn = screen.getByTestId('reset-btn');

            expect(input.dataset.value).toEqual('true');

            fireEvent.click(changeValueBtn);

            expect(input.dataset.value).toEqual('false');

            fireEvent.click(resetBtn);

            expect(input.dataset.value).toEqual('true');
        });

        it('should be able to set a value to components with updateInputsWithValue', () => {
            class TestForm extends React.Component<{}, { valueBar: boolean; valueFoo: boolean }> {
                formRef = React.createRef<Formsy>();

                constructor(props) {
                    super(props);
                    this.state = {
                        valueBar: true,
                        valueFoo: true,
                    };
                }

                updateInputsWithValue = () => {
                    this.formRef.current.updateInputsWithValue({ foo: false });
                };

                render() {
                    return (
                        <Formsy ref={this.formRef}>
                            <TestInput name="foo" testId="test-input1" type="checkbox" value={this.state.valueFoo} />
                            <TestInput name="bar" testId="test-input2" type="checkbox" value={this.state.valueBar} />
                            <button data-testid="update-btn" onClick={this.updateInputsWithValue} type="button" />
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm />);
            const input1 = screen.getByTestId('test-input1');
            const input2 = screen.getByTestId('test-input2');
            const updateBtn = screen.getByTestId('update-btn');

            expect(input1.dataset.value).toEqual('true');
            expect(input2.dataset.value).toEqual('true');

            fireEvent.click(updateBtn);

            expect(input1.dataset.value).toEqual('false');
            expect(input2.dataset.value).toEqual('true');
        });

        it('should be able to reset the form using custom data', () => {
            class TestForm extends React.Component<{}, { value: number }> {
                formRef = React.createRef<Formsy>();

                constructor(props) {
                    super(props);
                    this.state = {
                        value: 1,
                    };
                }

                changeValue = () => {
                    this.setState({
                        value: 2,
                    });
                };

                resetValues = () => {
                    this.formRef.current.reset({
                        foo: 3,
                    });
                };

                render() {
                    const { value } = this.state;

                    return (
                        <Formsy ref={this.formRef}>
                            <TestInput name="foo" testId="test-input1" value={value} />
                            <button data-testid="change-value-btn" onClick={this.changeValue} type="button" />
                            <button data-testid="reset-btn" onClick={this.resetValues} type="button" />
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm />);
            const input1 = screen.getByTestId('test-input1') as HTMLInputElement;
            const updateValueBtn = screen.getByTestId('change-value-btn');
            const resetBtn = screen.getByTestId('reset-btn');

            expect(input1.value).toEqual('1');

            fireEvent.click(updateValueBtn);

            expect(input1.value).toEqual('2');

            fireEvent.click(resetBtn);

            expect(input1.value).toEqual('3');
        });
    });

    describe('.reset()', () => {
        it('should be able to reset the form to empty values', () => {
            function TestForm() {
                const formRef = useRef<Formsy>();
                return (
                    <Formsy ref={formRef}>
                        <TestInput name="foo" testId="test-input" type="checkbox" value="42" />
                        <button
                            data-testid="reset-btn"
                            onClick={() =>
                                formRef.current.reset({
                                    foo: '',
                                })
                            }
                            type="button"
                        >
                            Reset
                        </button>
                    </Formsy>
                );
            }

            const screen = render(<TestForm />);
            const input = screen.getByTestId('test-input') as HTMLInputElement;
            const resetBtn = screen.getByTestId('reset-btn');

            fireEvent.click(resetBtn);

            expect(input.value).toEqual('');
        });

        it('rebases the pristine baseline when reset with explicit values', () => {
            const formRef = React.createRef<Formsy>();
            const screen = render(
                <Formsy ref={formRef}>
                    <TestInput name="one" testId="test-input" value="foo" />
                </Formsy>
            );
            const input = screen.getByTestId('test-input') as HTMLInputElement;

            fireEvent.change(input, { target: { value: 'bar' } });
            expect(formRef.current.isChanged()).toEqual(true);

            act(() => {
                formRef.current.reset({ one: 'baz' });
            });

            // The supplied value becomes the new baseline, so the form is no longer dirty against it.
            expect(input.value).toEqual('baz');
            expect(input.dataset.isPristine).toEqual('true');
            expect(formRef.current.isChanged()).toEqual(false);
        });

        it('restores the mount value and stays pristine when reset without values', () => {
            const formRef = React.createRef<Formsy>();
            const screen = render(
                <Formsy ref={formRef}>
                    <TestInput name="one" testId="test-input" value="foo" />
                </Formsy>
            );
            const input = screen.getByTestId('test-input') as HTMLInputElement;

            fireEvent.change(input, { target: { value: 'bar' } });
            expect(formRef.current.isChanged()).toEqual(true);

            act(() => {
                formRef.current.reset();
            });

            expect(input.value).toEqual('foo');
            expect(input.dataset.isPristine).toEqual('true');
            expect(formRef.current.isChanged()).toEqual(false);
        });

        it('should be able to reset the form using a button', () => {
            function TestForm() {
                return (
                    <Formsy>
                        <TestInput name="foo" testId="test-input" value="foo" />
                        <button data-testid="reset-btn" type="reset">
                            Reset
                        </button>
                    </Formsy>
                );
            }

            const screen = render(<TestForm />);
            const input = screen.getByTestId('test-input') as HTMLInputElement;
            const resetBtn = screen.getByTestId('reset-btn');

            expect(input.value).toEqual('foo');

            fireEvent.change(input, { target: { value: 'foobar' } });

            expect(input.value).toEqual('foobar');

            fireEvent.click(resetBtn);

            expect(input.value).toEqual('foo');
        });
    });

    describe('.isChanged()', () => {
        it('initially returns false', () => {
            const hasOnChanged = jest.fn();
            const formRef = React.createRef<Formsy>();
            render(
                <Formsy onChange={hasOnChanged} ref={formRef}>
                    <TestInput name="one" value="foo" />
                </Formsy>
            );

            expect(formRef.current.isChanged()).toEqual(false);
            expect(hasOnChanged).not.toHaveBeenCalled();
        });

        it('returns true when changed', () => {
            const hasOnChanged = jest.fn();
            const screen = render(
                <Formsy onChange={hasOnChanged}>
                    <TestInput name="one" testId="test-input" value="foo" />
                </Formsy>
            );
            const input = screen.getByTestId('test-input');
            fireEvent.change(input, {
                target: { value: 'bar' },
            });

            expect(hasOnChanged).toHaveBeenCalledWith({ one: 'bar' }, true);
        });

        it('returns false if changes are undone', () => {
            const hasOnChanged = jest.fn();
            const screen = render(
                <Formsy onChange={hasOnChanged}>
                    <TestInput name="one" testId="test-input" value="foo" />
                </Formsy>
            );
            const input = screen.getByTestId('test-input');
            fireEvent.change(input, {
                target: { value: 'bar' },
            });
            expect(hasOnChanged).toHaveBeenCalledWith({ one: 'bar' }, true);

            fireEvent.change(input, {
                target: { value: 'foo' },
            });
            expect(hasOnChanged).toHaveBeenCalledWith({ one: 'foo' }, false);
        });

        it('returns true when a controlled input echoes the value back through props', () => {
            const hasOnChanged = jest.fn();
            const screen = render(<ControlledForm initialValue="foo" onChange={hasOnChanged} />);

            fireEvent.change(screen.getByTestId('test-input'), {
                target: { value: 'bar' },
            });

            // The pristine baseline is captured when the input mounts, so a parent that writes the new value back
            // into the "value" prop must not mask the change.
            expect(hasOnChanged).toHaveBeenCalledWith({ one: 'bar' }, true);
            expect(hasOnChanged).not.toHaveBeenCalledWith({ one: 'bar' }, false);

            // The echoed prop must not re-apply a value the input already holds, which would fire onChange twice.
            expect(hasOnChanged).toHaveBeenCalledTimes(1);
        });

        it('returns true when the value prop is changed by the parent', () => {
            const hasOnChanged = jest.fn();

            function TestForm() {
                const [value, setValue] = useState('foo');
                return (
                    <Formsy onChange={hasOnChanged}>
                        <TestInput name="one" testId="test-input" value={value} />
                        <button data-testid="change-btn" onClick={() => setValue('bar')} type="button" />
                    </Formsy>
                );
            }

            const screen = render(<TestForm />);
            fireEvent.click(screen.getByTestId('change-btn'));

            // The baseline stays at the mount value, so an externally driven change still counts as a change.
            expect(hasOnChanged).toHaveBeenCalledWith({ one: 'bar' }, true);
        });

        it('returns false when a controlled input is restored to its initial value', () => {
            const hasOnChanged = jest.fn();
            const screen = render(<ControlledForm initialValue="foo" onChange={hasOnChanged} />);
            const input = screen.getByTestId('test-input');

            fireEvent.change(input, {
                target: { value: 'bar' },
            });
            expect(hasOnChanged).toHaveBeenCalledWith({ one: 'bar' }, true);

            fireEvent.change(input, {
                target: { value: 'foo' },
            });
            expect(hasOnChanged).toHaveBeenCalledWith({ one: 'foo' }, false);
        });
    });

    describe('form valid state', () => {
        it('should allow to be changed with updateInputsWithError', () => {
            let isValid = true;

            class TestForm extends React.Component {
                onValidSubmit = (_model, _reset, updateInputsWithError) => {
                    updateInputsWithError({ foo: 'bar' }, true);
                };

                onValid = () => {
                    isValid = true;
                };

                onInvalid = () => {
                    isValid = false;
                };

                render() {
                    return (
                        <Formsy
                            data-testid="form"
                            onInvalid={this.onInvalid}
                            onValid={this.onValid}
                            onValidSubmit={this.onValidSubmit}
                        >
                            <TestInput name="foo" />
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm />);
            const form = screen.getByTestId('form');

            expect(isValid).toEqual(true);
            fireEvent.submit(form);

            expect(isValid).toEqual(false);
        });

        it('should throw an error when updateInputsWithError is called with a missing input', () => {
            const mockConsoleError = jest.spyOn(console, 'error');
            mockConsoleError.mockImplementation(() => {
                // do nothing
            });

            const errorSpy = jest.fn();

            class TestForm extends React.Component {
                onValidSubmit = (_model, _reset, updateInputsWithError) => {
                    try {
                        updateInputsWithError({ bar: 'bar' }, true);
                    } catch (e) {
                        errorSpy(e.message);
                    }
                };

                componentDidCatch(error: Error) {
                    errorSpy(error);
                }

                render() {
                    return (
                        <Formsy data-testid="form" onValidSubmit={this.onValidSubmit}>
                            <TestInput name="foo" testId="test-input" />
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm />);
            const form = screen.getByTestId('form');
            fireEvent.submit(form);
            expect(errorSpy).toHaveBeenCalledWith(
                expect.stringContaining('You are trying to update an input that does not exist')
            );
            mockConsoleError.mockRestore();
        });

        it('should be false when validationErrors is not empty', () => {
            let isValid = true;

            class TestForm extends React.Component<
                {},
                {
                    validationErrors: Record<string, ValidationError>;
                }
            > {
                constructor(props) {
                    super(props);
                    this.state = {
                        validationErrors: {},
                    };
                }

                setValidationErrors = (empty?: unknown) => {
                    this.setState(!empty ? { validationErrors: { foo: 'bar' } } : { validationErrors: {} });
                };

                onValid = () => {
                    isValid = true;
                };

                onInvalid = () => {
                    isValid = false;
                };

                render() {
                    return (
                        <Formsy
                            onInvalid={this.onInvalid}
                            onValid={this.onValid}
                            validationErrors={this.state.validationErrors}
                        >
                            <TestInput name="foo" />
                            <button
                                data-testid="validation-btn"
                                onClick={() => this.setValidationErrors()}
                                type="button"
                            />
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm />);
            const validationBtn = screen.getByTestId('validation-btn');

            expect(isValid).toEqual(true);
            fireEvent.click(validationBtn);
            expect(isValid).toEqual(false);
        });

        it('should be true when validationErrors is not empty and preventExternalInvalidation is true', () => {
            let isValid = true;

            class TestForm extends React.Component<
                {},
                {
                    validationErrors: Record<string, ValidationError>;
                }
            > {
                constructor(props) {
                    super(props);
                    this.state = {
                        validationErrors: {},
                    };
                }

                setValidationErrors = (empty?: unknown) => {
                    this.setState(!empty ? { validationErrors: { foo: 'bar' } } : { validationErrors: {} });
                };

                onValid = () => {
                    isValid = true;
                };

                onInvalid = () => {
                    isValid = false;
                };

                render() {
                    return (
                        <Formsy
                            onInvalid={this.onInvalid}
                            onValid={this.onValid}
                            preventExternalInvalidation
                            validationErrors={this.state.validationErrors}
                        >
                            <TestInput name="foo" />
                            <button
                                data-testid="validation-btn"
                                onClick={() => this.setValidationErrors()}
                                type="button"
                            />
                        </Formsy>
                    );
                }
            }

            const screen = render(<TestForm />);
            const validationBtn = screen.getByTestId('validation-btn');

            expect(isValid).toEqual(true);

            fireEvent.click(validationBtn);

            expect(isValid).toEqual(true);
        });

        describe('revalidation', () => {
            beforeEach(() => {
                jest.useFakeTimers({ advanceTimers: true });
            });

            afterEach(() => {
                jest.useRealTimers();
            });

            it('should revalidate form when input added dynamically', async () => {
                const onValidSpy = jest.fn();
                const onInvalidSpy = jest.fn();

                const Inputs = memo(() => {
                    const [counter, setCounter] = useState(1);

                    const onClick = useCallback(() => {
                        setCounter(c => c + 1);
                    }, []);

                    return (
                        <>
                            <button data-testid="add-btn" onClick={onClick} type="button">
                                +
                            </button>
                            {Array.from(Array(counter)).map((_, index) => (
                                <TestInput
                                    key={index}
                                    name={`foo-${index}`}
                                    required
                                    value={index === 0 ? 'bla' : undefined}
                                />
                            ))}
                        </>
                    );
                });

                const TestForm = memo(() => {
                    return (
                        <Formsy onInvalid={onInvalidSpy} onValid={onValidSpy}>
                            <Inputs />
                        </Formsy>
                    );
                });

                const screen = render(<TestForm />);
                const plusButton = screen.getByTestId('add-btn');

                expect(onValidSpy).toHaveBeenCalledTimes(1);
                onValidSpy.mockReset();
                expect(onInvalidSpy).not.toHaveBeenCalled();

                await act(async () => {
                    await userEvent.click(plusButton);
                    jest.runAllTimers();
                });

                expect(onValidSpy).not.toHaveBeenCalled();
                expect(onInvalidSpy).toHaveBeenCalledTimes(2);
            });
        });

        it('should revalidate form once when mounting multiple inputs', () => {
            const validSpy = jest.fn();
            const TestForm = () => (
                <Formsy onValid={validSpy}>
                    {/* onValid is called each time the form revalidates */}
                    {Array.from(Array(5)).map((_, index) => (
                        <TestInput key={index} name={`foo-${index}`} required value="bla" />
                    ))}
                </Formsy>
            );

            render(<TestForm />);

            expect(validSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('onSubmit/onValidSubmit/onInvalidSubmit', () => {
        ['onSubmit', 'onValidSubmit', 'onInvalidSubmit'].forEach(key => {
            it(`should pass submit event to "${key}"`, () => {
                const submitSpy = jest.fn();

                const screen = render(
                    <Formsy {...{ [key]: submitSpy }}>
                        <button data-testid="submit-btn" type="submit" />
                        {key === 'onInvalidSubmit' && <TestInput name="test" required />}
                    </Formsy>
                );
                const button = screen.getByTestId('submit-btn');

                fireEvent.click(button);

                expect(submitSpy).toHaveBeenCalledWith(
                    expect.any(Object),
                    expect.any(Function),
                    expect.any(Function),
                    expect.any(Object)
                );
            });
        });
    });
});
