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

import { AddEntityButton } from './AddEntityButton';

describe('AddEntityButton', () => {
    test('Minimal props', async () => {
        const onClick = jest.fn();
        render(<AddEntityButton entity="EntityName" onClick={onClick} />);

        // verify the button is rendered
        expect(document.querySelectorAll('.container--action-button')).toHaveLength(1);
        expect(screen.getByText('Add EntityName')).toBeInTheDocument();

        // verify helper is not rendered
        expect(document.querySelectorAll('.label-help-target')).toHaveLength(0);

        // verify button click
        expect(onClick).toHaveBeenCalledTimes(0);
        await userEvent.click(screen.getByText('Add EntityName'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    test('Fully populated props', async () => {
        const onClick = jest.fn();
        render(
            <AddEntityButton
                entity="Something"
                onClick={onClick}
                buttonClass="test-button-class"
                containerClass="test-container-class"
                disabled
                title="test-title"
                helperTitle="test-helperTitle"
                helperBody={<p> Test Body Contents </p>}
            />
        );

        // verify the button is rendered
        expect(document.querySelectorAll('.container--action-button')).toHaveLength(1);
        expect(document.querySelectorAll('.test-container-class')).toHaveLength(1);
        expect(document.querySelectorAll('.test-button-class')).toHaveLength(1);
        expect(screen.getByText('Add Something')).toBeInTheDocument();
        expect(screen.getByTitle('test-title')).toBeInTheDocument();

        // verify helper is rendered
        expect(document.querySelectorAll('.label-help-target')).toHaveLength(1);

        // verify button disabled
        expect(document.querySelectorAll('.disabled')).toHaveLength(1);
        expect(onClick).toHaveBeenCalledTimes(0);
        await userEvent.click(screen.getByText('Add Something'));
        expect(onClick).toHaveBeenCalledTimes(0);
    });
});
