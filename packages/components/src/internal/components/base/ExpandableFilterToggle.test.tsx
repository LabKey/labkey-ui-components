import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ExpandableFilterToggle } from './ExpandableFilterToggle';

describe('ExpandableFilterToggle', () => {
    test('default properties without filters', () => {
        const toggleFilterPanel = jest.fn();
        const resetFilter = jest.fn();
        render(
            <ExpandableFilterToggle
                filterExpanded={false}
                hasFilter={false}
                toggleFilterPanel={toggleFilterPanel}
                resetFilter={resetFilter}
            />
        );
        expect(document.querySelectorAll('.show-hide-filter-toggle')).toHaveLength(1);
        expect(screen.getByText('Show filters')).toBeInTheDocument();
        expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
        expect(document.querySelectorAll('.fa-chevron-right')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-chevron-down')).toHaveLength(0);

        expect(toggleFilterPanel).toHaveBeenCalledTimes(0);
        expect(resetFilter).toHaveBeenCalledTimes(0);
        userEvent.click(screen.getByText('Show filters'));
        expect(toggleFilterPanel).toHaveBeenCalledTimes(1);
        expect(resetFilter).toHaveBeenCalledTimes(0);
    });

    test('custom properties without filters', () => {
        const toggleFilterPanel = jest.fn();
        const resetFilter = jest.fn();
        render(
            <ExpandableFilterToggle
                filterExpanded
                hasFilter
                toggleFilterPanel={toggleFilterPanel}
                resetFilter={resetFilter}
                panelCls="test-cls"
            />
        );
        expect(document.querySelectorAll('.show-hide-filter-toggle')).toHaveLength(0);
        expect(document.querySelectorAll('.test-cls')).toHaveLength(1);
        expect(screen.getByText('Hide filters')).toBeInTheDocument();
        expect(screen.getByText('Clear All')).toBeInTheDocument();
        expect(document.querySelectorAll('.fa-chevron-right')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-chevron-down')).toHaveLength(1);

        expect(toggleFilterPanel).toHaveBeenCalledTimes(0);
        expect(resetFilter).toHaveBeenCalledTimes(0);
        userEvent.click(screen.getByText('Clear All'));
        expect(toggleFilterPanel).toHaveBeenCalledTimes(0);
        expect(resetFilter).toHaveBeenCalledTimes(1);
        userEvent.click(screen.getByText('Hide filters'));
        expect(toggleFilterPanel).toHaveBeenCalledTimes(1);
        expect(resetFilter).toHaveBeenCalledTimes(1);
    });
});
