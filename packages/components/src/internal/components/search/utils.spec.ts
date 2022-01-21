import { Filter } from '@labkey/api';

import { fromJS, List, Map } from 'immutable';

import { SchemaQuery } from '../../../public/SchemaQuery';
import { TEST_USER_EDITOR, TEST_USER_GUEST } from '../../../test/data/users';
import { SCHEMAS } from '../../schemas';
import { FREEZER_MANAGER_APP_PROPERTIES } from '../../app/constants';
import { QueryInfo } from '../../../public/QueryInfo';
import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SAMPLE_STATUS_REQUIRED_COLUMNS } from '../samples/constants';
import { TestTypeDataType } from '../../../test/data/constants';
import { QueryColumn } from '../../../public/QueryColumn';

import {
    getFinderStartText,
    getFinderViewColumnsConfig,
    getSampleFinderCommonConfigs,
    getSampleFinderQueryConfigs,
    SAMPLE_FINDER_VIEW_NAME,
} from './utils';

test('getFinderStartText', () => {
    expect(getFinderStartText([])).toBe('Start by adding  properties.');
    expect(getFinderStartText([TestTypeDataType])).toBe(
        'Start by adding ' + TestTypeDataType.nounAsParentSingular + ' properties.'
    );
    expect(getFinderStartText([TestTypeDataType, { ...TestTypeDataType, nounAsParentSingular: 'Other Parents' }])).toBe(
        'Start by adding ' + TestTypeDataType.nounAsParentSingular + ' or Other Parents properties.'
    );
    expect(
        getFinderStartText([
            TestTypeDataType,
            { ...TestTypeDataType, nounAsParentSingular: 'Other Parents' },
            { ...TestTypeDataType, nounAsParentSingular: 'Third Parents' },
        ])
    ).toBe('Start by adding ' + TestTypeDataType.nounAsParentSingular + ', Other Parents or Third Parents properties.');
});

describe('getFinderViewColumnsConfig', () => {
    const model = makeTestQueryModel(
        SCHEMAS.SAMPLE_SETS.SAMPLES,
        new QueryInfo({
            showInsertNewButton: true,
            importUrl: 'https://some/import',
            importUrlDisabled: false,
            appEditableTable: true,
            pkCols: List(['RowId']),
            columns: fromJS({
                rowid: QueryColumn.create({ caption: 'Row Id', fieldKey: 'RowId', inputType: 'number' }),
                description: QueryColumn.create({
                    caption: 'Description',
                    fieldKey: 'Description',
                    inputType: 'textarea',
                }),
                samplestate: QueryColumn.create({ caption: 'SampleState', fieldKey: 'SampleState', inputType: 'text' }),
                name: QueryColumn.create({ caption: 'Name', fieldKey: 'Name', inputType: 'text' }),
                extraField: QueryColumn.create({ caption: 'Extra', fieldKey: 'ExtraField', inputType: 'text' }),
            }),
            views: Map({
                '~~default~~': {
                    name: '',
                    label: 'default',
                    default: true,
                    columns: [
                        {
                            name: 'Name',
                            key: 'Name',
                            fieldKey: 'Name',
                        },
                    ],
                },
            }),
        }),
        {},
        [],
        0,
        'test-samples'
    );
    test('no required columns', () => {
        expect(getFinderViewColumnsConfig(model)).toStrictEqual({
            hasUpdates: false,
            columns: [{ fieldKey: 'Name' }],
        });
    });

    test('no new required columns', () => {
        const modelUpdate = model.mutate({ requiredColumns: ['Name'] });
        expect(getFinderViewColumnsConfig(modelUpdate)).toStrictEqual({
            hasUpdates: false,
            columns: [{ fieldKey: 'Name' }],
        });
    });

    test('with new required columns', () => {
        const modelUpdate = model.mutate({ requiredColumns: ['Name', 'ExtraField', 'SampleState'] });
        expect(getFinderViewColumnsConfig(modelUpdate)).toStrictEqual({
            hasUpdates: true,
            columns: [{ fieldKey: 'Name' }, { fieldKey: 'ExtraField' }],
        });
    });
});

describe('getSampleFinderCommonConfigs', () => {
    test('No cards', () => {
        expect(getSampleFinderCommonConfigs([])).toStrictEqual({
            baseFilters: [],
            requiredColumns: SAMPLE_STATUS_REQUIRED_COLUMNS,
        });
    });

    test('Cards without filters', () => {
        expect(
            getSampleFinderCommonConfigs([
                {
                    entityDataType: TestTypeDataType,
                    schemaQuery: SchemaQuery.create('Samples', 'TestQuery'),
                },
            ])
        ).toStrictEqual({
            baseFilters: [Filter.create('QueryableInputs/Materials/TestQuery/Name', null, Filter.Types.NONBLANK)],
            requiredColumns: [...SAMPLE_STATUS_REQUIRED_COLUMNS, 'QueryableInputs/Materials/TestQuery'],
        });
    });

    test('Cards with and without filters', () => {
        const cardFilter = Filter.create('TestColumn', 'value');
        expect(
            getSampleFinderCommonConfigs([
                {
                    entityDataType: TestTypeDataType,
                    schemaQuery: SchemaQuery.create('Samples', 'TestQuery'),
                },
                {
                    entityDataType: TestTypeDataType,
                    schemaQuery: SchemaQuery.create('Samples', 'TestQuery2'),
                    filterArray: [cardFilter],
                },
            ])
        ).toStrictEqual({
            baseFilters: [
                Filter.create('QueryableInputs/Materials/TestQuery/Name', null, Filter.Types.NONBLANK),
                cardFilter,
            ],
            requiredColumns: [
                ...SAMPLE_STATUS_REQUIRED_COLUMNS,
                'QueryableInputs/Materials/TestQuery',
                'QueryableInputs/Materials/TestQuery2/TestColumn',
            ],
        });
    });
});

describe('getSampleFinderQueryConfigs', () => {
    LABKEY.moduleContext = {
        inventory: {
            productId: FREEZER_MANAGER_APP_PROPERTIES.productId,
        },
    };
    test('no sample type names, no cards', () => {
        expect(getSampleFinderQueryConfigs(TEST_USER_EDITOR, [], [], 'testId')).toStrictEqual({
            'testId|exp/materials': {
                id: 'testId|exp/materials',
                title: 'All Samples',
                schemaQuery: SchemaQuery.create(
                    SCHEMAS.EXP_TABLES.MATERIALS.schemaName,
                    SCHEMAS.EXP_TABLES.MATERIALS.queryName,
                    SAMPLE_FINDER_VIEW_NAME
                ),
                omittedColumns: ['Run'],
                baseFilters: [],
                requiredColumns: SAMPLE_STATUS_REQUIRED_COLUMNS,
            },
        });
    });

    test('no sample type names', () => {
        expect(
            getSampleFinderQueryConfigs(
                TEST_USER_EDITOR,
                [],
                [
                    {
                        entityDataType: TestTypeDataType,
                        schemaQuery: SchemaQuery.create('Samples', 'TestQuery'),
                    },
                ],
                'testId'
            )
        ).toStrictEqual({
            'testId|exp/materials': {
                id: 'testId|exp/materials',
                title: 'All Samples',
                schemaQuery: SchemaQuery.create(
                    SCHEMAS.EXP_TABLES.MATERIALS.schemaName,
                    SCHEMAS.EXP_TABLES.MATERIALS.queryName,
                    SAMPLE_FINDER_VIEW_NAME
                ),
                omittedColumns: ['Run'],
                baseFilters: [Filter.create('QueryableInputs/Materials/TestQuery/Name', null, Filter.Types.NONBLANK)],
                requiredColumns: [...SAMPLE_STATUS_REQUIRED_COLUMNS, 'QueryableInputs/Materials/TestQuery'],
            },
        });
    });

    test('multiple sample types, no cards', () => {
        expect(
            getSampleFinderQueryConfigs(TEST_USER_GUEST, ['Sample Type 1', 'Sample Type 2'], [], 'testId')
        ).toStrictEqual({
            'testId|exp/materials': {
                id: 'testId|exp/materials',
                title: 'All Samples',
                schemaQuery: SchemaQuery.create(
                    SCHEMAS.EXP_TABLES.MATERIALS.schemaName,
                    SCHEMAS.EXP_TABLES.MATERIALS.queryName,
                    SAMPLE_FINDER_VIEW_NAME
                ),
                omittedColumns: ['checkedOutBy', 'Run'],
                baseFilters: [],
                requiredColumns: SAMPLE_STATUS_REQUIRED_COLUMNS,
            },
            'testId|samples/Sample Type 1': {
                id: 'testId|samples/Sample Type 1',
                title: 'Sample Type 1',
                schemaQuery: SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, 'Sample Type 1', SAMPLE_FINDER_VIEW_NAME),
                omittedColumns: ['checkedOutBy'],
                baseFilters: [],
                requiredColumns: SAMPLE_STATUS_REQUIRED_COLUMNS,
            },
            'testId|samples/Sample Type 2': {
                id: 'testId|samples/Sample Type 2',
                title: 'Sample Type 2',
                schemaQuery: SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, 'Sample Type 2', SAMPLE_FINDER_VIEW_NAME),
                omittedColumns: ['checkedOutBy'],
                baseFilters: [],
                requiredColumns: SAMPLE_STATUS_REQUIRED_COLUMNS,
            },
        });
    });

    test('with names and cards', () => {
        const cards = [
            {
                entityDataType: TestTypeDataType,
                schemaQuery: SchemaQuery.create('Samples', 'TestQuery'),
            },
        ];
        expect(
            getSampleFinderQueryConfigs(TEST_USER_GUEST, ['Sample Type 1', 'Sample Type 2'], cards, 'testId')
        ).toStrictEqual({
            'testId|exp/materials': {
                id: 'testId|exp/materials',
                title: 'All Samples',
                schemaQuery: SchemaQuery.create(
                    SCHEMAS.EXP_TABLES.MATERIALS.schemaName,
                    SCHEMAS.EXP_TABLES.MATERIALS.queryName,
                    SAMPLE_FINDER_VIEW_NAME
                ),
                omittedColumns: ['checkedOutBy', 'Run'],
                baseFilters: [Filter.create('QueryableInputs/Materials/TestQuery/Name', null, Filter.Types.NONBLANK)],
                requiredColumns: [...SAMPLE_STATUS_REQUIRED_COLUMNS, 'QueryableInputs/Materials/TestQuery'],
            },
            'testId|samples/Sample Type 1': {
                id: 'testId|samples/Sample Type 1',
                title: 'Sample Type 1',
                schemaQuery: SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, 'Sample Type 1', SAMPLE_FINDER_VIEW_NAME),
                omittedColumns: ['checkedOutBy'],
                baseFilters: [Filter.create('QueryableInputs/Materials/TestQuery/Name', null, Filter.Types.NONBLANK)],
                requiredColumns: [...SAMPLE_STATUS_REQUIRED_COLUMNS, 'QueryableInputs/Materials/TestQuery'],
            },
            'testId|samples/Sample Type 2': {
                id: 'testId|samples/Sample Type 2',
                title: 'Sample Type 2',
                schemaQuery: SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, 'Sample Type 2', SAMPLE_FINDER_VIEW_NAME),
                omittedColumns: ['checkedOutBy'],
                baseFilters: [Filter.create('QueryableInputs/Materials/TestQuery/Name', null, Filter.Types.NONBLANK)],
                requiredColumns: [...SAMPLE_STATUS_REQUIRED_COLUMNS, 'QueryableInputs/Materials/TestQuery'],
            },
        });
    });
});
