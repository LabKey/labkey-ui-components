import { fromJS } from 'immutable';

import { QueryColumn } from '../../../../public/QueryColumn';
import { QueryInfo } from '../../../../public/QueryInfo';

import { extractChanges } from './utils';

const COLUMN_STRING_INPUT = new QueryColumn({
    fieldKey: 'strInput',
    name: 'strInput',
    fieldKeyArray: ['strInput'],
    inputType: 'text',
    jsonType: 'string',
});
const COLUMN_DATE_INPUT = new QueryColumn({
    fieldKey: 'dtInput',
    name: 'dtInput',
    fieldKeyArray: ['dtInput'],
    inputType: 'text',
    jsonType: 'date',
});
const COLUMN_FILE_INPUT = new QueryColumn({
    fieldKey: 'fileInput',
    name: 'fileInput',
    fieldKeyArray: ['fileInput'],
    inputType: 'file',
    jsonType: 'string',
});
const QUERY_INFO = QueryInfo.fromJsonForTests({
    name: 'test',
    schemaName: 'schema',
    columns: {
        strInput: COLUMN_STRING_INPUT,
        dtInput: COLUMN_DATE_INPUT,
        fileInput: COLUMN_FILE_INPUT,
    },
});

describe('extractChanges', () => {
    test('file input', () => {
        const FILE = new File([], 'file');
        const currentData = fromJS({ fileInput: { value: FILE } });
        expect(extractChanges(QUERY_INFO, currentData, {}).fileInput).toBe(undefined);
        expect(extractChanges(QUERY_INFO, currentData, { fileInput: undefined }).fileInput).toBeUndefined();
        expect(extractChanges(QUERY_INFO, currentData, { fileInput: FILE }).fileInput).toBeUndefined();
        expect(extractChanges(QUERY_INFO, currentData, { fileInput: null }).fileInput).toBe(null);
        expect(
            extractChanges(QUERY_INFO, currentData, { fileInput: new File([], 'fileEdit') }).fileInput
        ).toBeDefined();
    });

    test('string input', () => {
        const currentData = fromJS({ strInput: { value: 'abc' } });
        expect(extractChanges(QUERY_INFO, currentData, {}).strInput).toBe(undefined);
        expect(extractChanges(QUERY_INFO, currentData, { strInput: undefined }).strInput).toBe(null);
        expect(extractChanges(QUERY_INFO, currentData, { strInput: null }).strInput).toBe(null);
        expect(extractChanges(QUERY_INFO, currentData, { strInput: '' }).strInput).toBe('');
        expect(extractChanges(QUERY_INFO, currentData, { strInput: [] }).strInput).toStrictEqual([]);
        expect(extractChanges(QUERY_INFO, currentData, { strInput: 'abc' }).strInput).toBe(undefined);
        expect(extractChanges(QUERY_INFO, currentData, { strInput: ' abc ' }).strInput).toBe(undefined);
        expect(extractChanges(QUERY_INFO, currentData, { strInput: ' abcd ' }).strInput).toBe('abcd');
    });

    test('date input', () => {
        let currentData = fromJS({ dtInput: { value: '2022-08-30 01:02:03' } });
        expect(extractChanges(QUERY_INFO, currentData, {}).dtInput).toBe(undefined);
        expect(extractChanges(QUERY_INFO, currentData, { dtInput: undefined }).dtInput).toBe(null);
        expect(extractChanges(QUERY_INFO, currentData, { dtInput: null }).dtInput).toBe(null);
        expect(extractChanges(QUERY_INFO, currentData, { dtInput: '2022-08-30 01:02:03' }).dtInput).toBe(undefined);
        expect(extractChanges(QUERY_INFO, currentData, { dtInput: '2022-08-30 01:02:04' }).dtInput).toBe(undefined); // Issue 40139: date comparison only down to minute precision
        expect(extractChanges(QUERY_INFO, currentData, { dtInput: '2022-08-30 01:03:03' }).dtInput).toBe(
            '2022-08-30 01:03:03'
        );
        expect(extractChanges(QUERY_INFO, currentData, { dtInput: '2022-08-31 01:02:03' }).dtInput).toBe(
            '2022-08-31 01:02:03'
        );

        currentData = fromJS({ dtInput: { value: '2022-08-30' } });
        expect(extractChanges(QUERY_INFO, currentData, { dtInput: '2022-08-30' }).dtInput).toBe(undefined);
        expect(extractChanges(QUERY_INFO, currentData, { dtInput: '2022-08-31' }).dtInput).toBe('2022-08-31');
        expect(extractChanges(QUERY_INFO, currentData, { dtInput: '2022-08-30 01:02:03' }).dtInput).toBe(
            '2022-08-30 01:02:03'
        );
    });
});
