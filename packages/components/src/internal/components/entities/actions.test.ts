/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Map } from 'immutable';

import { extractEntityTypeOptionFromRow, getChosenParentData, getFieldDisplayValue, sampleGenCellKey } from './actions';
import { EntityDataType, EntityIdCreationModel } from './models';
import { DataClassDataType, SampleTypeDataType } from './constants';

describe('extractEntityTypeOptionFromRow', () => {
    const NAME = 'Test Name';
    const ROW = {
        RowId: { value: 1 },
        Name: { value: NAME },
        LSID: { value: 'ABC123' },
    };

    test('return value as expected', () => {
        const options = extractEntityTypeOptionFromRow(ROW);
        expect(options.label).toBe(NAME);
        expect(options.lsid).toBe('ABC123');
        expect(options.rowId).toBe(1);
        expect(options.value).toBe(NAME.toLowerCase());
        expect(options.query).toBe(NAME);
    });
});

describe('getChosenParentData', () => {
    let PARENT_ENTITY_DATA_TYPES = Map<string, EntityDataType>();
    PARENT_ENTITY_DATA_TYPES = PARENT_ENTITY_DATA_TYPES.set(SampleTypeDataType.instanceSchemaName, SampleTypeDataType);
    PARENT_ENTITY_DATA_TYPES = PARENT_ENTITY_DATA_TYPES.set(DataClassDataType.instanceSchemaName, DataClassDataType);

    test('allowParents = false', async () => {
        const result = await getChosenParentData(new EntityIdCreationModel(), PARENT_ENTITY_DATA_TYPES, false);
        expect(result.originalParents).toBe(undefined);
        expect(result.selectionKey).toBe(undefined);
        expect(result.entityParents.size).toBe(2);
        expect(result.entityParents.get(SampleTypeDataType.typeListingSchemaQuery.queryName).size).toBe(0);
        expect(result.entityParents.get(DataClassDataType.typeListingSchemaQuery.queryName).size).toBe(0);
        expect(result.entityCount).toBe(0);
    });

    test('allowParents, initialParents without value', async () => {
        const result = await getChosenParentData(
            new EntityIdCreationModel({
                originalParents: ['samples|TEST'],
                selectionKey: undefined,
            }),
            PARENT_ENTITY_DATA_TYPES,
            true
        );
        expect(result.originalParents).toBe(undefined);
        expect(result.selectionKey).toBe(undefined);
        expect(result.entityParents.size).toBe(2);
        expect(result.entityParents.get(SampleTypeDataType.typeListingSchemaQuery.queryName).size).toBe(1);
        expect(result.entityParents.get(DataClassDataType.typeListingSchemaQuery.queryName).size).toBe(0);
        expect(result.entityCount).toBe(0);
    });

    test('allowParents, without initialParents or selectionKey', async () => {
        const result = await getChosenParentData(
            new EntityIdCreationModel({
                originalParents: undefined,
                selectionKey: undefined,
            }),
            PARENT_ENTITY_DATA_TYPES,
            true
        );
        expect(result.originalParents).toBe(undefined);
        expect(result.selectionKey).toBe(undefined);
        expect(result.entityParents.size).toBe(2);
        expect(result.entityParents.get(SampleTypeDataType.typeListingSchemaQuery.queryName).size).toBe(0);
        expect(result.entityParents.get(DataClassDataType.typeListingSchemaQuery.queryName).size).toBe(0);
        expect(result.entityCount).toBe(0);
    });
});

describe('sampleGenCellKey', () => {
    test('with sample field key', () => {
        expect(sampleGenCellKey('SampleId', 'RunDate', 0)).toBe('sampleid/rundate&&0');
        expect(sampleGenCellKey('SampleId', 'RunDate', 1)).toBe('sampleid/rundate&&1');
        expect(sampleGenCellKey('SampleId', 'Ancestors/Sources/Study', 0)).toBe('sampleid/ancestors/sources/study&&0');
        expect(sampleGenCellKey('SampleId', 'Ancestors/Sources/Study', 1)).toBe('sampleid/ancestors/sources/study&&1');
    });
    test('without sample field key', () => {
        expect(sampleGenCellKey(undefined, 'RunDate', 0)).toBe('rundate&&0');
        expect(sampleGenCellKey(null, 'RunDate', 1)).toBe('rundate&&1');
        expect(sampleGenCellKey(undefined, 'Ancestors/Sources/Study', 0)).toBe('ancestors/sources/study&&0');
        expect(sampleGenCellKey(null, 'Ancestors/Sources/Study', 1)).toBe('ancestors/sources/study&&1');
    });
});

describe('getFieldDisplayValue', () => {
    test('returns formattedValue when available', () => {
        expect(getFieldDisplayValue({ formattedValue: 'formatted', displayValue: 'display', value: 'raw' })).toBe('formatted');
    });

    test('falls back to displayValue when formattedValue is undefined', () => {
        expect(getFieldDisplayValue({ displayValue: 'display', value: 'raw' })).toBe('display');
    });

    test('falls back to value when formattedValue and displayValue are undefined', () => {
        expect(getFieldDisplayValue({ value: 'raw' })).toBe('raw');
    });

    test('joins array values with comma and space', () => {
        expect(getFieldDisplayValue({ value: ['a', 'b', 'c'] })).toBe('a, b, c');
    });

    test('joins array formattedValue with comma and space', () => {
        expect(getFieldDisplayValue({ formattedValue: ['x', 'y'] })).toBe('x, y');
    });

    test('returns single string value as-is', () => {
        expect(getFieldDisplayValue({ value: 'single' })).toBe('single');
    });

    test('handles single-element array', () => {
        expect(getFieldDisplayValue({ value: ['only'] })).toBe('only');
    });

    test('returns empty string when fieldData is missing', () => {
        expect(getFieldDisplayValue(undefined)).toBe('');
        expect(getFieldDisplayValue(null)).toBe('');
        expect(getFieldDisplayValue('')).toBe('');
    });
});
