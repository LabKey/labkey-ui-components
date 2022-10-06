import { List } from 'immutable';

import mixturesQueryInfo from '../../../test/data/mixtures-getQueryDetails.json';

import { SchemaQuery } from '../../../public/SchemaQuery';

import { makeQueryInfo } from '../../testHelpers';

import { EntityChoice, IEntityTypeOption } from './models';
import {
    createEntityParentKey,
    getEntityDescription,
    getEntityNoun,
    getInitialParentChoices,
    getUpdatedLineageRowsForBulkEdit,
    parentValuesDiffer,
} from './utils';
import { DataClassDataType, SampleTypeDataType } from './constants';

describe('getInitialParentChoices', () => {
    const parentTypeOptions = List<IEntityTypeOption>([
        {
            label: 'Second Source',
            lsid: 'urn:lsid:labkey.com:DataClass.Folder-252:Second+Source',
            rowId: 322,
            value: 'second source',
            query: 'Second Source',
            schema: 'exp.data',
        },
        {
            label: 'Source 1',
            lsid: 'urn:lsid:labkey.com:DataClass.Folder-252:Source+1',
            rowId: 321,
            value: 'source 1',
            query: 'Source 1',
            schema: 'exp.data',
        },
        {
            label: 'Vendor 3',
            lsid: 'urn:lsid:labkey.com:DataClass.Folder-252:Vendor+3',
            rowId: 323,
            value: 'vendor 3',
            query: 'Vendor 3',
            schema: 'exp.data',
        },
    ]);

    test('empty child data', () => {
        const parentChoices = getInitialParentChoices(parentTypeOptions, DataClassDataType, {}, {});
        expect(parentChoices.size).toBe(0);
    });

    test('no data', () => {
        const parentChoices = getInitialParentChoices(parentTypeOptions, DataClassDataType, {}, {});
        expect(parentChoices.size).toBe(0);
    });

    test('missing parent type', () => {
        const parentIdData = {
            'urn:lsid:labkey.com:Data.Folder-252:1fce5b0b-33ce-1038-8604-d42714b6919e': {
                rowId: 123,
                parentId: 321,
            },
        };
        const parentChoices = getInitialParentChoices(parentTypeOptions, DataClassDataType, {}, parentIdData);
        expect(parentChoices.size).toBe(0);
    });

    test('multiple inputs and types', () => {
        const data = {
            LSID: {
                value: 'urn:lsid:labkey.com:Sample.252.Examples:E-20200316-10',
            },
            'Inputs/Materials/First': [],
            RowId: {
                value: 53703,
                url: '/labkey/Sam%20Man/experiment-showMaterial.view?rowId=53703',
            },
            CreatedBy: {
                displayValue: 'Susan',
                value: 1005,
                url: '/labkey/Sam%20Man/user-details.view?schemaName=core&query.queryName=Users&userId=1005',
            },
            Modified: {
                value: '2020-03-16 15:54:28.037',
                formattedValue: '2020-03-16 15:54',
            },
            Description: {
                value: null,
            },
            'Inputs/Data/First': [
                {
                    displayValue: 'B-50118',
                    value: 'urn:lsid:labkey.com:Data.Folder-252:a49f277e-301e-1038-a031-328bafaf2618',
                    url: '/labkey/Sam%20Man/experiment-showData.view?rowId=7067&dataClassId=321',
                },
                {
                    displayValue: 'B-50117',
                    value: 'urn:lsid:labkey.com:Data.Folder-252:a49f277f-301e-1038-a031-328bafaf2618',
                    url: '/labkey/Sam%20Man/experiment-showData.view?rowId=7068&dataClassId=321',
                },
                {
                    displayValue: 'B-50116',
                    value: 'urn:lsid:labkey.com:Data.Folder-252:a49f2780-301e-1038-a031-328bafaf2618',
                    url: '/labkey/Sam%20Man/experiment-showData.view?rowId=7069&dataClassId=321',
                },
                {
                    displayValue: 'Sec-2',
                    value: 'urn:lsid:labkey.com:Data.Folder-252:604347b2-3103-1038-91ee-da4874ca890e',
                    url: '/labkey/Sam%20Man/experiment-showData.view?rowId=57088&dataClassId=322',
                },
            ],
            Run: {
                displayValue: 'Derive sample from B-50116, B-50117, B-50118, Sec-2',
                value: 2297,
                url: '/labkey/Sam%20Man/experiment-showRunText.view?rowId=2297',
            },
            IntField: {
                value: 3,
            },
            ModifiedBy: {
                displayValue: 'Susan',
                value: 1005,
                url: '/labkey/Sam%20Man/user-details.view?schemaName=core&query.queryName=Users&userId=1005',
            },
            Created: {
                value: '2020-03-16 11:52:58.540',
                formattedValue: '2020-03-16 11:52',
            },
            Name: {
                value: 'E-20200316-10',
                url: '/labkey/Sam%20Man/experiment-showMaterial.view?rowId=53703',
            },
            SampleSet: {
                displayValue: 'Examples',
                value: 'urn:lsid:labkey.com:SampleSet.Folder-252:Examples',
                url: '/labkey/Sam%20Man/experiment-showMaterialSource.view?rowId=205',
            },
            TextField: {
                value: null,
            },
        };
        const parentIdData = {
            'urn:lsid:labkey.com:Data.Folder-252:a49f277e-301e-1038-a031-328bafaf2618': {
                rowId: 1,
                parentId: 321,
            },
            'urn:lsid:labkey.com:Data.Folder-252:a49f277f-301e-1038-a031-328bafaf2618': {
                rowId: 2,
                parentId: 321,
            },
            'urn:lsid:labkey.com:Data.Folder-252:a49f2780-301e-1038-a031-328bafaf2618': {
                rowId: 3,
                parentId: 321,
            },
            'urn:lsid:labkey.com:Data.Folder-252:604347b2-3103-1038-91ee-da4874ca890e': {
                rowId: 4,
                parentId: 322,
            },
        };
        const parentChoices = getInitialParentChoices(parentTypeOptions, DataClassDataType, data, parentIdData);
        expect(parentChoices.size).toBe(2);
        const firstChoice = parentChoices.get(0);
        expect(firstChoice.type.label).toBe('Second Source');
        expect(firstChoice.ids).toStrictEqual([
            'urn:lsid:labkey.com:Data.Folder-252:604347b2-3103-1038-91ee-da4874ca890e',
        ]);
        const secondChoice = parentChoices.get(1);
        expect(secondChoice.type.label).toBe('Source 1');
        expect(secondChoice.ids).toStrictEqual([
            'urn:lsid:labkey.com:Data.Folder-252:a49f277e-301e-1038-a031-328bafaf2618',
            'urn:lsid:labkey.com:Data.Folder-252:a49f277f-301e-1038-a031-328bafaf2618',
            'urn:lsid:labkey.com:Data.Folder-252:a49f2780-301e-1038-a031-328bafaf2618',
        ]);
    });
});

describe('parentValuesDiffer', () => {
    test('empty lists', () => {
        expect(parentValuesDiffer(List<EntityChoice>(), List<EntityChoice>())).toBe(false);
    });
    const original = List<EntityChoice>([
        {
            type: {
                lsid: 'lsid1',
                rowId: 1,
                label: 'Label 1',
            },
            ids: ['id1', 'id2'],
            value: 'Val1,Val2',
        },
        {
            type: {
                lsid: 'lsid2',
                rowId: 2,
                label: 'Label 2',
            },
            ids: ['id3'],
            value: 'Val3',
        },
    ]);

    test('non-empty without differences', () => {
        const current = List<EntityChoice>([
            {
                type: {
                    lsid: 'lsid1',
                    rowId: 1,
                    label: 'Label 1',
                },
                ids: ['id1', 'id2'],
                value: 'Val1,Val2',
            },
            {
                type: {
                    lsid: 'lsid2',
                    rowId: 2,
                    label: 'Label 2',
                },
                ids: ['id3'],
                value: 'Val3',
            },
        ]);
        expect(parentValuesDiffer(original, current)).toBe(false);
    });

    test('order change only', () => {
        const current = List<EntityChoice>([
            {
                type: {
                    lsid: 'lsid2',
                    rowId: 2,
                    label: 'Label 2',
                },
                ids: ['id3'],
                value: 'Val3',
            },
            {
                type: {
                    lsid: 'lsid1',
                    rowId: 1,
                    label: 'Label 1',
                },
                ids: ['id1', 'id2'],
                value: 'Val1,Val2',
            },
        ]);
        expect(parentValuesDiffer(original, current)).toBe(false);
    });

    test('original list smaller', () => {
        const original = List<EntityChoice>([
            {
                type: {
                    lsid: 'lsid1',
                    rowId: 1,
                    label: 'Label 1',
                },
                ids: ['id1', 'id2'],
                value: 'Val1,Val2',
            },
        ]);
        const current = List<EntityChoice>([
            {
                type: {
                    lsid: 'lsid2',
                    rowId: 2,
                    label: 'Label 2',
                },
                ids: ['id3'],
                value: 'Val3',
            },
            {
                type: {
                    lsid: 'lsid1',
                    rowId: 1,
                    label: 'Label 1',
                },
                ids: ['id1', 'id2'],
                value: 'Val1,Val2',
            },
        ]);
        expect(parentValuesDiffer(original, current)).toBe(true);
    });

    test('original list larger', () => {
        const current = List<EntityChoice>([
            {
                type: {
                    lsid: 'lsid2',
                    rowId: 2,
                    label: 'Label 2',
                },
                ids: ['id3'],
                value: 'Val3',
            },
        ]);
        expect(parentValuesDiffer(original, current)).toBe(true);
    });

    test('same size, different types', () => {
        const current = List<EntityChoice>([
            {
                type: {
                    lsid: 'lsid31',
                    rowId: 31,
                    label: 'Label 31',
                },
                ids: ['id3.1'],
                value: 'Val3.1',
            },
            {
                type: {
                    lsid: 'lsid2',
                    rowId: 2,
                    label: 'Label 2',
                },
                ids: ['id3'],
                value: 'Val3',
            },
        ]);
        expect(parentValuesDiffer(original, current)).toBe(true);
    });

    test('same types, different values', () => {
        const current = List<EntityChoice>([
            {
                type: {
                    lsid: 'lsid1',
                    rowId: 1,
                    label: 'Label 1',
                },
                ids: ['id1', 'id2'],
                value: 'Val2,Val1.1',
            },
            {
                type: {
                    lsid: 'lsid2',
                    rowId: 2,
                    label: 'Label 2',
                },
                ids: ['id3'],
                value: 'Val3',
            },
        ]);
        expect(parentValuesDiffer(original, current)).toBe(true);
    });

    test('same types, same values, different order', () => {
        const current = List<EntityChoice>([
            {
                type: {
                    lsid: 'lsid1',
                    rowId: 1,
                    label: 'Label 1',
                },
                ids: ['id1', 'id2'],
                value: 'Val2,Val1',
            },
            {
                type: {
                    lsid: 'lsid2',
                    rowId: 2,
                    label: 'Label 2',
                },
                ids: ['id3'],
                value: 'Val3',
            },
        ]);
        expect(parentValuesDiffer(original, current)).toBe(false);
    });

    test('current list with unspecified type', () => {
        const current = List<EntityChoice>([
            {
                type: {
                    lsid: 'lsid1',
                    rowId: 1,
                    label: 'Label 1',
                },
                ids: ['id1', 'id2'],
                value: 'Val1,Val2',
            },
            {
                type: {
                    lsid: 'lsid2',
                    rowId: 2,
                    label: 'Label 2',
                },
                ids: ['id3'],
                value: 'Val3',
            },
            {
                type: {
                    lsid: undefined,
                    label: undefined,
                    rowId: undefined,
                },
            },
        ]);
        expect(parentValuesDiffer(original, current)).toBe(false);
    });

    test('current list with new type specified but no value', () => {
        const current = List<EntityChoice>([
            {
                type: {
                    lsid: 'lsid1',
                    rowId: 1,
                    label: 'Label 1',
                },
                ids: ['id1', 'id2'],
                value: 'Val1,Val2',
            },
            {
                type: {
                    lsid: 'lsid2',
                    rowId: 2,
                    label: 'Label 2',
                },
                ids: ['id3'],
                value: 'Val3',
            },
            {
                type: {
                    lsid: undefined,
                    label: 'Label 4',
                    rowId: 4,
                },
                ids: undefined,
                value: undefined,
            },
        ]);
        expect(parentValuesDiffer(original, current)).toBe(false);
    });
});

describe('createEntityParentKey', () => {
    test('without id', () => {
        expect(createEntityParentKey(SchemaQuery.create('schema', 'query'))).toBe('schema:query');
    });
    test('with id', () => {
        expect(createEntityParentKey(SchemaQuery.create('schema', 'query'), 'id')).toBe('schema:query:id');
    });
});

describe('getEntityDescription', () => {
    test('zero', () => {
        expect(getEntityDescription(DataClassDataType, 0)).toBe('parent types');
    });
    test('one', () => {
        expect(getEntityDescription(DataClassDataType, 1)).toBe('parent type');
    });
    test('multiple', () => {
        expect(getEntityDescription(DataClassDataType, 2)).toBe('parent types');
    });
});

describe('getEntityNoun', () => {
    test('zero', () => {
        expect(getEntityNoun(SampleTypeDataType, 0)).toBe('samples');
    });
    test('one', () => {
        expect(getEntityNoun(SampleTypeDataType, 1)).toBe('sample');
    });
    test('multiple', () => {
        expect(getEntityNoun(SampleTypeDataType, 2)).toBe('samples');
    });
});

describe('getUpdatedLineageRowsForBulkEdit', () => {
    const QUERY_INFO = makeQueryInfo(mixturesQueryInfo);
    const original1 = List<EntityChoice>([
        {
            gridValues: [
                {
                    displayValue: 'Val1',
                },
                {
                    displayValue: 'Val2',
                },
            ],
            type: {
                lsid: 'lsid1',
                rowId: 1,
                label: 'Label 1',
            },
            ids: ['id1.1', 'id1.2'],
            value: undefined,
        },
        {
            gridValues: [
                {
                    displayValue: 'Val3',
                },
            ],
            type: {
                lsid: 'lsid2',
                rowId: 2,
                label: 'Label 2',
            },
            ids: ['id2.1'],
            value: undefined,
        },
    ]);
    const original2 = List<EntityChoice>([
        {
            gridValues: [
                {
                    displayValue: 'Val1',
                },
            ],
            type: {
                lsid: 'lsid1',
                rowId: 1,
                label: 'Label 1',
            },
            ids: ['id1.1'],
            value: 'Val1',
        },
    ]);

    const selected = List<EntityChoice>([
        {
            type: {
                lsid: 'lsid1',
                rowId: 1,
                label: 'Label 1',
                entityDataType: SampleTypeDataType,
            },
            ids: ['id1.1', 'id1.2'],
            value: 'Val1,Val2',
        },
    ]);
    const samples = {
        '1': {
            rowId: {
                value: '1',
            },
        },
        '2': {
            rowId: {
                value: '2',
            },
        },
    };
    test('no samples', () => {
        expect(getUpdatedLineageRowsForBulkEdit({}, selected, {}, QUERY_INFO)).toStrictEqual([]);
    });

    test('no selected parents', () => {
        expect(
            getUpdatedLineageRowsForBulkEdit(
                samples,
                List<EntityChoice>(),
                {
                    '1': original1,
                },
                QUERY_INFO
            )
        ).toStrictEqual([]);
    });

    test('no original parents', () => {
        const rows = getUpdatedLineageRowsForBulkEdit(
            samples,
            selected,
            { '1': List<EntityChoice>(), '2': List<EntityChoice>() },
            QUERY_INFO
        );
        expect(rows).toStrictEqual([
            {
                RowId: '1',
                'MaterialInputs/Label 1': 'Val1,Val2',
            },
            {
                RowId: '2',
                'MaterialInputs/Label 1': 'Val1,Val2',
            },
        ]);
    });

    test('change one original parent', () => {
        const rows = getUpdatedLineageRowsForBulkEdit(
            samples,
            selected,
            { '1': original1, '2': original2 },
            QUERY_INFO
        );
        expect(rows).toStrictEqual([
            {
                RowId: '2',
                'MaterialInputs/Label 1': 'Val1,Val2',
            },
        ]);
    });

    test('remove one of many original parents', () => {
        const selected = List<EntityChoice>([
            {
                type: {
                    lsid: 'lsid2',
                    rowId: 2,
                    label: 'Label 2',
                    entityDataType: SampleTypeDataType,
                },
                ids: [],
                value: undefined,
            },
        ]);
        const rows = getUpdatedLineageRowsForBulkEdit(
            samples,
            selected,
            { '1': original1, '2': original2 },
            QUERY_INFO
        );
        expect(rows).toHaveLength(1);
        expect(rows).toStrictEqual([
            {
                RowId: '1',
                'MaterialInputs/Label 2': null,
            },
        ]);
    });

    test('remove original parent entirely', () => {
        const selected = List<EntityChoice>([
            {
                type: {
                    lsid: 'lsid1',
                    rowId: 1,
                    label: 'Label 1',
                    entityDataType: SampleTypeDataType,
                },
                ids: ['id1.1'],
                value: 'Val1',
            },
        ]);
        const rows = getUpdatedLineageRowsForBulkEdit(
            samples,
            selected,
            { '1': original1, '2': original2 },
            QUERY_INFO
        );
        expect(rows).toStrictEqual([
            {
                RowId: '1',
                'MaterialInputs/Label 1': 'Val1',
            },
        ]);
    });

    test('multiple updates', () => {
        const selected = List<EntityChoice>([
            {
                type: {
                    lsid: 'lsid1',
                    rowId: 1,
                    label: 'Label 1',
                    entityDataType: SampleTypeDataType,
                },
                ids: ['id1.2'],
                value: 'Val2',
            },
            {
                type: {
                    lsid: 'lsid2',
                    rowId: 2,
                    label: 'Label 2',
                    entityDataType: SampleTypeDataType,
                },
                ids: [],
                value: undefined,
            },
        ]);
        const rows = getUpdatedLineageRowsForBulkEdit(
            samples,
            selected,
            { '1': original1, '2': original2 },
            QUERY_INFO
        );
        expect(rows).toStrictEqual([
            {
                RowId: '1',
                'MaterialInputs/Label 1': 'Val2',
                'MaterialInputs/Label 2': null,
            },
            {
                RowId: '2',
                'MaterialInputs/Label 1': 'Val2',
            },
        ]);
    });

    test('parents same except for ordering', () => {
        const selected = List<EntityChoice>([
            {
                type: {
                    lsid: 'lsid1',
                    rowId: 1,
                    label: 'Label 1',
                    entityDataType: SampleTypeDataType,
                },
                ids: ['id1.2, id1.1'],
                value: 'Val2,Val1',
            },
        ]);
        const rows = getUpdatedLineageRowsForBulkEdit(
            samples,
            selected,
            { '1': original1, '2': original2 },
            QUERY_INFO
        );
        expect(rows).toStrictEqual([
            {
                RowId: '2',
                'MaterialInputs/Label 1': 'Val1,Val2',
            },
        ]);
    });
});
