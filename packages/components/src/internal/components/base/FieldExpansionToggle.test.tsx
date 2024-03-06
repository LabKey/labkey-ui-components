import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FieldExpansionToggle } from './FieldExpansionToggle';

describe('FieldExpansionToggle', () => {
    test('not expanded and highlighted', () => {
        const onClick = jest.fn();
        render(
            <FieldExpansionToggle
                id="expand-id"
                expanded={false}
                highlighted
                expandedTitle="Click to collapse"
                collapsedTitle="Click to expand"
                onClick={onClick}
            />
        );
        expect(document.querySelectorAll('.field-icon')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-chevron-right')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-chevron-down')).toHaveLength(0);
        expect(document.querySelectorAll('.field-highlighted')).toHaveLength(1);
        expect(onClick).toHaveBeenCalledTimes(0);
        userEvent.click(screen.getByTitle('Click to expand'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    test('expanded and highlighted', () => {
        const onClick = jest.fn();
        render(
            <FieldExpansionToggle
                id="expand-id"
                expanded
                highlighted
                expandedTitle="Click to collapse"
                collapsedTitle="Click to expand"
                onClick={onClick}
            />
        );
        expect(document.querySelectorAll('.field-icon')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-chevron-right')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-chevron-down')).toHaveLength(1);
        expect(document.querySelectorAll('.field-highlighted')).toHaveLength(0); // only highlighted when not expanded
        expect(onClick).toHaveBeenCalledTimes(0);
        userEvent.click(screen.getByTitle('Click to collapse'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    test('custom properties', () => {
        const onClick = jest.fn();
        render(
            <FieldExpansionToggle
                id="expand-custom-id"
                cls="expand-custom-cls"
                expanded={false}
                expandedTitle="Custom click to collapse"
                collapsedTitle="Custom click to expand"
                onClick={onClick}
            />
        );
        expect(document.querySelectorAll('.field-icon')).toHaveLength(1);
        expect(document.querySelectorAll('.expand-custom-cls')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-chevron-right')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-chevron-down')).toHaveLength(0);
        expect(document.querySelectorAll('.field-highlighted')).toHaveLength(0);
        expect(onClick).toHaveBeenCalledTimes(0);
        userEvent.click(screen.getByTitle('Custom click to expand'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
