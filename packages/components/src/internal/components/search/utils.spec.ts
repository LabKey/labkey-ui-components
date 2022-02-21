import { Filter } from '@labkey/api';

import { fromJS, List, Map } from 'immutable';

import { TEST_USER_EDITOR, TEST_USER_GUEST } from '../../../test/data/users';
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

import {
    ALL_VALUE_DISPLAY,
    EMPTY_VALUE_DISPLAY,
    getCheckedFilterValues,
    getFieldFiltersValidationResult,
    getFilterValuesAsArray,
    getFinderStartText,
    getFinderViewColumnsConfig,
    getSampleFinderCommonConfigs,
    getSampleFinderQueryConfigs,
    getUpdatedCheckedValues,
    getUpdatedChooseValuesFilter,
    getUpdateFilterExpressionFilter,
    SAMPLE_FINDER_VIEW_NAME,
    searchFiltersFromJson,
    searchFiltersToJson,
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

const cardWithEntityTypeFilter = {
    entityDataType: TestTypeDataTypeWithEntityFilter,
    filterArray: [goodAnyValueFilter, goodBetweenFilter],
    schemaQuery: SchemaQuery.create('TestSchema', 'samples1'),
    index: 1,
};

const cardWithEntityTypeFilterJSON =
    '{"filters":[{"entityDataType":{"typeListingSchemaQuery":{"schemaName":"TestListing","queryName":"query"},"listingSchemaQuery":{"schemaName":"Test","queryName":"query"},' +
    '"instanceSchemaName":"TestSchema","operationConfirmationActionName":"test-delete-confirmation.api",' +
    '"nounSingular":"test","nounPlural":"tests","nounAsParentSingular":"test Parent","nounAsParentPlural":"test Parents",' +
    '"typeNounSingular":"Test Type","descriptionSingular":"parent test type","descriptionPlural":"parent test types","uniqueFieldKey":"Name","dependencyText":"test data dependencies",' +
    '"deleteHelpLinkTopic":"viewSampleSets#delete","inputColumnName":"Inputs/Materials/First","inputTypeValueField":"lsid","insertColumnNamePrefix":"MaterialInputs/","editTypeAppUrlPrefix":"Test",' +
    '"importFileAction":"importSamples","filterCardHeaderClass":"filter-card__header-success","filterArray":["query.Category~eq=Source"]},"filterArray":[{"fieldKey":"textField",' +
    '"fieldCaption":"textField","filter":"query.textField~="},{"fieldKey":"strField","fieldCaption":"strField","filter":"query.strField~between=1%2C5"}],"schemaQuery":{"schemaName":"TestSchema",' +
    '"queryName":"samples1"},"index":1}],"filterChangeCounter":5}';

describe('searchFiltersToJson', () => {
    test('searchFiltersToJson', () => {
        expect(searchFiltersToJson([card], 5)).toEqual(cardJSON);
        expect(searchFiltersToJson([cardWithEntityTypeFilter], 5)).toEqual(cardWithEntityTypeFilterJSON);
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

    test('missing value, with query label', () => {
        expect(
            getFieldFiltersValidationResult(
                {
                    sampleType1: [goodAnyValueFilter, badIntFilter],
                    sampleType2: [goodIntFilter],
                },
                { sampleType1: 'Sample Type 1' }
            )
        ).toEqual('Invalid/incomplete filter values. Please correct input for fields. Sample Type 1: intField. ');
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
    const stringField = QueryColumn.create({ name: fieldKey, rangeURI: TEXT_TYPE.rangeURI, jsonType: 'string' });

    const anyOp = {
        betweenOperator: false,
        label: 'Has Any Value',
        multiValue: false,
        value: 'any',
        valueRequired: false,
    };

    const equalOp = {
        betweenOperator: false,
        label: 'Equals',
        multiValue: false,
        value: 'eq',
        valueRequired: true,
    };

    const betweenOp = {
        betweenOperator: true,
        label: 'Between',
        multiValue: true,
        value: 'between',
        valueRequired: true,
    };

    const badOp = {
        betweenOperator: true,
        label: 'NotSupported',
        multiValue: true,
        value: 'NotSupported',
        valueRequired: true,
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
        if (resultFilter == null) expect(resultFilter).toBeNull();

        expect(resultFilter.getFilterType().getURLSuffix()).toEqual(expectedFilterUrlSuffix);

        if (expectedFilterValue == null) expect(resultFilter.getValue()).toBeNull();
        else expect(resultFilter.getValue()).toEqual(expectedFilterValue);
    }

    test('check ALL, from eq one', () => {
        validate(getUpdatedChooseValuesFilter(distinctValues, fieldKey, ALL_VALUE_DISPLAY, true, checkedOne), '');
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
        validate(getUpdatedChooseValuesFilter(distinctValues, fieldKey, 'red', true, uncheckedOne), '');
    });
});
