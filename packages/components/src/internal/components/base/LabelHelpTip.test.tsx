import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { LabelHelpTip } from './LabelHelpTip';

describe('LabelHelpTip', () => {
    const wrapperSelector = '.label-help-target';

    test('displays content on mouse over', () => {
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
        fireEvent.mouseOver(wrapper);

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
        fireEvent.mouseOver(wrapper);

        const contentElement = screen.getByText('Ken Griffey Jr');
        expect(contentElement).toBeInTheDocument();

        const requiredElement = screen.getByText('This field is required.');
        expect(requiredElement).toBeInTheDocument();
    });
});
