/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render } from '@testing-library/react';

import { FindAndSearchDropdown } from './FindAndSearchDropdown';

describe('FindAndSearchDropdown', () => {
    test('search but no find', () => {
        render(<FindAndSearchDropdown title="Test title" onSearch={jest.fn} />);
        expect(document.querySelector('.dropdown-toggle')).toHaveTextContent('Test title');
        const items = document.querySelectorAll('.lk-menu-item');
        expect(items).toHaveLength(2);
        expect(items[0]).toHaveTextContent('Sample Finder');
        expect(items[1]).toHaveTextContent('Search');
        expect(document.querySelector('.modal')).not.toBeInTheDocument();
    });

    test('find but no search', () => {
        render(<FindAndSearchDropdown title="Test title" findNounPlural="tests" onFindByIds={jest.fn} />);
        const items = document.querySelectorAll('.lk-menu-item');
        expect(items).toHaveLength(3);
        expect(items[0]).toHaveTextContent('Find Tests by Barcode');
        expect(items[1]).toHaveTextContent('Find Tests by ID');
        expect(items[2]).toHaveTextContent('Sample Finder');
    });
});
