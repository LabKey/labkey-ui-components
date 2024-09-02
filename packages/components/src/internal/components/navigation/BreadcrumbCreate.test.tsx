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

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { AppURL } from '../../url/AppURL';

import { BreadcrumbCreate } from './BreadcrumbCreate';

const createdModifiedRow = {
    Created: {
        formattedValue: '2019-05-15 19:45',
        value: '2019-05-15 19:45:40.593',
    },
    CreatedBy: {
        displayValue: 'username',
        url: '#/q/core/siteusers/1001',
        value: 1001,
    },
    Modified: {
        formattedValue: '2019-05-16 19:45',
        value: '2019-05-16 19:45:40.593',
    },
    ModifiedBy: {
        displayValue: 'username2',
        url: '#/q/core/siteusers/1002',
        value: 1002,
    },
};

describe('BreadcrumbCreate', () => {
    test('with created row', () => {
        const component = (
            <BreadcrumbCreate row={createdModifiedRow} useServerDate={false}>
                <a href={AppURL.create('q').toString()}>First</a>
            </BreadcrumbCreate>
        );

        renderWithAppContext(component);
        expect(document.querySelectorAll('li')).toHaveLength(1);

        const cbmbElement = document.querySelector('span');
        expect(cbmbElement.textContent).toContain('Modified ');

        const title = cbmbElement.getAttribute('title');
        expect(title).toContain('Created by: username');
        expect(title).toContain('Modified by: username2');
    });

    test('with multiple links, no created row', () => {
        renderWithAppContext(
            <BreadcrumbCreate useServerDate={false}>
                <a href={AppURL.create('q').toString()}>First</a>
                <a href={AppURL.create('q', 'two').toString()}>Second</a>
                <a href={AppURL.create('q', 'two', 'three').toString()}>Third</a>
            </BreadcrumbCreate>
        );

        expect(document.querySelectorAll('a')).toHaveLength(3);
    });
});
