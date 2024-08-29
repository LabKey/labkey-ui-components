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
import userEvent from '@testing-library/user-event';

import { ActionButton } from './ActionButton';

describe('<ActionButton />', () => {
    test('Default properties', async () => {
        const onClick = jest.fn();
        render(<ActionButton onClick={onClick} />);
        await userEvent.click(document.querySelector('span'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    test('With custom props', async () => {
        const onClick = jest.fn();

        render(
            <ActionButton
                buttonClass="test-button-class"
                containerClass="test-container-class"
                disabled={false}
                title="test-title"
                onClick={onClick}
            />
        );

        // Customized attributes should all be valid click targets
        await userEvent.click(document.querySelector('span'));
        await userEvent.click(document.querySelector('.test-button-class span'));
        await userEvent.click(document.querySelector('.test-container-class span'));
        await userEvent.click(document.querySelector('[title="test-title"] span'));
        expect(onClick).toHaveBeenCalledTimes(4);
    });

    test('With label helper', async () => {
        const onClick = jest.fn();

        render(
            <ActionButton onClick={onClick} helperTitle="test-helperTitle" helperBody={<p> Test Body Contents </p>} />
        );

        // content not visible
        const result = screen.queryByText('Test Body Contents');
        expect(result).toBeNull();

        const helpTarget = document.querySelector('.label-help-target');
        await userEvent.hover(helpTarget);

        const requiredElement = screen.getByText('Test Body Contents');
        expect(requiredElement).toBeInTheDocument();

        expect(onClick).toHaveBeenCalledTimes(0); // No clicks
    });

    test('Disabled', async () => {
        const onClick = jest.fn();
        render(<ActionButton disabled={true} onClick={onClick} />);
        await userEvent.click(document.querySelector('span'));
        expect(onClick).toHaveBeenCalledTimes(0);
    });
});
