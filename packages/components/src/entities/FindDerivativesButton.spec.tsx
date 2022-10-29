import React from 'react';
import { ReactWrapper } from 'enzyme';

import { Filter } from '@labkey/api';

import { fromJS } from 'immutable';

import { DataClassDataType, SampleTypeDataType } from '../internal/components/entities/constants';
import { makeTestQueryModel } from '../public/QueryModel/testUtils';
import { SchemaQuery } from '../public/SchemaQuery';
import { mountWithAppServerContext } from '../internal/testHelpers';
import { QueryInfo } from '../public/QueryInfo';
import { ViewInfo } from '../internal/ViewInfo';

import { DisableableMenuItem } from '../internal/components/samples/DisableableMenuItem';

import { FindDerivativesMenuItem, getFieldFilter, getSessionSearchFilterProps } from './FindDerivativesButton';

const VIEW_NAME = 'TEST_VIEW';
const VIEW = ViewInfo.create({
    name: VIEW_NAME,
    filter: [{ fieldKey: 'c', value: 'testing' }],
});
const QUERY_INFO = QueryInfo.fromJSON({
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
const MODEL = makeTestQueryModel(SchemaQuery.create('samples', 'query', VIEW_NAME), QUERY_INFO).mutate({
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
        expect(wrapper.find(DisableableMenuItem).prop('operationPermitted')).toBe(true);
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
        expect(wrapper.find(DisableableMenuItem).prop('operationPermitted')).toBe(false);
        expect(wrapper.find(DisableableMenuItem).prop('disabledMessage')).toContain(' (Search Filter)');
        wrapper.unmount();
    });

    test('invalidFilterNames from MVFK, disabled button', () => {
        const model2 = MODEL.mutate({
            filterArray: [Filter.create('e', null, Filter.Types.ISBLANK)],
        });
        const wrapper = mountWithAppServerContext(<FindDerivativesMenuItem {...DEFAULT_PROPS} model={model2} />);
        expect(wrapper.find(DisableableMenuItem)).toHaveLength(1);
        expect(wrapper.find(DisableableMenuItem).prop('operationPermitted')).toBe(false);
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
            schemaQuery: SchemaQuery.create('samples', 'query2'),
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
            schemaQuery: SchemaQuery.create('exp.data', 'query3'),
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
