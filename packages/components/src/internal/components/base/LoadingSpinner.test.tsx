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

import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
    test('render without properties', () => {
        render(<LoadingSpinner />);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
        expect(document.querySelectorAll('.fa-spinner')).toHaveLength(1);
    });

    test('render with text message', () => {
        render(<LoadingSpinner msg="my message here" />);
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        expect(screen.getByText('my message here')).toBeInTheDocument();
        expect(document.querySelectorAll('.fa-spinner')).toHaveLength(1);
    });

    test('render with react node message', () => {
        const messageNode = <div className="special-class">A div message</div>;
        render(<LoadingSpinner msg={messageNode} />);
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        expect(screen.getByText('A div message')).toBeInTheDocument();
        expect(document.querySelectorAll('.fa-spinner')).toHaveLength(1);
    });
});
