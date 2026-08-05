/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Map } from 'immutable';
import { Filter } from '@labkey/api';

import { SchemaQuery } from '../../../public/SchemaQuery';
import { Row, selectRows, SelectRowsOptions, SelectRowsResponse } from '../../query/selectRows';

import {
    extractEntityTypeOptionFromRow,
    getChosenParentData,
    getFieldDisplayValue,
    getSelectedParents,
    sampleGenCellKey,
} from './actions';
import { EntityDataType, EntityIdCreationModel } from './models';
import { DataClassDataType, SampleTypeDataType } from './constants';

jest.mock('../../query/selectRows', () => ({
    ...jest.requireActual('../../query/selectRows'),
    selectRows: jest.fn().mockResolvedValue({ rows: [] }),
}));

const mockSelectRows = selectRows as jest.MockedFunction<typeof selectRows>;

const getSelectRowsOptions = (): SelectRowsOptions => mockSelectRows.mock.calls[0][0];

const mockSelectRowsResponse = (rows: Row[]): void => {
    mockSelectRows.mockResolvedValue({ rows } as SelectRowsResponse);
};

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
        expect(result.originalParents).toBeUndefined();
        expect(result.selectionKey).toBeUndefined();
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
        expect(result.originalParents).toBeUndefined();
        expect(result.selectionKey).toBeUndefined();
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
        expect(result.originalParents).toBeUndefined();
        expect(result.selectionKey).toBeUndefined();
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
        expect(getFieldDisplayValue({ formattedValue: 'formatted', displayValue: 'display', value: 'raw' })).toBe(
            'formatted'
        );
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

describe('getSelectedParents', () => {
    const SAMPLE_SQ = new SchemaQuery('samples', 'Blood');
    const DATA_CLASS_SQ = new SchemaQuery('exp.data', 'Ingredients');
    const FILTERS = [Filter.create('RowId', [1, 2], Filter.Types.IN)];

    beforeEach(() => {
        mockSelectRows.mockClear();
        mockSelectRowsResponse([]);
    });

    // GitHub Issue 1357: the selected parents must be resolved from the detail view so that filters applied to the
    // default view (or to whichever view the selection came from) don't drop selected parents from the response.
    test('queries the detail view for a sample parent', async () => {
        await getSelectedParents(SAMPLE_SQ, FILTERS);

        expect(mockSelectRows).toHaveBeenCalledTimes(1);
        const { columns, filterArray, schemaQuery } = getSelectRowsOptions();
        expect(SAMPLE_SQ.detailView.isEqual(schemaQuery)).toBe(true);
        expect(columns).toEqual(['LSID', 'Name', 'RowId', 'SampleSet']);
        expect(filterArray).toBe(FILTERS);
    });

    test('queries the detail view for a data class parent', async () => {
        await getSelectedParents(DATA_CLASS_SQ, FILTERS);

        expect(mockSelectRows).toHaveBeenCalledTimes(1);
        const { columns, filterArray, schemaQuery } = getSelectRowsOptions();
        expect(DATA_CLASS_SQ.detailView.isEqual(schemaQuery)).toBe(true);
        expect(columns).toEqual(['LSID', 'Name', 'RowId', 'DataClass']);
        expect(filterArray).toBe(FILTERS);
    });
});
