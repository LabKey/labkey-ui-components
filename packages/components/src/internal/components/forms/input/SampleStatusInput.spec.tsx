import { mount } from 'enzyme';
import { fromJS } from 'immutable';

import React from 'react';

import { SampleStateType } from '../../samples/constants';

import { SampleState } from '../../samples/models';
import { QueryColumn } from '../../../../public/QueryColumn';

import { DiscardConsumedSamplesPanel } from '../../samples/DiscardConsumedSamplesPanel';
import { mountWithServerContext, waitForLifecycle } from '../../../testHelpers';

import { getSamplesTestAPIWrapper } from '../../samples/APIWrapper';

import { getTestAPIWrapper } from '../../../APIWrapper';

import { SampleStatusInput } from './SampleStatusInput';
import { TEST_USER_EDITOR, TEST_USER_STORAGE_EDITOR } from '../../../../test/data/users';

const COLUMN_STATUS = new QueryColumn({
    fieldKey: 'samplestate',
    name: 'samplestate',
    fieldKeyArray: ['samplestate'],
    shownInUpdateView: true,
    userEditable: true,
    lookup: { containerPath: '/Look', keyColumn: 'RowId', displayColumn: '"Label"', query: '"SampleStatus"' },
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
            getSampleStatuses: () =>
                Promise.resolve([
                    new SampleState({ rowId: 100, label: 'Available', stateType: SampleStateType.Available }),
                    new SampleState({ rowId: 200, label: 'Consumed', stateType: SampleStateType.Consumed }),
                    new SampleState({ rowId: 300, label: 'UsedUp', stateType: SampleStateType.Consumed }),
                ]),
        }),
    }),
    col: COLUMN_STATUS,
    data: INIT_EMPTY,
    key: 'status-key',
    onAdditionalFormDataChange: () => {
        return true;
    },
};

describe('SampleStatusInput', () => {
    test('initial value is blank', async () => {
        const component = mountWithServerContext(
            <SampleStatusInput {...DEFAULT_PROPS} formsy={false} />,
            { user: TEST_USER_STORAGE_EDITOR }
        );
        await waitForLifecycle(component);

        const discardPanel = component.find(DiscardConsumedSamplesPanel);
        expect(discardPanel).toHaveLength(0);
    });

    test('initial value is Consumed', async () => {
        const component = mountWithServerContext(
            <SampleStatusInput {...DEFAULT_PROPS} formsy={false} data={INIT_CONSUMED} />,
            { user: TEST_USER_STORAGE_EDITOR }
        );
        await waitForLifecycle(component);

        const discardPanel = component.find(DiscardConsumedSamplesPanel);
        expect(discardPanel).toHaveLength(0);
    });

    test('show discard', async () => {
        const component = mountWithServerContext(
            <SampleStatusInput {...DEFAULT_PROPS} formsy={false} forceShowDiscard={true} />,
            { user: TEST_USER_STORAGE_EDITOR }
        );

        await waitForLifecycle(component);

        const discardPanel = component.find(DiscardConsumedSamplesPanel);
        expect(discardPanel).toHaveLength(1);

        expect(component.find('.sample-bulk-update-discard-panel')).toHaveLength(0);
    });

    test('show discard, with allowDisable true (bulk edit)', async () => {
        const component = mountWithServerContext(
            <SampleStatusInput {...DEFAULT_PROPS} formsy={false} forceShowDiscard={true} allowDisable={true} />,
            { user: TEST_USER_STORAGE_EDITOR }
        );

        await waitForLifecycle(component);

        const discardPanel = component.find(DiscardConsumedSamplesPanel);
        expect(discardPanel).toHaveLength(1);

        expect(component.find('.sample-bulk-update-discard-panel')).toHaveLength(1);
    });
});
