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
import renderer from 'react-test-renderer';
import { fromJS } from 'immutable';

import { mount } from 'enzyme';

import { SearchResultCard } from './SearchResultCard';

describe('<SearchResultCard/>', () => {
    test('default props', () => {
        const component = <SearchResultCard title="Card Title" summary="Card Summary" url="#card" />;

        const wrapper = mount(component);
        const icon = wrapper.find('img');
        expect(icon.getDOMNode().getAttribute('src')).toBe('/labkey/_images/default.svg');
        expect(wrapper.text().indexOf('Type: ')).toBe(-1);
        wrapper.unmount();

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('resolve image and type from dataClass', () => {
        const data = fromJS({ dataClass: { name: 'molecule' } });
        const component = <SearchResultCard title="Card Title" summary="Card Summary" url="#card" data={data} />;

        const wrapper = mount(component);
        const icon = wrapper.find('img');
        expect(icon.getDOMNode().getAttribute('src')).toBe('/labkey/_images/molecule.svg');
        expect(wrapper.text().indexOf('Type: molecule')).toBeGreaterThan(-1);
        wrapper.unmount();
    });

    test('resolve image and type from sampleSet', () => {
        const data = fromJS({ sampleSet: { name: 'Sample Set 1' } });
        const component = <SearchResultCard title="Card Title" summary="Card Summary" url="#card" data={data} />;

        const wrapper = mount(component);
        const icon = wrapper.find('img');
        expect(icon.getDOMNode().getAttribute('src')).toBe('/labkey/_images/samples.svg');
        expect(wrapper.text().indexOf('Type: Sample Set 1')).toBeGreaterThan(-1);
        wrapper.unmount();
    });

    test('with iconUrl', () => {
        const iconUrl = 'http://labkey.wpengine.com/wp-content/uploads/2015/12/cropped-LK-icon.png';
        const component = <SearchResultCard title="Card Title" summary="Card Summary" url="#card" iconUrl={iconUrl} />;

        const wrapper = mount(component);
        const icon = wrapper.find('img');
        expect(icon.getDOMNode().getAttribute('src')).toBe(iconUrl);
        expect(wrapper.text().indexOf('Type: ')).toBe(-1);
        wrapper.unmount();
    });
});
