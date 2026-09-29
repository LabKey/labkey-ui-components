/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Filter } from '@labkey/api';

import {
    composeFieldToFilter,
    getValueShape,
    isGridSearchSuggestionsEnabled,
    nameExpressionToRegExp,
    setGridSearchSuggestionsEnabled,
    suggestionToFilter,
} from './utils';

describe('getValueShape', () => {
    test('letters and digits', () => {
        expect(getValueShape('SUBJ-028504')).toBe('AAAA-999999');
        expect(getValueShape('PL-5000000-1')).toBe('AA-9999999-9');
        expect(getValueShape('Freezer100 / Rack10')).toBe('AAAAAAA999 / AAAA99');
    });
});

describe('nameExpressionToRegExp', () => {
    test('substitutions match anything, constants are literal', () => {
        const regExp = nameExpressionToRegExp('PL-${genId}');
        expect(regExp.test('PL-5000000')).toBe(true);
        expect(regExp.test('PL-5000000-1')).toBe(true);
        expect(regExp.test('pl-12')).toBe(true);
        expect(regExp.test('PL-')).toBe(false);
        expect(regExp.test('XPL-1')).toBe(false);
    });

    test('nested substitutions', () => {
        const regExp = nameExpressionToRegExp('S-${${AliquotedFrom}-:withCounter}.${genId}');
        expect(regExp.test('S-parent-1.22')).toBe(true);
        expect(regExp.test('S-parent-1-22')).toBe(false);
    });

    test('regular expression characters in constants are escaped', () => {
        const regExp = nameExpressionToRegExp('A+(${genId})');
        expect(regExp.test('A+(12)')).toBe(true);
        expect(regExp.test('AA(12)')).toBe(false);
    });

    test('expressions without a meaningful constant are not usable', () => {
        expect(nameExpressionToRegExp(undefined)).toBeUndefined();
        expect(nameExpressionToRegExp('${genId}')).toBeUndefined();
        expect(nameExpressionToRegExp('${Parent}-${genId}')).toBeUndefined();
    });
});

describe('suggestion filters', () => {
    test('search becomes a Q filter', () => {
        const filter = suggestionToFilter({ kind: 'search', label: '', source: 'fallback', value: 'foo' });
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

describe('setGridSearchSuggestionsEnabled', () => {
    test('toggles the app-wide default', () => {
        expect(isGridSearchSuggestionsEnabled()).toBe(false);
        setGridSearchSuggestionsEnabled(true);
        expect(isGridSearchSuggestionsEnabled()).toBe(true);
        setGridSearchSuggestionsEnabled(false);
        expect(isGridSearchSuggestionsEnabled()).toBe(false);
    });
});
