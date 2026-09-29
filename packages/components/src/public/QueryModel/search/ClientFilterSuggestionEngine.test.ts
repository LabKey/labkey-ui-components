/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { QueryInfo } from '../../QueryInfo';
import { STORAGE_UNIQUE_ID_CONCEPT_URI } from '../../../internal/components/domainproperties/constants';

import {
    getFilterSuggestions,
    invalidateFilterSuggestionCache,
    SuggestionDataAPI,
} from './ClientFilterSuggestionEngine';
import { FilterSuggestionsRequest } from './models';

const TUBE_TYPES = ['ACD-B', 'EDTA K3', 'Heparin Li', 'Heparin Na', 'Sodium Citrate'];
const STATUSES = ['Available', 'Consumed', 'Locked'];

const pad = (n: number, width: number): string => String(n).padStart(width, '0');

// 600 rows so the ID-like columns overflow the distinct value limit and fall back to value shapes
const ROWS = Array.from({ length: 600 }, (_, i) => {
    const date = new Date(Date.UTC(2019, 0, 1 + i));
    return {
        Barcode: pad(5004000 + i, 9),
        CollectionDate: `${date.getUTCFullYear()}/${pad(date.getUTCMonth() + 1, 2)}/${pad(date.getUTCDate(), 2)} 00:00:00`,
        Concentration: 50 + (i % 70),
        FreezeThawCount: i % 6,
        Name: `PL-${1000 + i}`,
        RowId: i + 1,
        'SampleState/Label': STATUSES[i % 3],
        SubjectID: `SUBJ-${pad(i, 6)}`,
        TubeType: TUBE_TYPES[i % 5],
    };
});

const QUERY_INFO = QueryInfo.fromJsonForTests({
    name: 'Plasma',
    schemaName: 'samples',
    pkCols: ['RowId'],
    titleColumn: 'Name',
    columns: {
        Name: {
            fieldKey: 'Name',
            name: 'Name',
            caption: 'Sample ID',
            jsonType: 'string',
            nameExpression: 'PL-${genId}',
        },
        TubeType: { fieldKey: 'TubeType', name: 'TubeType', caption: 'Tube Type', jsonType: 'string' },
        SubjectID: { fieldKey: 'SubjectID', name: 'SubjectID', caption: 'Subject ID', jsonType: 'string' },
        Barcode: {
            fieldKey: 'Barcode',
            name: 'Barcode',
            caption: 'Barcode',
            jsonType: 'string',
            conceptURI: STORAGE_UNIQUE_ID_CONCEPT_URI,
        },
        Concentration: {
            fieldKey: 'Concentration',
            name: 'Concentration',
            caption: 'Concentration',
            jsonType: 'float',
        },
        FreezeThawCount: {
            fieldKey: 'FreezeThawCount',
            name: 'FreezeThawCount',
            caption: 'Freeze/Thaw Count',
            jsonType: 'int',
        },
        CollectionDate: {
            fieldKey: 'CollectionDate',
            name: 'CollectionDate',
            caption: 'Collection Date',
            jsonType: 'date',
        },
        SampleState: {
            fieldKey: 'SampleState',
            name: 'SampleState',
            caption: 'Status',
            jsonType: 'int',
            displayField: 'SampleState/Label',
            displayFieldJsonType: 'string',
            lookup: { schemaName: 'exp', queryName: 'SampleStatus', displayColumn: 'Label', keyColumn: 'RowId' },
        },
        Units: {
            fieldKey: 'Units',
            name: 'Units',
            caption: 'Units',
            jsonType: 'string',
            validValues: ['mL', 'blocks'],
        },
        IsAliquot: { fieldKey: 'IsAliquot', name: 'IsAliquot', caption: 'Is Aliquot', jsonType: 'boolean' },
        Description: {
            fieldKey: 'Description',
            name: 'Description',
            caption: 'Description',
            jsonType: 'string',
            inputType: 'textarea',
        },
        RowId: { fieldKey: 'RowId', name: 'RowId', caption: 'Row Id', jsonType: 'int', isKeyField: true },
    },
});

const REQUEST: Omit<FilterSuggestionsRequest, 'term'> = {
    columns: [
        'Name',
        'TubeType',
        'SubjectID',
        'Barcode',
        'Concentration',
        'FreezeThawCount',
        'CollectionDate',
        'SampleState',
        'Units',
        'IsAliquot',
        'Description',
    ],
    containerPath: '/Project',
    queryName: 'Plasma',
    schemaName: 'samples',
};

const AGGREGATE_PATTERN = /(MIN|MAX|COUNT)\((?:DISTINCT )?([^)]+)\) AS "(\w+)"/g;

function aggregate(fn: string, values: unknown[]): unknown {
    if (fn === 'COUNT') return new Set(values).size;
    const sorted = [...values].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    return fn === 'MIN' ? sorted[0] : sorted[sorted.length - 1];
}

// Answers the engine's queries from ROWS so the whole load path runs without a server
function createDataAPI(overrides: Partial<SuggestionDataAPI> = {}): jest.Mocked<SuggestionDataAPI> {
    return {
        executeSql: jest.fn(async ({ sql }) => {
            const row = {};
            for (const [, fn, column, alias] of sql.matchAll(AGGREGATE_PATTERN)) {
                row[alias] = {
                    value: aggregate(
                        fn,
                        ROWS.map(r => r[column])
                    ),
                };
            }
            return { messages: [], rowCount: 1, rows: [row] };
        }),
        getQueryDetails: jest.fn(async () => QUERY_INFO),
        selectDistinctRows: jest.fn(async ({ column, maxRows, queryName, schemaName }) => {
            const source = queryName === 'SampleStatus' ? STATUSES.map(Label => ({ Label })) : ROWS;
            const values = Array.from(new Set(source.map(r => r[column])));
            return { queryName, schemaName, values: values.slice(0, maxRows) };
        }),
        selectRows: jest.fn(async ({ columns, maxRows }) => ({
            messages: [],
            metaData: undefined,
            queryInfo: QUERY_INFO,
            rowCount: maxRows,
            rows: ROWS.slice(0, maxRows).map(r =>
                Object.fromEntries((columns as string[]).map(c => [c, { value: r[c] }]))
            ),
            schemaQuery: undefined,
        })),
        ...overrides,
    } as jest.Mocked<SuggestionDataAPI>;
}

const labels = (response: { suggestions: { label: string }[] }): string[] => response.suggestions.map(s => s.label);

describe('getFilterSuggestions', () => {
    beforeEach(() => {
        invalidateFilterSuggestionCache();
    });

    test('blank term', async () => {
        const dataAPI = createDataAPI();
        expect(await getFilterSuggestions({ ...REQUEST, term: ' ' }, { dataAPI })).toEqual({
            complete: true,
            suggestions: [],
        });
        expect(dataAPI.getQueryDetails).not.toHaveBeenCalled();
    });

    test('low-cardinality values', async () => {
        const dataAPI = createDataAPI();
        const response = await getFilterSuggestions({ ...REQUEST, term: 'Sodium' }, { dataAPI });

        expect(response.complete).toBe(true);
        expect(labels(response)).toEqual([
            'Tube Type is Sodium Citrate',
            'Compose a filter on Tube Type…',
            'Search all columns for "Sodium"',
        ]);
        // One aggregate pass covers every column that needs stats
        expect(dataAPI.executeSql).toHaveBeenCalledTimes(1);
        const { sql } = dataAPI.executeSql.mock.calls[0][0];
        expect(sql).toContain('COUNT(DISTINCT TubeType)');
        expect(sql).toContain('MIN(Concentration)');
        expect(sql).toContain('MIN(CollectionDate)');
        expect(sql).not.toContain('Description');
        expect(sql).toContain('FROM "Plasma"');
    });

    test('high-cardinality column falls back to value shapes', async () => {
        const dataAPI = createDataAPI();
        const response = await getFilterSuggestions({ ...REQUEST, term: 'SUBJ-000123' }, { dataAPI });

        expect(labels(response)).toEqual([
            'Subject ID is SUBJ-000123',
            'Compose a filter on Subject ID…',
            'Search all columns for "SUBJ-000123"',
        ]);
        expect(dataAPI.selectRows).toHaveBeenCalled();
        expect(dataAPI.selectRows.mock.calls[0][0]).toMatchObject({ includeTotalCount: false, maxRows: 200 });
        expect(dataAPI.selectDistinctRows).not.toHaveBeenCalledWith(expect.objectContaining({ column: 'SubjectID' }));
    });

    test('lookup values come from the lookup target', async () => {
        const dataAPI = createDataAPI();
        const response = await getFilterSuggestions({ ...REQUEST, term: 'Avail' }, { dataAPI });

        expect(labels(response)[0]).toBe('Status is Available');
        expect(response.suggestions[0]).toMatchObject({ fieldKey: 'SampleState/Label', value: 'Available' });
        expect(dataAPI.selectDistinctRows).toHaveBeenCalledWith(
            expect.objectContaining({ column: 'Label', queryName: 'SampleStatus', schemaName: 'exp' })
        );
    });

    test('numbers and dates are checked against column ranges', async () => {
        const dataAPI = createDataAPI();

        expect(labels(await getFilterSuggestions({ ...REQUEST, term: '3' }, { dataAPI }))).toEqual([
            'Row Id is 3',
            'Freeze/Thaw Count is 3',
            'Compose a filter on Freeze/Thaw Count…',
            'Search all columns for "3"',
        ]);

        const dateResponse = await getFilterSuggestions({ ...REQUEST, term: '2019-03-15' }, { dataAPI });
        expect(dateResponse.suggestions[0]).toMatchObject({
            fields: [{ fieldKey: 'CollectionDate', op: 'dateeq' }],
            kind: 'compose',
            value: '2019-03-15',
        });
        expect(labels(await getFilterSuggestions({ ...REQUEST, term: '2021-01-01' }, { dataAPI }))).toEqual([
            'Search all columns for "2021-01-01"',
        ]);
    });

    test('warm cache issues no further requests', async () => {
        const dataAPI = createDataAPI();
        await getFilterSuggestions({ ...REQUEST, term: 'Sodium' }, { dataAPI });
        const callCounts = [dataAPI.executeSql, dataAPI.selectDistinctRows, dataAPI.selectRows].map(
            fn => fn.mock.calls.length
        );

        await getFilterSuggestions({ ...REQUEST, term: 'Heparin' }, { dataAPI });
        expect(
            [dataAPI.executeSql, dataAPI.selectDistinctRows, dataAPI.selectRows].map(fn => fn.mock.calls.length)
        ).toEqual(callCounts);

        // A different container scope is cached separately
        await getFilterSuggestions({ ...REQUEST, containerPath: '/Other', term: 'Heparin' }, { dataAPI });
        expect(dataAPI.executeSql).toHaveBeenCalledTimes(2);
    });

    test('returns what is ready when the budget runs out', async () => {
        const dataAPI = createDataAPI({ executeSql: jest.fn(() => new Promise(() => undefined)) });
        const response = await getFilterSuggestions({ ...REQUEST, term: 'PL-1003' }, { budgetMs: 5, dataAPI });

        expect(response.complete).toBe(false);
        expect(labels(response)).toEqual([
            'Sample ID is PL-1003',
            'Compose a filter on Sample ID…',
            'Search all columns for "PL-1003"',
        ]);
    });

    test('failed stats keep number and date columns as compose candidates', async () => {
        const dataAPI = createDataAPI({ executeSql: jest.fn(() => Promise.reject(new Error('bad sql'))) });
        const response = await getFilterSuggestions({ ...REQUEST, term: '3' }, { dataAPI });

        expect(response.complete).toBe(true);
        expect(labels(response)).toEqual([
            'Row Id is 3',
            'Compose a number filter for "3"… (2 columns)',
            'Search all columns for "3"',
        ]);
    });

    test('unresolvable query offers only the full search', async () => {
        const dataAPI = createDataAPI({ getQueryDetails: jest.fn(() => Promise.reject(new Error('no query'))) });
        expect(await getFilterSuggestions({ ...REQUEST, term: 'Sodium' }, { dataAPI })).toEqual({
            complete: false,
            suggestions: [
                { kind: 'search', label: 'Search all columns for "Sodium"', source: 'fallback', value: 'Sodium' },
            ],
        });
    });
});
