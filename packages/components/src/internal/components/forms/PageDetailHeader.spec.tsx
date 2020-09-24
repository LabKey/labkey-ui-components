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
import { mount } from 'enzyme';

import { User } from '../base/models/model';

import { PageDetailHeader } from './PageDetailHeader';

describe('<PageDetailHeader/>', () => {
    test('default props', () => {
        const component = <PageDetailHeader title="Title" user={new User()} iconSrc="default" />;

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with additional props', () => {
        const component = (
            <PageDetailHeader
                user={new User()}
                title="Title"
                subTitle="Subtitle"
                description="Description"
                iconDir="iconDir"
                iconSrc="iconSrc"
                leftColumns={5}
            >
                <div>Something off to the right</div>
            </PageDetailHeader>
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('prefer iconUrl', () => {
        const component = (
            <PageDetailHeader user={new User()} title="Title" iconUrl="iconUrl" iconDir="iconDir" iconSrc="iconSrc" />
        );

        const wrapper = mount(component);
        const srcAttr = wrapper.find('img').getDOMNode().getAttribute('src');
        expect(srcAttr).toBe('iconUrl');
        wrapper.unmount();
    });

    test('without icon', () => {
        const component = <PageDetailHeader user={new User()} title="Title" />;

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
