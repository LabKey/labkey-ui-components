import React from 'react';
import { act } from '@testing-library/react';
import { fromJS } from 'immutable';

import { SampleState, SampleStateType } from '../../samples/models';
import { QueryColumn, QueryLookup } from '../../../../public/QueryColumn';

import { renderWithAppContext } from '../../../test/reactTestLibraryHelpers';
import { getSamplesTestAPIWrapper } from '../../samples/APIWrapper';
import { getTestAPIWrapper } from '../../../APIWrapper';
import { TEST_USER_EDITOR, TEST_USER_STORAGE_EDITOR } from '../../../userFixtures';
import { getFolderTestAPIWrapper } from '../../container/FolderAPIWrapper';
import { TEST_FOLDER_CONTAINER } from '../../../containerFixtures';

import { SampleStatusInput } from './SampleStatusInput';

jest.mock('../QuerySelect', () => ({
    QuerySelect: jest.fn(({ onQSChange, name }) => (
        <select
            data-testid="query-select"
            name={name}
            onChange={e => {
                const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                onQSChange?.(name, val, [], undefined, undefined);
            }}
        >
            <option value="">--</option>
            <option value="100">Available</option>
            <option value="200">Consumed</option>
        </select>
    )),
}));

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

    const COMMENTS_NOT_REQUIRED = {
        api: getTestAPIWrapper(jest.fn, {
            folder: getFolderTestAPIWrapper(jest.fn, {
                getAuditSettings: jest.fn().mockResolvedValue({ requireUserComments: false }),
            }),
        }),
    };

    async function selectValue(value: string): Promise<void> {
        const select = document.querySelector<HTMLSelectElement>('[data-testid="query-select"]');
        select.value = value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        await act(async () => {});
    }

    test('initial value is blank', async () => {
        renderWithAppContext(<SampleStatusInput {...DEFAULT_PROPS} formsy={false} />, {
            serverContext: { user: TEST_USER_STORAGE_EDITOR },
        });
        await act(async () => {}); // flush getSampleStatuses effect
        expect(document.querySelectorAll('.discard-consumed-title')).toHaveLength(0);
    });

    test('initial value is Consumed', async () => {
        renderWithAppContext(<SampleStatusInput {...DEFAULT_PROPS} formsy={false} value={INIT_CONSUMED} />, {
            serverContext: { user: TEST_USER_STORAGE_EDITOR },
        });
        await act(async () => {}); // flush getSampleStatuses effect
        expect(document.querySelectorAll('.discard-consumed-title')).toHaveLength(0);
    });

    test('change to consumed status, editor', async () => {
        renderWithAppContext(
            <SampleStatusInput {...DEFAULT_PROPS} formsy={false} allowDisable />,
            { appContext: COMMENTS_NOT_REQUIRED, serverContext: { container: TEST_FOLDER_CONTAINER, user: TEST_USER_EDITOR } }
        );
        await act(async () => {}); // flush getSampleStatuses effect
        await selectValue('200');
        expect(document.querySelectorAll('.discard-consumed-title')).toHaveLength(0);
    });

    test('change to consumed status, storage editor, allow disable (bulk edit)', async () => {
        renderWithAppContext(
            <SampleStatusInput {...DEFAULT_PROPS} formsy={false} allowDisable />,
            { appContext: COMMENTS_NOT_REQUIRED, serverContext: { container: TEST_FOLDER_CONTAINER, user: TEST_USER_STORAGE_EDITOR } }
        );
        await act(async () => {}); // flush getSampleStatuses effect
        await selectValue('200');
        expect(document.querySelectorAll('.discard-consumed-title')).toHaveLength(1);
        expect(document.querySelectorAll('.sample-bulk-update-discard-panel')).toHaveLength(1);
    });

    test('change to consumed status, storage editor, no allowDisable', async () => {
        renderWithAppContext(
            <SampleStatusInput {...DEFAULT_PROPS} formsy={false} />,
            { appContext: COMMENTS_NOT_REQUIRED, serverContext: { container: TEST_FOLDER_CONTAINER, user: TEST_USER_STORAGE_EDITOR } }
        );
        await act(async () => {}); // flush getSampleStatuses effect
        await selectValue('200');
        expect(document.querySelectorAll('.discard-consumed-title')).toHaveLength(1);
        expect(document.querySelectorAll('.sample-bulk-update-discard-panel')).toHaveLength(0);
    });

    test('change to not consumed, storage editor', async () => {
        renderWithAppContext(
            <SampleStatusInput {...DEFAULT_PROPS} formsy={false} />,
            { serverContext: { user: TEST_USER_STORAGE_EDITOR } }
        );
        await act(async () => {}); // flush getSampleStatuses effect
        await selectValue('100');
        expect(document.querySelectorAll('.discard-consumed-title')).toHaveLength(0);
        expect(document.querySelectorAll('.sample-bulk-update-discard-panel')).toHaveLength(0);
    });
});
