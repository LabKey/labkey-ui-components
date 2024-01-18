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
import { DropdownButton } from 'react-bootstrap';

import { ManageDropdownButton } from './ManageDropdownButton';

describe('<ManageDropdownButton/>', () => {
    test('default props', () => {
        const component = <ManageDropdownButton />;

        const wrapper = shallow(component);
        const dropdown = wrapper.find(DropdownButton);
        expect(dropdown.prop('noCaret')).toBe(false);
        expect(dropdown.prop('title')).toBe('Manage');
    });

    test('custom props', () => {
        const component = <ManageDropdownButton collapsed pullRight />;

        const wrapper = shallow(component);
        const dropdown = wrapper.find(DropdownButton);
        expect(dropdown.prop('noCaret')).toBe(true);
        expect(dropdown.prop('pullRight')).toBe(true);
        expect(dropdown.prop('title')).toStrictEqual(
            <span>
                <i className="fa fa-bars" /> Manage
            </span>
        );
    });
});
