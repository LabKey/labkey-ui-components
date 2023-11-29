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
import { render } from '@testing-library/react';

import { PageDetailHeader } from './PageDetailHeader';

describe('<PageDetailHeader/>', () => {
    test('default props', () => {
        const component = <PageDetailHeader title="Title" iconSrc="default" />;

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('with additional props', () => {
        const component = (
            <PageDetailHeader
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

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('prefer iconUrl', () => {
        const component = <PageDetailHeader title="Title" iconUrl="iconUrl" iconDir="iconDir" iconSrc="iconSrc" />;

        render(component);
        const srcAttr = document.querySelector('img').getAttribute('src');
        expect(srcAttr).toBe('iconUrl');
    });

    test('without icon', () => {
        const component = <PageDetailHeader title="Title" />;

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });
});
