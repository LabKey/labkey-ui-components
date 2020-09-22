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

import { notificationInit } from '../../../test/setupUtils';

import { PageHeader } from './PageHeader';

beforeEach(() => {
    notificationInit();
});

describe('<PageHeader />', () => {
    test('render without properties', () => {
        const tree = renderer.create(<PageHeader />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('render with icon', () => {
        const tree = renderer.create(<PageHeader iconCls="spinner" />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('render with title no icon', () => {
        const tree = renderer.create(<PageHeader title="Page title" />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('render with icon and title', () => {
        const tree = renderer.create(<PageHeader title="Page title" iconCls="fa fa-star" />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('render with children', () => {
        const tree = renderer.create(
            <PageHeader title="render with children">
                <div>Header text in the header</div>;
            </PageHeader>
        );
        expect(tree).toMatchSnapshot();
    });
});
