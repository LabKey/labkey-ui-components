import { fromJS, List, Map } from 'immutable';

import { createEntityParentKey, DataClassDataType, QueryGridModel, SchemaQuery } from '../../..';

import { EntityChoice, IEntityTypeOption } from './models';
import { getInitialParentChoices, parentValuesDiffer } from './utils';

describe('getInitialParentChoices', () => {
    const modelId = 'id';
    const schemaQuery = new SchemaQuery({
        schemaName: 'samples',
        queryName: 'example',
    });
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
        const parentChoices = getInitialParentChoices(parentTypeOptions, DataClassDataType, {});
        expect(parentChoices.size).toBe(0);
    });

    test('no data', () => {
        const model = new QueryGridModel({
            id: modelId,
            isLoaded: false,
            isLoading: false,
            isError: true,
            schema: schemaQuery.schemaName,
            query: schemaQuery.queryName,
            data: Map<any, Map<string, any>>(),
        });
        const parentChoices = getInitialParentChoices(parentTypeOptions, DataClassDataType, model);
        expect(parentChoices.size).toBe(0);
    });

    test('missing parent type', () => {
        const model = new QueryGridModel({
            id: modelId,
            isLoaded: true,
            isLoading: false,
            isError: false,
            schema: schemaQuery.schemaName,
            query: schemaQuery.queryName,
            dataIds: List(['1']),
            data: fromJS({
                '1': {
                    LSID: {
                        value: 'urn:lsid:labkey.com:Sample.252.Examples:E-20200303-1',
                    },
                    'Inputs/Materials/First': [],
                    RowId: {
                        value: 53412,
                        url: '/labkey/Sam%20Man/experiment-showMaterial.view?rowId=53412',
                    },
                    CreatedBy: {
                        displayValue: 'Susan',
                        value: 1005,
                        url: '/labkey/Sam%20Man/user-details.view?schemaName=core&query.queryName=Users&userId=1005',
                    },
                    Modified: {
                        formattedValue: '2020-03-03 08:58',
                        value: '2020-03-03 08:58:04.911',
                    },
                    Description: {
                        value: null,
                    },
                    'Inputs/Data/First': [
                        {
                            displayValue: 'Sec-32',
                            value: 'urn:lsid:labkey.com:Data.Folder-252:1fce5b0b-33ce-1038-8604-d42714b6919e',
                            url: '/labkey/Sam%20Man/experiment-showData.view?rowId=57093&dataClassId=322',
                        },
                    ],
                    'Inputs/Data/First/DataClass': [
                        {
                            displayValue: '322',
                            value: [0],
                        },
                    ],
                    Run: {
                        displayValue: 'Derive sample from Sec-32',
                        value: 2144,
                        url: '/labkey/Sam%20Man/experiment-showRunText.view?rowId=2144',
                    },
                    IntField: {
                        value: null,
                    },
                    ModifiedBy: {
                        displayValue: 'Susan',
                        value: 1005,
                        url: '/labkey/Sam%20Man/user-details.view?schemaName=core&query.queryName=Users&userId=1005',
                    },
                    Created: {
                        formattedValue: '2020-03-03 08:58',
                        value: '2020-03-03 08:58:04.911',
                    },
                    Name: {
                        value: 'E-20200303-1',
                        url: '/labkey/Sam%20Man/experiment-showMaterial.view?rowId=53412',
                    },
                    SampleSet: {
                        displayValue: 'Examples',
                        value: 'urn:lsid:labkey.com:SampleSet.Folder-252:Examples',
                        url: '/labkey/Sam%20Man/experiment-showMaterialSource.view?rowId=205',
                    },
                    TextField: {
                        value: null,
                    },
                    'Inputs/Materials/First/SampleSet': [],
                },
            }),
        });
        const parentChoices = getInitialParentChoices(parentTypeOptions, DataClassDataType, model);
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
            'Inputs/Data/First/DataClass': [
                {
                    displayValue: '321',
                    value: [321],
                },
                {
                    displayValue: '321',
                    value: [321],
                },
                {
                    displayValue: '321',
                    value: [321],
                },
                {
                    displayValue: '322',
                    value: [322],
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
            'Inputs/Materials/First/SampleSet': [],
        };
        const parentChoices = getInitialParentChoices(parentTypeOptions, DataClassDataType, data);
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
