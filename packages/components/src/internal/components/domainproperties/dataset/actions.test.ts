/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { DomainDesign } from '../models';
import { CALCULATED_CONCEPT_URI, MULTI_CHOICE_RANGE_URI } from '../constants';

import { TIME_KEY_FIELD_DISPLAY, TIME_KEY_FIELD_KEY, VISIT_TIMEPOINT_TYPE } from './constants';
import { getAdditionalKeyFields } from './actions';

describe('getAdditionalKeyFields', () => {
    test('includes time key field for date-based study', () => {
        const domain = DomainDesign.create({});
        const result = getAdditionalKeyFields(domain, 'DATE');

        expect(result.size).toBe(1);
        expect(result.get(0)).toEqual({ value: TIME_KEY_FIELD_KEY, label: TIME_KEY_FIELD_DISPLAY });
    });

    test('excludes time key field for visit-based study', () => {
        const domain = DomainDesign.create({});
        const result = getAdditionalKeyFields(domain, VISIT_TIMEPOINT_TYPE);

        expect(result.size).toBe(0);
    });

    test('includes regular fields', () => {
        const domain = DomainDesign.create({
            fields: [
                { name: 'Field1', rangeURI: 'int' },
                { name: 'Field2', rangeURI: 'string' },
            ],
        });
        const result = getAdditionalKeyFields(domain, VISIT_TIMEPOINT_TYPE);

        expect(result.size).toBe(2);
        expect(result.get(0)).toEqual({ value: 'Field1', label: 'Field1' });
        expect(result.get(1)).toEqual({ value: 'Field2', label: 'Field2' });
    });

    test('excludes calculated fields', () => {
        const domain = DomainDesign.create({
            fields: [
                { name: 'Regular', rangeURI: 'int' },
                { name: 'Calculated', rangeURI: 'int', conceptURI: CALCULATED_CONCEPT_URI },
            ],
        });
        const result = getAdditionalKeyFields(domain, VISIT_TIMEPOINT_TYPE);

        expect(result.size).toBe(1);
        expect(result.get(0)).toEqual({ value: 'Regular', label: 'Regular' });
    });

    test('excludes multi-choice fields', () => {
        const domain = DomainDesign.create({
            fields: [
                { name: 'Regular', rangeURI: 'int' },
                { name: 'MultiChoice', rangeURI: MULTI_CHOICE_RANGE_URI },
            ],
        });
        const result = getAdditionalKeyFields(domain, VISIT_TIMEPOINT_TYPE);

        expect(result.size).toBe(1);
        expect(result.get(0)).toEqual({ value: 'Regular', label: 'Regular' });
    });

    test('includes time key field before domain fields for non-visit study', () => {
        const domain = DomainDesign.create({
            fields: [{ name: 'Field1', rangeURI: 'int' }],
        });
        const result = getAdditionalKeyFields(domain, 'Timepoints');

        expect(result.size).toBe(2);
        expect(result.get(0)).toEqual({ value: TIME_KEY_FIELD_KEY, label: TIME_KEY_FIELD_DISPLAY });
        expect(result.get(1)).toEqual({ value: 'Field1', label: 'Field1' });
    });

    test('filters out both calculated and multi-choice fields while keeping regular fields', () => {
        const domain = DomainDesign.create({
            fields: [
                { name: 'Regular1', rangeURI: 'int' },
                { name: 'Calculated', rangeURI: 'int', conceptURI: CALCULATED_CONCEPT_URI },
                { name: 'Regular2', rangeURI: 'string' },
                { name: 'MultiChoice', rangeURI: MULTI_CHOICE_RANGE_URI },
            ],
        });
        const result = getAdditionalKeyFields(domain, 'Timepoints');

        expect(result.size).toBe(3);
        expect(result.get(0)).toEqual({ value: TIME_KEY_FIELD_KEY, label: TIME_KEY_FIELD_DISPLAY });
        expect(result.get(1)).toEqual({ value: 'Regular1', label: 'Regular1' });
        expect(result.get(2)).toEqual({ value: 'Regular2', label: 'Regular2' });
    });
});
