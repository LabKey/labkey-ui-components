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
import { MenuItem } from 'react-bootstrap';

import { AddRowsControl } from './Controls';

describe('Controls', () => {
    test('default properties', () => {
        const addFn = jest.fn();
        const wrapper = shallow(<AddRowsControl onAdd={addFn} />);
        wrapper.find('Button').simulate('click');
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

    test('with quick-add', () => {
        const quickAddFn = jest.fn();
        const addFn = jest.fn();
        const wrapper = shallow(
            <AddRowsControl
                initialCount={4}
                maxCount={10}
                minCount={3}
                quickAddText="quick add"
                onQuickAdd={quickAddFn}
                onAdd={addFn}
            />
        );
        const menuItemWrapper = wrapper.find(MenuItem);
        expect(menuItemWrapper).toHaveLength(1);
        menuItemWrapper.simulate('click');
        expect(quickAddFn).toHaveBeenCalledTimes(1);
    });
});
