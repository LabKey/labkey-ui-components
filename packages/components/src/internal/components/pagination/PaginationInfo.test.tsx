/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render } from '@testing-library/react';

import { LoadingState } from '../../../public/LoadingState';

import { PaginationInfo, PaginationInfoProps } from './PaginationInfo';

describe('PaginationInfo', () => {
    function getDefaultProps(): PaginationInfoProps {
        return {
            offset: 0,
            pageSize: 20,
            rowCount: 1,
            totalCountLoadingState: LoadingState.LOADED,
        };
    }

    test('loading', () => {
        render(<PaginationInfo {...getDefaultProps()} totalCountLoadingState={LoadingState.LOADING} />);
        expect(document.querySelector('.fa-spinner')).toBeInTheDocument();
        expect(document.querySelector('.pagination-info')).toBeInTheDocument();
        expect(document.querySelector('.pagination-info').textContent).toBe('1 -  ');
    });

    test('rowCount greater than maxRows', () => {
        render(<PaginationInfo {...getDefaultProps()} rowCount={22} />);
        expect(document.querySelector('.fa-spinner')).not.toBeInTheDocument();
        expect(document.querySelector('.pagination-info')).toBeInTheDocument();
        expect(document.querySelector('.pagination-info').textContent).toBe('1 - 20 of 22');
    });

    test('offset', () => {
        render(<PaginationInfo {...getDefaultProps()} rowCount={22} offset={20} />);
        expect(document.querySelector('.fa-spinner')).not.toBeInTheDocument();
        expect(document.querySelector('.pagination-info')).toBeInTheDocument();
        expect(document.querySelector('.pagination-info').textContent).toBe('21 - 22');
    });

    test('lots of rows, very large page', () => {
        render(<PaginationInfo {...getDefaultProps()} pageSize={3412} rowCount={22341} />);
        expect(document.querySelector('.fa-spinner')).not.toBeInTheDocument();
        expect(document.querySelector('.pagination-info')).toBeInTheDocument();
        expect(document.querySelector('.pagination-info').textContent).toBe('1 - 3,412 of 22,341');
    });

    test('capped rowCount shows a "+" suffix', () => {
        render(<PaginationInfo {...getDefaultProps()} rowCount={100000} rowCountCapped />);
        expect(document.querySelector('.pagination-info').textContent).toBe('1 - 20 of 100,000+');
    });

    test('capped rowCount shows total even on the boundary page where rowCount === max', () => {
        // rowCount (20) === max (20): without the cap the total is hidden, with the cap it shows "20+"
        const { container, rerender } = render(<PaginationInfo {...getDefaultProps()} rowCount={20} />);
        expect(container.querySelector('.pagination-info').textContent).toBe('1 - 20');

        rerender(<PaginationInfo {...getDefaultProps()} rowCount={20} rowCountCapped />);
        expect(container.querySelector('.pagination-info').textContent).toBe('1 - 20 of 20+');
    });
});
