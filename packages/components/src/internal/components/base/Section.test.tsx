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
import { render, screen } from '@testing-library/react';

import { Section } from './Section';

describe('Section', () => {
    test('default properties', () => {
        render(<Section />);
        expect(document.querySelectorAll('.g-section')).toHaveLength(1);
        expect(document.querySelectorAll('.panel')).toHaveLength(1);
        expect(document.querySelectorAll('.panel-content-title-large')).toHaveLength(0);
        expect(document.querySelectorAll('.panel-content-caption')).toHaveLength(0);
        expect(document.querySelectorAll('.panel-content-context')).toHaveLength(0);
    });

    test('custom properties', () => {
        render(
            <Section
                caption={<p>Testing Caption</p>}
                context={<div>Testing Context</div>}
                title="Testing Title"
                panelClassName="testing-class-name"
            />
        );
        expect(document.querySelectorAll('.g-section')).toHaveLength(1);
        expect(document.querySelectorAll('.panel')).toHaveLength(1);
        expect(document.querySelectorAll('.testing-class-name')).toHaveLength(1);
        expect(screen.getByText('Testing Title')).toBeInTheDocument();
        expect(screen.getByText('Testing Caption')).toBeInTheDocument();
        expect(screen.getByText('Testing Context')).toBeInTheDocument();
    });
});
