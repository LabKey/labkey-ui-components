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
import { userEvent } from '@testing-library/user-event';

import { RemoveEntityButton } from './RemoveEntityButton';

describe('RemoveEntityButton', () => {
    test('Default properties', async () => {
        const onClick = jest.fn();
        render(<RemoveEntityButton onClick={onClick} />);

        expect(document.querySelectorAll('.container--removal-icon')).toHaveLength(1);

        expect(onClick).toHaveBeenCalledTimes(0);
        await userEvent.click(document.querySelector('.container--removal-icon'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    test('Specify entity without index', () => {
        const onClick = jest.fn();
        render(<RemoveEntityButton entity="Test" onClick={onClick} />);

        expect(document.querySelectorAll('.container--removal-icon')).toHaveLength(1);

        // verify "Remove Test" button is rendered
        expect(screen.getByText('Remove Test')).toBeInTheDocument();
    });

    test('Specify label class, index, and entity', () => {
        const onClick = jest.fn();
        render(<RemoveEntityButton entity="Test" onClick={onClick} labelClass="test-label-class" index={3} />);

        expect(document.querySelectorAll('.container--removal-icon')).toHaveLength(1);

        // verify "Remove Test" button is rendered
        expect(screen.getByText('Remove Test 3')).toBeInTheDocument();

        // verify label class is applied
        expect(document.querySelectorAll('.test-label-class')).toHaveLength(1);
    });
});
