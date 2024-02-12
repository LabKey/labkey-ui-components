import React from 'react';
import { fromJS } from 'immutable';
import { Filter } from '@labkey/api';

import { ViewInfo } from '../../ViewInfo';
import { QueryInfo } from '../../../public/QueryInfo';
import { QueryColumn } from '../../../public/QueryColumn';
import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { mountWithAppServerContext } from '../../test/enzymeTestHelpers';
import { DisableableMenuItem } from '../samples/DisableableMenuItem';

import { TestTypeDataType, TestTypeDataTypeWithEntityFilter } from '../../../test/data/constants';

import { FieldFilter } from '../search/models';

import { SCHEMAS } from '../../schemas';

import {
    FindDerivativesMenuItem,
    getFieldFilter,
    getSessionSearchFilterProps,
    searchFiltersToJson,
    isValidFilterFieldSampleFinder,
} from './FindDerivativesButton';
import { DataClassDataType, SampleTypeDataType } from './constants';

const VIEW_NAME = 'TEST_VIEW';
const VIEW = ViewInfo.fromJson({
    name: VIEW_NAME,
    filter: [{ fieldKey: 'c', value: 'testing', op: 'eq' }],
});
const QUERY_INFO = QueryInfo.fromJsonForTests({
    views: fromJS({ [VIEW_NAME.toLowerCase()]: VIEW }),
    columns: [
        {
            name: 'a',
            fieldKey: 'a',
            fieldKeyArray: ['a'],
            caption: 'FieldA',
            shortCaption: 'FieldA',
            jsonType: 'string',
        },
        {
            name: 'b',
            fieldKey: 'b',
            fieldKeyArray: ['b'],
            caption: 'FieldB',
            shortCaption: 'FieldB',
            jsonType: 'int',
        },
        {
            name: 'c',
            fieldKey: 'c',
            fieldKeyArray: ['c'],
            caption: undefined,
            shortCaption: '',
            jsonType: 'string',
        },
        {
            name: 'd',
            fieldKey: 'd',
            fieldKeyArray: ['d'],
            caption: 'FieldD',
            shortCaption: 'FieldD',
            jsonType: 'int',
            displayFieldJsonType: 'string',
            lookup: {
                // details not important here
            },
        },
        {
            name: 'e',
            fieldKey: 'e',
            fieldKeyArray: ['e'],
            caption: 'FieldE',
            shortCaption: 'FieldE',
            jsonType: 'int',
            multiValue: true,
            lookup: {
                // details not important here
            },
        },
    ],
});
const MODEL = makeTestQueryModel(new SchemaQuery('samples', 'query', VIEW_NAME), QUERY_INFO).mutate({
    baseFilters: [Filter.create('a', null, Filter.Types.ISBLANK)],
    filterArray: [Filter.create('b', null, Filter.Types.ISBLANK)],
});

describe('FindDerivativesButton', () => {
    const DEFAULT_PROPS = {
        entityDataType: SampleTypeDataType,
        model: MODEL,
    };

    test('default props', () => {
        const wrapper = mountWithAppServerContext(<FindDerivativesMenuItem {...DEFAULT_PROPS} asSubMenu />);
        expect(wrapper.find(DisableableMenuItem)).toHaveLength(1);
        expect(wrapper.find(DisableableMenuItem).prop('disabled')).toBe(false);
        expect(wrapper.find(DisableableMenuItem).prop('disabledMessage')).toContain(' ()');
        wrapper.unmount();
    });

    test('invalidFilterNames from search, disabled button', () => {
        const model2 = MODEL.mutate({
            filterArray: [
                Filter.create('b', null, Filter.Types.ISBLANK),
                Filter.create('*', 'test', Filter.Types.CONTIANS),
            ],
        });
        const wrapper = mountWithAppServerContext(<FindDerivativesMenuItem {...DEFAULT_PROPS} model={model2} />);
        expect(wrapper.find(DisableableMenuItem)).toHaveLength(1);
        expect(wrapper.find(DisableableMenuItem).prop('disabled')).toBe(true);
        expect(wrapper.find(DisableableMenuItem).prop('disabledMessage')).toContain(' (Search Filter)');
        wrapper.unmount();
    });

    test('invalidFilterNames from MVFK, disabled button', () => {
        const model2 = MODEL.mutate({
            filterArray: [Filter.create('e', null, Filter.Types.ISBLANK)],
        });
        const wrapper = mountWithAppServerContext(<FindDerivativesMenuItem {...DEFAULT_PROPS} model={model2} />);
        expect(wrapper.find(DisableableMenuItem)).toHaveLength(1);
        expect(wrapper.find(DisableableMenuItem).prop('disabled')).toBe(true);
        expect(wrapper.find(DisableableMenuItem).prop('disabledMessage')).toContain(' (FieldE)');
        wrapper.unmount();
    });
});

describe('getFieldFilter', () => {
    test('string field', () => {
        const ff = getFieldFilter(MODEL, Filter.create('a', 'val'));
        expect(ff.fieldKey).toBe('a');
        expect(ff.fieldCaption).toBe('FieldA');
        expect(ff.jsonType).toBe('string');
    });

    test('int field', () => {
        const ff = getFieldFilter(MODEL, Filter.create('b', '1'));
        expect(ff.fieldKey).toBe('b');
        expect(ff.fieldCaption).toBe('FieldB');
        expect(ff.jsonType).toBe('int');
    });

    test('without caption', () => {
        const ff = getFieldFilter(MODEL, Filter.create('c', 'val'));
        expect(ff.fieldKey).toBe('c');
        expect(ff.fieldCaption).toBe('c');
        expect(ff.jsonType).toBe('string');
    });

    test('lookup field', () => {
        const ff = getFieldFilter(MODEL, Filter.create('d', 'val'));
        expect(ff.fieldKey).toBe('d');
        expect(ff.fieldCaption).toBe('FieldD');
        expect(ff.jsonType).toBe('string');
    });
});

describe('getSessionSearchFilterProps', () => {
    test('no filters', () => {
        const props = getSessionSearchFilterProps(SampleTypeDataType, MODEL, []);
        expect(props).toHaveLength(1);
        expect(props[0].filterArray).toHaveLength(0);
        expect(props[0].dataTypeDisplayName).toBe('query');
        expect(props[0].entityDataType).toBe(SampleTypeDataType);
    });

    test('with model title', () => {
        const model2 = MODEL.mutate({ title: 'TestingTitle' });
        const props = getSessionSearchFilterProps(SampleTypeDataType, model2, []);
        expect(props).toHaveLength(1);
        expect(props[0].dataTypeDisplayName).toBe('TestingTitle');
    });

    test('with filters', () => {
        const props = getSessionSearchFilterProps(SampleTypeDataType, MODEL, [
            Filter.create('a', 'val1'),
            Filter.create('b', 'val2'),
        ]);
        expect(props).toHaveLength(1);
        expect(props[0].filterArray).toHaveLength(2);
    });

    test('baseFilter, without baseModel', () => {
        const props = getSessionSearchFilterProps(SampleTypeDataType, MODEL, [], undefined, undefined, [
            Filter.create('a', 'Something'),
        ]);
        expect(props).toHaveLength(1);
        expect(props[0].filterArray).toHaveLength(1);
    });

    test('baseFilter, with baseModel for sample type', () => {
        const baseModel = MODEL.mutate({
            schemaQuery: new SchemaQuery('samples', 'query2'),
        });
        const props = getSessionSearchFilterProps(SampleTypeDataType, MODEL, [], SampleTypeDataType, baseModel, [
            Filter.create('a', 'Something'),
        ]);
        expect(props).toHaveLength(2);
        expect(props[0].filterArray).toHaveLength(1);
        expect(props[0].dataTypeDisplayName).toBe('query2');
        expect(props[0].entityDataType).toBe(SampleTypeDataType);
        expect(props[1].filterArray).toHaveLength(0);
    });

    test('baseFilter, with baseModel for data class', () => {
        const baseModel = MODEL.mutate({
            schemaQuery: new SchemaQuery('exp.data', 'query3'),
        });
        const props = getSessionSearchFilterProps(SampleTypeDataType, MODEL, [], DataClassDataType, baseModel, [
            Filter.create('a', 'Something'),
        ]);
        expect(props).toHaveLength(2);
        expect(props[0].filterArray).toHaveLength(1);
        expect(props[0].dataTypeDisplayName).toBe('query3');
        expect(props[0].entityDataType).toBe(DataClassDataType);
        expect(props[1].filterArray).toHaveLength(0);
    });
});

const datePOSIX = 1596750283812; // Aug 6, 2020 14:44 America/Los_Angeles
const testDate = new Date(datePOSIX);

const anyValueFilter = {
    fieldKey: 'textField',
    fieldCaption: 'textField',
    filter: Filter.create('textField', null, Filter.Types.HAS_ANY_VALUE),
    jsonType: 'string',
} as FieldFilter;

const stringBetweenFilter = {
    fieldKey: 'strField',
    fieldCaption: 'strField',
    filter: Filter.create('strField', ['1', '5'], Filter.Types.BETWEEN),
    jsonType: 'string',
} as FieldFilter;

const card = {
    entityDataType: TestTypeDataType,
    filterArray: [anyValueFilter, stringBetweenFilter],
    schemaQuery: new SchemaQuery('TestSchema', 'samples1'),
    index: 1,
};

const cardWithEntityTypeFilter = {
    entityDataType: TestTypeDataTypeWithEntityFilter,
    filterArray: [anyValueFilter, stringBetweenFilter],
    schemaQuery: new SchemaQuery('TestSchema', 'samples1'),
    index: 1,
};

const cardJSON =
    '{"filters":[{"filterArray":[{"fieldKey":"textField","fieldCaption":"textField","filter":"query.textField~=","jsonType":"string"},{"fieldKey":"strField","fieldCaption":"strField","filter":"query.strField~between=1%2C5","jsonType":"string"}],"schemaQuery":{"schemaName":"TestSchema","queryName":"samples1"},"index":1,"sampleFinderCardType":"sampleparent"}],"filterChangeCounter":5,"filterTimestamp":"Searched 2020-08-06 14:44"}';

const cardWithEntityTypeFilterJSON = cardJSON;

describe('searchFiltersToJson', () => {
    test('searchFiltersToJson', () => {
        expect(searchFiltersToJson([card], 5, testDate, 'America/Los_Angeles')).toEqual(cardJSON);
        expect(searchFiltersToJson([cardWithEntityTypeFilter], 5, testDate, 'America/Los_Angeles')).toEqual(
            cardWithEntityTypeFilterJSON
        );
    });
});

describe('isValidFilterFieldSampleFinder', () => {
    test('lookup field', () => {
        const field = new QueryColumn({ name: 'test', lookup: { isPublic: true } });
        const queryInfo = QueryInfo.fromJsonForTests({
            schemaName: 'test',
            name: 'query',
            supportGroupConcatSubSelect: true,
        });
        expect(isValidFilterFieldSampleFinder(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(
            true
        );
    });

    test('mult-value lookup field', () => {
        const field = new QueryColumn({ name: 'test', lookup: { isPublic: true }, multiValue: true });
        const queryInfo = QueryInfo.fromJsonForTests({
            schemaName: 'test',
            name: 'query',
            supportGroupConcatSubSelect: true,
        });
        expect(isValidFilterFieldSampleFinder(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(
            false
        );
    });

    test('mult-value lookup field and not supportGroupConcatSubSelect', () => {
        const field = new QueryColumn({ name: 'test', lookup: { isPublic: true }, multiValue: true });
        const queryInfo = QueryInfo.fromJsonForTests({
            schemaName: 'test',
            name: 'query',
            supportGroupConcatSubSelect: false,
        });
        expect(isValidFilterFieldSampleFinder(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(
            false
        );
    });

    test('Units field', () => {
        const field = new QueryColumn({ name: 'Units', fieldKey: 'Units' });
        const queryInfo = QueryInfo.fromJsonForTests({
            schemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
            name: 'test',
            supportGroupConcatSubSelect: true,
        });
        expect(isValidFilterFieldSampleFinder(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(
            false
        );
    });

    test('group concat field not supported', () => {
        const field = new QueryColumn({ name: 'StorageStatus', fieldKey: 'StorageStatus' });
        const queryInfo = QueryInfo.fromJsonForTests({
            schemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
            name: 'test',
            supportGroupConcatSubSelect: false,
        });
        expect(isValidFilterFieldSampleFinder(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(
            false
        );
    });

    test('group concat field not supported, regular field', () => {
        const field = new QueryColumn({ name: 'RowId', fieldKey: 'RowId' });
        const queryInfo = QueryInfo.fromJsonForTests({
            schemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
            name: 'test',
            supportGroupConcatSubSelect: false,
        });
        expect(isValidFilterFieldSampleFinder(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(
            true
        );
    });

    test('group concat field not supported, no group concat fields', () => {
        const field = new QueryColumn({ name: 'RowId', fieldKey: 'RowId' });
        const queryInfo = QueryInfo.fromJsonForTests({
            schemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
            name: 'test',
            supportGroupConcatSubSelect: false,
        });
        expect(isValidFilterFieldSampleFinder(field, queryInfo, undefined)).toBe(true);
    });

    test('group concat field is supported', () => {
        const field = new QueryColumn({ name: 'StorageStatus', fieldKey: 'StorageStatus' });
        const queryInfo = QueryInfo.fromJsonForTests({
            schemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
            name: 'test',
            supportGroupConcatSubSelect: true,
        });
        expect(isValidFilterFieldSampleFinder(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(
            true
        );
    });

    test('regular field', () => {
        const field = new QueryColumn({ name: 'Regular', fieldKey: 'Regular' });
        const queryInfo = QueryInfo.fromJsonForTests({
            schemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
            name: 'test',
            supportGroupConcatSubSelect: false,
        });
        expect(isValidFilterFieldSampleFinder(field, queryInfo, SampleTypeDataType.exprColumnsWithSubSelect)).toBe(
            true
        );
    });
});
