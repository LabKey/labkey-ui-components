import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { List } from 'immutable';
import { mount, ReactWrapper } from 'enzyme';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { getTestAPIWrapper } from '../../APIWrapper';

import { waitForLifecycle } from '../../testHelpers';

import { Progress } from '../base/Progress';

import { EntityLineageEditModal } from './EntityLineageEditModal';
import { DataClassDataType, SampleTypeDataType } from './constants';
import { ParentEntityEditPanel } from './ParentEntityEditPanel';
import { getSamplesTestAPIWrapper } from '../samples/APIWrapper';

const SQ = SchemaQuery.create('schema', 'query');
const MODEL = makeTestQueryModel(SQ).mutate({
    selections: new Set(['1', '2', '3']),
});

const LINEAGE_DATA_WITHOUT_ALIQUOTS = {
    key: 'schema/query',
    models: {
        'schema/query': {
            1: { IsAliquot: { value: false } },
            2: { IsAliquot: { value: false } },
            3: { IsAliquot: { value: false } },
        },
    },
    orderedModels: List(['schema/query']),
    queries: { 'schema/query': undefined },
    totalRows: 3,
};
const LINEAGE_DATA_WITH_ALIQUOTS = {
    key: 'schema/query',
    models: {
        'schema/query': {
            1: { IsAliquot: { value: true } },
            2: { IsAliquot: { value: true } },
            3: { IsAliquot: { value: false } },
        },
    },
    orderedModels: List(['schema/query']),
    queries: { 'schema/query': undefined },
    totalRows: 3,
};
const LINEAGE_DATA_ALL_ALIQUOTS = {
    key: 'schema/query',
    models: {
        'schema/query': {
            1: { IsAliquot: { value: true } },
            2: { IsAliquot: { value: true } },
            3: { IsAliquot: { value: true } },
        },
    },
    orderedModels: List(['schema/query']),
    queries: { 'schema/query': undefined },
    totalRows: 3,
};

const DEFAULT_PROPS = {
    onCancel: jest.fn,
    onSuccess: jest.fn,
    childEntityDataType: SampleTypeDataType,
    parentEntityDataTypes: [SampleTypeDataType, DataClassDataType],
    api: getTestAPIWrapper({
        samples: getSamplesTestAPIWrapper({
            getSampleSelectionLineageData: () => Promise.resolve(LINEAGE_DATA_WITHOUT_ALIQUOTS)
        }),
    }),
};

describe('EntityLineageEditModal', () => {
    function validate(wrapper: ReactWrapper, hasModel = true, hasAliquots = false, aliquotsOnly = false): void {
        expect(wrapper.find(Modal)).toHaveLength(hasModel ? 1 : 0);
        expect(wrapper.find('.has-aliquots-alert').hostNodes()).toHaveLength(hasAliquots ? 1 : 0);
        expect(wrapper.find(Button)).toHaveLength(hasModel ? (aliquotsOnly ? 1 : 2) : 0);
        expect(wrapper.find(ParentEntityEditPanel)).toHaveLength(hasModel && !aliquotsOnly ? 1 : 0);
        expect(wrapper.find(Progress)).toHaveLength(hasModel && !aliquotsOnly ? 1 : 0);
    }

    test('without queryModel', () => {
        const wrapper = mount(<EntityLineageEditModal {...DEFAULT_PROPS} queryModel={undefined} />);
        validate(wrapper, false);
        wrapper.unmount();
    });

    test('without aliquots', async () => {
        const wrapper = mount(<EntityLineageEditModal {...DEFAULT_PROPS} queryModel={MODEL} />);
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(Modal.Title).text()).toBe('Edit samples for 3 Selected Samples');
        expect(wrapper.find(Button).last().text()).toBe('Update samples');
        wrapper.unmount();
    });

    test('with some aliquots', async () => {
        const wrapper = mount(
            <EntityLineageEditModal
                {...DEFAULT_PROPS}
                queryModel={MODEL}
                api={getTestAPIWrapper({
                    samples: getSamplesTestAPIWrapper({
                        getSampleSelectionLineageData: () => Promise.resolve(LINEAGE_DATA_WITH_ALIQUOTS),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);
        validate(wrapper, true, true);
        expect(wrapper.find(Modal.Title).text()).toBe('Edit samples for 1 Selected Sample');
        expect(wrapper.find(Button).last().text()).toBe('Update samples');
        expect(wrapper.find('.has-aliquots-alert').hostNodes().text()).toBe(
            ' 2 aliquots were among the selections. Lineage for aliquots cannot be changed.'
        );
        wrapper.unmount();
    });

    test('with only aliquots', async () => {
        const wrapper = mount(
            <EntityLineageEditModal
                {...DEFAULT_PROPS}
                queryModel={MODEL}
                api={getTestAPIWrapper({
                    samples: getSamplesTestAPIWrapper({
                        getSampleSelectionLineageData: () => Promise.resolve(LINEAGE_DATA_ALL_ALIQUOTS)
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);
        validate(wrapper, true, false, true);
        expect(wrapper.find(Modal.Title).text()).toBe('Cannot Edit samples');
        expect(wrapper.find(Modal.Body).text()).toBe('The samples for aliquots cannot be changed.');
        expect(wrapper.find(Button).text()).toBe('Dismiss');
        wrapper.unmount();
    });

    test('parent noun based on first parentEntityDataTypes', async () => {
        const wrapper = mount(
            <EntityLineageEditModal
                {...DEFAULT_PROPS}
                queryModel={MODEL}
                parentEntityDataTypes={[DataClassDataType, SampleTypeDataType]}
            />
        );
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(Modal.Title).text()).toBe('Edit data for 3 Selected Samples');
        expect(wrapper.find(Button).last().text()).toBe('Update data');
        wrapper.unmount();
    });
});
