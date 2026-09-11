/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { PageMenu } from './PageMenu';

describe('PageMenu', () => {
    let props;
    beforeEach(() => {
        props = {
            id: 'model',
            currentPage: 2,
            disabled: false,
            isFirstPage: false,
            isLastPage: false,
            loadFirstPage: jest.fn(),
            loadLastPage: jest.fn(),
            pageCount: 34,
            showPageSizeMenu: false,
            pageSize: 20,
            pageSizes: [20, 40, 100, 250, 400],
            setPageSize: jest.fn(),
        };
    });

    const expectPageMenuItems = (
        menuDisabled: boolean,
        firstDisabled: boolean,
        lastDisabled: boolean,
        page: string,
        pageCount: string
    ): void => {
        const menuButton = document.querySelector('button.dropdown-toggle');

        if (menuDisabled) expect(menuButton).toBeDisabled();
        else expect(menuButton).not.toBeDisabled();

        expect(menuButton.textContent).toEqual(page); // there is a space then a caret

        const first = screen.getByText('First Page').parentElement; // getByText will return the <a>, we want the <li>
        const last = screen.getByText('Last Page').parentElement;
        if (firstDisabled) expect(first).toHaveClass('disabled');
        else expect(first).not.toHaveClass('disabled');

        if (lastDisabled) expect(last).toHaveClass('disabled');
        else expect(last).not.toHaveClass('disabled');

        expect(screen.getByText(pageCount)).toBeInTheDocument();

        for (const pageSize of props.pageSizes) {
            expect(screen.getByText(pageSize)).toBeInTheDocument();

            if (props.pageSize === pageSize) expect(screen.getByText(pageSize).parentElement).toHaveClass('active');
        }
    };

    test('render', () => {
        const { rerender } = render(<PageMenu {...props} />);
        expectPageMenuItems(false, false, false, '2', '34 Total Pages');

        rerender(<PageMenu {...props} disabled />);
        expectPageMenuItems(true, true, true, '2', '...');

        rerender(<PageMenu {...props} currentPage={1} isFirstPage />);
        expectPageMenuItems(false, true, false, '1', '34 Total Pages');

        rerender(<PageMenu {...props} currentPage={34} isLastPage />);
        expectPageMenuItems(false, false, true, '34', '34 Total Pages');
    });

    test('capped rowCount keeps "Last Page" enabled and drops the total-pages footer', () => {
        render(<PageMenu {...props} rowCountCapped isLastPage />);
        expect(screen.getByText('First Page')).toBeInTheDocument();
        // Last Page stays enabled while capped (even with isLastPage true) so there's always a way to reach the last row
        const last = screen.getByText('Last Page').parentElement;
        expect(last).not.toHaveClass('disabled');
        // no fake "Page N" jump, and the total-pages footer is hidden because the true total is unknown
        expect(screen.queryByText('Page 34')).not.toBeInTheDocument();
        expect(screen.queryByText('34 Total Pages')).not.toBeInTheDocument();
    });

    test('capped rowCount shows "Count All Rows" only when a handler is provided', () => {
        const { rerender } = render(<PageMenu {...props} rowCountCapped />);
        expect(screen.queryByText('Count All Rows')).not.toBeInTheDocument();

        const onShowTotalRowCount = jest.fn();
        rerender(<PageMenu {...props} rowCountCapped onShowTotalRowCount={onShowTotalRowCount} />);
        expect(screen.getByText('Count All Rows')).toBeInTheDocument();

        // not shown when the count is exact
        rerender(<PageMenu {...props} onShowTotalRowCount={onShowTotalRowCount} />);
        expect(screen.queryByText('Count All Rows')).not.toBeInTheDocument();
    });

    test('Count All Rows shows a spinner and is disabled while counting', () => {
        render(<PageMenu {...props} rowCountCapped loadingTotalCount onShowTotalRowCount={jest.fn()} />);
        // the spinner replaces the label, and the item is present but disabled
        expect(screen.queryByText('Count All Rows')).not.toBeInTheDocument();
        expect(screen.getByText('Counting…')).toBeInTheDocument();
        expect(screen.getByText('Counting…').closest('li')).toHaveClass('disabled');
    });

    test('Count All Rows invokes the handler when clicked', async () => {
        const onShowTotalRowCount = jest.fn();
        render(<PageMenu {...props} rowCountCapped onShowTotalRowCount={onShowTotalRowCount} />);
        await userEvent.click(screen.getByText('Count All Rows'));
        expect(onShowTotalRowCount).toHaveBeenCalled();
    });

    test('interactions', async () => {
        render(<PageMenu {...props} />);

        await userEvent.click(screen.getByText('First Page'));
        expect(props.loadFirstPage).toHaveBeenCalled();

        await userEvent.click(screen.getByText('Last Page'));
        expect(props.loadLastPage).toHaveBeenCalled();

        await userEvent.click(screen.getByText('40'));
        expect(props.setPageSize).toHaveBeenCalledWith(40);
    });
});
