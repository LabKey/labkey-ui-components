import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { List } from 'immutable';
import { ReactWrapper } from 'enzyme';

import { makeTestQueryModel } from '../public/QueryModel/testUtils';
import { SchemaQuery } from '../public/SchemaQuery';

import { getTestAPIWrapper } from '../internal/APIWrapper';

import { mountWithAppServerContext, waitForLifecycle } from '../internal/testHelpers';

import { Progress } from '../internal/components/base/Progress';

import { getSamplesTestAPIWrapper } from '../internal/components/samples/APIWrapper';

import { EntityLineageEditModal } from './EntityLineageEditModal';
import { DataClassDataType, SampleTypeDataType } from '../internal/components/entities/constants';
import { ParentEntityEditPanel } from './ParentEntityEditPanel';
import { OperationConfirmationData } from '../internal/components/entities/models';

const SQ = new SchemaQuery('schema', 'query');
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
};

const DEFAULT_PROPS = {
    onCancel: jest.fn,
    onSuccess: jest.fn,
    childEntityDataType: SampleTypeDataType,
    parentEntityDataTypes: [SampleTypeDataType, DataClassDataType],
    api: getTestAPIWrapper(jest.fn, {
        samples: getSamplesTestAPIWrapper(jest.fn, {
            getSelectionLineageData: () => Promise.resolve(LINEAGE_DATA_WITHOUT_ALIQUOTS),
        }),
    }),
};

const ALL_ALLOWED_CONFIRMATION_DATA = new OperationConfirmationData({
    allowed: [
        {
            Name: 'A-1',
            RowId: 1,
        },
        {
            Name: 'A-2',
            RowId: 2,
        },
        {
            Name: 'A-3',
            RowId: 3,
        },
    ],
});

const NONE_ALLOWED_CONFIRMATION_DATA = new OperationConfirmationData({
    notAllowed: [
        {
            Name: 'A-1',
            RowId: 1,
        },
        {
            Name: 'A-2',
            RowId: 2,
        },
        {
            Name: 'A-3',
            RowId: 3,
        },
    ],
});
const SOME_ALLOWED_CONFIRMATION_DATA = new OperationConfirmationData({
    allowed: [
        {
            Name: 'A-1',
            RowId: 1,
        },
    ],
    notAllowed: [
        {
            Name: 'A-2',
            RowId: 2,
        },
        {
            Name: 'A-3',
            RowId: 3,
        },
    ],
});

describe('EntityLineageEditModal', () => {
    function validate(wrapper: ReactWrapper, hasModel = true, hasAlert = false, editAllowed = true): void {
        expect(wrapper.find(Modal)).toHaveLength(hasModel ? 1 : 0);
        expect(wrapper.find('.has-aliquots-alert').hostNodes()).toHaveLength(hasAlert ? 1 : 0);
        expect(wrapper.find(Button)).toHaveLength(hasModel ? (editAllowed ? 2 : 1) : 0);
        expect(wrapper.find(ParentEntityEditPanel)).toHaveLength(hasModel && editAllowed ? 1 : 0);
        expect(wrapper.find(Progress)).toHaveLength(hasModel && editAllowed ? 1 : 0);
    }

    test('without queryModel', () => {
        const wrapper = mountWithAppServerContext(<EntityLineageEditModal {...DEFAULT_PROPS} queryModel={undefined} />);
        validate(wrapper, false, false, false);
        wrapper.unmount();
    });

    test('without aliquots', async () => {
        const wrapper = mountWithAppServerContext(
            <EntityLineageEditModal
                {...DEFAULT_PROPS}
                queryModel={MODEL}
                api={getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSelectionLineageData: () => Promise.resolve(LINEAGE_DATA_WITHOUT_ALIQUOTS),
                        getSampleOperationConfirmationData: () =>
                            Promise.resolve(new OperationConfirmationData(ALL_ALLOWED_CONFIRMATION_DATA)),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(Modal.Title).text()).toBe('Edit samples for 3 Selected Samples');
        expect(wrapper.find(Button).last().text()).toBe('Update samples');
        wrapper.unmount();
    });

    test('with some aliquots', async () => {
        const wrapper = mountWithAppServerContext(
            <EntityLineageEditModal
                {...DEFAULT_PROPS}
                queryModel={MODEL}
                api={getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSelectionLineageData: () => Promise.resolve(LINEAGE_DATA_WITH_ALIQUOTS),
                        getSampleOperationConfirmationData: () =>
                            Promise.resolve(new OperationConfirmationData(ALL_ALLOWED_CONFIRMATION_DATA)),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);
        validate(wrapper, true, true);
        expect(wrapper.find(Modal.Title).text()).toBe('Edit samples for 1 Selected Sample');
        expect(wrapper.find(Button).last().text()).toBe('Update samples');
        expect(wrapper.find('.has-aliquots-alert').hostNodes().text()).toBe(
            '2 aliquots were among the selections. Lineage for aliquots cannot be changed. '
        );
        wrapper.unmount();
    });

    test('with only aliquots', async () => {
        const wrapper = mountWithAppServerContext(
            <EntityLineageEditModal
                {...DEFAULT_PROPS}
                queryModel={MODEL}
                api={getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSelectionLineageData: () => Promise.resolve(LINEAGE_DATA_ALL_ALIQUOTS),
                        getSampleOperationConfirmationData: () =>
                            Promise.resolve(new OperationConfirmationData(ALL_ALLOWED_CONFIRMATION_DATA)),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);
        validate(wrapper, true, false, false);
        expect(wrapper.find(Modal.Title).text()).toBe('Cannot Edit samples');
        expect(wrapper.find(Modal.Body).text()).toBe('The samples for aliquots cannot be changed. ');
        expect(wrapper.find(Button).text()).toBe('Dismiss');
        wrapper.unmount();
    });

    test('parent noun based on first parentEntityDataTypes', async () => {
        const wrapper = mountWithAppServerContext(
            <EntityLineageEditModal
                {...DEFAULT_PROPS}
                queryModel={MODEL}
                parentEntityDataTypes={[DataClassDataType, SampleTypeDataType]}
                api={getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSelectionLineageData: () => Promise.resolve(LINEAGE_DATA_WITHOUT_ALIQUOTS),
                        getSampleOperationConfirmationData: () =>
                            Promise.resolve(new OperationConfirmationData(ALL_ALLOWED_CONFIRMATION_DATA)),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(Modal.Title).text()).toBe('Edit data for 3 Selected Samples');
        expect(wrapper.find(Button).last().text()).toBe('Update data');
        wrapper.unmount();
    });

    test('none allowed', async () => {
        const wrapper = mountWithAppServerContext(
            <EntityLineageEditModal
                {...DEFAULT_PROPS}
                queryModel={MODEL}
                parentEntityDataTypes={[DataClassDataType, SampleTypeDataType]}
                api={getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSelectionLineageData: () => Promise.resolve(LINEAGE_DATA_WITHOUT_ALIQUOTS),
                        getSampleOperationConfirmationData: () =>
                            Promise.resolve(new OperationConfirmationData(NONE_ALLOWED_CONFIRMATION_DATA)),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);
        validate(wrapper, true, false, false);
        expect(wrapper.find(Modal.Title).text()).toBe('Cannot Edit data');
        expect(wrapper.find(Modal.Body).text()).toBe(
            'All selected samples have a status that prevents updating of their lineage.'
        );
        expect(wrapper.find(Button).last().text()).toBe('Dismiss');
        wrapper.unmount();
    });

    test('none allowed with aliquots', async () => {
        const wrapper = mountWithAppServerContext(
            <EntityLineageEditModal
                {...DEFAULT_PROPS}
                queryModel={MODEL}
                parentEntityDataTypes={[DataClassDataType, SampleTypeDataType]}
                api={getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSelectionLineageData: () => Promise.resolve(LINEAGE_DATA_WITH_ALIQUOTS),
                        getSampleOperationConfirmationData: () =>
                            Promise.resolve(new OperationConfirmationData(SOME_ALLOWED_CONFIRMATION_DATA)),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);
        validate(wrapper, true, false, false);
        expect(wrapper.find(Modal.Title).text()).toBe('Cannot Edit data');
        expect(wrapper.find(Modal.Body).text()).toBe(
            '2 aliquots were among the selections. ' +
                'Lineage for aliquots cannot be changed. ' +
                'The current status of 2 selected samples prevents updating of their lineage.'
        );
        expect(wrapper.find(Button).last().text()).toBe('Dismiss');
        wrapper.unmount();
    });

    test('none allowed with aliquots locked', async () => {
        const wrapper = mountWithAppServerContext(
            <EntityLineageEditModal
                {...DEFAULT_PROPS}
                queryModel={MODEL}
                parentEntityDataTypes={[DataClassDataType, SampleTypeDataType]}
                api={getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSelectionLineageData: () => Promise.resolve(LINEAGE_DATA_WITH_ALIQUOTS),
                        getSampleOperationConfirmationData: () =>
                            Promise.resolve(new OperationConfirmationData(NONE_ALLOWED_CONFIRMATION_DATA)),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);
        validate(wrapper, true, false, false);
        expect(wrapper.find(Modal.Title).text()).toBe('Cannot Edit data');
        expect(wrapper.find(Modal.Body).text()).toBe(
            '2 aliquots were among the selections. ' +
                'Lineage for aliquots cannot be changed. ' +
                'All selected samples have a status that prevents updating of their lineage.'
        );
        expect(wrapper.find(Button).last().text()).toBe('Dismiss');
        wrapper.unmount();
    });

    test('some not allowed, without aliquots', async () => {
        const wrapper = mountWithAppServerContext(
            <EntityLineageEditModal
                {...DEFAULT_PROPS}
                queryModel={MODEL}
                parentEntityDataTypes={[DataClassDataType, SampleTypeDataType]}
                api={getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSelectionLineageData: () => Promise.resolve(LINEAGE_DATA_WITHOUT_ALIQUOTS),
                        getSampleOperationConfirmationData: () =>
                            Promise.resolve(new OperationConfirmationData(SOME_ALLOWED_CONFIRMATION_DATA)),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);
        validate(wrapper, true, true, true);
        expect(wrapper.find(Modal.Title).text()).toBe('Edit data for 1 Selected Sample');
        expect(wrapper.find('div.has-aliquots-alert').text()).toBe(
            'The current status of 2 selected samples prevents updating of their lineage.'
        );
        expect(wrapper.find(Button).last().text()).toBe('Update data');
        wrapper.unmount();
    });
});
