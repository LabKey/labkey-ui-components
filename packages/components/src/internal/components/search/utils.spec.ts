import { Filter, Query } from '@labkey/api';

import { fromJS, List, Map } from 'immutable';

import { TEST_USER_EDITOR, TEST_USER_GUEST } from '../../userFixtures';
import { FREEZER_MANAGER_APP_PROPERTIES } from '../../app/constants';
import { QueryInfo } from '../../../public/QueryInfo';
import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SAMPLE_STATUS_REQUIRED_COLUMNS } from '../samples/constants';
import { TestTypeDataType, TestTypeDataTypeWithEntityFilter } from '../../../test/data/constants';
import { QueryColumn } from '../../../public/QueryColumn';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { SCHEMAS } from '../../schemas';

import { TEXT_TYPE } from '../domainproperties/PropDescType';

import { NOT_ANY_FILTER_TYPE } from '../../url/NotAnyFilterType';

import { IN_EXP_DESCENDANTS_OF_FILTER_TYPE } from '../../url/InExpDescendantsOfFilterType';

import { formatDate } from '../../util/Date';

import { AssayResultDataType, SampleTypeDataType } from '../entities/constants';

import { COLUMN_IN_FILTER_TYPE, COLUMN_NOT_IN_FILTER_TYPE } from '../../query/filter';

import {
    ALL_VALUE_DISPLAY,
    EMPTY_VALUE_DISPLAY,
    getAssayFilter,
    getCheckedFilterValues,
    getDataTypeFiltersWithNotInQueryUpdate,
    getExpDescendantOfSelectClause,
    getFieldFiltersValidationResult,
    getFilterSelections,
    getFilterValuesAsArray,
    getFinderStartText,
    getFinderViewColumnsConfig,
    getLabKeySql,
    getLabKeySqlWhere,
    getSampleFinderColumnNames,
    getSampleFinderCommonConfigs,
    getSampleFinderQueryConfigs,
    getUpdatedCheckedValues,
    getUpdatedChooseValuesFilter,
    getUpdatedDataTypeFilters,
    getUpdatedFilters,
    getUpdatedFilterSelection,
    getUpdateFilterExpressionFilter,
    isValidFilterField,
    isValidFilterFieldExcludeLookups,
    isValidFilterFieldSampleFinder,
    SAMPLE_FINDER_VIEW_NAME,
    searchFiltersFromJson,
    searchFiltersToJson,
} from './utils';
import { FieldFilter } from './models';

beforeAll(() => {
    LABKEY.container = {
        formats: {
            dateFormat: 'yyyy-MM-dd',
            dateTimeFormat: 'yyyy-MM-dd HH:mm',
            numberFormat: null,
        },
    };
});

test('getFinderStartText', () => {
    expect(getFinderStartText([], [])).toBeNull();
    expect(getFinderStartText([TestTypeDataType], [])).toBeNull();
    expect(getFinderStartText([TestTypeDataType], [TestTypeDataType.typeListingSchemaQuery.queryName])).toBe(
        'Start by adding ' + TestTypeDataType.nounAsParentSingular + ' properties.'
    );
    expect(
        getFinderStartText(
            [
                TestTypeDataType,
                {
                    ...TestTypeDataType,
                    typeListingSchemaQuery: SchemaQuery.create('TestClasses', 'query2'),
                    nounAsParentSingular: 'Other Parents',
                },
            ],
            [TestTypeDataType.typeListingSchemaQuery.queryName, 'query2']
        )
    ).toBe('Start by adding ' + TestTypeDataType.nounAsParentSingular + ' or Other Parents properties.');
    expect(
        getFinderStartText(
            [
                TestTypeDataType,
                {
                    ...TestTypeDataType,
                    typeListingSchemaQuery: SchemaQuery.create('TestClasses', 'query2'),
                    nounAsParentSingular: 'Other Parents',
                },
            ],
            [TestTypeDataType.typeListingSchemaQuery.queryName]
        )
    ).toBe('Start by adding ' + TestTypeDataType.nounAsParentSingular + ' properties.');
    expect(
        getFinderStartText(
            [
                TestTypeDataType,
                { ...TestTypeDataType, nounAsParentSingular: 'Other Parents' },
                { ...TestTypeDataType, nounAsParentSingular: 'Third Parents' },
            ],
            [TestTypeDataType.typeListingSchemaQuery.queryName]
        )
    ).toBe('Start by adding ' + TestTypeDataType.nounAsParentSingular + ', Other Parents or Third Parents properties.');
});

describe('getFinderViewColumnsConfig', () => {
    const queryInfo = new QueryInfo({
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
            extrafield: QueryColumn.create({ caption: 'Extra', fieldKey: 'ExtraField', inputType: 'text' }),
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
            [SAMPLE_FINDER_VIEW_NAME.toLowerCase()]: {
                name: SAMPLE_FINDER_VIEW_NAME,
                label: SAMPLE_FINDER_VIEW_NAME,
                default: false,
                columns: [
                    {
                        name: 'Name',
                        key: 'Name',
                        fieldKey: 'Name',
                    },
                ],
            },
        }),
    });
    const model = makeTestQueryModel(
        SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, 'Test', SAMPLE_FINDER_VIEW_NAME),
        queryInfo,
        {},
        [],
        0,
        'test-samples'
    );
    test('no required columns', () => {
        expect(getFinderViewColumnsConfig(model, {})).toStrictEqual({
            hasUpdates: false,
            columns: [{ fieldKey: 'Name', title: undefined }],
        });
    });

    test('no new required columns', () => {
        const modelUpdate = model.mutate({ requiredColumns: ['Name'] });
        expect(getFinderViewColumnsConfig(modelUpdate, {})).toStrictEqual({
            hasUpdates: false,
            columns: [{ fieldKey: 'Name', title: undefined }],
        });
    });

    test('with new required columns', () => {
        const modelUpdate = model.mutate({ requiredColumns: ['Name', 'ExtraField', 'SampleState'] });
        expect(getFinderViewColumnsConfig(modelUpdate, { ExtraField: 'Extra Field Display' })).toStrictEqual({
            hasUpdates: true,
            columns: [
                { fieldKey: 'Name', title: undefined },
                { fieldKey: 'ExtraField', title: 'Extra Field Display' },
            ],
        });
    });

    test('view has all updates', () => {
        const queryInfo = new QueryInfo({
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
                extrafield: QueryColumn.create({ caption: 'Extra', fieldKey: 'ExtraField', inputType: 'text' }),
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
                [SAMPLE_FINDER_VIEW_NAME.toLowerCase()]: {
                    name: SAMPLE_FINDER_VIEW_NAME,
                    label: SAMPLE_FINDER_VIEW_NAME,
                    default: false,
                    columns: [
                        {
                            name: 'Name',
                            key: 'Name',
                            fieldKey: 'Name',
                        },
                        {
                            name: 'Extra',
                            fieldKey: 'ExtraField',
                            key: 'Extra',
                        },
                    ],
                },
            }),
        });
        const model = makeTestQueryModel(
            SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, 'Test', SAMPLE_FINDER_VIEW_NAME),
            queryInfo,
            {},
            [],
            0,
            'test-samples'
        );
        const modelUpdate = model.mutate({
            requiredColumns: ['Name', 'ExtraField'],
        });
        expect(getFinderViewColumnsConfig(modelUpdate, { ExtraField: 'Extra Field Display' })).toStrictEqual({
            hasUpdates: false,
            columns: [
                { fieldKey: 'Name', title: undefined },
                { fieldKey: 'ExtraField', title: 'Extra Field Display' },
            ],
        });
    });
});

const assay1 = 'assay1';
const assay1SchemaQuery = SchemaQuery.create('assay.general.' + assay1, 'data');

const AssayColumnInFilter = Filter.create(
    'RowId',
    'SELECT "SampleId" FROM "assay.general.assay1"."data" WHERE "TestColumn" = \'value\'',
    COLUMN_IN_FILTER_TYPE
);

const AssayNotInFilter = Filter.create(
    'RowId',
    'SELECT "strField" FROM "assay.general.assay1"."data"',
    COLUMN_NOT_IN_FILTER_TYPE
);
const AssayNotInFilterField = {
    fieldKey: '*',
    fieldCaption: 'Results',
    filter: AssayNotInFilter,
    jsonType: undefined,
} as FieldFilter;

describe('getAssayFilter', () => {
    test('Assay card with filters', () => {
        const cardFilter = {
            fieldKey: 'TestColumn',
            fieldCaption: 'TestColumn',
            filter: Filter.create('TestColumn', 'value'),
            jsonType: 'string',
        } as FieldFilter;
        expect(
            getAssayFilter({
                entityDataType: AssayResultDataType,
                schemaQuery: SchemaQuery.create('assay.general.' + assay1, 'data'),
                filterArray: [cardFilter],
                targetColumnFieldKey: 'SampleId',
                selectColumnFieldKey: 'RowId',
            })
        ).toEqual(AssayColumnInFilter);
    });

    test('Assay card with not in assay filter', () => {
        const cardFilter = {
            fieldKey: 'TestColumn',
            fieldCaption: 'TestColumn',
            filter: Filter.create('TestColumn', 'value'),
            jsonType: 'string',
        } as FieldFilter;
        expect(
            getAssayFilter({
                entityDataType: AssayResultDataType,
                schemaQuery: SchemaQuery.create('assay.general.' + assay1, 'data'),
                filterArray: [AssayNotInFilterField],
            })
        ).toEqual(AssayNotInFilter);
    });
});

describe('getSampleFinderCommonConfigs', () => {
    test('No cards', () => {
        expect(getSampleFinderCommonConfigs([], true)).toStrictEqual({
            baseFilters: [],
            requiredColumns: SAMPLE_STATUS_REQUIRED_COLUMNS,
        });
    });

    test('Cards without filters, not ancestors', () => {
        expect(
            getSampleFinderCommonConfigs(
                [
                    {
                        entityDataType: TestTypeDataType,
                        schemaQuery: SchemaQuery.create('Samples', 'TestQuery'),
                    },
                ],
                false
            )
        ).toStrictEqual({
            baseFilters: [
                Filter.create(
                    '*',
                    'SELECT "TestQuery".expObject() FROM Samples."TestQuery" WHERE "Name" IS NOT NULL',
                    IN_EXP_DESCENDANTS_OF_FILTER_TYPE
                ),
            ],
            requiredColumns: [...SAMPLE_STATUS_REQUIRED_COLUMNS, 'Inputs/Materials/TestQuery'],
        });
    });

    test('Assay card without filters', () => {
        expect(
            getSampleFinderCommonConfigs(
                [
                    {
                        entityDataType: AssayResultDataType,
                        schemaQuery: SchemaQuery.create('assay.general.' + assay1, 'data'),
                    },
                ],
                false
            )
        ).toStrictEqual({
            baseFilters: [],
            requiredColumns: [...SAMPLE_STATUS_REQUIRED_COLUMNS],
        });
    });

    test('Cards without filters, with ancestors', () => {
        expect(
            getSampleFinderCommonConfigs(
                [
                    {
                        entityDataType: TestTypeDataType,
                        schemaQuery: SchemaQuery.create('Samples', 'TestQuery'),
                    },
                ],
                true
            )
        ).toStrictEqual({
            baseFilters: [
                Filter.create(
                    '*',
                    'SELECT "TestQuery".expObject() FROM Samples."TestQuery" WHERE "Name" IS NOT NULL',
                    IN_EXP_DESCENDANTS_OF_FILTER_TYPE
                ),
            ],
            requiredColumns: [...SAMPLE_STATUS_REQUIRED_COLUMNS, 'Ancestors/Samples/TestQuery'],
        });
    });

    test('Cards with and without filters', () => {
        const cardFilter = {
            fieldKey: 'TestColumn',
            fieldCaption: 'TestColumn',
            filter: Filter.create('TestColumn', 'value'),
            jsonType: 'string',
        } as FieldFilter;

        expect(
            getSampleFinderCommonConfigs(
                [
                    {
                        entityDataType: TestTypeDataType,
                        schemaQuery: SchemaQuery.create('Samples', 'TestQuery'),
                    },
                    {
                        entityDataType: TestTypeDataType,
                        schemaQuery: SchemaQuery.create('Samples', 'TestQuery2'),
                        filterArray: [cardFilter],
                    },
                ],
                false,
                Query.ContainerFilter.currentAndFirstChildren
            )
        ).toStrictEqual({
            baseFilters: [
                Filter.create(
                    '*',
                    'SELECT "TestQuery".expObject() FROM Samples."TestQuery"[ContainerFilter=\'CurrentAndFirstChildren\'] WHERE "Name" IS NOT NULL',
                    IN_EXP_DESCENDANTS_OF_FILTER_TYPE
                ),
                Filter.create(
                    '*',
                    'SELECT "TestQuery2".expObject() FROM Samples."TestQuery2"[ContainerFilter=\'CurrentAndFirstChildren\'] WHERE "TestColumn" = \'value\'',
                    IN_EXP_DESCENDANTS_OF_FILTER_TYPE
                ),
            ],
            requiredColumns: [
                ...SAMPLE_STATUS_REQUIRED_COLUMNS,
                'Inputs/Materials/TestQuery',
                'Inputs/Materials/TestQuery2',
                'Inputs/Materials/TestQuery2/TestColumn',
            ],
        });
    });

    test('Assay card with filters', () => {
        const cardFilter = {
            fieldKey: 'TestColumn',
            fieldCaption: 'TestColumn',
            filter: Filter.create('TestColumn', 'value'),
            jsonType: 'string',
        } as FieldFilter;
        expect(
            getSampleFinderCommonConfigs(
                [
                    {
                        entityDataType: AssayResultDataType,
                        schemaQuery: SchemaQuery.create('assay.general.' + assay1, 'data'),
                        filterArray: [cardFilter],
                        targetColumnFieldKey: 'SampleId',
                        selectColumnFieldKey: 'RowId',
                    },
                ],
                false
            )
        ).toStrictEqual({
            baseFilters: [AssayColumnInFilter],
            requiredColumns: [...SAMPLE_STATUS_REQUIRED_COLUMNS],
        });
    });

    test('Assay card with not in assay filter', () => {
        expect(
            getSampleFinderCommonConfigs(
                [
                    {
                        entityDataType: AssayResultDataType,
                        schemaQuery: SchemaQuery.create('assay.general.' + assay1, 'data'),
                        filterArray: [AssayNotInFilterField],
                    },
                ],
                false
            )
        ).toStrictEqual({
            baseFilters: [AssayNotInFilter],
            requiredColumns: [...SAMPLE_STATUS_REQUIRED_COLUMNS],
        });
    });
});

describe('getSampleFinderQueryConfigs', () => {
    LABKEY.moduleContext = {
        inventory: {
            productId: FREEZER_MANAGER_APP_PROPERTIES.productId,
        },
    };
    LABKEY.uuids = ['uuid-1', 'uuid-2', 'uuid-3'];
    test('no sample type names, no cards', () => {
        expect(getSampleFinderQueryConfigs(TEST_USER_EDITOR, [], [], 'testId')).toStrictEqual({
            'uuid-1-testId|exp/materials': {
                id: 'uuid-1-testId|exp/materials',
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
            'uuid-1-testId|exp/materials': {
                id: 'uuid-1-testId|exp/materials',
                title: 'All Samples',
                schemaQuery: SchemaQuery.create(
                    SCHEMAS.EXP_TABLES.MATERIALS.schemaName,
                    SCHEMAS.EXP_TABLES.MATERIALS.queryName,
                    SAMPLE_FINDER_VIEW_NAME
                ),
                omittedColumns: ['Run'],
                baseFilters: [
                    Filter.create(
                        '*',
                        'SELECT "TestQuery".expObject() FROM Samples."TestQuery" WHERE "Name" IS NOT NULL',
                        IN_EXP_DESCENDANTS_OF_FILTER_TYPE
                    ),
                ],
                requiredColumns: [...SAMPLE_STATUS_REQUIRED_COLUMNS, 'Inputs/Materials/TestQuery'],
            },
        });
    });

    test('multiple sample types, no cards', () => {
        expect(
            getSampleFinderQueryConfigs(TEST_USER_GUEST, ['Sample Type 1', 'Sample Type 2'], [], 'testId')
        ).toStrictEqual({
            'uuid-1-testId|exp/materials': {
                id: 'uuid-1-testId|exp/materials',
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
            'uuid-1-testId|samples/Sample Type 1': {
                id: 'uuid-1-testId|samples/Sample Type 1',
                title: 'Sample Type 1',
                schemaQuery: SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, 'Sample Type 1', SAMPLE_FINDER_VIEW_NAME),
                omittedColumns: ['checkedOutBy'],
                baseFilters: [],
                requiredColumns: SAMPLE_STATUS_REQUIRED_COLUMNS,
            },
            'uuid-1-testId|samples/Sample Type 2': {
                id: 'uuid-1-testId|samples/Sample Type 2',
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
            'uuid-1-testId|exp/materials': {
                id: 'uuid-1-testId|exp/materials',
                title: 'All Samples',
                schemaQuery: SchemaQuery.create(
                    SCHEMAS.EXP_TABLES.MATERIALS.schemaName,
                    SCHEMAS.EXP_TABLES.MATERIALS.queryName,
                    SAMPLE_FINDER_VIEW_NAME
                ),
                omittedColumns: ['checkedOutBy', 'Run'],
                baseFilters: [
                    Filter.create(
                        '*',
                        'SELECT "TestQuery".expObject() FROM Samples."TestQuery" WHERE "Name" IS NOT NULL',
                        IN_EXP_DESCENDANTS_OF_FILTER_TYPE
                    ),
                ],
                requiredColumns: [...SAMPLE_STATUS_REQUIRED_COLUMNS, 'Inputs/Materials/TestQuery'],
            },
            'uuid-1-testId|samples/Sample Type 1': {
                id: 'uuid-1-testId|samples/Sample Type 1',
                title: 'Sample Type 1',
                schemaQuery: SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, 'Sample Type 1', SAMPLE_FINDER_VIEW_NAME),
                omittedColumns: ['checkedOutBy'],
                baseFilters: [
                    Filter.create(
                        '*',
                        'SELECT "TestQuery".expObject() FROM Samples."TestQuery" WHERE "Name" IS NOT NULL',
                        IN_EXP_DESCENDANTS_OF_FILTER_TYPE
                    ),
                ],
                requiredColumns: [...SAMPLE_STATUS_REQUIRED_COLUMNS, 'Ancestors/Samples/TestQuery'],
            },
            'uuid-1-testId|samples/Sample Type 2': {
                id: 'uuid-1-testId|samples/Sample Type 2',
                title: 'Sample Type 2',
                schemaQuery: SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, 'Sample Type 2', SAMPLE_FINDER_VIEW_NAME),
                omittedColumns: ['checkedOutBy'],
                baseFilters: [
                    Filter.create(
                        '*',
                        'SELECT "TestQuery".expObject() FROM Samples."TestQuery" WHERE "Name" IS NOT NULL',
                        IN_EXP_DESCENDANTS_OF_FILTER_TYPE
                    ),
                ],
                requiredColumns: [...SAMPLE_STATUS_REQUIRED_COLUMNS, 'Ancestors/Samples/TestQuery'],
            },
        });
    });
});

const anyValueFilter = {
    fieldKey: 'textField',
    fieldCaption: 'textField',
    filter: Filter.create('textField', null, Filter.Types.HAS_ANY_VALUE),
    jsonType: 'string',
} as FieldFilter;

const intEqFilter = {
    fieldKey: 'intField',
    fieldCaption: 'intField',
    filter: Filter.create('intField', 1),
    jsonType: 'int',
} as FieldFilter;

const stringBetweenFilter = {
    fieldKey: 'strField',
    fieldCaption: 'strField',
    filter: Filter.create('strField', ['1', '5'], Filter.Types.BETWEEN),
    jsonType: 'string',
} as FieldFilter;

const stringEqualFilter = {
    fieldKey: 'strField',
    fieldCaption: 'strField',
    filter: Filter.create('strField', '2', Filter.Types.EQ),
    jsonType: 'string',
} as FieldFilter;

const emptyStringBetweenFilter = {
    fieldKey: 'strField',
    fieldCaption: 'strField',
    filter: Filter.create('strField', ['', '5'], Filter.Types.BETWEEN),
    jsonType: 'string',
} as FieldFilter;

const emptyStringLessThanFilter = {
    fieldKey: 'strField',
    fieldCaption: 'strField',
    filter: Filter.create('strField', '', Filter.Types.LT),
    jsonType: 'string',
} as FieldFilter;

const floatBetweenFilter = {
    fieldKey: 'floatField2',
    fieldCaption: 'floatField2',
    filter: Filter.create('floatField2', '1,5', Filter.Types.BETWEEN),
    jsonType: 'float',
} as FieldFilter;

const badIntFilter = {
    fieldKey: 'intField',
    fieldCaption: 'intField',
    filter: Filter.create('intField', null),
    jsonType: 'int',
} as FieldFilter;

const badBetweenFilter = {
    fieldKey: 'doubleField',
    fieldCaption: 'doubleField',
    filter: Filter.create('doubleField', '1', Filter.Types.BETWEEN),
    jsonType: 'float',
} as FieldFilter;

const card = {
    entityDataType: TestTypeDataType,
    filterArray: [anyValueFilter, stringBetweenFilter],
    schemaQuery: SchemaQuery.create('TestSchema', 'samples1'),
    index: 1,
};

const cardJSON =
    '{"filters":[{"entityDataType":{"typeListingSchemaQuery":{"schemaName":"TestListing","queryName":"query"},"listingSchemaQuery":{"schemaName":"Test","queryName":"query"},' +
    '"instanceSchemaName":"TestSchema","operationConfirmationControllerName":"controller","operationConfirmationActionName":"test-delete-confirmation.api",' +
    '"nounSingular":"test","nounPlural":"tests","nounAsParentSingular":"test Parent",' +
    '"nounAsParentPlural":"test Parents","typeNounSingular":"Test Type","typeNounAsParentSingular":"Test Parent Type","descriptionSingular":"parent test type","descriptionPlural":"parent test types","uniqueFieldKey":"Name",' +
    '"dependencyText":"test data dependencies","deleteHelpLinkTopic":"viewSampleSets#delete","inputColumnName":"Inputs/Materials/First","ancestorColumnName":"Ancestors/Samples","inputTypeValueField":"lsid",' +
    '"insertColumnNamePrefix":"MaterialInputs/","editTypeAppUrlPrefix":"Test","importFileAction":"importSamples","filterCardHeaderClass":"filter-card__header-success"},' +
    '"filterArray":[{"fieldKey":"textField","fieldCaption":"textField","filter":"query.textField~=","jsonType":"string"},{"fieldKey":"strField","fieldCaption":"strField",' +
    '"filter":"query.strField~between=1%2C5","jsonType":"string"}],"schemaQuery":{"schemaName":"TestSchema","queryName":"samples1"},"index":1}],"filterChangeCounter":5,"filterTimestamp":"Searched 2020-08-06 14:44"}';

const cardWithEntityTypeFilter = {
    entityDataType: TestTypeDataTypeWithEntityFilter,
    filterArray: [anyValueFilter, stringBetweenFilter],
    schemaQuery: SchemaQuery.create('TestSchema', 'samples1'),
    index: 1,
};

const cardWithEntityTypeFilterJSON =
    '{"filters":[{"entityDataType":{"typeListingSchemaQuery":{"schemaName":"TestListing","queryName":"query"},"listingSchemaQuery":{"schemaName":"Test","queryName":"query"},' +
    '"instanceSchemaName":"TestSchema","operationConfirmationControllerName":"controller","operationConfirmationActionName":"test-delete-confirmation.api",' +
    '"nounSingular":"test","nounPlural":"tests","nounAsParentSingular":"test Parent","nounAsParentPlural":"test Parents",' +
    '"typeNounSingular":"Test Type","typeNounAsParentSingular":"Test Parent Type","descriptionSingular":"parent test type","descriptionPlural":"parent test types","uniqueFieldKey":"Name","dependencyText":"test data dependencies",' +
    '"deleteHelpLinkTopic":"viewSampleSets#delete","inputColumnName":"Inputs/Materials/First","ancestorColumnName":"Ancestors/Samples","inputTypeValueField":"lsid","insertColumnNamePrefix":"MaterialInputs/","editTypeAppUrlPrefix":"Test",' +
    '"importFileAction":"importSamples","filterCardHeaderClass":"filter-card__header-success","filterArray":["query.Category~eq=Source"]},"filterArray":[{"fieldKey":"textField",' +
    '"fieldCaption":"textField","filter":"query.textField~=","jsonType":"string"},{"fieldKey":"strField","fieldCaption":"strField","filter":"query.strField~between=1%2C5","jsonType":"string"}],"schemaQuery":{"schemaName":"TestSchema",' +
    '"queryName":"samples1"},"index":1}],"filterChangeCounter":5,"filterTimestamp":"Searched 2020-08-06 14:44"}';

describe('searchFiltersToJson', () => {
    test('searchFiltersToJson', () => {
        expect(searchFiltersToJson([card], 5, testDate, 'America/Los_Angeles')).toEqual(cardJSON);
        expect(searchFiltersToJson([cardWithEntityTypeFilter], 5, testDate, 'America/Los_Angeles')).toEqual(
            cardWithEntityTypeFilterJSON
        );
    });
});

describe('searchFiltersFromJson', () => {
    test('searchFiltersFromJson', () => {
        const deserializedCard = searchFiltersFromJson(cardJSON);
        expect(deserializedCard['filterChangeCounter']).toEqual(5);
        const cards = deserializedCard['filters'];
        expect(cards.length).toEqual(1);
        const fieldFilters = cards[0].filterArray;
        expect(fieldFilters.length).toEqual(2);
        expect(fieldFilters[0]['fieldCaption']).toEqual('textField');
        const textFilter = fieldFilters[1]['filter'];
        expect(textFilter).toStrictEqual(stringBetweenFilter.filter);

        const deserializedCardWithEntityFilter = searchFiltersFromJson(cardWithEntityTypeFilterJSON);
        const entityTypeFilters = deserializedCardWithEntityFilter['filters'][0].entityDataType.filterArray;
        expect(entityTypeFilters.length).toEqual(1);
        expect(entityTypeFilters[0]).toStrictEqual(Filter.create('Category', 'Source'));
    });
});

describe('getFilterValuesAsArray', () => {
    test('array value', () => {
        expect(getFilterValuesAsArray(Filter.create('textField', ['a', 'b'], Filter.Types.IN))).toStrictEqual([
            'a',
            'b',
        ]);
    });

    test('string value', () => {
        expect(getFilterValuesAsArray(Filter.create('textField', 'a;b;c', Filter.Types.IN))).toStrictEqual([
            'a',
            'b',
            'c',
        ]);
    });

    test('with blank value', () => {
        expect(getFilterValuesAsArray(Filter.create('textField', 'a;b;;c', Filter.Types.IN))).toStrictEqual([
            'a',
            'b',
            '[blank]',
            'c',
        ]);
    });

    test('with custom blank value', () => {
        expect(getFilterValuesAsArray(Filter.create('textField', 'a;b;;c', Filter.Types.IN), '[empty]')).toStrictEqual([
            'a',
            'b',
            '[empty]',
            'c',
        ]);
    });

    test('string value - between', () => {
        expect(getFilterValuesAsArray(Filter.create('textField', 'a,c', Filter.Types.BETWEEN))).toStrictEqual([
            'a',
            'c',
        ]);
    });
});

describe('getFieldFiltersValidationResult', () => {
    test('no error', () => {
        expect(
            getFieldFiltersValidationResult({
                sampleType1: [anyValueFilter, stringBetweenFilter],
                sampleType2: [intEqFilter, floatBetweenFilter],
            })
        ).toBeNull();
    });

    test('missing value', () => {
        expect(
            getFieldFiltersValidationResult({
                sampleType1: [anyValueFilter, badIntFilter],
                sampleType2: [intEqFilter],
            })
        ).toEqual('Missing filter values for: intField.');
    });

    test('missing value, with query label', () => {
        expect(
            getFieldFiltersValidationResult(
                {
                    sampleType1: [anyValueFilter, badIntFilter],
                    sampleType2: [intEqFilter],
                },
                { sampleType1: 'Sample Type 1' }
            )
        ).toEqual('Missing filter values for: Sample Type 1: intField.');
    });

    test('missing between filter value', () => {
        expect(
            getFieldFiltersValidationResult(
                {
                    sampleType1: [anyValueFilter, badIntFilter],
                    sampleType2: [intEqFilter, badIntFilter, badBetweenFilter],
                },
                { sampleType1: 'sampleType1', sampleType2: 'sampleType2' }
            )
        ).toEqual('Missing filter values for: sampleType1: intField; sampleType2: intField, doubleField.');
    });

    test('string value is empty', () => {
        expect(
            getFieldFiltersValidationResult(
                {
                    sampleType1: [emptyStringLessThanFilter, emptyStringBetweenFilter],
                    sampleType2: [emptyStringBetweenFilter],
                },
                { sampleType1: 'sampleType1', sampleType2: 'sampleType2' }
            )
        ).toEqual('Missing filter values for: sampleType1: strField; sampleType2: strField.');
    });
});

describe('getUpdateFilterExpressionFilter', () => {
    const fieldKey = 'StringField';
    const stringField = QueryColumn.create({
        name: fieldKey,
        rangeURI: TEXT_TYPE.rangeURI,
        jsonType: 'string',
        fieldKey,
    });

    const anyOp = {
        betweenOperator: false,
        label: 'Has Any Value',
        multiValue: false,
        value: 'any',
        valueRequired: false,
        isSoleFilter: false,
    };

    const equalOp = {
        betweenOperator: false,
        label: 'Equals',
        multiValue: false,
        value: 'eq',
        valueRequired: true,
        isSoleFilter: true,
    };

    const betweenOp = {
        betweenOperator: true,
        label: 'Between',
        multiValue: true,
        value: 'between',
        valueRequired: true,
        isSoleFilter: false,
    };

    const badOp = {
        betweenOperator: true,
        label: 'NotSupported',
        multiValue: true,
        value: 'NotSupported',
        valueRequired: true,
        isSoleFilter: false,
    };

    test('remove filter type', () => {
        expect(getUpdateFilterExpressionFilter(null)).toBeNull();
    });

    test('invalid filter type', () => {
        expect(getUpdateFilterExpressionFilter(badOp, stringField)).toBeNull();
    });

    test('value not required', () => {
        expect(getUpdateFilterExpressionFilter(anyOp, stringField, 'abc')).toStrictEqual(
            Filter.create(fieldKey, null, Filter.Types.HAS_ANY_VALUE)
        );
    });

    test('remove filter value', () => {
        expect(getUpdateFilterExpressionFilter(equalOp, stringField, 'abc', null, null)).toStrictEqual(
            Filter.create(fieldKey, null, Filter.Types.EQ)
        );
    });

    test('update filter value', () => {
        expect(getUpdateFilterExpressionFilter(equalOp, stringField, 'abc', null, 'def')).toStrictEqual(
            Filter.create(fieldKey, 'def', Filter.Types.EQ)
        );
    });

    test('update between filter first value', () => {
        expect(getUpdateFilterExpressionFilter(betweenOp, stringField, 'x', 'z', 'a')).toStrictEqual(
            Filter.create(fieldKey, 'a,z', Filter.Types.BETWEEN)
        );
    });

    test('update between filter second value', () => {
        expect(getUpdateFilterExpressionFilter(betweenOp, stringField, null, null, 'y', true)).toStrictEqual(
            Filter.create(fieldKey, 'y', Filter.Types.BETWEEN)
        );
    });

    test('remove between filter second value', () => {
        expect(getUpdateFilterExpressionFilter(betweenOp, stringField, 'x', 'z', null, true)).toStrictEqual(
            Filter.create(fieldKey, 'x', Filter.Types.BETWEEN)
        );
    });

    test('clear between filter values', () => {
        expect(getUpdateFilterExpressionFilter(betweenOp, stringField, 'x', 'z', null, null, true)).toStrictEqual(
            Filter.create(fieldKey, null, Filter.Types.BETWEEN)
        );
    });
});

const distinctValues = ['[All]', '[blank]', 'ed', 'ned', 'ted', 'red', 'bed'];
const distinctValuesNoBlank = ['[All]', 'ed', 'ned', 'ted', 'red', 'bed'];
const fieldKey = 'thing';

const checkedOne = Filter.create(fieldKey, 'ed');
const uncheckedOne = Filter.create(fieldKey, 'red', Filter.Types.NOT_EQUAL);
const uncheckedTwo = Filter.create(fieldKey, 'ed;ned', Filter.Types.NOT_IN);
const checkedTwo = Filter.create(fieldKey, 'ed;ned', Filter.Types.IN);
const checkedTwoWithBlank = Filter.create(fieldKey, ';ed', Filter.Types.IN);
const checkedThree = Filter.create(fieldKey, 'ed;ned;ted', Filter.Types.IN);
const checkedZero = Filter.create(fieldKey, null, NOT_ANY_FILTER_TYPE);
const anyFilter = Filter.create(fieldKey, null, Filter.Types.HAS_ANY_VALUE);
const blankFilter = Filter.create(fieldKey, null, Filter.Types.ISBLANK);
const notblankFilter = Filter.create(fieldKey, null, Filter.Types.NONBLANK);

describe('getCheckedFilterValues', () => {
    test('no filter', () => {
        expect(getCheckedFilterValues(null, distinctValues)).toEqual(distinctValues);
    });

    test('any filter', () => {
        expect(getCheckedFilterValues(anyFilter, distinctValues)).toEqual(distinctValues);
    });

    test('eq one', () => {
        expect(getCheckedFilterValues(checkedOne, distinctValues)).toEqual(['ed']);
    });

    test('not eq one', () => {
        expect(getCheckedFilterValues(uncheckedOne, distinctValues)).toEqual(['[blank]', 'ed', 'ned', 'ted', 'bed']);
    });

    test('isblank', () => {
        expect(getCheckedFilterValues(blankFilter, distinctValues)).toEqual(['[blank]']);
    });

    test('not blank', () => {
        expect(getCheckedFilterValues(notblankFilter, distinctValues)).toEqual(['ed', 'ned', 'ted', 'red', 'bed']);
        expect(getCheckedFilterValues(notblankFilter, distinctValuesNoBlank)).toEqual([
            '[All]',
            'ed',
            'ned',
            'ted',
            'red',
            'bed',
        ]);
    });

    test('in values', () => {
        expect(getCheckedFilterValues(checkedThree, distinctValues)).toEqual(['ed', 'ned', 'ted']);
    });

    test('not in values', () => {
        expect(getCheckedFilterValues(uncheckedTwo, distinctValues)).toEqual(['[blank]', 'ted', 'red', 'bed']);
    });
});

describe('getUpdatedCheckedValues', () => {
    test('check another, from eq one', () => {
        expect(getUpdatedCheckedValues(distinctValues, 'ned', true, checkedOne)).toEqual(['ed', 'ned']);
    });

    test('check blank, from eq one', () => {
        expect(getUpdatedCheckedValues(distinctValues, EMPTY_VALUE_DISPLAY, true, checkedOne)).toEqual([
            'ed',
            EMPTY_VALUE_DISPLAY,
        ]);
    });

    test('all checked, then uncheck one', () => {
        expect(getUpdatedCheckedValues(distinctValues, 'red', false, null)).toEqual([
            EMPTY_VALUE_DISPLAY,
            'ed',
            'ned',
            'ted',
            'bed',
        ]);
    });

    test('two checked, then uncheck one', () => {
        expect(getUpdatedCheckedValues(distinctValues, 'ed', false, checkedTwo)).toEqual(['ned']);
    });

    test('two checked, then uncheck another so blank is the only value left', () => {
        expect(getUpdatedCheckedValues(distinctValues, 'ed', false, checkedTwoWithBlank)).toEqual([
            EMPTY_VALUE_DISPLAY,
        ]);
    });

    test('all checked, then uncheck blank', () => {
        expect(getUpdatedCheckedValues(distinctValues, EMPTY_VALUE_DISPLAY, false, null)).toEqual([
            'ed',
            'ned',
            'ted',
            'red',
            'bed',
        ]);
    });

    test('none checked, then check blank', () => {
        expect(getUpdatedCheckedValues(distinctValues, EMPTY_VALUE_DISPLAY, true, checkedZero)).toEqual([
            EMPTY_VALUE_DISPLAY,
        ]);
    });

    test('none checked, then check one', () => {
        expect(getUpdatedCheckedValues(distinctValues, 'ed', true, checkedZero)).toEqual(['ed']);
    });

    test('all checked, then check blank and uncheck everything else', () => {
        expect(getUpdatedCheckedValues(distinctValues, EMPTY_VALUE_DISPLAY, true, null, true)).toEqual([
            EMPTY_VALUE_DISPLAY,
        ]);
    });

    test('half checked, then check one more', () => {
        expect(getUpdatedCheckedValues(distinctValues, 'red', true, checkedThree)).toEqual(['ed', 'ned', 'ted', 'red']);
    });

    test('half checked, then uncheck one', () => {
        expect(getUpdatedCheckedValues(distinctValues, 'ed', false, checkedThree)).toEqual(['ned', 'ted']);
    });

    test('one checked, then uncheck that one', () => {
        expect(getUpdatedCheckedValues(distinctValues, 'ed', false, checkedOne)).toEqual([]);
    });

    test('one unchecked, then check that one', () => {
        expect(getUpdatedCheckedValues(distinctValues, 'red', true, uncheckedOne)).toEqual([
            '[blank]',
            'ed',
            'ned',
            'ted',
            'bed',
            'red',
            '[All]',
        ]);
    });
});

describe('getUpdatedChooseValuesFilter', () => {
    function validate(resultFilter: Filter.IFilter, expectedFilterUrlSuffix: string, expectedFilterValue?: any) {
        expect(resultFilter.getFilterType().getURLSuffix()).toEqual(expectedFilterUrlSuffix);

        if (expectedFilterValue == null) expect(resultFilter.getValue()).toBeNull();
        else expect(resultFilter.getValue()).toEqual(expectedFilterValue);
    }

    test('check ALL, from eq one', () => {
        expect(getUpdatedChooseValuesFilter(distinctValues, fieldKey, ALL_VALUE_DISPLAY, true, checkedOne)).toBeNull();
    });

    test('check another, from eq one', () => {
        validate(getUpdatedChooseValuesFilter(distinctValues, fieldKey, 'ned', true, checkedOne), 'in', ['ed', 'ned']);
    });

    test('check blank, from eq one', () => {
        validate(getUpdatedChooseValuesFilter(distinctValues, fieldKey, EMPTY_VALUE_DISPLAY, true, checkedOne), 'in', [
            'ed',
            '',
        ]);
    });

    test('all checked, then uncheck one', () => {
        validate(getUpdatedChooseValuesFilter(distinctValues, fieldKey, 'red', false, null), 'neqornull', 'red');
    });

    test('two checked, then uncheck one', () => {
        validate(getUpdatedChooseValuesFilter(distinctValues, fieldKey, 'ed', false, checkedTwo), 'eq', 'ned');
    });

    test('two checked, then uncheck another so blank is the only value left', () => {
        validate(getUpdatedChooseValuesFilter(distinctValues, fieldKey, 'ed', false, checkedTwoWithBlank), 'isblank');
    });

    test('all checked, then uncheck blank', () => {
        validate(
            getUpdatedChooseValuesFilter(distinctValues, fieldKey, EMPTY_VALUE_DISPLAY, false, null),
            'isnonblank'
        );
    });

    test('none checked, then check blank', () => {
        validate(
            getUpdatedChooseValuesFilter(distinctValues, fieldKey, EMPTY_VALUE_DISPLAY, true, checkedZero),
            'isblank'
        );
    });

    test('none checked, then check one', () => {
        validate(getUpdatedChooseValuesFilter(distinctValues, fieldKey, 'ed', true, checkedZero), 'eq', 'ed');
    });

    test('all checked, then check blank and uncheck everything else', () => {
        validate(
            getUpdatedChooseValuesFilter(distinctValues, fieldKey, EMPTY_VALUE_DISPLAY, true, null, true),
            'isblank'
        );
    });

    test('half checked, then check one more', () => {
        validate(getUpdatedChooseValuesFilter(distinctValues, fieldKey, 'red', true, checkedThree), 'notin', [
            '',
            'bed',
        ]);
    });

    test('half checked, then uncheck one', () => {
        validate(getUpdatedChooseValuesFilter(distinctValues, fieldKey, 'ed', false, checkedThree), 'in', [
            'ned',
            'ted',
        ]);
    });

    test('one checked, then uncheck that one', () => {
        validate(getUpdatedChooseValuesFilter(distinctValues, fieldKey, 'ed', false, checkedOne), 'notany');
    });

    test('one unchecked, then check that one', () => {
        expect(getUpdatedChooseValuesFilter(distinctValues, fieldKey, 'red', true, uncheckedOne)).toBeNull();
    });

    test('check all, no blank', () => {
        validate(
            getUpdatedChooseValuesFilter(distinctValuesNoBlank, fieldKey, ALL_VALUE_DISPLAY, true, uncheckedOne),
            'isnonblank'
        );
    });
});

const datePOSIX = 1596750283812; // Aug 6, 2020 14:44 America/Los_Angeles
const testDate = new Date(datePOSIX);
const dateStr = formatDate(testDate, 'America/Los_Angeles', 'YYYY-MM-dd');

const date2POSIX = 1597182283812; // Aug 11, 2020 14:44 America/Los_Angeles
const testDate2 = new Date(date2POSIX);
const dateStr2 = formatDate(testDate2, 'America/Los_Angeles', 'YYYY-MM-dd');

const isBlankFilter = {
    fieldKey: 'String Field',
    fieldCaption: 'String Field',
    jsonType: 'string',
    filter: Filter.create('String Field', null, Filter.Types.ISBLANK),
} as FieldFilter;

const floatGreaterEqFilter = {
    fieldKey: 'float Field',
    fieldCaption: 'float Field',
    jsonType: 'float',
    filter: Filter.create('float Field', 1.234, Filter.Types.GTE),
} as FieldFilter;

const stringInFilter = {
    fieldKey: 'String Field',
    fieldCaption: 'String Field',
    jsonType: 'string',
    filter: Filter.create('String Field', 'value1;value2;value3', Filter.Types.IN),
} as FieldFilter;
const floatNotInFilter = {
    fieldKey: 'float Field',
    fieldCaption: 'float Field',
    jsonType: 'float',
    filter: Filter.create('FloatField', '1.1;2.2;3.3', Filter.Types.NOT_IN),
} as FieldFilter;
const booleanEqFilter = {
    fieldKey: 'Boolean Field',
    fieldCaption: 'Boolean Field',
    jsonType: 'boolean',
    filter: Filter.create('Boolean Field', 'true', Filter.Types.Equals),
} as FieldFilter;
const dateNeqFilter = {
    fieldKey: 'Date Field',
    fieldCaption: 'Date Field',
    jsonType: 'date',
    filter: Filter.create('Date Field', dateStr, Filter.Types.NEQ_OR_NULL),
} as FieldFilter;
const dateNotBetweenFilter = {
    fieldKey: 'Date Field',
    fieldCaption: 'Date Field',
    jsonType: 'date',
    filter: Filter.create('Date Field', dateStr + ',' + dateStr2, Filter.Types.NOT_BETWEEN),
} as FieldFilter;
const notSupportedFilter = {
    fieldKey: 'String Field',
    fieldCaption: 'String Field',
    jsonType: 'string',
    filter: Filter.create('String Field', null, Filter.Types.MEMBER_OF),
} as FieldFilter;

describe('getLabKeySqlWhere', () => {
    test('empty', () => {
        expect(getLabKeySqlWhere([])).toEqual('');
    });

    test('has any value', () => {
        expect(getLabKeySqlWhere([anyValueFilter])).toEqual('');
    });

    test('unsupported filters', () => {
        expect(getLabKeySqlWhere([notSupportedFilter])).toEqual('');
    });

    test('has any value and unsupported filters', () => {
        expect(getLabKeySqlWhere([anyValueFilter, notSupportedFilter])).toEqual('');
    });

    test('isBlankFilter: simple operator, no filter value', () => {
        expect(getLabKeySqlWhere([isBlankFilter])).toEqual('WHERE "String Field" IS NULL');
        expect(getLabKeySqlWhere([anyValueFilter, isBlankFilter])).toEqual('WHERE "String Field" IS NULL');
    });

    test('eq filter', () => {
        expect(getLabKeySqlWhere([intEqFilter])).toEqual('WHERE "intField" = 1');
        expect(getLabKeySqlWhere([intEqFilter, anyValueFilter])).toEqual('WHERE "intField" = 1');
    });

    test('skipwhere', () => {
        expect(getLabKeySqlWhere([intEqFilter], true)).toEqual('"intField" = 1');
        expect(getLabKeySqlWhere([intEqFilter, anyValueFilter], true)).toEqual('"intField" = 1');
    });

    test('multiple filter types and field types filter', () => {
        expect(getLabKeySqlWhere([intEqFilter, booleanEqFilter])).toEqual(
            'WHERE "intField" = 1 AND "Boolean Field" = TRUE'
        );

        const expectedWhere =
            'WHERE "String Field" IS NULL AND "float Field" >= 1.234 AND "strField" BETWEEN \'1\' AND \'5\' AND "floatField2" BETWEEN 1 AND 5 AND ("String Field" IN (\'value1\', \'value2\', \'value3\')) AND ("FloatField" NOT IN (1.1, 2.2, 3.3) OR "FloatField" IS NULL) AND "Boolean Field" = TRUE AND ("Date Field" < \'2020-08-06\' OR "Date Field" >= \'2020-08-12\')';
        expect(
            getLabKeySqlWhere([
                isBlankFilter,
                floatGreaterEqFilter,
                stringBetweenFilter,
                floatBetweenFilter,
                stringInFilter,
                floatNotInFilter,
                booleanEqFilter,
                dateNeqFilter,
                dateNotBetweenFilter,
                notSupportedFilter,
            ])
        ).toEqual(expectedWhere);
    });
});

describe('getLabKeySql', () => {
    test('empty', () => {
        expect(getLabKeySql('RowId', 'schema', 'query', [])).toEqual('SELECT "RowId" FROM "schema"."query" ');
    });

    test('has any value', () => {
        expect(getLabKeySql('RowId', 'schema', 'query', [anyValueFilter])).toEqual(
            'SELECT "RowId" FROM "schema"."query" '
        );
    });

    test('unsupported filters', () => {
        expect(getLabKeySql('RowId', 'schema', 'query', [notSupportedFilter])).toEqual(
            'SELECT "RowId" FROM "schema"."query" '
        );
    });

    test('schema name and query name with quote', () => {
        expect(getLabKeySql('RowId', 'schema"assay', 'query"b', [isBlankFilter])).toEqual(
            'SELECT "RowId" FROM "schema""assay"."query""b" WHERE "String Field" IS NULL'
        );
        expect(getLabKeySql('RowId', "schema'assay", "query'b", [anyValueFilter, isBlankFilter])).toEqual(
            'SELECT "RowId" FROM "schema\'assay"."query\'b" WHERE "String Field" IS NULL'
        );
    });
});

const schemaQuery = SchemaQuery.create('Test', 'SampleA');
const schemaQueryWithSpace = SchemaQuery.create('Test', 'Sample Type A');

describe('getExpDescendantOfSelectClause', () => {
    test('empty', () => {
        expect(getExpDescendantOfSelectClause(schemaQuery, [])).toBeNull();
        expect(getExpDescendantOfSelectClause(schemaQueryWithSpace, [])).toBeNull();
    });

    test('has any value', () => {
        expect(getExpDescendantOfSelectClause(schemaQuery, [anyValueFilter])).toBeNull();
    });

    test('unsupported filters', () => {
        expect(getExpDescendantOfSelectClause(schemaQuery, [notSupportedFilter])).toBeNull();
    });

    test('has any value and unsupported filters', () => {
        expect(getExpDescendantOfSelectClause(schemaQuery, [anyValueFilter, notSupportedFilter])).toBeNull();
    });

    test('isBlankFilter: simple operator, no filter value', () => {
        expect(getExpDescendantOfSelectClause(schemaQuery, [isBlankFilter])).toEqual(
            'SELECT "SampleA".expObject() FROM Test."SampleA" WHERE "String Field" IS NULL'
        );
    });

    test('eq filter', () => {
        expect(getExpDescendantOfSelectClause(schemaQueryWithSpace, [intEqFilter])).toEqual(
            'SELECT "Sample Type A".expObject() FROM Test."Sample Type A" WHERE "intField" = 1'
        );
    });

    test('multiple filter types and field types filter', () => {
        expect(getExpDescendantOfSelectClause(schemaQuery, [intEqFilter, booleanEqFilter])).toEqual(
            'SELECT "SampleA".expObject() FROM Test."SampleA" WHERE "intField" = 1 AND "Boolean Field" = TRUE'
        );
        expect(getExpDescendantOfSelectClause(schemaQueryWithSpace, [intEqFilter, booleanEqFilter])).toEqual(
            'SELECT "Sample Type A".expObject() FROM Test."Sample Type A" WHERE "intField" = 1 AND "Boolean Field" = TRUE'
        );
    });

    test('respects container filter', () => {
        const cf = Query.ContainerFilter.currentAndSubfoldersPlusShared;
        expect(getExpDescendantOfSelectClause(schemaQuery, [intEqFilter], cf)).toEqual(
            'SELECT "SampleA".expObject() FROM Test."SampleA"[ContainerFilter=\'CurrentAndSubfoldersPlusShared\'] WHERE "intField" = 1'
        );
    });
});

describe('getSampleFinderColumnNames', () => {
    test('no cards', () => {
        expect(getSampleFinderColumnNames(undefined)).toStrictEqual({});
    });

    test('empty cards', () => {
        expect(getSampleFinderColumnNames([])).toStrictEqual({});
    });

    test('cards without dataTypeDisplayName', () => {
        expect(
            getSampleFinderColumnNames([
                {
                    entityDataType: SampleTypeDataType,
                    schemaQuery: SchemaQuery.create('test', 'query'),
                    filterArray: [
                        {
                            fieldKey: 'IntValue',
                            fieldCaption: 'Integer',
                            filter: Filter.create('IntValue', 3, Filter.Types.GT),
                            jsonType: 'int',
                        },
                    ],
                },
            ])
        ).toStrictEqual({});
    });

    test('cards without filters', () => {
        expect(
            getSampleFinderColumnNames([
                {
                    entityDataType: SampleTypeDataType,
                    schemaQuery: SchemaQuery.create('test', 'query'),
                    dataTypeDisplayName: 'Test Samples',
                    filterArray: [],
                },
            ])
        ).toStrictEqual({
            'Inputs/Materials/query': 'Test Samples ID',
            'Ancestors/Samples/query': 'Test Samples ID',
        });
    });

    test('cards with filters', () => {
        expect(
            getSampleFinderColumnNames([
                {
                    entityDataType: SampleTypeDataType,
                    schemaQuery: SchemaQuery.create('test', 'query'),
                    dataTypeDisplayName: 'Test Samples',
                    filterArray: [
                        {
                            fieldKey: 'IntValue',
                            fieldCaption: 'Integer',
                            filter: Filter.create('IntValue', 3, Filter.Types.GT),
                            jsonType: 'int',
                        },
                    ],
                },
            ])
        ).toStrictEqual({
            'Inputs/Materials/query': 'Test Samples ID',
            'Inputs/Materials/query/IntValue': 'Test Samples Integer',
            'Ancestors/Samples/query': 'Test Samples ID',
            'Ancestors/Samples/query/IntValue': 'Test Samples Integer',
        });
    });

    test('assay cards with filters', () => {
        expect(
            getSampleFinderColumnNames([
                {
                    entityDataType: AssayResultDataType,
                    schemaQuery: SchemaQuery.create('test', 'query'),
                    dataTypeDisplayName: 'Test Assays',
                    filterArray: [
                        {
                            fieldKey: 'IntValue',
                            fieldCaption: 'Integer',
                            filter: Filter.create('IntValue', 3, Filter.Types.GT),
                            jsonType: 'int',
                        },
                    ],
                },
            ])
        ).toStrictEqual({});
    });
});

describe('isValidFilterField', () => {
    test('lookup field', () => {
        const field = QueryColumn.create({ name: 'test', lookup: { isPublic: true } });
        const queryInfo = QueryInfo.create({
            schemaName: 'test',
            name: 'query',
            supportGroupConcatSubSelect: true,
        });
        expect(isValidFilterField(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(true);
        expect(isValidFilterFieldExcludeLookups(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(
            false
        );
        expect(isValidFilterFieldSampleFinder(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(
            true
        );
    });

    test('mult-value lookup field', () => {
        const field = QueryColumn.create({ name: 'test', lookup: { isPublic: true }, multiValue: true });
        const queryInfo = QueryInfo.create({
            schemaName: 'test',
            name: 'query',
            supportGroupConcatSubSelect: true,
        });
        expect(isValidFilterField(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(true);
        expect(isValidFilterFieldExcludeLookups(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(
            false
        );
        expect(isValidFilterFieldSampleFinder(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(
            false
        );
    });

    test('mult-value lookup field and not supportGroupConcatSubSelect', () => {
        const field = QueryColumn.create({ name: 'test', lookup: { isPublic: true }, multiValue: true });
        const queryInfo = QueryInfo.create({
            schemaName: 'test',
            name: 'query',
            supportGroupConcatSubSelect: false,
        });
        expect(isValidFilterField(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(true);
        expect(isValidFilterFieldExcludeLookups(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(
            false
        );
        expect(isValidFilterFieldSampleFinder(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(
            false
        );
    });

    test('Units field', () => {
        const field = QueryColumn.create({ name: 'Units', fieldKey: 'Units' });
        const queryInfo = QueryInfo.create({
            schemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
            name: 'test',
            supportGroupConcatSubSelect: true,
        });
        expect(isValidFilterField(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(false);
        expect(isValidFilterFieldExcludeLookups(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(
            false
        );
        expect(isValidFilterFieldSampleFinder(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(
            false
        );
    });

    test('group concat field not supported', () => {
        const field = QueryColumn.create({ name: 'StorageStatus', fieldKey: 'StorageStatus' });
        const queryInfo = QueryInfo.create({
            schemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
            name: 'test',
            supportGroupConcatSubSelect: false,
        });
        expect(isValidFilterField(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(false);
        expect(isValidFilterFieldExcludeLookups(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(
            false
        );
        expect(isValidFilterFieldSampleFinder(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(
            false
        );
    });

    test('group concat field not supported, regular field', () => {
        const field = QueryColumn.create({ name: 'RowId', fieldKey: 'RowId' });
        const queryInfo = QueryInfo.create({
            schemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
            name: 'test',
            supportGroupConcatSubSelect: false,
        });
        expect(isValidFilterField(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(true);
        expect(isValidFilterFieldExcludeLookups(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(
            true
        );
        expect(isValidFilterFieldSampleFinder(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(
            true
        );
    });

    test('group concat field not supported, no group concat fields', () => {
        const field = QueryColumn.create({ name: 'RowId', fieldKey: 'RowId' });
        const queryInfo = QueryInfo.create({
            schemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
            name: 'test',
            supportGroupConcatSubSelect: false,
        });
        expect(isValidFilterField(field, queryInfo, undefined)).toBe(true);
        expect(isValidFilterFieldExcludeLookups(field, queryInfo, undefined)).toBe(true);
        expect(isValidFilterFieldSampleFinder(field, queryInfo, undefined)).toBe(true);
    });

    test('group concat field is supported', () => {
        const field = QueryColumn.create({ name: 'StorageStatus', fieldKey: 'StorageStatus' });
        const queryInfo = QueryInfo.create({
            schemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
            name: 'test',
            supportGroupConcatSubSelect: true,
        });
        expect(isValidFilterField(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(true);
        expect(isValidFilterFieldExcludeLookups(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(
            true
        );
        expect(isValidFilterFieldSampleFinder(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(
            true
        );
    });

    test('regular field', () => {
        const field = QueryColumn.create({ name: 'Regular', fieldKey: 'Regular' });
        const queryInfo = QueryInfo.create({
            schemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
            name: 'test',
            supportGroupConcatSubSelect: false,
        });
        expect(isValidFilterField(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(true);
        expect(isValidFilterFieldExcludeLookups(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(
            true
        );
        expect(isValidFilterFieldSampleFinder(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(
            true
        );
    });
});

const PARENT_WITH_FILTERS = 'parent_with_filters';
const PARENT_WITHOUT_FILTERS = 'parent_without_filters';
const DATA_TYPE_FILTERS = {
    [PARENT_WITH_FILTERS]: [stringEqualFilter, stringBetweenFilter, intEqFilter],
    [PARENT_WITHOUT_FILTERS]: [],
};

describe('getUpdatedDataTypeFilters', () => {
    test('separate field, no new filters', () => {
        const updatedFilters = getUpdatedDataTypeFilters(
            DATA_TYPE_FILTERS,
            PARENT_WITH_FILTERS,
            QueryColumn.create({
                caption: floatBetweenFilter.fieldCaption,
                fieldKey: floatBetweenFilter.fieldKey,
            }),
            undefined
        );
        expect(updatedFilters).toStrictEqual(DATA_TYPE_FILTERS);
    });

    test('remove all filters with undefined', () => {
        const updatedFilters = getUpdatedDataTypeFilters(
            DATA_TYPE_FILTERS,
            PARENT_WITH_FILTERS,
            QueryColumn.create({
                name: stringEqualFilter.fieldKey,
                caption: stringEqualFilter.fieldCaption,
                fieldKey: stringEqualFilter.fieldKey,
            }),
            undefined
        );
        expect(updatedFilters).toStrictEqual({
            [PARENT_WITH_FILTERS]: [intEqFilter],
            [PARENT_WITHOUT_FILTERS]: [],
        });
    });

    test('remove all filters with empty array', () => {
        const updatedFilters = getUpdatedDataTypeFilters(
            DATA_TYPE_FILTERS,
            PARENT_WITH_FILTERS,
            QueryColumn.create({
                name: stringEqualFilter.fieldKey,
                caption: stringEqualFilter.fieldCaption,
                fieldKey: stringEqualFilter.fieldKey,
            }),
            []
        );
        expect(updatedFilters).toStrictEqual({
            [PARENT_WITH_FILTERS]: [intEqFilter],
            [PARENT_WITHOUT_FILTERS]: [],
        });
    });

    test('remove all filters with null filter in array', () => {
        const updatedFilters = getUpdatedDataTypeFilters(
            DATA_TYPE_FILTERS,
            PARENT_WITH_FILTERS,
            QueryColumn.create({
                name: stringEqualFilter.fieldKey,
                caption: stringEqualFilter.fieldCaption,
                fieldKey: stringEqualFilter.fieldKey,
            }),
            [null]
        );
        expect(updatedFilters).toStrictEqual({
            [PARENT_WITH_FILTERS]: [intEqFilter],
            [PARENT_WITHOUT_FILTERS]: [],
        });
    });

    test('update one filter', () => {
        const updatedFilters = getUpdatedDataTypeFilters(
            DATA_TYPE_FILTERS,
            PARENT_WITH_FILTERS,
            QueryColumn.create({
                name: stringEqualFilter.fieldKey,
                caption: stringEqualFilter.fieldCaption,
                fieldKey: stringEqualFilter.fieldKey,
            }),
            [stringEqualFilter.filter, emptyStringBetweenFilter.filter]
        );
        expect(updatedFilters).toStrictEqual({
            [PARENT_WITH_FILTERS]: [intEqFilter, stringEqualFilter, emptyStringBetweenFilter],
            [PARENT_WITHOUT_FILTERS]: [],
        });
    });

    test('add filter where there were none', () => {
        const updatedFilters = getUpdatedDataTypeFilters(
            DATA_TYPE_FILTERS,
            PARENT_WITHOUT_FILTERS,
            QueryColumn.create({
                name: stringEqualFilter.fieldKey,
                caption: stringEqualFilter.fieldCaption,
                fieldKey: stringEqualFilter.fieldKey,
            }),
            [stringEqualFilter.filter, emptyStringBetweenFilter.filter]
        );
        expect(updatedFilters).toStrictEqual({
            [PARENT_WITH_FILTERS]: [stringEqualFilter, stringBetweenFilter, intEqFilter],
            [PARENT_WITHOUT_FILTERS]: [stringEqualFilter, emptyStringBetweenFilter],
        });
    });
});

const ASSAY_RESULT_FILTERS = {
    [assay1]: [stringEqualFilter, stringBetweenFilter, intEqFilter],
};

const ASSAY_NO_DATA_FILTERS = {
    [assay1]: [AssayNotInFilterField],
};

describe('getDataTypeFiltersWithNotInQueryUpdate', () => {
    test('has no assay filters, check no data in filter', () => {
        const updatedFilters = getDataTypeFiltersWithNotInQueryUpdate(
            {},
            assay1SchemaQuery,
            assay1,
            'RowId',
            'strField',
            true
        );
        expect(updatedFilters).toStrictEqual(ASSAY_NO_DATA_FILTERS);
    });

    test('has existing assay filters, check no data in filter', () => {
        const updatedFilters = getDataTypeFiltersWithNotInQueryUpdate(
            ASSAY_RESULT_FILTERS,
            assay1SchemaQuery,
            assay1,
            'RowId',
            'strField',
            true
        );
        expect(updatedFilters).toStrictEqual(ASSAY_NO_DATA_FILTERS);
    });

    test('uncheck no data in filter', () => {
        const updatedFilters = getDataTypeFiltersWithNotInQueryUpdate(
            ASSAY_NO_DATA_FILTERS,
            assay1SchemaQuery,
            assay1,
            'RowId',
            'strField',
            false
        );
        expect(updatedFilters).toStrictEqual({});
    });
});

const equalFilterOption = {
    value: Filter.Types.EQUAL.getURLSuffix(),
    label: 'Equal',
    valueRequired: true,
    multiValue: false,
    betweenOperator: false,
    isSoleFilter: false,
};

const lessThanFilterOption = {
    value: Filter.Types.LT.getURLSuffix(),
    label: 'Less Than',
    valueRequired: true,
    multiValue: false,
    betweenOperator: false,
    isSoleFilter: false,
};

const betweenFilterOption = {
    value: Filter.Types.BETWEEN.getURLSuffix(),
    label: 'Between',
    valueRequired: true,
    multiValue: false,
    betweenOperator: true,
    isSoleFilter: false,
};

const notBetweenFilterOption = {
    value: Filter.Types.NOT_BETWEEN.getURLSuffix(),
    label: 'Not Between',
    valueRequired: true,
    multiValue: false,
    betweenOperator: true,
    isSoleFilter: false,
};

const oneOfOption = {
    value: Filter.Types.IN.getURLSuffix(),
    label: 'Is One Of',
    valueRequired: true,
    multiValue: true,
    betweenOperator: false,
    isSoleFilter: false,
};

const isBlankFilterOption = {
    value: Filter.Types.ISBLANK.getURLSuffix(),
    label: 'Blank',
    valueRequired: false,
    multiValue: false,
    betweenOperator: false,
    isSoleFilter: true,
};

describe('getFilterSelections', () => {
    test('no filters', () => {
        const filterSelections = getFilterSelections(undefined, undefined);
        expect(filterSelections).toStrictEqual([]);
    });

    test('no matching filter option', () => {
        const filterSelections = getFilterSelections(
            [Filter.create('strField', 'test')],
            [
                {
                    value: 'none-such',
                    label: 'Not Valid',
                    valueRequired: true,
                    multiValue: true,
                    betweenOperator: false,
                    isSoleFilter: false,
                },
            ]
        );
        expect(filterSelections).toStrictEqual([]);
    });

    test('single filter, single value', () => {
        const filterSelections = getFilterSelections(
            [Filter.create('strField', 'test')],
            [equalFilterOption, betweenFilterOption]
        );
        expect(filterSelections).toStrictEqual([
            {
                filterType: equalFilterOption,
                firstFilterValue: 'test',
            },
        ]);
    });

    test('single filter, multiple values', () => {
        const filterSelections = getFilterSelections(
            [Filter.create('strField', ['test', 'zebra'], Filter.Types.IN)],
            [equalFilterOption, betweenFilterOption, oneOfOption]
        );
        expect(filterSelections).toStrictEqual([
            {
                filterType: oneOfOption,
                firstFilterValue: 'test;zebra',
            },
        ]);
    });

    test('single filter, between values', () => {
        const filterSelections = getFilterSelections(
            [Filter.create('strField', ['test', 'zebra'], Filter.Types.BETWEEN)],
            [equalFilterOption, betweenFilterOption, oneOfOption]
        );
        expect(filterSelections).toStrictEqual([
            {
                filterType: betweenFilterOption,
                firstFilterValue: 'test',
                secondFilterValue: 'zebra',
            },
        ]);
    });

    test('multiple filters', () => {
        const filterSelections = getFilterSelections(
            [
                Filter.create('strField', ['test', 'zebra'], Filter.Types.BETWEEN),
                Filter.create('strField', ['unicorn', 'walrus'], Filter.Types.IN),
            ],
            [equalFilterOption, betweenFilterOption, oneOfOption]
        );
        expect(filterSelections).toStrictEqual([
            {
                filterType: betweenFilterOption,
                firstFilterValue: 'test',
                secondFilterValue: 'zebra',
            },
            {
                filterType: oneOfOption,
                firstFilterValue: 'unicorn;walrus',
            },
        ]);
    });
});

describe('getUpdatedFilters', () => {
    const field = QueryColumn.create({
        name: stringEqualFilter.fieldKey,
        caption: stringEqualFilter.fieldCaption,
        fieldKey: stringEqualFilter.fieldKey,
    });

    test('no new filter, one existing filter', () => {
        const updatedFilters = getUpdatedFilters(
            field,
            [
                {
                    filterType: equalFilterOption,
                    firstFilterValue: stringEqualFilter.filter.getValue(),
                },
            ],
            0,
            undefined
        );
        expect(updatedFilters).toStrictEqual([]);
    });

    test('no new filter, two existing filters', () => {
        const updatedFilters = getUpdatedFilters(
            field,
            [
                {
                    filterType: equalFilterOption,
                    firstFilterValue: stringEqualFilter.filter.getValue(),
                },
                {
                    filterType: lessThanFilterOption,
                    firstFilterValue: emptyStringLessThanFilter.filter.getValue(),
                },
            ],
            0,
            undefined
        );
        expect(updatedFilters).toStrictEqual([emptyStringLessThanFilter.filter]);
    });

    test('new filter is sole filter, with two original', () => {
        const updatedFilters = getUpdatedFilters(
            field,
            [
                {
                    filterType: equalFilterOption,
                    firstFilterValue: stringEqualFilter.filter.getValue(),
                },
                {
                    filterType: lessThanFilterOption,
                    firstFilterValue: emptyStringLessThanFilter.filter.getValue(),
                },
            ],
            0,
            isBlankFilterOption
        );
        expect(updatedFilters).toHaveLength(1);
        expect(updatedFilters[0].getFilterType().getURLSuffix()).toBe(Filter.Types.ISBLANK.getURLSuffix());
        expect(updatedFilters[0].getValue()).toBe(null);
    });

    test('new filter is sole filter, with one original', () => {
        const updatedFilters = getUpdatedFilters(
            field,
            [
                {
                    filterType: equalFilterOption,
                    firstFilterValue: stringEqualFilter.filter.getValue(),
                },
            ],
            0,
            isBlankFilterOption
        );
        expect(updatedFilters).toHaveLength(1);
        expect(updatedFilters[0].getFilterType().getURLSuffix()).toBe(Filter.Types.ISBLANK.getURLSuffix());
        expect(updatedFilters[0].getValue()).toBe(null);
    });

    test('new filter not sole filter, two existing, update first', () => {
        const updatedFilters = getUpdatedFilters(
            field,
            [
                {
                    filterType: equalFilterOption,
                    firstFilterValue: stringEqualFilter.filter.getValue(),
                },
                {
                    filterType: lessThanFilterOption,
                    firstFilterValue: emptyStringLessThanFilter.filter.getValue(),
                },
            ],
            0,
            lessThanFilterOption,
            '5'
        );
        expect(updatedFilters).toHaveLength(2);
        expect(updatedFilters[0].getFilterType().getURLSuffix()).toBe(Filter.Types.LT.getURLSuffix());
        expect(updatedFilters[0].getValue()).toBe('5');
        expect(updatedFilters[1].getFilterType().getURLSuffix()).toBe(Filter.Types.LT.getURLSuffix());
        expect(updatedFilters[1].getValue()).toBe(emptyStringLessThanFilter.filter.getValue());
    });

    test('new filter not sole filter, two existing, update second', () => {
        const updatedFilters = getUpdatedFilters(
            field,
            [
                {
                    filterType: equalFilterOption,
                    firstFilterValue: stringEqualFilter.filter.getValue(),
                },
                {
                    filterType: lessThanFilterOption,
                    firstFilterValue: emptyStringLessThanFilter.filter.getValue(),
                },
            ],
            1,
            lessThanFilterOption,
            '5'
        );
        expect(updatedFilters).toHaveLength(2);
        expect(updatedFilters[0].getFilterType().getURLSuffix()).toBe(Filter.Types.EQUAL.getURLSuffix());
        expect(updatedFilters[0].getValue()).toBe(stringEqualFilter.filter.getValue());
        expect(updatedFilters[1].getFilterType().getURLSuffix()).toBe(Filter.Types.LT.getURLSuffix());
        expect(updatedFilters[1].getValue()).toBe('5');
    });

    test('new filter not sole filter, only one existing', () => {
        const updatedFilters = getUpdatedFilters(
            field,
            [
                {
                    filterType: equalFilterOption,
                    firstFilterValue: stringEqualFilter.filter.getValue(),
                },
            ],
            0,
            lessThanFilterOption,
            '5'
        );
        expect(updatedFilters).toHaveLength(1);
        expect(updatedFilters[0].getFilterType().getURLSuffix()).toBe(Filter.Types.LT.getURLSuffix());
        expect(updatedFilters[0].getValue()).toBe('5');
    });
});

describe('getUpdatedFilterSelection', () => {
    test('new value not required', () => {
        const { shouldClear, filterSelection } = getUpdatedFilterSelection(isBlankFilterOption, {
            filterType: equalFilterOption,
            firstFilterValue: 'x',
        });
        expect(shouldClear).toBe(true);
        expect(filterSelection).toStrictEqual({
            filterType: isBlankFilterOption,
            firstFilterValue: null,
            secondFilterValue: undefined,
        });
    });

    test('new value is required, old not required', () => {
        const { shouldClear, filterSelection } = getUpdatedFilterSelection(equalFilterOption, {
            filterType: isBlankFilterOption,
            firstFilterValue: null,
        });
        expect(shouldClear).toBe(true);
        expect(filterSelection).toStrictEqual({
            filterType: equalFilterOption,
            firstFilterValue: undefined,
            secondFilterValue: undefined,
        });
    });

    test('new value is required, old value required', () => {
        const { shouldClear, filterSelection } = getUpdatedFilterSelection(equalFilterOption, {
            filterType: lessThanFilterOption,
            firstFilterValue: 'test',
        });
        expect(shouldClear).toBe(false);
        expect(filterSelection).toStrictEqual({
            filterType: equalFilterOption,
            firstFilterValue: 'test',
            secondFilterValue: undefined,
        });
    });

    test('new value not multivalued, old is', () => {
        const { shouldClear, filterSelection } = getUpdatedFilterSelection(equalFilterOption, {
            filterType: oneOfOption,
            firstFilterValue: 'test;one;two;three',
        });
        expect(shouldClear).toBe(true);
        expect(filterSelection).toStrictEqual({
            filterType: equalFilterOption,
            firstFilterValue: undefined,
            secondFilterValue: undefined,
        });
    });

    test('both are between operators', () => {
        const { shouldClear, filterSelection } = getUpdatedFilterSelection(notBetweenFilterOption, {
            filterType: betweenFilterOption,
            firstFilterValue: 'test',
            secondFilterValue: 'unicorn',
        });
        expect(shouldClear).toBe(false);
        expect(filterSelection).toStrictEqual({
            filterType: notBetweenFilterOption,
            firstFilterValue: 'test',
            secondFilterValue: 'unicorn',
        });
    });

    test('new not between, old is', () => {
        const { shouldClear, filterSelection } = getUpdatedFilterSelection(equalFilterOption, {
            filterType: betweenFilterOption,
            firstFilterValue: 'test',
            secondFilterValue: 'unicorn',
        });
        expect(shouldClear).toBe(false);
        expect(filterSelection).toStrictEqual({
            filterType: equalFilterOption,
            firstFilterValue: 'test',
            secondFilterValue: 'unicorn',
        });
    });

    test("new is between, old isn't", () => {
        const { shouldClear, filterSelection } = getUpdatedFilterSelection(betweenFilterOption, {
            filterType: equalFilterOption,
            firstFilterValue: 'test',
        });
        expect(shouldClear).toBe(false);
        expect(filterSelection).toStrictEqual({
            filterType: betweenFilterOption,
            firstFilterValue: 'test',
            secondFilterValue: undefined,
        });
    });
});
