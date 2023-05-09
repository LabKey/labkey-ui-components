import React from 'react';

import { SchemaQuery } from '../public/SchemaQuery';
import { SCHEMAS } from '../internal/schemas';
import { makeTestQueryModel } from '../public/QueryModel/testUtils';
import { LoadingState } from '../public/LoadingState';
import { mountWithAppServerContext, waitForLifecycle } from '../internal/testHelpers';
import { TEST_USER_AUTHOR, TEST_USER_EDITOR, TEST_USER_READER } from '../internal/userFixtures';

import { DisableableMenuItem } from '../internal/components/samples/DisableableMenuItem';

import { SampleHeaderImpl } from './SampleHeader';
import { CreateSamplesSubMenu } from './CreateSamplesSubMenu';
import { getTestAPIWrapper } from '../internal/APIWrapper';
import { getSamplesTestAPIWrapper } from '../internal/components/samples/APIWrapper';
import { OperationConfirmationData } from '../internal/components/entities/models';

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
        defaultLabel: undefined,
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
            <SampleHeaderImpl {...DEFAULT_PROPS} user={TEST_USER_READER} sampleModel={DATA_MODEL} canDerive={true} />,
            {},
            { user: TEST_USER_READER }
        );
        expect(wrapper.find(CreateSamplesSubMenu)).toHaveLength(0);
        wrapper.unmount();

        wrapper = mountWithAppServerContext(
            <SampleHeaderImpl {...DEFAULT_PROPS} user={TEST_USER_AUTHOR} sampleModel={DATA_MODEL} canDerive={true} />,
            {},
            { user: TEST_USER_AUTHOR }
        );
        expect(wrapper.find(CreateSamplesSubMenu)).toHaveLength(1);
        wrapper.unmount();
    });

    test('CreateSamplesSubMenu props', () => {
        const wrapper = mountWithAppServerContext(
            <SampleHeaderImpl {...DEFAULT_PROPS} user={TEST_USER_AUTHOR} sampleModel={DATA_MODEL} canDerive={true} />,
            {},
            { user: TEST_USER_AUTHOR }
        );
        expect(wrapper.find(CreateSamplesSubMenu).prop('parentType')).toBe('samples');
        expect(wrapper.find(CreateSamplesSubMenu).prop('parentKey')).toBe('samples:testsampletype:123');
        wrapper.unmount();
    });

    test('no subfolders, with update perm', () => {
        const wrapper = mountWithAppServerContext(
            <SampleHeaderImpl
                {...DEFAULT_PROPS}
                user={TEST_USER_EDITOR}
                sampleModel={DATA_MODEL}
            />,
            {},
            { user: TEST_USER_EDITOR }
        );
        expect(wrapper.find(DisableableMenuItem)).toHaveLength(2);
        expect(wrapper.find(DisableableMenuItem).at(0).text()).toBe('Add to Picklist');
        expect(wrapper.find(DisableableMenuItem).at(1).text()).toBe('Delete Sample');
        wrapper.unmount();
    });

    test('with subfolders and update perm', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleHeaderImpl
                {...DEFAULT_PROPS}
                user={TEST_USER_EDITOR}
                sampleModel={DATA_MODEL}
            />,
            {
                api: getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSampleOperationConfirmationData: () =>
                            Promise.resolve(new OperationConfirmationData({allowed: [1]})),
                    }),
                })
            },
            { user: TEST_USER_EDITOR, moduleContext: { query: { hasProductProjects: true } } }
        );

        await waitForLifecycle(wrapper);

        const items = wrapper.find(DisableableMenuItem);
        expect(items).toHaveLength(3);
        expect(items.at(0).text()).toBe('Add to Picklist');
        expect(items.at(1).text()).toBe('Move to Project');
        expect(items.at(2).text()).toBe('Delete Sample');
        wrapper.unmount();
    });

    test('without update perm', () => {
        const wrapper = mountWithAppServerContext(
            <SampleHeaderImpl
                {...DEFAULT_PROPS}
                user={TEST_USER_AUTHOR}
                sampleModel={DATA_MODEL}
            />,
            {},
            { user: TEST_USER_AUTHOR }
        );
        expect(wrapper.find(DisableableMenuItem)).toHaveLength(0);
        wrapper.unmount();
    });
});
