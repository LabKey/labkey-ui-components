/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import { mount, shallow } from 'enzyme';

import { FieldLabel } from '../FieldLabel';

import { waitForLifecycle } from '../../../testHelpers';

import { initOptions, SelectInputImpl, SelectInputProps } from './SelectInput';
import { blurSelectInputInput, setSelectInputText } from './SelectInputTestUtils';

describe('SelectInput', () => {
    function getFormsyProps(): Partial<SelectInputProps> {
        return {
            formsy: true,
            getErrorMessage: jest.fn(),
            getValue: jest.fn(),
            setValue: jest.fn(),
        };
    }

    test('Should apply css classes', () => {
        const containerCls = 'container-class-test';
        const inputCls = 'input-class-test';

        const component = shallow(
            <SelectInputImpl {...getFormsyProps()} containerClass={containerCls} inputClass={inputCls} />
        );
        expect(component.find('.' + containerCls).length).toBe(1);
        expect(component.find('.' + inputCls).length).toBe(1);
    });

    test('Should saveOnBlur - creatable', () => {
        const expectedInputValue = 'Hello';
        const selectProps = getFormsyProps();

        const component = mount<SelectInputImpl>(<SelectInputImpl {...selectProps} allowCreate saveOnBlur />);
        setSelectInputText(component, expectedInputValue, true);

        expect(selectProps.setValue).toHaveBeenCalledTimes(1);
        expect(component.state().selectedOptions).toHaveProperty('value', expectedInputValue);
    });

    test('Should saveOnBlur - async', async () => {
        const selectProps = {
            ...getFormsyProps(),
            filterOption: jest.fn((option, rawValue: string) => option.label === rawValue),
            loadOptions: jest.fn().mockResolvedValue([
                { value: 'one', label: 'One' },
                { value: 'two', label: 'Two' },
            ]),
            multiple: true,
            saveOnBlur: true,
        };

        const component = mount<SelectInputImpl>(<SelectInputImpl {...selectProps} />);
        setSelectInputText(component, 'Two');
        await waitForLifecycle(component);
        blurSelectInputInput(component);

        expect(selectProps.setValue).toHaveBeenCalledTimes(1);
        expect(component.state().selectedOptions).toHaveLength(1);
        expect(component.state().selectedOptions[0].value).toEqual('two');
    });

    function validateFieldLabel(component: any, hasFieldLabel: boolean, labelText?: string): void {
        expect(component.find(FieldLabel)).toHaveLength(hasFieldLabel ? 1 : 0);
        if (labelText !== undefined) {
            expect(component.find('label').text().trim()).toBe(labelText);
        } else {
            expect(component.find('label')).toHaveLength(0);
        }
    }

    test('renderFieldLabel', () => {
        const defaultLabel = 'Jest Label Test';
        const customLabel = 'Jest Custom Label Test';

        const component = mount(<SelectInputImpl {...getFormsyProps()} label={defaultLabel} showLabel />);
        validateFieldLabel(component, true, defaultLabel);

        component.setProps({ renderFieldLabel: () => <div>{customLabel}</div> });
        validateFieldLabel(component, false, customLabel);

        component.setProps({ required: true });
        validateFieldLabel(component, false, customLabel + ' *');

        component.setProps({ showLabel: false });
        validateFieldLabel(component, false);
    });

    describe('initOptions', () => {
        test('empty values', () => {
            expect(initOptions({ value: undefined })).toBeUndefined();
            expect(initOptions({ value: null })).toBeUndefined();
            expect(initOptions({ value: '' })).toBeUndefined();
            expect(initOptions({ value: [] })).toHaveLength(0);
        });
        test('primitive values', () => {
            expect(initOptions({ value: 5 })).toEqual({ label: 5, value: 5 });
            expect(initOptions({ value: 'word' })).toEqual({ label: 'word', value: 'word' });
            expect(initOptions({ value: [5, 'word'] })).toEqual([
                { label: 5, value: 5 },
                { label: 'word', value: 'word' },
            ]);

            // labelKey / valueKey
            expect(initOptions({ labelKey: 'display', value: 5, valueKey: 'key' })).toEqual({ display: 5, key: 5 });
            expect(initOptions({ labelKey: 'display', value: 'word', valueKey: 'key' })).toEqual({
                display: 'word',
                key: 'word',
            });
        });
        test('options', () => {
            const option1 = { label: 'Five', value: 5 };
            const option2 = { label: 'Word', value: 'word' };
            const options = [option1, option2];

            expect(initOptions({ options, value: 5 })).toEqual(option1);
            expect(initOptions({ options, value: 'word' })).toEqual(option2);
            expect(initOptions({ options, value: 99 })).toEqual({ label: 99, value: 99 });

            // labelKey / valueKey
            const option3 = { name: 'Jackie Robinson', number: 42 };
            const option4 = { name: 'Ken Griffey Jr', number: 24 };
            const customOptions = [option3, option4];
            expect(initOptions({ labelKey: 'name', options: customOptions, value: 42, valueKey: 'number' })).toEqual(
                option3
            );
            expect(initOptions({ labelKey: 'name', options: customOptions, value: 99, valueKey: 'number' })).toEqual({
                name: 99,
                number: 99,
            });
        });
    });
});
