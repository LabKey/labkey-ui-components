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

import { DomainFieldsDisplay } from './DomainFieldsDisplay';
import { DomainDesign } from './models';

const testDomain = new DomainDesign({ name: 'test domain name' });

describe('DomainFieldsDisplay', () => {
    test('with empty domain design', () => {
        const domain = new DomainDesign();
        const { container} = render(<DomainFieldsDisplay domain={domain} />);

        expect(container.firstChild).toMatchSnapshot();
    });

    test('without title', () => {
        const { container} = render(<DomainFieldsDisplay domain={testDomain} />);

        expect(container.firstChild).toMatchSnapshot();
    });

    test('with title', () => {
        const { container} = render(<DomainFieldsDisplay domain={testDomain} title="test domain title" />);

        expect(container.firstChild).toMatchSnapshot();
    });
});
