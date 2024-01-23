import React from 'react';
import { act } from 'react-dom/test-utils';
import { fromJS } from 'immutable';

import { SampleStateType } from '../../samples/constants';

import { SampleState } from '../../samples/models';
import { QueryColumn, QueryLookup } from '../../../../public/QueryColumn';

import { DiscardConsumedSamplesPanel } from '../../samples/DiscardConsumedSamplesPanel';
import { mountWithAppServerContext, mountWithServerContext, waitForLifecycle } from '../../../test/enzymeTestHelpers';

import { getSamplesTestAPIWrapper } from '../../samples/APIWrapper';

import { getTestAPIWrapper } from '../../../APIWrapper';

import { TEST_USER_EDITOR, TEST_USER_STORAGE_EDITOR } from '../../../userFixtures';
import { QuerySelect } from '../QuerySelect';

import { SampleStatusInput } from './SampleStatusInput';
import { getFolderTestAPIWrapper } from '../../container/FolderAPIWrapper';

describe('SampleStatusInput', () => {
    const COLUMN_STATUS = new QueryColumn({
        fieldKey: 'samplestate',
        name: 'samplestate',
        fieldKeyArray: ['samplestate'],
        shownInUpdateView: true,
        userEditable: true,
        lookup: new QueryLookup({
            containerPath: '/Look',
            keyColumn: 'RowId',
            displayColumn: 'Label',
            queryName: 'SampleStatus',
        }),
    });

    const INIT_EMPTY = fromJS({
        displayValue: undefined,
        value: undefined,
    });

    const INIT_CONSUMED = fromJS({
        displayValue: 'Consumed',
        value: 200,
    });

    const DEFAULT_PROPS = {
        api: getTestAPIWrapper(jest.fn, {
            samples: getSamplesTestAPIWrapper(jest.fn, {
                getSampleStatuses: jest
                    .fn()
                    .mockResolvedValue([
                        new SampleState({ rowId: 100, label: 'Available', stateType: SampleStateType.Available }),
                        new SampleState({ rowId: 200, label: 'Consumed', stateType: SampleStateType.Consumed }),
                        new SampleState({ rowId: 300, label: 'UsedUp', stateType: SampleStateType.Consumed }),
                    ]),
            }),
        }),
        col: COLUMN_STATUS,
        data: INIT_EMPTY,
        key: 'status-key',
        onAdditionalFormDataChange: jest.fn().mockReturnValue(true),
    };

    test('initial value is blank', async () => {
        const component = mountWithServerContext(<SampleStatusInput {...DEFAULT_PROPS} formsy={false} />, {
            user: TEST_USER_STORAGE_EDITOR,
        });
        await waitForLifecycle(component, 50);

        const discardPanel = component.find(DiscardConsumedSamplesPanel);
        expect(discardPanel).toHaveLength(0);
        component.unmount();
    });

    test('initial value is Consumed', async () => {
        const component = mountWithServerContext(
            <SampleStatusInput {...DEFAULT_PROPS} formsy={false} value={INIT_CONSUMED} />,
            { user: TEST_USER_STORAGE_EDITOR }
        );
        await waitForLifecycle(component, 50);

        const discardPanel = component.find(DiscardConsumedSamplesPanel);
        expect(discardPanel).toHaveLength(0);
        component.unmount();
    });

    test('change to consumed status, editor', async () => {
        const component = <SampleStatusInput {...DEFAULT_PROPS} formsy={false} allowDisable />;
        const wrapper = mountWithAppServerContext(
            component,
            {
                api: getTestAPIWrapper(jest.fn, {
                    folder: getFolderTestAPIWrapper(jest.fn, {
                        getAuditSettings: jest.fn().mockResolvedValue({ requireUserComments: false }),
                    }),
                }),
            },
            { user: TEST_USER_EDITOR }
        );

        await waitForLifecycle(wrapper, 50); // retrieve statuses
        act(() => {
            wrapper.find(QuerySelect).prop('onQSChange')('name', 200, [], undefined, undefined);
        });
        await waitForLifecycle(wrapper, 50); // update after select
        const discardPanel = wrapper.find(DiscardConsumedSamplesPanel);
        expect(discardPanel).toHaveLength(0);
        wrapper.unmount();
    });

    test('change to consumed status, storage editor, allow disable (bulk edit)', async () => {
        const component = <SampleStatusInput {...DEFAULT_PROPS} formsy={false} allowDisable />;
        const wrapper = mountWithAppServerContext(
            component,
            {
                api: getTestAPIWrapper(jest.fn, {
                    folder: getFolderTestAPIWrapper(jest.fn, {
                        getAuditSettings: jest.fn().mockResolvedValue({ requireUserComments: false }),
                    }),
                }),
            },
            { user: TEST_USER_STORAGE_EDITOR }
        );

        await waitForLifecycle(wrapper, 50);
        act(() => {
            wrapper.find(QuerySelect).prop('onQSChange')('name', 200, [], undefined, undefined);
        });
        await waitForLifecycle(wrapper, 50);
        const discardPanel = wrapper.find(DiscardConsumedSamplesPanel);
        expect(discardPanel).toHaveLength(1);

        expect(wrapper.find('.sample-bulk-update-discard-panel')).toHaveLength(1);
        wrapper.unmount();
    });

    test('change to consumed status, storage editor, no allowDisable', async () => {
        const component = <SampleStatusInput {...DEFAULT_PROPS} formsy={false} />;
        const wrapper = mountWithAppServerContext(
            component,
            {
                api: getTestAPIWrapper(jest.fn, {
                    folder: getFolderTestAPIWrapper(jest.fn, {
                        getAuditSettings: jest.fn().mockResolvedValue({ requireUserComments: false }),
                    }),
                }),
            },
            { user: TEST_USER_STORAGE_EDITOR }
        );

        await waitForLifecycle(wrapper, 50);
        act(() => {
            wrapper.find(QuerySelect).prop('onQSChange')('name', 200, [], undefined, undefined);
        });
        await waitForLifecycle(wrapper, 50);
        const discardPanel = wrapper.find(DiscardConsumedSamplesPanel);
        expect(discardPanel).toHaveLength(1);

        expect(wrapper.find('.sample-bulk-update-discard-panel')).toHaveLength(0);
        wrapper.unmount();
    });

    test('change to not consumed, storage editor', async () => {
        const component = <SampleStatusInput {...DEFAULT_PROPS} formsy={false} />;
        const wrapper = mountWithServerContext(component, { user: TEST_USER_STORAGE_EDITOR });

        await waitForLifecycle(wrapper, 50);
        act(() => {
            wrapper.find(QuerySelect).prop('onQSChange')('name', 100, [], undefined, undefined);
        });
        await waitForLifecycle(wrapper, 50);
        const discardPanel = wrapper.find(DiscardConsumedSamplesPanel);
        expect(discardPanel).toHaveLength(0);

        expect(wrapper.find('.sample-bulk-update-discard-panel')).toHaveLength(0);
        wrapper.unmount();
    });
});
