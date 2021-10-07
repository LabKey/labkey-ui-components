import React from 'react';
import {
    App,
    getOmittedSampleTypeColumns,
    isSampleOperationPermitted,
    SampleOperation,
    SampleStateType
} from '../../..';
import { isFreezerManagementEnabled, isSampleStatusEnabled } from '../../app/utils';

// Duplicated from inventory/packages/freezermanager/src/constants.ts
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

test('getOmittedSampleTypeColumns with inventoryCols omitted', () => {
    LABKEY.moduleContext = {};
    expect(isFreezerManagementEnabled()).toBeFalsy();
    expect(getOmittedSampleTypeColumns(App.TEST_USER_READER)).toStrictEqual([]);
    expect(getOmittedSampleTypeColumns(App.TEST_USER_GUEST)).toStrictEqual([CHECKED_OUT_BY_FIELD]);
    expect(getOmittedSampleTypeColumns(App.TEST_USER_GUEST, INVENTORY_COLS)).toStrictEqual([CHECKED_OUT_BY_FIELD]);
    expect(getOmittedSampleTypeColumns(App.TEST_USER_READER, INVENTORY_COLS)).toStrictEqual(INVENTORY_COLS);

    LABKEY.moduleContext = { inventory: {} };
    expect(isFreezerManagementEnabled()).toBeTruthy();
    expect(getOmittedSampleTypeColumns(App.TEST_USER_READER, INVENTORY_COLS)).toStrictEqual([]);
    expect(getOmittedSampleTypeColumns(App.TEST_USER_READER)).toStrictEqual([]);
    expect(getOmittedSampleTypeColumns(App.TEST_USER_GUEST, INVENTORY_COLS)).toStrictEqual([CHECKED_OUT_BY_FIELD]);
});

describe("isSampleOperationPermitted", () => {
    test("status not enabled", () => {
        LABKEY.moduleContext = {};
        expect(isSampleStatusEnabled()).toBeFalsy();
        expect(isSampleOperationPermitted(SampleStateType.Locked, SampleOperation.EditMetadata)).toBeTruthy();
        expect(isSampleOperationPermitted(SampleStateType.Consumed, SampleOperation.AddToStorage)).toBeTruthy();
        expect(isSampleOperationPermitted(SampleStateType.Available, SampleOperation.EditLineage)).toBeTruthy();
    });

    test("enabled, no status provided", () => {
        LABKEY.moduleContext = { experiment: {'experimental-sample-status': true} };
        expect(isSampleOperationPermitted(undefined, SampleOperation.EditMetadata)).toBeTruthy();
        expect(isSampleOperationPermitted(null, SampleOperation.EditLineage)).toBeTruthy();
    });

    test("enabled, with status type provided", () => {
        LABKEY.moduleContext = { experiment: {'experimental-sample-status': true} };
        expect(isSampleOperationPermitted(SampleStateType.Locked, SampleOperation.EditMetadata)).toBeFalsy();
        expect(isSampleOperationPermitted(SampleStateType.Locked, SampleOperation.AddToPicklist)).toBeTruthy();
        expect(isSampleOperationPermitted(SampleStateType.Consumed, SampleOperation.AddToStorage)).toBeFalsy();
        expect(isSampleOperationPermitted(SampleStateType.Consumed, SampleOperation.RemoveFromStorage)).toBeTruthy();
        expect(isSampleOperationPermitted(SampleStateType.Available, SampleOperation.EditLineage)).toBeTruthy();
    })
});

