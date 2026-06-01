/*
 * Copyright (c) 2023-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { PaginationButtons } from './PaginationButtons';

const startSelector = '.pagination-info__start';
const endSelector = '.pagination-info__end';
const totalSelector = '.pagination-info__total';
const prevSelector = '.pagination-buttons__prev';
const nextSelector = '.pagination-buttons__next';

describe('PaginationButtons', () => {
    test('Render first page', async () => {
        const prev = jest.fn();
        const next = jest.fn();
        render(<PaginationButtons total={60} currentPage={0} perPage={20} previousPage={prev} nextPage={next} />);

        expect(document.querySelector(startSelector).textContent).toBe('1');
        expect(document.querySelector(endSelector).textContent).toBe('20');
        expect(document.querySelector(totalSelector).textContent).toBe('60');

        // verify prev/next button is disabled/enabled
        expect(document.querySelector(prevSelector).hasAttribute('disabled')).toBe(true);
        expect(document.querySelector(nextSelector).hasAttribute('disabled')).toBe(false);

        // click next button, enabled
        expect(prev).toHaveBeenCalledTimes(0);
        expect(next).toHaveBeenCalledTimes(0);
        await userEvent.click(document.querySelector(nextSelector));
        expect(prev).toHaveBeenCalledTimes(0);
        expect(next).toHaveBeenCalledTimes(1);
        // click prev button, disabled
        await userEvent.click(document.querySelector(prevSelector));
        expect(prev).toHaveBeenCalledTimes(0);
        expect(next).toHaveBeenCalledTimes(1);
    });

    test('Render last page', async () => {
        const prev = jest.fn();
        const next = jest.fn();
        render(<PaginationButtons total={60} currentPage={2} perPage={20} previousPage={prev} nextPage={next} />);

        expect(document.querySelector(startSelector).textContent).toBe('41');
        expect(document.querySelector(endSelector).textContent).toBe('60');
        expect(document.querySelector(totalSelector).textContent).toBe('60');

        // verify prev/next button is disabled/enabled
        expect(document.querySelector(prevSelector).hasAttribute('disabled')).toBe(false);
        expect(document.querySelector(nextSelector).hasAttribute('disabled')).toBe(true);

        // click prev button, enabled
        expect(prev).toHaveBeenCalledTimes(0);
        expect(next).toHaveBeenCalledTimes(0);
        await userEvent.click(document.querySelector(prevSelector));
        expect(prev).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledTimes(0);
        // click next button, disabled
        await userEvent.click(document.querySelector(nextSelector));
        expect(prev).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledTimes(0);
    });

    test('Render only page', async () => {
        const prev = jest.fn();
        const next = jest.fn();
        render(<PaginationButtons total={10} currentPage={0} perPage={20} previousPage={prev} nextPage={next} />);

        expect(document.querySelector(startSelector).textContent).toBe('1');
        expect(document.querySelector(endSelector).textContent).toBe('10');
        expect(document.querySelector(totalSelector).textContent).toBe('10');

        // verify prev/next button is disabled/enabled
        expect(document.querySelector(prevSelector).hasAttribute('disabled')).toBe(true);
        expect(document.querySelector(nextSelector).hasAttribute('disabled')).toBe(true);

        // click next button
        expect(prev).toHaveBeenCalledTimes(0);
        expect(next).toHaveBeenCalledTimes(0);
        await userEvent.click(document.querySelector(nextSelector));
        expect(prev).toHaveBeenCalledTimes(0);
        expect(next).toHaveBeenCalledTimes(0);
        // click prev button, disabled
        await userEvent.click(document.querySelector(prevSelector));
        expect(prev).toHaveBeenCalledTimes(0);
        expect(next).toHaveBeenCalledTimes(0);
    });

    test('Render last page with less items than perPage', async () => {
        const prev = jest.fn();
        const next = jest.fn();
        render(<PaginationButtons total={63} currentPage={3} perPage={20} previousPage={prev} nextPage={next} />);

        expect(document.querySelector(startSelector).textContent).toBe('61');
        expect(document.querySelector(endSelector).textContent).toBe('63');
        expect(document.querySelector(totalSelector).textContent).toBe('63');

        // verify prev/next button is disabled/enabled
        expect(document.querySelector(prevSelector).hasAttribute('disabled')).toBe(false);
        expect(document.querySelector(nextSelector).hasAttribute('disabled')).toBe(true);

        // click prev button, enabled
        expect(prev).toHaveBeenCalledTimes(0);
        expect(next).toHaveBeenCalledTimes(0);
        await userEvent.click(document.querySelector(prevSelector));
        expect(prev).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledTimes(0);
        // click next button, disabled
        await userEvent.click(document.querySelector(nextSelector));
        expect(prev).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledTimes(0);
    });

    test('Hide counts with invalid data', () => {
        const prev = jest.fn();
        const next = jest.fn();
        render(<PaginationButtons total={0} currentPage={1} perPage={20} previousPage={prev} nextPage={next} />);
        expect(document.querySelector('.pagination-buttons__info').innerHTML).toBe('');
    });
});
