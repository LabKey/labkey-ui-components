/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Query } from '@labkey/api';

import { makeQueryInfo } from '../../internal/test/testHelpers';
import mixturesQueryInfo from '../../test/data/mixtures-getQueryDetails.json';
import { Row, selectRows, SelectRowsResponse } from '../../internal/query/selectRows';

import { ExtendedMap } from '../ExtendedMap';
import { QueryColumn } from '../QueryColumn';
import { QueryInfo } from '../QueryInfo';
import { SchemaQuery } from '../SchemaQuery';

import { QueryModel } from './QueryModel';
import { DefaultQueryModelLoader } from './QueryModelLoader';
import { makeTestQueryModel } from './testUtils';

jest.mock('../../internal/query/selectRows', () => ({
    ...jest.requireActual('../../internal/query/selectRows'),
    selectRows: jest.fn(),
}));

const mockSelectRows = selectRows as jest.MockedFunction<typeof selectRows>;

const SCHEMA_QUERY = new SchemaQuery('exp.data', 'mixtures');

// Nothing for resolveRowKey() to key on: no metaData.id and no single-column primary key
const NO_PK_QUERY_INFO = new QueryInfo({});

// pkCol.name and pkCol.fieldKey differ, the only case where resolveRowKey()'s alt key does any work
const LOOKUP_PK_QUERY_INFO = new QueryInfo({
    pkCols: ['Parent/RowId'],
    columns: new ExtendedMap<string, QueryColumn>({
        'parent/rowid': new QueryColumn({ fieldKey: 'Parent/RowId', name: 'RowId' }),
    }),
});

let MIXTURES_QUERY_INFO: QueryInfo;

const makeRow = (values: Record<string, any>): Row =>
    Object.entries(values).reduce<Row>((row, [fieldKey, value]) => ({ ...row, [fieldKey]: { value } }), {});

const mockResponse = (overrides: Partial<SelectRowsResponse>): void => {
    mockSelectRows.mockResolvedValue({
        messages: [],
        metaData: undefined,
        queryInfo: NO_PK_QUERY_INFO,
        rowCount: 0,
        rows: [],
        schemaQuery: SCHEMA_QUERY,
        ...overrides,
    });
};

beforeAll(() => {
    MIXTURES_QUERY_INFO = makeQueryInfo(mixturesQueryInfo);
});

describe('DefaultQueryModelLoader', () => {
    describe('loadRows', () => {
        let consoleError: jest.SpyInstance;
        const model = (): QueryModel => makeTestQueryModel(SCHEMA_QUERY, MIXTURES_QUERY_INFO);

        beforeEach(() => {
            mockSelectRows.mockReset();
            consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        });

        afterEach(() => {
            consoleError.mockRestore();
        });

        test('request options', async () => {
            mockResponse({});
            const requestHandler = jest.fn();

            await DefaultQueryModelLoader.loadRows(model(), requestHandler);

            const options = mockSelectRows.mock.calls[0][0];
            expect(options.schemaQuery).toEqual(SCHEMA_QUERY);
            // left unset so selectRows() decides via isSelectRowMetadataRequired()
            expect(options.includeMetadata).toBeUndefined();
            expect(options.includeTotalCount).toBe(false);
            expect(options.includeStyle).toBe(true);
            expect(options.requestHandler).toBe(requestHandler);
        });

        test('keys rows by metaData.id', async () => {
            mockResponse({
                metaData: { id: 'RowId' } as Query.ResponseMetadata,
                rowCount: 2,
                rows: [makeRow({ RowId: 11, Name: 'a' }), makeRow({ RowId: 22, Name: 'b' })],
            });

            const result = await DefaultQueryModelLoader.loadRows(model());

            expect(result.orderedRows).toEqual(['11', '22']);
            expect(Object.keys(result.rows)).toEqual(['11', '22']);
            expect(result.rows['11'].Name.value).toEqual('a');
            expect(consoleError).not.toHaveBeenCalled();
        });

        // The server names a single-column PK in metaData.id regardless of the requested columns, but strips that
        // column from the rows when it was not requested (minimalColumns). Such rows must still render.
        test('keys rows by position when the key column is missing from the response', async () => {
            mockResponse({
                metaData: { id: 'RowId' } as Query.ResponseMetadata,
                rowCount: 2,
                rows: [makeRow({ Name: 'a' }), makeRow({ Name: 'b' })],
            });

            const result = await DefaultQueryModelLoader.loadRows(model());

            expect(result.orderedRows).toEqual(['0', '1']);
            expect(result.rows['0'].Name.value).toEqual('a');
            expect(result.rows['1'].Name.value).toEqual('b');
            expect(consoleError).toHaveBeenCalledTimes(2);
        });

        test('retains rows missing the key column alongside keyed rows', async () => {
            mockResponse({
                metaData: { id: 'RowId' } as Query.ResponseMetadata,
                rowCount: 3,
                rows: [makeRow({ RowId: 11, Name: 'a' }), makeRow({ Name: 'b' }), makeRow({ RowId: 33, Name: 'c' })],
            });

            const result = await DefaultQueryModelLoader.loadRows(model());

            expect(result.orderedRows).toEqual(['11', '0', '33']);
            expect(result.orderedRows.map(key => result.rows[key].Name.value)).toEqual(['a', 'b', 'c']);
            expect(consoleError).toHaveBeenCalledTimes(1);
        });

        test('keys rows by position when the query has no single-column primary key', async () => {
            mockResponse({
                metaData: {} as Query.ResponseMetadata,
                rowCount: 2,
                rows: [makeRow({ Name: 'a' }), makeRow({ Name: 'b' })],
            });

            const result = await DefaultQueryModelLoader.loadRows(model());

            expect(result.orderedRows).toEqual(['0', '1']);
            expect(consoleError).not.toHaveBeenCalled();
        });

        test('falls back to the QueryInfo primary key when metaData is not included', async () => {
            mockResponse({
                metaData: undefined,
                queryInfo: MIXTURES_QUERY_INFO,
                rowCount: 1,
                rows: [makeRow({ RowId: 11, Name: 'a' })],
            });

            const result = await DefaultQueryModelLoader.loadRows(model());

            expect(result.orderedRows).toEqual(['11']);
            expect(consoleError).not.toHaveBeenCalled();
        });

        test('falls back to the primary key fieldKey when the row is not keyed by column name', async () => {
            mockResponse({
                metaData: undefined,
                queryInfo: LOOKUP_PK_QUERY_INFO,
                rowCount: 1,
                rows: [makeRow({ 'Parent/RowId': 11 })],
            });

            const result = await DefaultQueryModelLoader.loadRows(model());

            expect(result.orderedRows).toEqual(['11']);
            expect(consoleError).not.toHaveBeenCalled();
        });

        test('tolerates a null key value', async () => {
            mockResponse({
                metaData: { id: 'RowId' } as Query.ResponseMetadata,
                rowCount: 1,
                rows: [makeRow({ RowId: null, Name: 'a' })],
            });

            const result = await DefaultQueryModelLoader.loadRows(model());

            expect(result.orderedRows).toEqual([]);
            expect(result.rows.null.Name.value).toEqual('a');
        });

        test('passes through messages and rowCount', async () => {
            const messages = [{ area: 'view', content: 'Showing 5 of 10 rows', type: 'INFO' }];
            mockResponse({ messages, rowCount: 10 });

            const result = await DefaultQueryModelLoader.loadRows(model());

            expect(result.messages).toStrictEqual(messages);
            expect(result.rowCount).toEqual(10);
            expect(result.orderedRows).toEqual([]);
            expect(result.rows).toEqual({});
        });
    });
});
