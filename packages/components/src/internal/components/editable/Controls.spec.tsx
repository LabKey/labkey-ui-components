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
import { shallow } from 'enzyme';

import { AddRowsControl } from './Controls';

describe('Controls', () => {
    test('default properties', () => {
        const addFn = jest.fn();
        const wrapper = shallow(<AddRowsControl onAdd={addFn} />);
        wrapper.find('button').simulate('click');
        expect(addFn).toHaveBeenCalledTimes(1);
    });

    test('non-default properties', () => {
        const addFn = jest.fn();
        const wrapper = shallow(<AddRowsControl initialCount={6} maxCount={25} minCount={5} onAdd={addFn} />);
        const inputWrapper = wrapper.find('input');
        expect(inputWrapper.prop('value')).toBe('6');
        expect(inputWrapper.prop('min')).toBe(5);
        expect(inputWrapper.prop('max')).toBe(25);
        inputWrapper.simulate('focus');
        inputWrapper.simulate('change', { target: { value: 1 } });
        wrapper.update();
        expect(wrapper.find('.text-danger')).toHaveLength(1);
    });

    test('invalid row count', () => {
        const addFn = jest.fn();
        const wrapper = shallow(<AddRowsControl initialCount={6} maxCount={10} onAdd={addFn} />);
        const inputWrapper = wrapper.find('input');
        inputWrapper.simulate('focus');
        inputWrapper.simulate('change', { target: { value: 100 } });
        wrapper.update();
        expect(wrapper.find('.text-danger')).toHaveLength(1);
        expect(wrapper.find('.text-danger').text()).toBe('At most 10 rows can be added at once (10 remaining).');
    });

    test('invalid row count with custom invalidCountMsg', () => {
        const addFn = jest.fn();
        const wrapper = shallow(
            <AddRowsControl
                initialCount={6}
                maxCount={10}
                onAdd={addFn}
                invalidCountMsg="A max of 10 rows are allowed"
            />
        );
        const inputWrapper = wrapper.find('input');
        inputWrapper.simulate('focus');
        inputWrapper.simulate('change', { target: { value: 100 } });
        wrapper.update();

        expect(wrapper.find('.text-danger')).toHaveLength(1);
        expect(wrapper.find('.text-danger').text()).toContain('A max of 10 rows are allowed');
    });

    test('invalid row count with maxTotalCount', () => {
        const addFn = jest.fn();
        const wrapper = shallow(<AddRowsControl initialCount={6} maxTotalCount={50} maxCount={10} onAdd={addFn} />);
        const inputWrapper = wrapper.find('input');
        inputWrapper.simulate('focus');
        inputWrapper.simulate('change', { target: { value: 100 } });
        wrapper.update();
        expect(wrapper.find('.text-danger')).toHaveLength(1);
        expect(wrapper.find('.text-danger').text()).toBe('At most 50 rows can be added at once (10 remaining).');
    });

    test('invalid row count with large maxTotalCount', () => {
        const addFn = jest.fn();
        const wrapper = shallow(<AddRowsControl initialCount={6} maxTotalCount={5000} maxCount={10} onAdd={addFn} />);
        const inputWrapper = wrapper.find('input');
        inputWrapper.simulate('focus');
        inputWrapper.simulate('change', { target: { value: 10000 } });
        wrapper.update();
        expect(wrapper.find('.text-danger')).toHaveLength(1);
        expect(wrapper.find('.text-danger').text()).toBe('At most 5,000 rows can be added at once (10 remaining).');
    })
});
