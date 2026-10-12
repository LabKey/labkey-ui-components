/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Filter } from '@labkey/api';

import { filterActionValuesByType } from './utils';
import { ActionValue } from './actions/Action';

describe('filterActionValuesByType', () => {
    const mockActionValues: ActionValue[] = [
        {
            action: { keyword: 'search' },
        },
        {
            action: { keyword: 'filter' },
        },
        {
            action: { keyword: 'filter' },
            isReadOnly: 'locked',
        },
    ];

    it('returns only action values matching the keyword', () => {
        const result = filterActionValuesByType(mockActionValues, 'search', false);
        expect(result.length).toBe(1);
        expect(result.every(av => av.action.keyword === 'search')).toBe(true);
    });

    it('excludes read-only action values when lockReadOnlyForDelete is true', () => {
        const result = filterActionValuesByType(mockActionValues, 'search', true);
        expect(result.length).toBe(1);
        expect(result[0].isReadOnly).toBeUndefined();
    });

    it('returns an empty array when no action values match the keyword', () => {
        const result = filterActionValuesByType(mockActionValues, 'nonexistent', false);
        expect(result.length).toBe(0);
    });

    it('returns non-readonly filter action values when lockReadOnlyForDelete is true', () => {
        const result = filterActionValuesByType(mockActionValues, 'filter', true);
        expect(result.length).toBe(1);
        expect(result[0].isReadOnly).toBeUndefined();
    });

    it('returns all matching action values when lockReadOnlyForDelete is false', () => {
        const result = filterActionValuesByType(mockActionValues, 'filter', false);
        expect(result.length).toBe(2);
        expect(result[0].isReadOnly).toBeUndefined();
        expect(result[1].isReadOnly).toBe('locked');
    });
});
