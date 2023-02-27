import { List } from 'immutable';

import { QueryInfo } from '../../../public/QueryInfo';
import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { DataClassDataType, SampleTypeDataType } from '../entities/constants';
import { EntityChoice, IEntityTypeOption } from '../entities/models';

import { QueryColumn } from '../../../public/QueryColumn';

import { getLineageEditorUpdateColumns } from './LineageEditableGridLoaderFromSelection';

describe('getLineageEditorUpdateColumns', () => {
    const MODEL = makeTestQueryModel(
        new SchemaQuery('schema', 'query'),
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
        expect(cols.columns.size).toBe(1);
        expect(cols.columns.get(0).fieldKey).toBe('name');
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
        expect(cols.queryInfoColumns.get('materialinputs/test1')).toBeDefined();
        expect(cols.queryInfoColumns.get('datainputs/test2')).toBeDefined();
        expect(cols.columns.size).toBe(3);
        expect(cols.columns.get(0).fieldKey).toBe('name');
        expect(cols.columns.get(1).fieldKey).toBe('DataInputs/Test2');
        expect(cols.columns.get(2).fieldKey).toBe('MaterialInputs/Test1');
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
        expect(cols.columns.size).toBe(0);
    });
});
