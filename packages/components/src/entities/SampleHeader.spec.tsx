import React from 'react';

import { SchemaQuery } from '../public/SchemaQuery';
import { SCHEMAS } from '../internal/schemas';
import { makeTestQueryModel } from '../public/QueryModel/testUtils';
import { LoadingState } from '../public/LoadingState';
import { mountWithAppServerContext } from '../internal/testHelpers';
import { TEST_USER_AUTHOR, TEST_USER_READER } from '../internal/userFixtures';

import { SampleHeaderImpl } from './SampleHeader';
import { CreateSamplesSubMenu } from './CreateSamplesSubMenu';

describe('SampleHeader', () => {
    const SQ = new SchemaQuery(SCHEMAS.SAMPLE_SETS.SCHEMA, 'TestSampleType');

    const EMPTY_MODEL = makeTestQueryModel(SQ, undefined, {}, [], 0, 'empty-model').mutate({
        queryInfoLoadingState: LoadingState.LOADED,
        rowsLoadingState: LoadingState.LOADED,
    });

    const DATA_MODEL = makeTestQueryModel(
        SQ,
        undefined,
        {
            1: {
                RowId: { value: 123 },
                Name: { value: 'Sample A' },
                Description: { value: 'Sample A description here.' },
                SampleSet: { displayValue: 'TestSampleType' },
                'SampleSet/LabelColor': { value: '#000000' },
                queryInfo: {
                    name: 'TestSampleType',
                },
            },
        },
        [1],
        0,
        'data-model'
    ).mutate({ queryInfoLoadingState: LoadingState.LOADED, rowsLoadingState: LoadingState.LOADED });

    const PARTIAL_DATA_MODEL = makeTestQueryModel(
        SQ,
        undefined,
        {
            1: {
                RowId: { value: 123 },
                Name: { value: 'Sample A' },
                Description: { value: null },
                SampleSet: { displayValue: 'TestSampleType' },
                'SampleSet/LabelColor': { value: null },
                queryInfo: {
                    name: 'TestSampleType',
                },
            },
        },
        [1],
        0,
        'partial-data-model'
    ).mutate({ queryInfoLoadingState: LoadingState.LOADED, rowsLoadingState: LoadingState.LOADED });

    const DEFAULT_PROPS = {
        labelTemplate: undefined,
        printServiceUrl: undefined,
        canPrintLabels: undefined,
        onUpdate: jest.fn(),
        navigate: jest.fn(),
    };

    test('empty model as reader', () => {
        const wrapper = mountWithAppServerContext(
            <SampleHeaderImpl {...DEFAULT_PROPS} user={TEST_USER_READER} sampleModel={EMPTY_MODEL} />,
            {},
            { user: TEST_USER_READER }
        );

        expect(wrapper.find('.detail__header--name').text()).toBe('');
        expect(wrapper.find('.test-loc-detail-subtitle span')).toHaveLength(0);
        expect(wrapper.find('.color-icon__circle-small')).toHaveLength(0);
        expect(wrapper.find('.detail__header--desc')).toHaveLength(0);

        wrapper.unmount();
    });

    test('data model as reader', () => {
        const wrapper = mountWithAppServerContext(
            <SampleHeaderImpl
                {...DEFAULT_PROPS}
                user={TEST_USER_READER}
                sampleModel={DATA_MODEL}
                showDescription={true}
            />,
            {},
            { user: TEST_USER_READER }
        );

        expect(wrapper.find('.detail__header--name').text()).toBe('Sample A');
        expect(wrapper.find('.test-loc-detail-subtitle span').text()).toBe('TestSampleType');
        expect(wrapper.find('.color-icon__circle-small')).toHaveLength(1);
        expect(wrapper.find('.detail__header--desc')).toHaveLength(1);
        expect(wrapper.find('.detail__header--desc').text()).toBe('Sample A description here.');

        wrapper.unmount();
    });

    test('partial data model as reader', () => {
        const wrapper = mountWithAppServerContext(
            <SampleHeaderImpl {...DEFAULT_PROPS} user={TEST_USER_READER} sampleModel={PARTIAL_DATA_MODEL} />,
            {},
            { user: TEST_USER_READER }
        );

        expect(wrapper.find('.detail__header--name').text()).toBe('Sample A');
        expect(wrapper.find('.test-loc-detail-subtitle').text()).toBe('TestSampleType');
        expect(wrapper.find('.color-icon__circle-small')).toHaveLength(0);
        expect(wrapper.find('.detail__header--desc')).toHaveLength(0);

        wrapper.unmount();
    });

    test('CreateSamplesSubMenu permissions', () => {
        let wrapper = mountWithAppServerContext(
            <SampleHeaderImpl {...DEFAULT_PROPS} user={TEST_USER_READER} sampleModel={DATA_MODEL} canDerive={true}/>,
            {},
            { user: TEST_USER_READER }
        );
        expect(wrapper.find(CreateSamplesSubMenu)).toHaveLength(0);
        wrapper.unmount();

        wrapper = mountWithAppServerContext(
            <SampleHeaderImpl {...DEFAULT_PROPS} user={TEST_USER_AUTHOR} sampleModel={DATA_MODEL} canDerive={true}/>,
            {},
            { user: TEST_USER_AUTHOR }
        );
        expect(wrapper.find(CreateSamplesSubMenu)).toHaveLength(1);
        wrapper.unmount();
    });

    test('CreateSamplesSubMenu props', () => {
        const wrapper = mountWithAppServerContext(
            <SampleHeaderImpl {...DEFAULT_PROPS} user={TEST_USER_AUTHOR} sampleModel={DATA_MODEL} canDerive={true}/>,
            {},
            { user: TEST_USER_AUTHOR }
        );
        expect(wrapper.find(CreateSamplesSubMenu).prop('parentType')).toBe('samples');
        expect(wrapper.find(CreateSamplesSubMenu).prop('parentKey')).toBe('samples:testsampletype:123');
        wrapper.unmount();
    });
});
