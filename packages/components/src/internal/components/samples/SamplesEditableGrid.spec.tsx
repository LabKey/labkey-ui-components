import { List, fromJS } from 'immutable';

import { QueryGridModel } from '../../QueryGridModel';
import { QueryInfo } from '../../../public/QueryInfo';
import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { DataClassDataType, SampleTypeDataType } from '../entities/constants';
import { EntityChoice, IEntityTypeOption } from '../entities/models';

import { getLineageEditorUpdateColumns, getUpdatedLineageRows } from './SamplesEditableGrid';

let DATA = fromJS({
    '1': {
        RowId: 1,
        'MaterialInputs/One': List(),
        'MaterialInputs/Two': List(),
    },
    '2': {
        RowId: 2,
        'MaterialInputs/One': List(),
        'MaterialInputs/Two': List(),
    },
});
DATA = DATA.setIn(
    ['1', 'MaterialInputs/One'],
    List.of({
        value: 1,
        displayValue: 'A',
    })
);
DATA = DATA.setIn(
    ['1', 'MaterialInputs/Two'],
    List.of(
        {
            value: 2,
            displayValue: 'B',
        },
        {
            value: 3,
            displayValue: 'C',
        }
    )
);
const ORIGINAL_MODEL = new QueryGridModel({ data: DATA });

describe('getUpdatedLineageRows', () => {
    test('no changes', () => {
        const updatedRows = getUpdatedLineageRows(
            [
                { RowId: 1, 'MaterialInputs/One': 'A', 'MaterialInputs/Two': 'B, C' },
                { RowId: 2, 'MaterialInputs/One': '', 'MaterialInputs/Two': '' },
            ],
            ORIGINAL_MODEL,
            []
        );
        expect(updatedRows.length).toBe(0);
    });

    test('add to existing parent', () => {
        const updatedRows = getUpdatedLineageRows(
            [
                { RowId: 1, 'MaterialInputs/One': 'A', 'MaterialInputs/Two': 'B, C, D' },
                { RowId: 2, 'MaterialInputs/One': '', 'MaterialInputs/Two': '' },
            ],
            ORIGINAL_MODEL,
            []
        );
        expect(updatedRows.length).toBe(1);
        expect(updatedRows[0].RowId).toBe(1);
        expect(updatedRows[0]['MaterialInputs/One']).toBe('A');
        expect(updatedRows[0]['MaterialInputs/Two']).toBe('B, C, D');
    });

    test('replace existing parent', () => {
        const updatedRows = getUpdatedLineageRows(
            [
                { RowId: 1, 'MaterialInputs/One': 'D', 'MaterialInputs/Two': 'B, C' },
                { RowId: 2, 'MaterialInputs/One': '', 'MaterialInputs/Two': '' },
            ],
            ORIGINAL_MODEL,
            []
        );
        expect(updatedRows.length).toBe(1);
        expect(updatedRows[0].RowId).toBe(1);
        expect(updatedRows[0]['MaterialInputs/One']).toBe('D');
        expect(updatedRows[0]['MaterialInputs/Two']).toBe('B, C');
    });

    test('remove existing parent', () => {
        const updatedRows = getUpdatedLineageRows(
            [
                { RowId: 1, 'MaterialInputs/One': '', 'MaterialInputs/Two': 'B, C' },
                { RowId: 2, 'MaterialInputs/One': '', 'MaterialInputs/Two': '' },
            ],
            ORIGINAL_MODEL,
            []
        );
        expect(updatedRows.length).toBe(1);
        expect(updatedRows[0].RowId).toBe(1);
        expect(updatedRows[0]['MaterialInputs/One']).toBe('');
        expect(updatedRows[0]['MaterialInputs/Two']).toBe('B, C');
    });

    test('add new parent', () => {
        const updatedRows = getUpdatedLineageRows(
            [
                { RowId: 1, 'MaterialInputs/One': 'A', 'MaterialInputs/Two': 'B, C' },
                { RowId: 2, 'MaterialInputs/One': 'A, B', 'MaterialInputs/Two': '' },
            ],
            ORIGINAL_MODEL,
            []
        );
        expect(updatedRows.length).toBe(1);
        expect(updatedRows[0].RowId).toBe(2);
        expect(updatedRows[0]['MaterialInputs/One']).toBe('A, B');
        expect(updatedRows[0]['MaterialInputs/Two']).toBe('');
    });

    test('exclude aliquots', () => {
        const updatedRows = getUpdatedLineageRows(
            [
                { RowId: 1, 'MaterialInputs/One': 'A, B', 'MaterialInputs/Two': 'B, C' },
                { RowId: 2, 'MaterialInputs/One': 'A, B', 'MaterialInputs/Two': '' },
            ],
            ORIGINAL_MODEL,
            [1, 2]
        );
        expect(updatedRows.length).toBe(0);
    });
});

describe('getLineageEditorUpdateColumns', () => {
    const MODEL = makeTestQueryModel(
        SchemaQuery.create('schema', 'query'),
        new QueryInfo({
            columns: fromJS({ rowid: {}, name: {}, other: {} }),
        })
    );

    test('no parent types', () => {
        const cols = getLineageEditorUpdateColumns(MODEL, {});
        expect(cols.size).toBe(2);
        expect(cols.get('rowid')).toBeDefined();
        expect(cols.get('name')).toBeDefined();
        expect(cols.get('other')).toBeUndefined();
    });

    test('with parent types', () => {
        const cols = getLineageEditorUpdateColumns(MODEL, {
            s1: List.of({
                type: {
                    lsid: 'a',
                    rowId: 1,
                    schema: 'exp',
                    query: 'test1',
                    entityDataType: SampleTypeDataType,
                } as IEntityTypeOption,
                ids: [],
                value: '',
            } as EntityChoice),
            s2: List.of({
                type: {
                    lsid: 'b',
                    rowId: 1,
                    schema: 'exp.data',
                    query: 'test2',
                    entityDataType: DataClassDataType,
                } as IEntityTypeOption,
                ids: [],
                value: '',
            } as EntityChoice),
            s3: List.of(),
        });
        expect(cols.size).toBe(4);
        expect(cols.get('rowid')).toBeDefined();
        expect(cols.get('name')).toBeDefined();
        expect(cols.get('other')).toBeUndefined();
        expect(cols.get('MaterialInputs/Test1')).toBeDefined();
        expect(cols.get('DataInputs/Test2')).toBeDefined();
    });
});
