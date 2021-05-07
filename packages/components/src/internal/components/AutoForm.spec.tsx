import React from 'react';
import { mount } from 'enzyme';

import { AutoForm, FormSchema } from './AutoForm';

describe('AutoForm', () => {
    const expectField = (wrapper, field, index): void => {
        const fieldEl = wrapper.find('.auto-form-field').at(index);

        const label = fieldEl.find('label').at(0);
        expect(label.text()).toContain(field.label + (field.required ? '*' : ''));

        if (field.helpText) {
            // Can't assert text content of help icon at the moment, so just assert it exists.
            expect(label.find('.help-icon').exists()).toEqual(true);
        }

        if (field.type === 'textarea') {
            expect(fieldEl.find('textarea').length).toEqual(1);
        } else if (field.type === 'radio') {
            const radios = fieldEl.find('label.radio-inline');
            expect(radios.length).toEqual(field.options.length);
            field.options.forEach((option, idx) => {
                const radio = radios.at(idx);
                expect(radio.find('input').props().name).toEqual(field.name);
                expect(radio.find('input').props().value).toEqual(option.value);
                expect(radio.text()).toEqual(option.label);
            });
        } else if (field.type === 'checkbox') {
            expect(fieldEl.find('input[type="checkbox"]').length).toEqual(1);
        } else if (field.type === 'select') {
            expect(fieldEl.find('select').length).toEqual(1);
            const expectedOptions = field.placeholder ? field.options.length + 1 : field.options.length;
            const optionEls = fieldEl.find('select > option');
            expect(optionEls.length).toEqual(expectedOptions);
            optionEls.forEach((optionEl, idx) => {
                if (field.placeholder && idx === 0) {
                    expect(optionEl.props().value).toEqual('');
                    expect(optionEl.text()).toEqual(field.placeholder);
                } else {
                    const option = field.options[field.placeholder ? idx - 1 : idx];
                    expect(optionEl.props().value).toEqual(option.value);
                    expect(optionEl.text()).toEqual(option.label);
                }
            });
        } else {
            expect(fieldEl.find('input[type="text"]').length).toEqual(1);
        }
    };
    test('render', () => {
        const formSchema: FormSchema = {
            fields: [
                {
                    label: 'text field',
                    name: 'textField',
                    type: 'text',
                },
                {
                    label: 'text field, required',
                    name: 'textFieldRequired',
                    type: 'text',
                },
                {
                    label: 'text field, help text',
                    name: 'textFieldHelpText',
                    helpText: 'this is help text',
                    type: 'text',
                },
                {
                    label: 'text field, help text and href',
                    name: 'textFieldHelpTextHref',
                    helpText: 'this is help text',
                    helpTextHref: '',
                    type: 'text',
                },
                {
                    label: 'textarea field',
                    name: 'textareaField',
                    type: 'textarea',
                },
                {
                    label: 'number field',
                    name: 'numberField',
                    type: 'number',
                },
                {
                    label: 'checkbox field',
                    name: 'checkboxField',
                    type: 'checkbox',
                },
                {
                    label: 'select field w/ placeholder',
                    name: 'selectFieldPlaceholder',
                    placeholder: 'select placeholder',
                    options: [
                        { label: 'option 1', value: 'option1' },
                        { label: 'option 2', value: 'option2' },
                    ],
                    type: 'select',
                },
                {
                    label: 'select field w/o placeholder',
                    name: 'selectFieldNoPlaceholder',
                    options: [
                        { label: 'option 1', value: 'option1' },
                        { label: 'option 2', value: 'option2' },
                    ],
                    type: 'select',
                },
                {
                    label: 'radio field',
                    name: 'radioField',
                    options: [
                        { label: 'option 1', value: 'option1' },
                        { label: 'option 2', value: 'option2' },
                    ],
                    type: 'radio',
                },
            ],
        };
        const wrapper = mount(<AutoForm formSchema={formSchema} onChange={jest.fn()} values={{}} />);

        formSchema.fields.forEach((field, index) => expectField(wrapper, field, index));
    });

    test('interaction', () => {
        const formSchema: FormSchema = {
            fields: [
                {
                    label: 'text field',
                    name: 'textField',
                    type: 'text',
                },
                {
                    label: 'radio field',
                    name: 'radioField',
                    options: [
                        { label: 'option 1', value: 'option1' },
                        { label: 'option 2', value: 'option2' },
                    ],
                    type: 'radio',
                },
                {
                    label: 'select field w/o placeholder',
                    name: 'selectField',
                    options: [
                        { label: 'option 1', value: 'option1' },
                        { label: 'option 2', value: 'option2' },
                    ],
                    type: 'select',
                },
                {
                    label: 'checkbox field',
                    name: 'checkboxField',
                    type: 'checkbox',
                },
            ],
        };

        const onChange = jest.fn();
        const wrapper = mount(<AutoForm formSchema={formSchema} onChange={onChange} values={{}} />);
        const text = 'I am text';
        wrapper.find('input[type="text"]').simulate('change', { target: { value: text } });
        expect(onChange).toHaveBeenCalledWith('textField', text);
        wrapper
            .find('input[type="radio"]')
            .at(1)
            .simulate('change', { target: { value: 'option2' } });
        expect(onChange).toHaveBeenCalledWith('radioField', 'option2');
        wrapper.find('select').simulate('change', { target: { value: 'option2' } });
        expect(onChange).toHaveBeenCalledWith('selectField', 'option2');
        wrapper.find('input[type="checkbox"]').simulate('change', { target: { checked: false } });
        expect(onChange).toHaveBeenCalledWith('checkboxField', false);
    });
});
