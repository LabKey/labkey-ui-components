import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LabelHelpTip } from './LabelHelpTip';

describe('LabelHelpTip', () => {
    const wrapperSelector = '.label-help-target';

    test('displays content on mouse over', async () => {
        render(
            <LabelHelpTip>
                <div className="test-content" />
            </LabelHelpTip>
        );

        // displays icon
        const iconElement = document.querySelector('.label-help-icon');
        expect(iconElement).toBeInTheDocument();

        // content not visible
        expect(document.querySelector('.test-content')).toBeNull();

        const wrapper = document.querySelector(wrapperSelector);
        await userEvent.hover(wrapper);

        const contentElement = document.querySelector('.test-content');
        expect(contentElement).toBeVisible();
    });
    test('renders required', async () => {
        render(
            <LabelHelpTip required>
                <span>Ken Griffey Jr</span>
            </LabelHelpTip>
        );

        const result = await screen.queryByText('This field is required.');
        expect(result).toBeNull();

        const wrapper = document.querySelector(wrapperSelector);
        await userEvent.hover(wrapper);

        const contentElement = screen.getByText('Ken Griffey Jr');
        expect(contentElement).toBeInTheDocument();

        const requiredElement = screen.getByText('This field is required.');
        expect(requiredElement).toBeInTheDocument();
    });
});
