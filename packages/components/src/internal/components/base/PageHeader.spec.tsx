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

import { PageHeader } from './PageHeader';

describe('<PageHeader />', () => {
    test('render without properties', () => {
        const wrapper = shallow(<PageHeader showNotifications={false} />);
        expect(wrapper.find('h2').text()).toEqual('');
    });

    test('render with icon', () => {
        const wrapper = shallow(<PageHeader showNotifications={false} iconCls="spinner" />);
        expect(wrapper.find('span.spinner').exists()).toEqual(true);
        expect(wrapper.find('h2').text()).toEqual(' ');
    });

    test('render with title no icon', () => {
        const wrapper = shallow(<PageHeader showNotifications={false} title="Page title" />);
        expect(wrapper.find('.page-header-icon').exists()).toEqual(false);
        expect(wrapper.find('h2').text()).toEqual('Page title');
    });

    test('render with icon and title', () => {
        const wrapper = shallow(<PageHeader showNotifications={false} title="Page title" iconCls="fa fa-star" />);
        expect(wrapper.find('span.fa-star').exists()).toEqual(true);
        expect(wrapper.find('h2').text()).toEqual(' Page title');
    });

    test('render with children', () => {
        const wrapper = shallow(
            <PageHeader showNotifications={false} title="render with children">
                <div className="child">Header text in the header</div>;
            </PageHeader>
        );
        expect(wrapper.find('div.child').exists()).toEqual(true);
    });
});
