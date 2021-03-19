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

import { SelectInputImpl, SelectInputProps } from './SelectInput';
import { setSelectInputText } from './SelectInputTestUtils';

describe('SelectInput', () => {
    function getFormsyProps(): Partial<SelectInputProps> {
        return {
            formsy: true,
            getErrorMessage: jest.fn(),
            getValue: jest.fn(),
            setValue: jest.fn(),
        };
    }

    function setSelectInput(component, value): void {
        const input = component.find('input');
        input.getDOMNode().setAttribute('value', value);
        input.simulate('change', { currentTarget: input });
        input.simulate('blur');
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

    test('Should saveOnBlur - async', () => {
        const selectProps = {
            ...getFormsyProps(),
            loadOptions: (input, callback) => {
                callback([
                    { value: 'one', label: 'One' },
                    { value: 'two', label: 'Two' },
                ]);
            },
            multiple: true,
            saveOnBlur: true,
        };

        const component = mount<SelectInputImpl>(<SelectInputImpl {...selectProps} />);
        setSelectInputText(component, 'Two', true);

        expect(selectProps.setValue).toHaveBeenCalledTimes(1);
        expect(component.state().selectedOptions).toHaveLength(1);
    });

    function validateFieldLabel(component: any, hasFieldLabel: boolean, labelText?: string): void {
        expect(component.find(FieldLabel)).toHaveLength(hasFieldLabel ? 1 : 0);
        if (labelText !== undefined) {
            expect(component.find('label').text().startsWith(labelText)).toBeTruthy();
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

        component.setProps({ showLabel: false });
        validateFieldLabel(component, false);
    });
});
