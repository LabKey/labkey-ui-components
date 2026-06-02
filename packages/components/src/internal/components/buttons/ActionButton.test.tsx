/*
 * Copyright (c) 2023-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { ActionButton } from './ActionButton';

describe('ActionButton', () => {
    test('Default properties', async () => {
        const onClick = jest.fn();
        render(<ActionButton onClick={onClick} />);
        await userEvent.click(document.querySelector('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    test('With custom props', async () => {
        const onClick = jest.fn();

        render(
            <ActionButton
                buttonClass="test-button-class"
                containerClass="test-container-class"
                disabled={false}
                onClick={onClick}
                title="test-title"
            />
        );

        // Customized attributes should all be valid click targets
        await userEvent.click(document.querySelector('button'));
        await userEvent.click(document.querySelector('.test-button-class button'));
        await userEvent.click(document.querySelector('.test-container-class button'));
        await userEvent.click(document.querySelector('[title="test-title"] button'));
        expect(onClick).toHaveBeenCalledTimes(4);
    });

    test('With label helper', async () => {
        const onClick = jest.fn();

        render(
            <ActionButton helperBody={<p> Test Body Contents </p>} helperTitle="test-helperTitle" onClick={onClick} />
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
        await userEvent.click(document.querySelector('button'));
        expect(onClick).toHaveBeenCalledTimes(0);
    });
});
