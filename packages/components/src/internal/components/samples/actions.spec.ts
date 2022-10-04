import { List, fromJS } from 'immutable';

import { QueryInfo } from '../../../public/QueryInfo';
import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { DataClassDataType, SampleTypeDataType } from '../entities/constants';
import { EntityChoice, IEntityTypeOption } from '../entities/models';

import { QueryColumn } from '../../../public/QueryColumn';

import { getLineageEditorUpdateColumns, getUpdatedLineageRows, getRowIdsFromSelection } from './actions';

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

describe('getUpdatedLineageRows', () => {
    test('no changes', () => {
        const updatedRows = getUpdatedLineageRows(
            [
                { RowId: 1, 'MaterialInputs/One': 'A', 'MaterialInputs/Two': 'B, C' },
                { RowId: 2, 'MaterialInputs/One': '', 'MaterialInputs/Two': '' },
            ],
            DATA.toJS(),
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
            DATA.toJS(),
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
            DATA.toJS(),
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
            DATA.toJS(),
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
            DATA.toJS(),
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
            DATA.toJS(),
            [1, 2]
        );
        expect(updatedRows.length).toBe(0);
    });
});

describe('getLineageEditorUpdateColumns', () => {
    const MODEL = makeTestQueryModel(
        SchemaQuery.create('schema', 'query'),
        QueryInfo.fromJSON({
            columns: [
                { fieldKey: 'rowId' },
                {
                    fieldKey: 'name',
                    fieldKeyArray: ['name'],
                    shownInUpdateView: true,
                    userEditable: true,
                },
                { fieldKey: 'other' },
            ],
        })
    );

    test('no parent types', () => {
        const cols = getLineageEditorUpdateColumns(MODEL, {});
        expect(cols.queryInfoColumns.size).toBe(2);
        expect(cols.queryInfoColumns.get('rowid')).toBeDefined();
        expect(cols.queryInfoColumns.get('name')).toBeDefined();
        expect(cols.queryInfoColumns.get('other')).toBeUndefined();
        expect(cols.updateColumns.size).toBe(1);
        expect(cols.updateColumns.get(0).get('fieldKey')).toBe('name');
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
        expect(cols.queryInfoColumns.size).toBe(4);
        expect(cols.queryInfoColumns.get('rowid')).toBeDefined();
        expect(cols.queryInfoColumns.get('name')).toBeDefined();
        expect(cols.queryInfoColumns.get('other')).toBeUndefined();
        expect(cols.queryInfoColumns.get('MaterialInputs/Test1')).toBeDefined();
        expect(cols.queryInfoColumns.get('DataInputs/Test2')).toBeDefined();
        expect(cols.updateColumns.size).toBe(3);
        expect(cols.updateColumns.get(0).get('fieldKey')).toBe('name');
        expect(cols.updateColumns.get(1).get('fieldKey')).toBe('DataInputs/Test2');
        expect(cols.updateColumns.get(2).get('fieldKey')).toBe('MaterialInputs/Test1');
    });

    // Regression coverage to ensure the "name" column is included in the lineage
    // update columns ONLY when the "name" column is a part of the update columns for the underlying QueryInfo.
    test('without updatable "name" column', () => {
        const queryInfo = MODEL.queryInfo.setIn(
            ['columns', 'name'],
            new QueryColumn({ fieldKey: 'name' })
        ) as QueryInfo;
        const model = MODEL.mutate({ queryInfo });
        const cols = getLineageEditorUpdateColumns(model, {});

        expect(cols.queryInfoColumns.size).toBe(2);
        expect(cols.queryInfoColumns.get('name')).toBeDefined();
        expect(cols.updateColumns.size).toBe(0);
    });
});

describe('getSampleRowIdsFromSelection', () => {
    test('none', () => {
        expect(JSON.stringify(getRowIdsFromSelection(undefined))).toBe('[]');
        expect(JSON.stringify(getRowIdsFromSelection(List()))).toBe('[]');
    });
    test('not empty', () => {
        expect(JSON.stringify(getRowIdsFromSelection(List.of('1', '2', '3')))).toBe('[1,2,3]');
        expect(JSON.stringify(getRowIdsFromSelection(List.of(1, 2, 3)))).toBe('[1,2,3]');
    });
});
