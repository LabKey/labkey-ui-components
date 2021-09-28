import { List } from 'immutable';

import { App, getOmittedSampleTypeColumns } from '../../../index';
import { isFreezerManagementEnabled } from '../../app/utils';

// Duplicated from sampleManagement/packages/workflow/src/constants.ts
export const CHECKED_OUT_BY_FIELD = 'checkedOutBy';
export const INVENTORY_COLS = [
    'LabelColor',
    'DisplayUnit',
    'StorageStatus',
    'StoredAmountDisplay',
    'StorageLocation',
    'StorageRow',
    'StorageCol',
    'StoredAmount',
    'Units',
    'FreezeThawCount',
    'EnteredStorage',
    'CheckedOut',
    'CheckedOutBy',
    'StorageComment',
];

test('getOmittedSampleTypeColumns with inventoryCols', () => {
    LABKEY.moduleContext = {};
    expect(isFreezerManagementEnabled()).toBeFalsy();
    expect(getOmittedSampleTypeColumns(App.TEST_USER_READER)).toStrictEqual(List<string>());
    expect(getOmittedSampleTypeColumns(App.TEST_USER_GUEST)).toStrictEqual([CHECKED_OUT_BY_FIELD]);
    expect(getOmittedSampleTypeColumns(App.TEST_USER_GUEST, INVENTORY_COLS)).toStrictEqual([CHECKED_OUT_BY_FIELD]);
    expect(getOmittedSampleTypeColumns(App.TEST_USER_READER, INVENTORY_COLS)).toStrictEqual(INVENTORY_COLS);

    LABKEY.moduleContext = { inventory: {} };
    expect(isFreezerManagementEnabled()).toBeTruthy();
    expect(getOmittedSampleTypeColumns(App.TEST_USER_READER, INVENTORY_COLS)).toStrictEqual(List<string>());
    expect(getOmittedSampleTypeColumns(App.TEST_USER_READER)).toStrictEqual(List<string>());
    expect(getOmittedSampleTypeColumns(App.TEST_USER_GUEST, INVENTORY_COLS)).toStrictEqual([CHECKED_OUT_BY_FIELD]);
});
