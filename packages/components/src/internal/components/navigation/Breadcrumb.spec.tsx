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
import { mount } from 'enzyme';

import { AppURL } from '../../url/AppURL';

import { Breadcrumb } from './Breadcrumb';

describe('Breadcrumb', () => {
    test('empty render', () => {
        expect(mount(<Breadcrumb />).isEmptyRender()).toBe(true);
        expect(mount(<Breadcrumb>{null}</Breadcrumb>).isEmptyRender()).toBe(true);
    });

    test('with links', () => {
        const wrapper = mount(
            <Breadcrumb>
                <a href={AppURL.create('q').toString()}>First</a>
                <a href={AppURL.create('q', 'two').toString()}>Second</a>
                {false && <a href={AppURL.create('q', 'two', 'three').toString()}>Third</a>}
                <a href={AppURL.create('q', 'two', 'three', 'four').toString()}>Fourth</a>
            </Breadcrumb>
        );

        expect(wrapper.exists('ol.breadcrumb')).toBe(true);

        const links = wrapper.find('a');
        expect(links).toHaveLength(3);
        expect(links.at(0).text()).toEqual('First');
        expect(links.at(1).text()).toEqual('Second');
        expect(links.at(2).text()).toEqual('Fourth');
    });

    test('with className prop', () => {
        const wrapper = mount(
            <Breadcrumb className="anotherclass">
                <a href={AppURL.create('q').toString()}>First</a>
            </Breadcrumb>
        );
        expect(wrapper.find('ol').getDOMNode().getAttribute('class')).toBe('breadcrumb anotherclass');
    });
});
