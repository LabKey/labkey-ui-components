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

import { SelectInputImpl } from './SelectInput';

describe('SelectInput', () => {
    const formsyProps = {
        formsy: true,
        getErrorMessage: () => {},
        getValue: () => {},
        setValue: () => {},
    };

    test('Should apply css classes', () => {
        const containerCls = 'container-class-test';
        const inputCls = 'input-class-test';

        const component = shallow(
            <SelectInputImpl {...formsyProps} containerClass={containerCls} inputClass={inputCls} />
        );
        expect(component.find('.' + containerCls).length).toBe(1);
        expect(component.find('.' + inputCls).length).toBe(1);
    });

    test('Should saveOnBlur - creatable', () => {
        const setValue = jest.fn();

        const selectProps = Object.assign({}, formsyProps, {
            allowCreate: true,
            saveOnBlur: true,
            setValue,
        });

        const component = mount(<SelectInputImpl {...selectProps} />);

        component
            .find('input')
            .simulate('focus')
            .simulate('change', { target: { value: 'Hello' } })
            .simulate('blur');

        expect(setValue).toHaveBeenCalledTimes(1);
        const state = component.state() as any;
        expect(state.selectedOptions).toHaveProperty('value', 'Hello');

        component.unmount();
    });

    test('Should saveOnBlur - async', () => {
        const setValue = jest.fn();

        const selectProps = Object.assign({}, formsyProps, {
            loadOptions: (input, callback) => {
                callback([
                    { value: 'one', label: 'One' },
                    { value: 'two', label: 'Two' },
                ]);
            },
            multiple: true,
            saveOnBlur: true,
            setValue,
        });

        const component = mount(<SelectInputImpl {...selectProps} />);

        component
            .find('input')
            .simulate('focus')
            .simulate('change', { target: { value: 'Two' } })
            .simulate('blur');

        expect(setValue.mock.calls.length).toBe(1);
        const state = component.state() as any;
        expect(state.selectedOptions).toHaveLength(1);

        component.unmount();
    });

    function validateFieldLabel(component: any, hasFieldLabel: boolean, labelText: string): void {
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

        let component = mount(
            <SelectInputImpl
                {...Object.assign({}, formsyProps, {
                    showLabel: true,
                    label: defaultLabel,
                })}
            />
        );
        validateFieldLabel(component, true, defaultLabel);
        component.unmount();

        component = mount(
            <SelectInputImpl
                {...Object.assign({}, formsyProps, {
                    showLabel: false,
                    label: defaultLabel,
                })}
            />
        );
        validateFieldLabel(component, false, undefined);
        component.unmount();

        component = mount(
            <SelectInputImpl
                {...Object.assign({}, formsyProps, {
                    showLabel: true,
                    label: defaultLabel,
                    renderFieldLabel: () => <div>{customLabel}</div>,
                })}
            />
        );
        validateFieldLabel(component, false, customLabel);
        component.unmount();

        component = mount(
            <SelectInputImpl
                {...Object.assign({}, formsyProps, {
                    showLabel: false,
                    label: defaultLabel,
                    renderFieldLabel: () => <div>Jest Custom Label Test</div>,
                })}
            />
        );
        validateFieldLabel(component, false, undefined);
        component.unmount();
    });
});
