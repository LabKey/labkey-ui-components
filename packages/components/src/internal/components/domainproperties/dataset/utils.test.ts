import { DomainField } from '../models';

import { DECIMAL_RANGE_URI, STRING_RANGE_URI } from '../constants';

import { allowAsManagedField, getDatasetSystemFields, getStudyTimepointLabel, StudyProperties } from './utils';

describe('getDatasetSystemFields', () => {
    test('not visit based', () => {
        const fields = getDatasetSystemFields({
            SubjectColumnName: 'Mouse',
            TimepointType: 'TIMEPOINT',
        } as StudyProperties);
        expect(fields.length).toBe(5);
        expect(fields[0].Name).toBe('Mouse');
        expect(fields[0].Label).toBe('Mouse');
        expect(fields[1].Required).toBe(false);
    });

    test('visit based', () => {
        const fields = getDatasetSystemFields({
            SubjectColumnName: 'Mouse',
            TimepointType: 'VISIT',
        } as StudyProperties);
        expect(fields.length).toBe(3);
        expect(fields[0].Name).toBe('Mouse');
        expect(fields[0].Label).toBe('Mouse');
        expect(fields[1].Required).toBe(true);
    });
});

describe('allowAsManagedField', () => {
    test('without type', () => {
        expect(allowAsManagedField(undefined)).toBe(undefined);
        expect(allowAsManagedField(DomainField.create({}))).toBe(true);
    });

    test('with type', () => {
        expect(allowAsManagedField(DomainField.create({ dataType: { rangeURI: STRING_RANGE_URI } }))).toBe(true);
        expect(allowAsManagedField(DomainField.create({ dataType: { rangeURI: DECIMAL_RANGE_URI } }))).toBe(true);
        expect(allowAsManagedField(DomainField.create({ dataType: { name: 'lookup' } }))).toBe(true);
    });
});

describe('getStudyTimepointLabel', () => {
    test('types', () => {
        expect(getStudyTimepointLabel('VISIT')).toBe('Visits');
        expect(getStudyTimepointLabel('TIMEPOINT')).toBe('Timepoints');
        expect(getStudyTimepointLabel('OTHER')).toBe('Timepoints');
    });
});
