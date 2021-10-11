import React from 'react';
import {
    App,
    getFilterForSampleOperation,
    getOmittedSampleTypeColumns,
    getSampleDeleteMessage,
    isSampleOperationPermitted,
    LoadingSpinner,
    SAMPLE_STATE_TYPE_COLUMN_NAME,
    SampleOperation,
    SampleStateType
} from '../../..';
import { isFreezerManagementEnabled, isSampleStatusEnabled } from '../../app/utils';
import { Filter } from '@labkey/api';
import { mount } from 'enzyme';

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

describe("getSampleDeleteMessage", () => {
    test("loading", () => {
        LABKEY.moduleContext = {};
        const wrapper = mount(<span>{getSampleDeleteMessage(undefined, false)}</span>);
        expect(wrapper.find(LoadingSpinner).exists()).toBeTruthy();
    });

    test("cannot delete", () => {
        LABKEY.moduleContext = {};
        const wrapper = mount(<span>{getSampleDeleteMessage(false, false)}</span>);
        expect(wrapper.find(LoadingSpinner).exists()).toBeFalsy();
        expect(wrapper.text()).toContain("This sample cannot be deleted because it has either derived sample or assay data dependencies.")
    });

    test("cannot delete with error", () => {
        LABKEY.moduleContext = {};
        const wrapper = mount(<span>{getSampleDeleteMessage(false, true)}</span>);
        expect(wrapper.text()).toContain("This sample cannot be deleted because there was a problem loading the delete confirmation data.")
    });

    test("cannot delete, status enabled", () => {
        LABKEY.moduleContext = { experiment: {'experimental-sample-status': true} };
        const wrapper = mount(<span>{getSampleDeleteMessage(false, false)}</span>);
        expect(wrapper.find(LoadingSpinner).exists()).toBeFalsy();
        expect(wrapper.text()).toContain("This sample cannot be deleted because it has either derived sample or assay data dependencies or status that prevents deletion.")
    });
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

describe("getFilterForSampleOperation", () => {
   test("status not enabled", () => {
       LABKEY.moduleContext = {};
       expect(getFilterForSampleOperation(SampleOperation.EditMetadata)).toBeNull()
   });

   test("enabled, all allowed", () => {
       LABKEY.moduleContext = { experiment: {'experimental-sample-status': true} };
       expect(getFilterForSampleOperation(SampleOperation.AddToPicklist)).toBeNull();
   })

    test("enabled, some status does not allow", () => {
        LABKEY.moduleContext = { experiment: {'experimental-sample-status': true} };
        expect(getFilterForSampleOperation(SampleOperation.EditLineage)).toStrictEqual(Filter.create(SAMPLE_STATE_TYPE_COLUMN_NAME,[SampleStateType.Locked], Filter.Types.NOT_IN));
        expect(getFilterForSampleOperation(SampleOperation.UpdateStorageMetadata)).toStrictEqual(Filter.create(SAMPLE_STATE_TYPE_COLUMN_NAME,[SampleStateType.Consumed, SampleStateType.Locked], Filter.Types.NOT_IN));
    })
});

