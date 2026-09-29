/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { parseDateSpan, parseSuggestionTerm } from './term';

describe('parseSuggestionTerm', () => {
    test('trims and keeps non-numeric text as-is', () => {
        expect(parseSuggestionTerm('  Sodium  ')).toEqual({ dateSpan: undefined, raw: 'Sodium' });
        expect(parseSuggestionTerm(undefined)).toEqual({ raw: '' });
    });

    test('numbers', () => {
        expect(parseSuggestionTerm('3')).toMatchObject({ hasLeadingZero: false, isInteger: true, number: 3 });
        expect(parseSuggestionTerm('-12')).toMatchObject({ hasLeadingZero: false, isInteger: true, number: -12 });
        expect(parseSuggestionTerm('86.76')).toMatchObject({ isInteger: false, number: 86.76 });
        expect(parseSuggestionTerm('0.5')).toMatchObject({ hasLeadingZero: false, isInteger: false, number: 0.5 });
        expect(parseSuggestionTerm('005004441')).toMatchObject({ hasLeadingZero: true, isInteger: true });
        expect(parseSuggestionTerm('1,000').number).toBeUndefined();
        expect(parseSuggestionTerm('1e5').number).toBeUndefined();
    });

    test('a four-digit integer is both a number and a year', () => {
        const term = parseSuggestionTerm('2023');
        expect(term.number).toBe(2023);
        expect(term.dateSpan).toEqual({ end: '2023-12-31', precision: 'year', start: '2023-01-01' });
    });
});

describe('parseDateSpan', () => {
    test('full dates', () => {
        const day = { end: '2019-02-03', precision: 'day', start: '2019-02-03' };
        expect(parseDateSpan('2019-02-03')).toEqual(day);
        expect(parseDateSpan('2019/2/3')).toEqual(day);
        expect(parseDateSpan('2019-02-03 11:38')).toEqual(day);
        expect(parseDateSpan('2019-02-03T11:38:05.123')).toEqual(day);
    });

    test('invalid days and months', () => {
        expect(parseDateSpan('2023-02-29')).toBeUndefined();
        expect(parseDateSpan('2024-02-29')).toEqual({ end: '2024-02-29', precision: 'day', start: '2024-02-29' });
        expect(parseDateSpan('2023-13')).toBeUndefined();
        expect(parseDateSpan('2023-00-10')).toBeUndefined();
    });

    test('months', () => {
        const feb = { end: '2024-02-29', precision: 'month', start: '2024-02-01' };
        expect(parseDateSpan('2024-02')).toEqual(feb);
        expect(parseDateSpan('Feb 2024')).toEqual(feb);
        expect(parseDateSpan('february 2024')).toEqual(feb);
        expect(parseDateSpan('Feb. 2024')).toEqual(feb);
        expect(parseDateSpan('Febr 2024')).toBeUndefined();
    });

    test('ambiguous or unsupported formats are not dates', () => {
        expect(parseDateSpan('03/04/2023')).toBeUndefined();
        expect(parseDateSpan('3')).toBeUndefined();
        expect(parseDateSpan('PL-2023')).toBeUndefined();
        expect(parseDateSpan('last 7 days')).toBeUndefined();
    });
});
