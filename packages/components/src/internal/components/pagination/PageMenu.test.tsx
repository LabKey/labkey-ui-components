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
