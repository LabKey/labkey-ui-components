import React, { createRef } from 'react';
import { act, fireEvent, render } from '@testing-library/react';

import { QueryColumn } from '../../../../public/QueryColumn';

import { Formsy } from '../formsy';

import { DatePickerInput, DatePickerInputImpl, DatePickerInputProps } from './DatePickerInput';

describe('DatePickerInput', () => {
    const DEFAULT_PROPS: DatePickerInputProps = {
        name: 'col',
        queryColumn: new QueryColumn({ fieldKey: 'col', caption: 'Test Column', required: true }),
    };

    const getInput = (): HTMLInputElement =>
        document.querySelector('.react-datepicker__input-container input') as HTMLInputElement;

    function validate(hasFieldLabel = true): void {
        expect(document.querySelectorAll('.control-label')).toHaveLength(hasFieldLabel ? 1 : 0);
        expect(document.querySelectorAll('.react-datepicker-wrapper')).toHaveLength(1);
    }

    test('default props', () => {
        render(
            <Formsy>
                <DatePickerInput {...DEFAULT_PROPS} />
            </Formsy>
        );

        validate();

        const input = document.querySelector('.react-datepicker__input-container input');
        expect(input).toBeDefined();
        expect(input.getAttribute('name')).toEqual('col');
        expect(input.getAttribute('placeholder')).toEqual('Select test column');
    });

    test('not isFormInput', () => {
        render(
            <Formsy>
                <DatePickerInput {...DEFAULT_PROPS} isFormInput={false} />
            </Formsy>
        );
        validate(false);
    });

    test('with name and placeholderText props', () => {
        render(
            <Formsy>
                <DatePickerInput {...DEFAULT_PROPS} name="name" placeholderText="placeholder text" />
            </Formsy>
        );

        validate();

        const input = document.querySelector('.react-datepicker__input-container input');
        expect(input).toBeDefined();
        expect(input.getAttribute('name')).toEqual('name');
        expect(input.getAttribute('placeholder')).toEqual('placeholder text');
    });

    test('initialization of formsy value', () => {
        const queryColumn = new QueryColumn({
            fieldKey: 'col',
            caption: 'Test Column',
            required: true,
        });
        const setValue = jest.fn();

        render(
            // @ts-expect-error not supplying portion of formsy component interface
            <DatePickerInputImpl
                {...DEFAULT_PROPS}
                formsy={false}
                queryColumn={queryColumn}
                setValue={setValue}
                value="12/16/2024 11:20 am"
            />
        );

        expect(setValue).not.toHaveBeenCalled();
        setValue.mockReset();

        render(
            // @ts-expect-error not supplying portion FormsyInjectedProps interface
            <DatePickerInputImpl
                {...DEFAULT_PROPS}
                formsy
                queryColumn={queryColumn}
                setValue={setValue}
                value="12/16/2024 11:20 am"
            />
        );

        expect(setValue).toHaveBeenCalledWith('2024-12-16 11:20:00.000');
        setValue.mockReset();

        render(
            // @ts-expect-error not supplying portion FormsyInjectedProps interface
            <DatePickerInputImpl {...DEFAULT_PROPS} formsy queryColumn={queryColumn} setValue={setValue} />
        );

        expect(setValue).toHaveBeenCalledWith(undefined);
    });

    test('renderFieldLabel', () => {
        render(
            <Formsy>
                <DatePickerInput
                    {...DEFAULT_PROPS}
                    labelClassName="labelClassName"
                    renderFieldLabel={jest.fn().mockReturnValue('renderFieldLabel')}
                />
            </Formsy>
        );

        expect(document.querySelectorAll('input.form-control')).toHaveLength(1);
        expect(document.querySelector('.labelClassName')).toHaveTextContent('renderFieldLabel *');
    });

    describe('allowRelativeInput', () => {
        test('value getter returns initial relative date from props.value', () => {
            const ref = createRef<DatePickerInputImpl>();
            render(
                // @ts-expect-error not supplying portion of formsy component interface
                <DatePickerInputImpl {...DEFAULT_PROPS} allowRelativeInput formsy={false} ref={ref} value="-5d" />
            );

            // The value getter should return the relative date from props
            expect(ref.current.value).toBe('-5d');
            // relativeInputValue should be undefined initially (using props.value as fallback)
            expect(ref.current.state.relativeInputValue).toBeUndefined();
        });

        test('value getter returns undefined when allowRelativeInput is false', () => {
            const ref = createRef<DatePickerInputImpl>();
            render(
                // @ts-expect-error not supplying portion of formsy component interface
                <DatePickerInputImpl
                    {...DEFAULT_PROPS}
                    allowRelativeInput={false}
                    formsy={false}
                    ref={ref}
                    value="-5d"
                />
            );

            expect(ref.current.value).toBeUndefined();
        });

        test('value getter returns props.value when it is a valid relative date and relativeInputValue is undefined', () => {
            const ref = createRef<DatePickerInputImpl>();
            render(
                // @ts-expect-error not supplying portion of formsy component interface
                <DatePickerInputImpl {...DEFAULT_PROPS} allowRelativeInput formsy={false} ref={ref} value="-5d" />
            );

            expect(ref.current.value).toBe('-5d');
        });

        test('value getter returns undefined when relativeInputValue is null (calendar selection)', () => {
            const ref = createRef<DatePickerInputImpl>();
            render(
                // @ts-expect-error not supplying portion of formsy component interface
                <DatePickerInputImpl {...DEFAULT_PROPS} allowRelativeInput formsy={false} ref={ref} value="-5d" />
            );

            // Simulate calendar selection by setting state
            act(() => {
                ref.current.setState({ relativeInputValue: null });
            });

            expect(ref.current.value).toBeUndefined();
        });

        test('value getter returns relativeInputValue when user is typing', () => {
            const ref = createRef<DatePickerInputImpl>();
            render(
                // @ts-expect-error not supplying portion of formsy component interface
                <DatePickerInputImpl {...DEFAULT_PROPS} allowRelativeInput formsy={false} ref={ref} value="-5d" />
            );

            // Simulate user typing
            act(() => {
                ref.current.setState({ relativeInputValue: '+10d' });
            });

            expect(ref.current.value).toBe('+10d');
        });

        test('onChangeRaw tracks valid relative date input', () => {
            const onChange = jest.fn();
            const ref = createRef<DatePickerInputImpl>();
            render(
                // @ts-expect-error not supplying portion of formsy component interface
                <DatePickerInputImpl
                    {...DEFAULT_PROPS}
                    allowRelativeInput
                    formsy={false}
                    onChange={onChange}
                    ref={ref}
                />
            );

            const input = getInput();
            fireEvent.change(input, { target: { value: '-5d' } });

            expect(ref.current.state.relativeInputValue).toBe('-5d');
            expect(ref.current.state.invalid).toBe(false);
            expect(onChange).toHaveBeenCalledWith('-5d');
        });

        test('onChangeRaw tracks partial relative date input without marking invalid', () => {
            const onChange = jest.fn();
            const ref = createRef<DatePickerInputImpl>();
            render(
                // @ts-expect-error not supplying portion of formsy component interface
                <DatePickerInputImpl
                    {...DEFAULT_PROPS}
                    allowRelativeInput
                    formsy={false}
                    onChange={onChange}
                    ref={ref}
                />
            );

            const input = getInput();

            // Partial input like "-5" should be valid (relaxed match)
            fireEvent.change(input, { target: { value: '-5' } });
            expect(ref.current.state.relativeInputValue).toBe('-5');
            expect(ref.current.state.invalid).toBe(false);

            // Just "-" should also be valid (relaxed match)
            fireEvent.change(input, { target: { value: '-' } });
            expect(ref.current.state.relativeInputValue).toBe('-');
            expect(ref.current.state.invalid).toBe(false);
        });

        test('onChangeRaw marks invalid when input does not match relative pattern', () => {
            const ref = createRef<DatePickerInputImpl>();
            render(
                // @ts-expect-error not supplying portion of formsy component interface
                <DatePickerInputImpl {...DEFAULT_PROPS} allowRelativeInput formsy={false} ref={ref} />
            );

            const input = getInput();
            fireEvent.change(input, { target: { value: 'invalid' } });

            expect(ref.current.state.relativeInputValue).toBe('invalid');
            expect(ref.current.state.invalid).toBe(true);
        });

        test('onChangeRaw allows editing within relative date string', () => {
            const ref = createRef<DatePickerInputImpl>();
            render(
                // @ts-expect-error not supplying portion of formsy component interface
                <DatePickerInputImpl {...DEFAULT_PROPS} allowRelativeInput formsy={false} ref={ref} value="-5d" />
            );

            const input = getInput();

            // User edits "-5d" to "-15d"
            fireEvent.change(input, { target: { value: '-15d' } });
            expect(ref.current.state.relativeInputValue).toBe('-15d');
            expect(ref.current.state.invalid).toBe(false);
        });

        test('onChange clears relativeInputValue when date is selected from calendar', () => {
            const onChange = jest.fn();
            const ref = createRef<DatePickerInputImpl>();
            render(
                // @ts-expect-error not supplying portion of formsy component interface
                <DatePickerInputImpl
                    {...DEFAULT_PROPS}
                    allowRelativeInput
                    formsy={false}
                    onChange={onChange}
                    ref={ref}
                />
            );

            // Set up the initial relative input state
            act(() => {
                ref.current.setState({ relativeInputValue: '-5d' });
            });

            // Simulate calendar selection
            const selectedDate = new Date('2024-01-15');
            act(() => {
                ref.current.onChange(selectedDate, {});
            });

            // relativeInputValue should be null (not undefined) to indicate calendar selection
            expect(ref.current.state.relativeInputValue).toBeNull();
            expect(ref.current.state.selectedDate).toEqual(selectedDate);
            expect(onChange).toHaveBeenCalled();
        });

        test('onChange prioritizes calendar selection over typed relative value', () => {
            const onChange = jest.fn();
            const ref = createRef<DatePickerInputImpl>();
            render(
                // @ts-expect-error not supplying portion of formsy component interface
                <DatePickerInputImpl
                    {...DEFAULT_PROPS}
                    allowRelativeInput
                    formsy={false}
                    onChange={onChange}
                    ref={ref}
                />
            );

            // User types a valid relative date
            const input = getInput();
            fireEvent.change(input, { target: { value: '-5d' } });
            onChange.mockClear();

            // User then selects from the calendar
            const selectedDate = new Date('2024-01-15');
            act(() => {
                ref.current.onChange(selectedDate, {});
            });

            // Should use the calendar date, not the relative value
            expect(ref.current.state.relativeInputValue).toBeNull();
            expect(ref.current.state.selectedDate).toEqual(selectedDate);
            // onChange should be called with the date, not the relative value
            expect(onChange).toHaveBeenCalledWith(selectedDate, '2024-01-15 00:00');
        });

        test('displays error message when input is invalid', () => {
            const ref = createRef<DatePickerInputImpl>();
            render(
                // @ts-expect-error not supplying portion of formsy component interface
                <DatePickerInputImpl {...DEFAULT_PROPS} allowRelativeInput formsy={false} ref={ref} />
            );

            const input = getInput();
            fireEvent.change(input, { target: { value: 'not-a-date' } });
            expect(document.querySelector('.has-error')).not.toBeNull();
            expect(document.querySelector('.help-block')).toHaveTextContent('Invalid date value');
        });

        test('clears error when valid relative date is entered', () => {
            const ref = createRef<DatePickerInputImpl>();
            render(
                // @ts-expect-error not supplying portion of formsy component interface
                <DatePickerInputImpl {...DEFAULT_PROPS} allowRelativeInput formsy={false} ref={ref} />
            );

            const input = getInput();

            // Enter invalid value
            fireEvent.change(input, { target: { value: 'invalid' } });
            expect(document.querySelector('.has-error')).not.toBeNull();

            // Enter a valid relative date
            fireEvent.change(input, { target: { value: '-5d' } });
            expect(document.querySelector('.has-error')).toBeNull();
        });

        test('empty input is not marked as invalid', () => {
            const ref = createRef<DatePickerInputImpl>();
            render(
                // @ts-expect-error not supplying portion of formsy component interface
                <DatePickerInputImpl {...DEFAULT_PROPS} allowRelativeInput formsy={false} ref={ref} />
            );

            const input = getInput();
            fireEvent.change(input, { target: { value: '' } });

            expect(ref.current.state.invalid).toBe(false);
            expect(document.querySelector('.has-error')).toBeNull();
        });
    });
});
