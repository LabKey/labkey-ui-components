import { fromJS, List } from 'immutable';

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
const COLUMN_ARRAY_INPUT = new QueryColumn({
    fieldKey: 'arrInput',
    name: 'arrInput',
    fieldKeyArray: ['arrInput'],
    inputType: 'text',
    jsonType: 'array',
});
const QUERY_INFO = QueryInfo.fromJsonForTests({
    name: 'test',
    schemaName: 'schema',
    columns: {
        arrInput: COLUMN_ARRAY_INPUT,
        dtInput: COLUMN_DATE_INPUT,
        fileInput: COLUMN_FILE_INPUT,
        strInput: COLUMN_STRING_INPUT,
    },
});

describe('extractChanges', () => {
    test('file input', () => {
        const FILE = new File([], 'file');
        const currentData = fromJS({ fileInput: { value: FILE } });
        expect(extractChanges(QUERY_INFO, currentData, {}).fileInput).toBeUndefined();
        expect(extractChanges(QUERY_INFO, currentData, { fileInput: undefined }).fileInput).toBeUndefined();
        expect(extractChanges(QUERY_INFO, currentData, { fileInput: FILE }).fileInput).toBeUndefined();
        expect(extractChanges(QUERY_INFO, currentData, { fileInput: null }).fileInput).toBeNull();
        expect(
            extractChanges(QUERY_INFO, currentData, { fileInput: new File([], 'fileEdit') }).fileInput
        ).toBeDefined();
    });

    test('string input', () => {
        const currentData = fromJS({ strInput: { value: 'abc' } });
        expect(extractChanges(QUERY_INFO, currentData, {}).strInput).toBeUndefined();
        expect(extractChanges(QUERY_INFO, currentData, { strInput: undefined }).strInput).toBeNull();
        expect(extractChanges(QUERY_INFO, currentData, { strInput: null }).strInput).toBeNull();
        expect(extractChanges(QUERY_INFO, currentData, { strInput: '' }).strInput).toBe('');
        expect(extractChanges(QUERY_INFO, currentData, { strInput: [] }).strInput).toStrictEqual([]);
        expect(extractChanges(QUERY_INFO, currentData, { strInput: 'abc' }).strInput).toBeUndefined();
        expect(extractChanges(QUERY_INFO, currentData, { strInput: ' abc ' }).strInput).toBeUndefined();
        expect(extractChanges(QUERY_INFO, currentData, { strInput: ' abcd ' }).strInput).toBe('abcd');
    });

    test('date input', () => {
        let currentData = fromJS({ dtInput: { value: '2022-08-30 01:02:03' } });
        expect(extractChanges(QUERY_INFO, currentData, {}).dtInput).toBeUndefined();
        expect(extractChanges(QUERY_INFO, currentData, { dtInput: undefined }).dtInput).toBeNull();
        expect(extractChanges(QUERY_INFO, currentData, { dtInput: null }).dtInput).toBeNull();
        expect(extractChanges(QUERY_INFO, currentData, { dtInput: '2022-08-30 01:02:03' }).dtInput).toBeUndefined();
        expect(extractChanges(QUERY_INFO, currentData, { dtInput: '2022-08-30 01:02:04' }).dtInput).toBe(
            '2022-08-30 01:02:04'
        ); // Issue 40139, 52536: date comparison only down to minute precision
        expect(extractChanges(QUERY_INFO, currentData, { dtInput: '2022-08-30 01:02:03.001' }).dtInput).toBe(
            '2022-08-30 01:02:03.001'
        );
        expect(extractChanges(QUERY_INFO, currentData, { dtInput: '2022-08-31 01:02:03' }).dtInput).toBe(
            '2022-08-31 01:02:03'
        );
        expect(extractChanges(QUERY_INFO, currentData, { dtInput: '2022-08-31 01:02:03.321' }).dtInput).toBe(
            '2022-08-31 01:02:03.321'
        );

        currentData = fromJS({ dtInput: { value: '2022-08-30' } });
        expect(extractChanges(QUERY_INFO, currentData, { dtInput: '2022-08-30' }).dtInput).toBeUndefined();
        expect(extractChanges(QUERY_INFO, currentData, { dtInput: '2022-08-31' }).dtInput).toBe('2022-08-31');
        expect(extractChanges(QUERY_INFO, currentData, { dtInput: '2022-08-30 01:02:03' }).dtInput).toBe(
            '2022-08-30 01:02:03'
        );
    });

    test('array input', () => {
        // The existing value is an Immutable List
        const currentDataList = fromJS({ arrInput: { value: List([1, 2, 3]) } });
        expect(extractChanges(QUERY_INFO, currentDataList, { arrInput: [1, 2, 3] }).arrInput).toBeUndefined();
        expect(extractChanges(QUERY_INFO, currentDataList, { arrInput: [1, 2, 4] }).arrInput).toEqual([1, 2, 4]);
        expect(extractChanges(QUERY_INFO, currentDataList, { arrInput: [1, 2] }).arrInput).toEqual([1, 2]);

        // Existing value is a raw JavaScript array
        const currentDataRaw = fromJS({ arrInput: { value: [10, 20] } });
        expect(extractChanges(QUERY_INFO, currentDataRaw, { arrInput: [10, 20] }).arrInput).toBeUndefined();
        expect(extractChanges(QUERY_INFO, currentDataRaw, { arrInput: [10, 20, 30] }).arrInput).toEqual([10, 20, 30]);

        // Nulls and Undefined
        expect(extractChanges(QUERY_INFO, currentDataList, { arrInput: null }).arrInput).toBeNull();
        expect(extractChanges(QUERY_INFO, currentDataList, { arrInput: undefined }).arrInput).toBeNull();
    });
});
