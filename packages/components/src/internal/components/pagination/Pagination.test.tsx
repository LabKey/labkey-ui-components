/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { Pagination, PaginationProps } from './Pagination';

describe('Pagination', () => {
    let props: PaginationProps;
    beforeEach(() => {
        props = {
            disabled: false,
            currentPage: 1,
            isFirstPage: false,
            isLastPage: false,
            offset: 0,
            pageCount: 34,
            pageSize: 20,
            rowCount: 661,
            loadFirstPage: jest.fn(),
            loadLastPage: jest.fn(),
            loadNextPage: jest.fn(),
            loadPreviousPage: jest.fn(),
            setPageSize: jest.fn(),
        };
    });

    test('render', () => {
        // Previous page button should be disabled
        const { rerender } = render(<Pagination {...props} isFirstPage />);
        expect(document.querySelector('.pagination-button--previous')).toBeDisabled();
        expect(document.querySelector('.pagination-button--next')).not.toBeDisabled();

        // Next page button should be disabled
        rerender(<Pagination {...props} isLastPage={true} />);
        expect(document.querySelector('.pagination-button--previous')).not.toBeDisabled();
        expect(document.querySelector('.pagination-button--next')).toBeDisabled();

        // Everything should be disabled.
        rerender(<Pagination {...props} disabled />);
        expect(document.querySelector('.pagination-button--previous')).toBeDisabled();
        expect(document.querySelector('.pagination-button--next')).toBeDisabled();

        // PageSizeMenu is last button
        expect(document.querySelector('.current-page-dropdown')).toBeDisabled();

        // PageMenu should be hidden.
        rerender(<Pagination {...props} rowCount={5} />);
        expect(document.querySelector('.current-page-dropdown')).not.toBeInTheDocument();

        rerender(<Pagination {...props} />);
        expect(document.querySelector('.pagination-info').textContent).toEqual('1 - 20 of 661');

        rerender(<Pagination {...props} pageSize={40} />);
        expect(document.querySelector('.pagination-info').textContent).toEqual('1 - 40 of 661');

        rerender(<Pagination {...props} offset={20} />);
        expect(document.querySelector('.pagination-info').textContent).toEqual('21 - 40 of 661');

        rerender(<Pagination {...props} pageSize={20} rowCount={10} />);
        expect(document.querySelector('.pagination-info').textContent).toEqual('1 - 10');
    });

    test('interactions', async () => {
        // Note: we only test next/previous buttons here because the menu components have their own interaction tests.
        const { loadNextPage, loadPreviousPage } = props;
        render(<Pagination {...props} currentPage={2} />);
        await userEvent.click(document.querySelector('.pagination-button--next'));
        expect(loadNextPage).toHaveBeenCalled();
        await userEvent.click(document.querySelector('.pagination-button--previous'));
        expect(loadPreviousPage).toHaveBeenCalled();
    });
});
