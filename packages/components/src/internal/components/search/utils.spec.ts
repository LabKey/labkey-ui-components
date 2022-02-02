import { Filter } from '@labkey/api';

import { fromJS, List, Map } from 'immutable';

import { TEST_USER_EDITOR, TEST_USER_GUEST } from '../../../test/data/users';
import { FREEZER_MANAGER_APP_PROPERTIES } from '../../app/constants';
import { QueryInfo } from '../../../public/QueryInfo';
import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SAMPLE_STATUS_REQUIRED_COLUMNS } from '../samples/constants';
import { TestTypeDataType } from '../../../test/data/constants';
import { QueryColumn } from '../../../public/QueryColumn';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { SCHEMAS } from '../../schemas';

import {
    getFieldFiltersValidationResult,
    getFilterValuesAsArray,
    getFinderStartText,
    getFinderViewColumnsConfig,
    getSampleFinderCommonConfigs,
    getSampleFinderQueryConfigs, getUpdateFilterExpressionFilter,
    SAMPLE_FINDER_VIEW_NAME,
    searchFiltersFromJson,
    searchFiltersToJson,
} from './utils';
import {TEXT_TYPE} from "../domainproperties/PropDescType";

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
        const cardFilter = {
            fieldKey: 'TestColumn',
            fieldCaption: 'TestColumn',
            filter: Filter.create('TestColumn', 'value'),
        };

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
                Filter.create('QueryableInputs/Materials/TestQuery2/TestColumn', 'value'),
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
                baseFilters: [Filter.create('QueryableInputs/Materials/TestQuery/Name', null, Filter.Types.NONBLANK)],
                requiredColumns: [...SAMPLE_STATUS_REQUIRED_COLUMNS, 'QueryableInputs/Materials/TestQuery'],
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
                baseFilters: [Filter.create('QueryableInputs/Materials/TestQuery/Name', null, Filter.Types.NONBLANK)],
                requiredColumns: [...SAMPLE_STATUS_REQUIRED_COLUMNS, 'QueryableInputs/Materials/TestQuery'],
            },
            'uuid-1-testId|samples/Sample Type 1': {
                id: 'uuid-1-testId|samples/Sample Type 1',
                title: 'Sample Type 1',
                schemaQuery: SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, 'Sample Type 1', SAMPLE_FINDER_VIEW_NAME),
                omittedColumns: ['checkedOutBy'],
                baseFilters: [Filter.create('QueryableInputs/Materials/TestQuery/Name', null, Filter.Types.NONBLANK)],
                requiredColumns: [...SAMPLE_STATUS_REQUIRED_COLUMNS, 'QueryableInputs/Materials/TestQuery'],
            },
            'uuid-1-testId|samples/Sample Type 2': {
                id: 'uuid-1-testId|samples/Sample Type 2',
                title: 'Sample Type 2',
                schemaQuery: SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, 'Sample Type 2', SAMPLE_FINDER_VIEW_NAME),
                omittedColumns: ['checkedOutBy'],
                baseFilters: [Filter.create('QueryableInputs/Materials/TestQuery/Name', null, Filter.Types.NONBLANK)],
                requiredColumns: [...SAMPLE_STATUS_REQUIRED_COLUMNS, 'QueryableInputs/Materials/TestQuery'],
            },
        });
    });
});

const goodAnyValueFilter = {
    fieldKey: 'textField',
    fieldCaption: 'textField',
    filter: Filter.create('textField', null, Filter.Types.HAS_ANY_VALUE),
};

const goodIntFilter = {
    fieldKey: 'intField',
    fieldCaption: 'intField',
    filter: Filter.create('intField', 1),
};

const goodBetweenFilter = {
    fieldKey: 'strField',
    fieldCaption: 'strField',
    filter: Filter.create('strField', ['1', '5'], Filter.Types.BETWEEN),
};

const goodBetweenFilter2 = {
    fieldKey: 'floatField2',
    fieldCaption: 'floatField2',
    filter: Filter.create('floatField2', '1,5', Filter.Types.BETWEEN),
};

const badIntFilter = {
    fieldKey: 'intField',
    fieldCaption: 'intField',
    filter: Filter.create('intField', null),
};

const badBetweenFilter = {
    fieldKey: 'doubleField',
    fieldCaption: 'doubleField',
    filter: Filter.create('doubleField', '1', Filter.Types.BETWEEN),
};

const card = {
    entityDataType: TestTypeDataType,
    filterArray: [goodAnyValueFilter, goodBetweenFilter],
    schemaQuery: SchemaQuery.create('TestSchema', 'samples1'),
    index: 1,
};

const cardJSON =
    '{"filters":[{"entityDataType":{"typeListingSchemaQuery":{"schemaName":"TestListing","queryName":"query"},"listingSchemaQuery":{"schemaName":"Test","queryName":"query"},' +
    '"instanceSchemaName":"TestSchema","operationConfirmationActionName":"test-delete-confirmation.api","nounSingular":"test","nounPlural":"tests","nounAsParentSingular":"test Parent",' +
    '"nounAsParentPlural":"test Parents","typeNounSingular":"Test Type","descriptionSingular":"parent test type","descriptionPlural":"parent test types","uniqueFieldKey":"Name",' +
    '"dependencyText":"test data dependencies","deleteHelpLinkTopic":"viewSampleSets#delete","inputColumnName":"Inputs/Materials/First","inputTypeValueField":"lsid",' +
    '"insertColumnNamePrefix":"MaterialInputs/","editTypeAppUrlPrefix":"Test","importFileAction":"importSamples","filterCardHeaderClass":"filter-card__header-success"},' +
    '"filterArray":[{"fieldKey":"textField","fieldCaption":"textField","filter":"query.textField~="},{"fieldKey":"strField","fieldCaption":"strField",' +
    '"filter":"query.strField~between=1%2C5"}],"schemaQuery":{"schemaName":"TestSchema","queryName":"samples1"},"index":1}],"filterChangeCounter":5}';

describe('searchFiltersToJson', () => {
    test('searchFiltersToJson', () => {
        expect(searchFiltersToJson([card], 5)).toEqual(cardJSON);
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
        expect(textFilter).toStrictEqual(goodBetweenFilter.filter);
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
                sampleType1: [goodAnyValueFilter, goodBetweenFilter],
                sampleType2: [goodIntFilter, goodBetweenFilter2],
            })
        ).toBeNull();
    });

    test('missing value', () => {
        expect(
            getFieldFiltersValidationResult({
                sampleType1: [goodAnyValueFilter, badIntFilter],
                sampleType2: [goodIntFilter],
            })
        ).toEqual('Invalid/incomplete filter values. Please correct input for fields. sampleType1: intField. ');
    });

    test('missing between filter value', () => {
        expect(
            getFieldFiltersValidationResult({
                sampleType1: [goodAnyValueFilter, badIntFilter],
                sampleType2: [goodIntFilter, badIntFilter, badBetweenFilter],
            })
        ).toEqual(
            'Invalid/incomplete filter values. Please correct input for fields. sampleType1: intField. sampleType2: intField, doubleField. '
        );
    });
});


describe('getUpdateFilterExpressionFilter', () => {

    const fieldKey = 'StringField';
    const stringField = QueryColumn.create({ name: fieldKey, rangeURI: TEXT_TYPE.rangeURI, jsonType: 'string' })

    const anyOp = {
        betweenOperator: false,
        label: "Has Any Value",
        multiValue: false,
        value: "any",
        valueRequired: false
    }

    const equalOp = {
        betweenOperator: false,
        label: "Equals",
        multiValue: false,
        value: "eq",
        valueRequired: true
    }

    const betweenOp = {
        betweenOperator: true,
        label: "Between",
        multiValue: true,
        value: "between",
        valueRequired: true
    }

    const badOp = {
        betweenOperator: true,
        label: "NotSupported",
        multiValue: true,
        value: "NotSupported",
        valueRequired: true
    }

    test('remove filter type', () => {
        expect(getUpdateFilterExpressionFilter(null)).toBeNull();
    });

    test('invalid filter type', () => {
        expect(getUpdateFilterExpressionFilter(badOp, stringField)).toBeNull();
    });

    test('value not required', () => {
        expect(getUpdateFilterExpressionFilter(anyOp, stringField, 'abc'))
            .toStrictEqual(Filter.create(fieldKey, null, Filter.Types.HAS_ANY_VALUE));
    });

    test('remove filter value', () => {
        expect(getUpdateFilterExpressionFilter(equalOp, stringField, 'abc', null, null))
            .toStrictEqual(Filter.create(fieldKey, null, Filter.Types.EQ));
    });

    test('update filter value', () => {
        expect(getUpdateFilterExpressionFilter(equalOp, stringField, 'abc', null, 'def'))
            .toStrictEqual(Filter.create(fieldKey, 'def', Filter.Types.EQ));
    });

    test('update between filter first value', () => {
        expect(getUpdateFilterExpressionFilter(betweenOp, stringField, 'x', 'z', 'a'))
            .toStrictEqual(Filter.create(fieldKey, 'a,z', Filter.Types.BETWEEN));
    });

    test('update between filter second value', () => {
        expect(getUpdateFilterExpressionFilter(betweenOp, stringField, null, null, 'y', true))
            .toStrictEqual(Filter.create(fieldKey, 'y', Filter.Types.BETWEEN));
    });

    test('remove between filter second value', () => {
        expect(getUpdateFilterExpressionFilter(betweenOp, stringField, 'x', 'z', null, true))
            .toStrictEqual(Filter.create(fieldKey, 'x', Filter.Types.BETWEEN));
    });

    test('clear between filter values', () => {
        expect(getUpdateFilterExpressionFilter(betweenOp, stringField, 'x', 'z', null, null, true))
            .toStrictEqual(Filter.create(fieldKey, null, Filter.Types.BETWEEN));
    });

});
