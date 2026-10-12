/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Filter } from '@labkey/api';

import {
    composeFieldToFilter,
    createSearchSuggestion,
    suggestionToFilter,
} from './utils';

describe('suggestion filters', () => {
    test('search becomes a Q filter', () => {
        const filter = suggestionToFilter({
            kind: 'search',
            label: '',
            source: 'fallback',
            value: 'foo',
        });
        expect(filter.getColumnName()).toBe('*');
        expect(filter.getFilterType()).toBe(Filter.Types.Q);
        expect(filter.getValue()).toBe('foo');
    });

    test('direct filter', () => {
        const filter = suggestionToFilter({
            fieldKey: 'SampleState/Label',
            kind: 'filter',
            label: '',
            op: 'eq',
            source: 'exactValue',
            value: 'Available',
        });
        expect(filter.getColumnName()).toBe('SampleState/Label');
        expect(filter.getFilterType()).toBe(Filter.Types.EQUAL);
        expect(filter.getValue()).toBe('Available');
    });

    test('multi-valued operators split the value', () => {
        const filter = composeFieldToFilter({ fieldKey: 'Collected', op: 'between' }, '2023-01-01,2023-12-31');
        expect(filter.getFilterType()).toBe(Filter.Types.BETWEEN);
        expect(filter.getValue()).toEqual(['2023-01-01', '2023-12-31']);
    });
});

describe('createSearchSuggestion', () => {
    test('searches all columns for the raw term', () => {
        expect(createSearchSuggestion('Sodium')).toEqual({
            kind: 'search',
            label: 'Search all columns for "Sodium"',
            source: 'fallback',
            value: 'Sodium',
        });
    });
});
