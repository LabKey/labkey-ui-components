/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';

import { render } from '@testing-library/react';

import { LKS_PRODUCT_ID } from '../../app/products';

import { ProductNavigationHeader } from './ProductNavigationHeader';

const DEFAULT_PROPS = {
    productId: undefined,
    title: undefined,
    onClick: jest.fn,
};

describe('ProductNavigationHeader', () => {
    function validate(hasBack = false) {
        expect(document.querySelectorAll('.back-icon')).toHaveLength(hasBack ? 1 : 0);
        expect(document.querySelectorAll('.clickable')).toHaveLength(hasBack ? 1 : 0);
        expect(document.querySelectorAll('.fa-chevron-left')).toHaveLength(hasBack ? 1 : 0);
        expect(document.querySelectorAll('.header-title')).toHaveLength(1);
    }

    test('no productId or title', () => {
        render(<ProductNavigationHeader {...DEFAULT_PROPS} />);
        validate();
        expect(document.querySelector('.header-title').textContent).toBe('Applications');
    });

    test('title', () => {
        render(<ProductNavigationHeader {...DEFAULT_PROPS} title="Test title" />);
        validate();
        expect(document.querySelector('.header-title').textContent).toBe('Test title');
    });

    test('productId LKS_PRODUCT_ID', () => {
        render(<ProductNavigationHeader {...DEFAULT_PROPS} productId={LKS_PRODUCT_ID} />);
        validate(true);
        expect(document.querySelector('.header-title').textContent).toBe('LabKey Server');
    });

    test('productId other', () => {
        render(<ProductNavigationHeader {...DEFAULT_PROPS} productId="other" />);
        validate(true);
        expect(document.querySelector('.header-title').textContent).toBe('Applications');
    });
});
