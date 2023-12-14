import { Filter } from '@labkey/api';

import { isFreezerManagementEnabled, isSampleStatusEnabled } from '../../app/utils';

import { TEST_USER_GUEST, TEST_USER_READER } from '../../userFixtures';

import { SCHEMAS } from '../../schemas';

import { OperationConfirmationData } from '../entities/models';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';

import { QueryInfo } from '../../../public/QueryInfo';

import { SAMPLE_STATE_TYPE_COLUMN_NAME, SampleOperation, SampleStateType } from './constants';
import {
    getFilterForSampleOperation,
    getOmittedSampleTypeColumns,
    getOperationNotPermittedMessage,
    getSampleStatus,
    getSampleStatusLockedMessage,
    getSampleStatusType,
    getURLParamsForSampleSelectionKey,
    isSampleOperationPermitted,
    isSamplesSchema,
} from './utils';
import { SampleState } from './models';

const CHECKED_OUT_BY_FIELD = SCHEMAS.INVENTORY.CHECKED_OUT_BY_FIELD;
const INVENTORY_COLS = SCHEMAS.INVENTORY.INVENTORY_COLS;

test('getOmittedSampleTypeColumn', () => {
    let moduleContext = {};
    expect(isFreezerManagementEnabled(moduleContext)).toBeFalsy();
    expect(getOmittedSampleTypeColumns(TEST_USER_READER, moduleContext)).toStrictEqual(INVENTORY_COLS);
    expect(getOmittedSampleTypeColumns(TEST_USER_GUEST, moduleContext)).toStrictEqual(
        [CHECKED_OUT_BY_FIELD].concat(INVENTORY_COLS)
    );

    moduleContext = { inventory: {} };
    expect(isFreezerManagementEnabled(moduleContext)).toBeTruthy();
    expect(getOmittedSampleTypeColumns(TEST_USER_READER, moduleContext)).toStrictEqual([]);
    expect(getOmittedSampleTypeColumns(TEST_USER_GUEST, moduleContext)).toStrictEqual([CHECKED_OUT_BY_FIELD]);
});

describe('isSampleOperationPermitted', () => {
    test('status not enabled', () => {
        const moduleContext = {};
        expect(isSampleStatusEnabled()).toBeFalsy();
        expect(
            isSampleOperationPermitted(SampleStateType.Locked, SampleOperation.EditMetadata, moduleContext)
        ).toBeTruthy();
        expect(
            isSampleOperationPermitted(SampleStateType.Consumed, SampleOperation.AddToStorage, moduleContext)
        ).toBeTruthy();
        expect(
            isSampleOperationPermitted(SampleStateType.Available, SampleOperation.EditLineage, moduleContext)
        ).toBeTruthy();
    });

    test('enabled, no status provided', () => {
        const moduleContext = { api: { moduleNames: ['samplemanagement'] } };
        expect(isSampleOperationPermitted(undefined, SampleOperation.EditMetadata, moduleContext)).toBeTruthy();
        expect(isSampleOperationPermitted(null, SampleOperation.EditLineage, moduleContext)).toBeTruthy();
    });

    test('enabled, with status type provided', () => {
        const moduleContext = { api: { moduleNames: ['samplemanagement'] } };
        expect(
            isSampleOperationPermitted(SampleStateType.Locked, SampleOperation.EditMetadata, moduleContext)
        ).toBeFalsy();
        expect(
            isSampleOperationPermitted(SampleStateType.Locked, SampleOperation.AddToPicklist, moduleContext)
        ).toBeTruthy();
        expect(
            isSampleOperationPermitted(SampleStateType.Consumed, SampleOperation.AddToStorage, moduleContext)
        ).toBeFalsy();
        expect(
            isSampleOperationPermitted(SampleStateType.Consumed, SampleOperation.RemoveFromStorage, moduleContext)
        ).toBeTruthy();
        expect(
            isSampleOperationPermitted(SampleStateType.Available, SampleOperation.EditLineage, moduleContext)
        ).toBeTruthy();
    });
});

describe('getFilterForSampleOperation', () => {
    test('status not enabled', () => {
        expect(getFilterForSampleOperation(SampleOperation.EditMetadata, true, {})).toBeNull();
    });

    test('enabled, all allowed', () => {
        const moduleContext = { api: { moduleNames: ['samplemanagement'] } };
        expect(getFilterForSampleOperation(SampleOperation.AddToPicklist, true, moduleContext)).toBeNull();
    });

    test('enabled, some status does not allow', () => {
        const moduleContext = { api: { moduleNames: ['samplemanagement'] } };
        expect(getFilterForSampleOperation(SampleOperation.EditLineage, true, moduleContext)).toStrictEqual(
            Filter.create(SAMPLE_STATE_TYPE_COLUMN_NAME, [SampleStateType.Locked], Filter.Types.NOT_IN)
        );
        expect(getFilterForSampleOperation(SampleOperation.UpdateStorageMetadata, true, moduleContext)).toStrictEqual(
            Filter.create(
                SAMPLE_STATE_TYPE_COLUMN_NAME,
                [SampleStateType.Consumed, SampleStateType.Locked],
                Filter.Types.NOT_IN
            )
        );
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
    });

    test('some allowed, lots not', () => {
        const notAllowed = [];
        for (let i = 0; i < 1235; i++) {
            notAllowed.push({ Name: 'D-2.' + i, RowId: i });
        }
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
                    notAllowed,
                })
            )
        ).toBe('The current status of 1,235 selected samples prevents updating of their lineage.');
    });
});

describe('isSamplesSchema', () => {
    test('not sample schema', () => {
        expect(isSamplesSchema(SCHEMAS.EXP_TABLES.DATA)).toBeFalsy();
        expect(undefined).toBeFalsy();
    });

    test('sample set', () => {
        expect(isSamplesSchema(new SchemaQuery(SCHEMAS.SAMPLE_SETS.SCHEMA, 'test'))).toBeTruthy();
        expect(isSamplesSchema(new SchemaQuery('Samples', 'test'))).toBeTruthy();
    });

    test('exp.materials', () => {
        expect(isSamplesSchema(new SchemaQuery('EXP', 'materials'))).toBeTruthy();
        expect(isSamplesSchema(SCHEMAS.EXP_TABLES.MATERIALS)).toBeTruthy();
    });

    test('source samples', () => {
        expect(isSamplesSchema(SCHEMAS.SAMPLE_MANAGEMENT.SOURCE_SAMPLES)).toBeTruthy();
        expect(isSamplesSchema(new SchemaQuery('sampleManagement', 'SourceSamples'))).toBeTruthy();
        expect(isSamplesSchema(new SchemaQuery('sampleManagement', 'Jobs'))).toBeFalsy();
    });
});

describe('getSampleStatus', () => {
    test('getSampleStatusType', () => {
        expect(getSampleStatusType({})).toBeUndefined();
        expect(getSampleStatusType({ 'SampleState/StatusType': { value: undefined } })).toBeUndefined();
        expect(getSampleStatusType({ 'SampleState/StatusType': { value: 'Available' } })).toBe('Available');
        expect(getSampleStatusType({ 'SampleID/SampleState/StatusType': { value: undefined } })).toBeUndefined();
        expect(getSampleStatusType({ 'SampleID/SampleState/StatusType': { value: 'Consumed' } })).toBe('Consumed');
        expect(getSampleStatusType({ StatusType: { value: undefined } })).toBeUndefined();
        expect(getSampleStatusType({ StatusType: { value: 'Locked' } })).toBe('Locked');
    });

    test('label', () => {
        expect(getSampleStatus({}).label).toBeUndefined();
        expect(getSampleStatus({ SampleState: { displayValue: undefined } }).label).toBeUndefined();
        expect(getSampleStatus({ SampleState: { displayValue: 'Label1' } }).label).toBe('Label1');
        expect(getSampleStatus({ 'SampleID/SampleState': { displayValue: undefined } }).label).toBeUndefined();
        expect(getSampleStatus({ 'SampleID/SampleState': { displayValue: 'Label2' } }).label).toBe('Label2');
        expect(getSampleStatus({ Label: { displayValue: undefined } }).label).toBeUndefined();
        expect(getSampleStatus({ Label: { displayValue: 'Label3' } }).label).toBeUndefined();
        expect(getSampleStatus({ Label: { value: 'Label3' } }).label).toBe('Label3');
    });

    test('description', () => {
        expect(getSampleStatus({}).description).toBeUndefined();
        expect(getSampleStatus({ 'SampleState/Description': { value: undefined } }).description).toBeUndefined();
        expect(getSampleStatus({ 'SampleState/Description': { value: 'Desc1' } }).description).toBe('Desc1');
        expect(
            getSampleStatus({ 'SampleID/SampleState/Description': { value: undefined } }).description
        ).toBeUndefined();
        expect(getSampleStatus({ 'SampleID/SampleState/Description': { value: 'Desc2' } }).description).toBe('Desc2');
        expect(getSampleStatus({ Description: { value: undefined } }).description).toBeUndefined();
        expect(getSampleStatus({ Description: { value: 'Desc3' } }).description).toBe('Desc3');
    });
});

const TEST_SQ = new SchemaQuery('schema', 'query');
const TEST_QUERY_INFO = new QueryInfo({ schemaQuery: TEST_SQ, pkCols: ['RowId'] });
const TEST_MODEL = makeTestQueryModel(TEST_SQ, TEST_QUERY_INFO).mutate({ id: 'model-id' });

describe('getURLParamsForSampleSelectionKey', () => {
    test('default props', () => {
        expect(getURLParamsForSampleSelectionKey(TEST_MODEL)).toStrictEqual({ selectionKey: 'model-id' });
    });

    test('picklist', () => {
        expect(getURLParamsForSampleSelectionKey(TEST_MODEL, 'picklist1')).toStrictEqual({
            selectionKey: 'model-id',
            picklistName: 'picklist1',
        });
    });

    test('assay', () => {
        expect(getURLParamsForSampleSelectionKey(TEST_MODEL, undefined, true, 'Name')).toStrictEqual({
            selectionKey: 'model-id',
            assayProtocol: 'schema',
            isAssay: true,
            sampleFieldKey: 'Name',
        });
    });

    test('keyValue', () => {
        const model = TEST_MODEL.mutate({ keyValue: 123 });
        expect(getURLParamsForSampleSelectionKey(model)).toStrictEqual({
            'query.RowId~eq': 123,
            selectionKey: 'appkey|schema/query|123',
        });
    });
});

describe("getSampleStatusLockedMessage", () => {
    test("no state", () => {
        expect(getSampleStatusLockedMessage(undefined, false)).toBeUndefined();
    });

   test("not locked", () => {
       expect(getSampleStatusLockedMessage(new SampleState({
           rowId: 1,
           label: 'Available',
           stateType: SampleStateType.Available,
           inUse: false,
           containerPath: "/Test Project",
           isLocal: true
       }), false)).toBeUndefined();
   });

   test("saving but not in use", () => {
       expect(getSampleStatusLockedMessage(new SampleState({
           rowId: 1,
           label: 'Available',
           stateType: SampleStateType.Available,
           inUse: false,
           containerPath: "/Test Project",
           isLocal: true
       }), true)).toBe("This sample status cannot change status type or be deleted because it is in use.");
   });

   test("in use", () => {
       expect(getSampleStatusLockedMessage(new SampleState({
           rowId: 1,
           label: 'Available',
           stateType: SampleStateType.Available,
           inUse: true,
           containerPath: "/Test Project",
           isLocal: true
       }), false)).toBe("This sample status cannot change status type or be deleted because it is in use.");

   });

    test("in use and saving", () => {
        expect(getSampleStatusLockedMessage(new SampleState({
            rowId: 1,
            label: 'Available',
            stateType: SampleStateType.Available,
            inUse: true,
            containerPath: "/Test Project",
            isLocal: true
        }), true)).toBe("This sample status cannot change status type or be deleted because it is in use.");
    });

   test("not in use, not local", () => {
       expect(getSampleStatusLockedMessage(new SampleState({
           rowId: 1,
           label: 'Available',
           stateType: SampleStateType.Available,
           inUse: false,
           containerPath: "/Test Project",
           isLocal: false
       }), false)).toBe("This sample status can be changed only in the Test Project project.");

   });

   test("in use and not local", () => {
       expect(getSampleStatusLockedMessage(new SampleState({
           rowId: 1,
           label: 'Available',
           stateType: SampleStateType.Available,
           inUse: true,
           containerPath: "/Test Project",
           isLocal: false
       }), false)).toBe("This sample status cannot change status type or be deleted because it is in use and can be changed only in the Test Project project.");
   });

    test("in use, saving, and not local", () => {
        expect(getSampleStatusLockedMessage(new SampleState({
            rowId: 1,
            label: 'Available',
            stateType: SampleStateType.Available,
            inUse: true,
            containerPath: "/Test Project",
            isLocal: false
        }), true)).toBe("This sample status cannot change status type or be deleted because it is in use and can be changed only in the Test Project project.");
    });
});
