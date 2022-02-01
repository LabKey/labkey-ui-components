import React from 'react';

import { Filter } from '@labkey/api';

import { mount } from 'enzyme';

import {
    App,
    filterSampleRowsForOperation,
    getFilterForSampleOperation,
    getOmittedSampleTypeColumns,
    getOperationNotPermittedMessage,
    getSampleDeleteMessage,
    isSampleOperationPermitted,
    isSamplesSchema,
    LoadingSpinner,
    OperationConfirmationData,
    SAMPLE_STATE_TYPE_COLUMN_NAME,
    SampleOperation,
    SamplesManageButtonSections,
    SampleStateType,
    SchemaQuery,
    SCHEMAS,
} from '../../..';
import { isFreezerManagementEnabled, isSampleStatusEnabled } from '../../app/utils';

import { shouldShowButtons, getSampleStatus, getSampleStatusType } from './utils';

const CHECKED_OUT_BY_FIELD = SCHEMAS.INVENTORY.CHECKED_OUT_BY_FIELD;
const INVENTORY_COLS = SCHEMAS.INVENTORY.INVENTORY_COLS;

test('getOmittedSampleTypeColumn', () => {
    LABKEY.moduleContext = {};
    expect(isFreezerManagementEnabled()).toBeFalsy();
    expect(getOmittedSampleTypeColumns(App.TEST_USER_READER)).toStrictEqual(INVENTORY_COLS);
    expect(getOmittedSampleTypeColumns(App.TEST_USER_GUEST)).toStrictEqual(
        [CHECKED_OUT_BY_FIELD].concat(INVENTORY_COLS)
    );

    LABKEY.moduleContext = { inventory: {} };
    expect(isFreezerManagementEnabled()).toBeTruthy();
    expect(getOmittedSampleTypeColumns(App.TEST_USER_READER)).toStrictEqual([]);
    expect(getOmittedSampleTypeColumns(App.TEST_USER_GUEST)).toStrictEqual([CHECKED_OUT_BY_FIELD]);
});

describe('getSampleDeleteMessage', () => {
    test('loading', () => {
        LABKEY.moduleContext = {};
        const wrapper = mount(<span>{getSampleDeleteMessage(undefined, false)}</span>);
        expect(wrapper.find(LoadingSpinner).exists()).toBeTruthy();
    });

    test('cannot delete', () => {
        LABKEY.moduleContext = {};
        const wrapper = mount(<span>{getSampleDeleteMessage(false, false)}</span>);
        expect(wrapper.find(LoadingSpinner).exists()).toBeFalsy();
        expect(wrapper.text()).toContain(
            'This sample cannot be deleted because it has either derived sample or assay data dependencies.'
        );
    });

    test('cannot delete with error', () => {
        LABKEY.moduleContext = {};
        const wrapper = mount(<span>{getSampleDeleteMessage(false, true)}</span>);
        expect(wrapper.text()).toContain(
            'This sample cannot be deleted because there was a problem loading the delete confirmation data.'
        );
    });

    test('cannot delete, status enabled', () => {
        LABKEY.moduleContext = { api: { moduleNames: ['samplemanagement'] } };
        const wrapper = mount(<span>{getSampleDeleteMessage(false, false)}</span>);
        expect(wrapper.find(LoadingSpinner).exists()).toBeFalsy();
        expect(wrapper.text()).toContain(
            'This sample cannot be deleted because it has either derived sample or assay data dependencies or status that prevents deletion.'
        );
    });
});

describe('isSampleOperationPermitted', () => {
    test('status not enabled', () => {
        LABKEY.moduleContext = {};
        expect(isSampleStatusEnabled()).toBeFalsy();
        expect(isSampleOperationPermitted(SampleStateType.Locked, SampleOperation.EditMetadata)).toBeTruthy();
        expect(isSampleOperationPermitted(SampleStateType.Consumed, SampleOperation.AddToStorage)).toBeTruthy();
        expect(isSampleOperationPermitted(SampleStateType.Available, SampleOperation.EditLineage)).toBeTruthy();
    });

    test('enabled, no status provided', () => {
        LABKEY.moduleContext = { api: { moduleNames: ['samplemanagement'] } };
        expect(isSampleOperationPermitted(undefined, SampleOperation.EditMetadata)).toBeTruthy();
        expect(isSampleOperationPermitted(null, SampleOperation.EditLineage)).toBeTruthy();
    });

    test('enabled, with status type provided', () => {
        LABKEY.moduleContext = { api: { moduleNames: ['samplemanagement'] } };
        expect(isSampleOperationPermitted(SampleStateType.Locked, SampleOperation.EditMetadata)).toBeFalsy();
        expect(isSampleOperationPermitted(SampleStateType.Locked, SampleOperation.AddToPicklist)).toBeTruthy();
        expect(isSampleOperationPermitted(SampleStateType.Consumed, SampleOperation.AddToStorage)).toBeFalsy();
        expect(isSampleOperationPermitted(SampleStateType.Consumed, SampleOperation.RemoveFromStorage)).toBeTruthy();
        expect(isSampleOperationPermitted(SampleStateType.Available, SampleOperation.EditLineage)).toBeTruthy();
    });
});

describe('getFilterForSampleOperation', () => {
    test('status not enabled', () => {
        LABKEY.moduleContext = {};
        expect(getFilterForSampleOperation(SampleOperation.EditMetadata)).toBeNull();
    });

    test('enabled, all allowed', () => {
        LABKEY.moduleContext = { api: { moduleNames: ['samplemanagement'] } };
        expect(getFilterForSampleOperation(SampleOperation.AddToPicklist)).toBeNull();
    });

    test('enabled, some status does not allow', () => {
        LABKEY.moduleContext = { api: { moduleNames: ['samplemanagement'] } };
        expect(getFilterForSampleOperation(SampleOperation.EditLineage)).toStrictEqual(
            Filter.create(SAMPLE_STATE_TYPE_COLUMN_NAME, [SampleStateType.Locked], Filter.Types.NOT_IN)
        );
        expect(getFilterForSampleOperation(SampleOperation.UpdateStorageMetadata)).toStrictEqual(
            Filter.create(
                SAMPLE_STATE_TYPE_COLUMN_NAME,
                [SampleStateType.Consumed, SampleStateType.Locked],
                Filter.Types.NOT_IN
            )
        );
    });
});

describe('filterSampleRowsForOperation', () => {
    const availableRow1 = {
        rowId: { value: 1 },
        SampleID: { value: 1, displayValue: 'T-1' },
        [SAMPLE_STATE_TYPE_COLUMN_NAME]: { value: SampleStateType.Available },
    };
    const availableRow2 = {
        rowId: { value: 2 },
        sampleId: { value: 2, displayValue: 'T-2' },
        [SAMPLE_STATE_TYPE_COLUMN_NAME]: { value: SampleStateType.Available },
    };
    const consumedRow1 = {
        rowId: { value: 20 },
        SampleID: { value: 20, displayValue: 'T-20' },
        [SAMPLE_STATE_TYPE_COLUMN_NAME]: { value: SampleStateType.Consumed },
    };
    const lockedRow1 = {
        rowId: { value: 30 },
        SampleID: { value: 30, displayValue: 'T-30' },
        [SAMPLE_STATE_TYPE_COLUMN_NAME]: { value: SampleStateType.Locked },
    };
    const lockedRow2 = {
        rowId: { value: 31 },
        SampleID: { value: 310, displayValue: 'T-310' },
        [SAMPLE_STATE_TYPE_COLUMN_NAME]: { value: SampleStateType.Locked },
    };

    function validate(
        rows: { [p: string]: any },
        operation: SampleOperation,
        numAllowed: number,
        numNotAllowed: number
    ) {
        const filteredData = filterSampleRowsForOperation(rows, operation);
        expect(Object.keys(filteredData.rows)).toHaveLength(numAllowed);
        expect(filteredData.statusData.allowed).toHaveLength(numAllowed);
        expect(filteredData.statusData.notAllowed).toHaveLength(numNotAllowed);
        if (numNotAllowed == 0) {
            expect(filteredData.statusMessage).toBeNull();
        } else {
            expect(filteredData.statusMessage).toBeTruthy();
        }
    }

    test('all available', () => {
        LABKEY.moduleContext = { api: { moduleNames: ['samplemanagement'] } };
        const data = {
            1: availableRow1,
            2: availableRow2,
        };
        validate(data, SampleOperation.UpdateStorageMetadata, 2, 0);
    });

    test('all locked', () => {
        LABKEY.moduleContext = { api: { moduleNames: ['samplemanagement'] } };
        const data = {
            30: lockedRow1,
            31: lockedRow2,
        };
        validate(data, SampleOperation.EditMetadata, 0, 2);
        validate(data, SampleOperation.AddToPicklist, 2, 0);
    });

    test('mixed statuses', () => {
        LABKEY.moduleContext = { api: { moduleNames: ['samplemanagement'] } };
        const data = {
            30: lockedRow1,
            20: consumedRow1,
            1: availableRow1,
            2: availableRow2,
        };
        validate(data, SampleOperation.EditLineage, 3, 1);
        validate(data, SampleOperation.UpdateStorageMetadata, 2, 2);
        validate(data, SampleOperation.AddToPicklist, 4, 0);
    });
});

describe('getOperationNotPermittedMessage', () => {
    test('no status data', () => {
        expect(getOperationNotPermittedMessage(SampleOperation.EditMetadata, undefined)).toBeNull();
        expect(getOperationNotPermittedMessage(SampleOperation.EditMetadata, undefined, [1, 2])).toBeNull();
    });

    test('status data, no rows', () => {
        expect(
            getOperationNotPermittedMessage(SampleOperation.UpdateStorageMetadata, new OperationConfirmationData())
        ).toBeNull();
    });

    test('none allowed', () => {
        expect(
            getOperationNotPermittedMessage(
                SampleOperation.AddToStorage,
                new OperationConfirmationData({
                    allowed: [],
                    notAllowed: [
                        {
                            Name: 'D-2',
                            RowId: 351,
                        },
                    ],
                })
            )
        ).toBe('All selected samples have a status that prevents adding them to storage.');
    });

    test('some not allowed, without aliquots', () => {
        expect(
            getOperationNotPermittedMessage(
                SampleOperation.EditLineage,
                new OperationConfirmationData({
                    allowed: [
                        {
                            Name: 'T-1',
                            RowId: 111,
                        },
                    ],
                    notAllowed: [
                        {
                            Name: 'D-2',
                            RowId: 351,
                        },
                    ],
                })
            )
        ).toBe('The current status of 1 selected sample prevents updating of its lineage.');
        expect(
            getOperationNotPermittedMessage(
                SampleOperation.EditLineage,
                new OperationConfirmationData({
                    allowed: [
                        {
                            Name: 'T-1',
                            RowId: 111,
                        },
                    ],
                    notAllowed: [
                        {
                            Name: 'D-2',
                            RowId: 351,
                        },
                        {
                            Name: 'D-3',
                            RowId: 353,
                        },
                    ],
                }),
                []
            )
        ).toBe('The current status of 2 selected samples prevents updating of their lineage.');
    });

    test('some allowed, with aliquots', () => {
        expect(
            getOperationNotPermittedMessage(
                SampleOperation.EditLineage,
                new OperationConfirmationData({
                    allowed: [
                        {
                            Name: 'T-1',
                            RowId: 111,
                        },
                    ],
                    notAllowed: [
                        {
                            Name: 'D-2',
                            RowId: 351,
                        },
                        {
                            Name: 'D-4',
                            RowId: 354,
                        },
                        {
                            Name: 'D-3.1',
                            RowId: 356,
                        },
                    ],
                }),
                [356]
            )
        ).toBe('The current status of 2 selected samples prevents updating of their lineage.');
    });

    test('all allowed', () => {
        expect(
            getOperationNotPermittedMessage(
                SampleOperation.EditLineage,
                new OperationConfirmationData({
                    allowed: [
                        {
                            Name: 'T-1',
                            RowId: 111,
                        },
                        {
                            Name: 'T-2',
                            RowId: 123,
                        },
                    ],
                    notAllowed: [],
                }),
                [356]
            )
        ).toBeNull();

        expect(
            getOperationNotPermittedMessage(
                SampleOperation.EditLineage,
                new OperationConfirmationData({
                    allowed: [
                        {
                            Name: 'T-1',
                            RowId: 111,
                        },
                    ],
                    notAllowed: [
                        {
                            Name: 'D-2.1',
                            RowId: 351,
                        },
                        {
                            Name: 'D-4.1',
                            RowId: 354,
                        },
                        {
                            Name: 'D-3.1',
                            RowId: 356,
                        },
                    ],
                }),
                [351, 354, 356, 357]
            )
        ).toBe('The current status of 3 selected samples prevents updating of their lineage.');
    });
});

describe('shouldShowButtons', () => {
    test('undefined hideButtons', () => {
        expect(shouldShowButtons(undefined, undefined)).toBeTruthy();
        expect(shouldShowButtons(SamplesManageButtonSections.IMPORT, undefined)).toBeTruthy();
        expect(shouldShowButtons(undefined, [])).toBeTruthy();
        expect(shouldShowButtons(SamplesManageButtonSections.IMPORT, [])).toBeTruthy();
    });

    test('with hideButtons', () => {
        expect(shouldShowButtons(undefined, [SamplesManageButtonSections.IMPORT])).toBeTruthy();
        expect(
            shouldShowButtons(SamplesManageButtonSections.DELETE, [SamplesManageButtonSections.IMPORT])
        ).toBeTruthy();
        expect(shouldShowButtons(SamplesManageButtonSections.IMPORT, [SamplesManageButtonSections.IMPORT])).toBeFalsy();
    });
});

describe('isSamplesSchema', () => {
    test('not sample schema', () => {
        expect(isSamplesSchema(SCHEMAS.EXP_TABLES.DATA)).toBeFalsy();
        expect(undefined).toBeFalsy();
    });

    test('sample set', () => {
        expect(isSamplesSchema(SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, 'test'))).toBeTruthy();
        expect(isSamplesSchema(SchemaQuery.create('Samples', 'test'))).toBeTruthy();
    });

    test('exp.materials', () => {
        expect(isSamplesSchema(SchemaQuery.create('EXP', 'materials'))).toBeTruthy();
        expect(isSamplesSchema(SCHEMAS.EXP_TABLES.MATERIALS)).toBeTruthy();
    });

    test('source samples', () => {
        expect(isSamplesSchema(SCHEMAS.SAMPLE_MANAGEMENT.SOURCE_SAMPLES)).toBeTruthy();
        expect(isSamplesSchema(SchemaQuery.create('sampleManagement', 'SourceSamples'))).toBeTruthy();
        expect(isSamplesSchema(SchemaQuery.create('sampleManagement', 'Jobs'))).toBeFalsy();
    });
});

describe('getSampleStatus', () => {
    test('getSampleStatusType', () => {
        expect(getSampleStatusType({})).toBeUndefined();
        expect(getSampleStatusType({ 'SampleState/StatusType': { value: undefined } })).toBeUndefined();
        expect(getSampleStatusType({ 'SampleState/StatusType': { value: 'Available' } })).toBe('Available');
        expect(getSampleStatusType({ 'SampleID/SampleState/StatusType': { value: undefined } })).toBeUndefined();
        expect(getSampleStatusType({ 'SampleID/SampleState/StatusType': { value: 'Consumed' } })).toBe('Consumed');
        expect(getSampleStatusType({ 'StatusType': { value: undefined } })).toBeUndefined();
        expect(getSampleStatusType({ 'StatusType': { value: 'Locked' } })).toBe('Locked');
    });

    test('label', () => {
        expect(getSampleStatus({}).label).toBeUndefined();
        expect(getSampleStatus({ 'SampleState': { displayValue: undefined } }).label).toBeUndefined();
        expect(getSampleStatus({ 'SampleState': { displayValue: 'Label1' } }).label).toBe('Label1');
        expect(getSampleStatus({ 'SampleID/SampleState': { displayValue: undefined } }).label).toBeUndefined();
        expect(getSampleStatus({ 'SampleID/SampleState': { displayValue: 'Label2' } }).label).toBe('Label2');
        expect(getSampleStatus({ 'Label': { displayValue: undefined } }).label).toBeUndefined();
        expect(getSampleStatus({ 'Label': { displayValue: 'Label3' } }).label).toBeUndefined();
        expect(getSampleStatus({ 'Label': { value: 'Label3' } }).label).toBe('Label3');
    });

    test('description', () => {
        expect(getSampleStatus({}).description).toBeUndefined();
        expect(getSampleStatus({ 'SampleState/Description': { value: undefined } }).description).toBeUndefined();
        expect(getSampleStatus({ 'SampleState/Description': { value: 'Desc1' } }).description).toBe('Desc1');
        expect(getSampleStatus({ 'SampleID/SampleState/Description': { value: undefined } }).description).toBeUndefined();
        expect(getSampleStatus({ 'SampleID/SampleState/Description': { value: 'Desc2' } }).description).toBe('Desc2');
        expect(getSampleStatus({ 'Description': { value: undefined } }).description).toBeUndefined();
        expect(getSampleStatus({ 'Description': { value: 'Desc3' } }).description).toBe('Desc3');
    });
});
