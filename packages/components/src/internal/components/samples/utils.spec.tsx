import React from 'react';

import { Filter } from '@labkey/api';

import { mount } from 'enzyme';
import { isFreezerManagementEnabled, isSampleStatusEnabled } from '../../app/utils';

import { TEST_USER_GUEST, TEST_USER_READER } from '../../userFixtures';

import {
    filterSampleRowsForOperation,
    getFilterForSampleOperation,
    getOmittedSampleTypeColumns,
    getOperationNotPermittedMessage,
    getSampleDeleteMessage,
    getSampleStatus,
    getSampleStatusType,
    getSampleTypeTemplateUrl,
    getSampleWizardURL,
    isSampleOperationPermitted,
    isSamplesSchema,
    SamplesEditButtonSections,
    shouldIncludeMenuItem
} from './utils';
import {SCHEMAS} from "../../schemas";
import {LoadingSpinner} from "../base/LoadingSpinner";
import {SAMPLE_STATE_TYPE_COLUMN_NAME, SAMPLE_STORAGE_COLUMNS, SampleOperation, SampleStateType} from "./constants";
import {OperationConfirmationData} from "../entities/models";
import {SchemaQuery} from "../../../public/SchemaQuery";
import {QueryInfo} from "../../../public/QueryInfo";

const CHECKED_OUT_BY_FIELD = SCHEMAS.INVENTORY.CHECKED_OUT_BY_FIELD;
const INVENTORY_COLS = SCHEMAS.INVENTORY.INVENTORY_COLS;

test('getOmittedSampleTypeColumn', () => {
    LABKEY.moduleContext = {};
    expect(isFreezerManagementEnabled()).toBeFalsy();
    expect(getOmittedSampleTypeColumns(TEST_USER_READER)).toStrictEqual(INVENTORY_COLS);
    expect(getOmittedSampleTypeColumns(TEST_USER_GUEST)).toStrictEqual([CHECKED_OUT_BY_FIELD].concat(INVENTORY_COLS));

    LABKEY.moduleContext = { inventory: {} };
    expect(isFreezerManagementEnabled()).toBeTruthy();
    expect(getOmittedSampleTypeColumns(TEST_USER_READER)).toStrictEqual([]);
    expect(getOmittedSampleTypeColumns(TEST_USER_GUEST)).toStrictEqual([CHECKED_OUT_BY_FIELD]);
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
            'This sample cannot be deleted because it has either derived sample, job, or assay data dependencies, or status that prevents deletion.'
        );
    });

    test('cannot delete with error', () => {
        LABKEY.moduleContext = {};
        const wrapper = mount(<span>{getSampleDeleteMessage(false, true)}</span>);
        expect(wrapper.text()).toContain(
            'This sample cannot be deleted because there was a problem loading the delete confirmation data.'
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

describe('shouldIncludeMenuItem', () => {
    test('undefined excludedMenuKeys', () => {
        expect(shouldIncludeMenuItem(undefined, undefined)).toBeTruthy();
        expect(shouldIncludeMenuItem(SamplesEditButtonSections.IMPORT, undefined)).toBeTruthy();
        expect(shouldIncludeMenuItem(undefined, [])).toBeTruthy();
        expect(shouldIncludeMenuItem(SamplesEditButtonSections.IMPORT, [])).toBeTruthy();
    });

    test('with excludedMenuKeys', () => {
        expect(shouldIncludeMenuItem(undefined, [SamplesEditButtonSections.IMPORT])).toBeTruthy();
        expect(
            shouldIncludeMenuItem(SamplesEditButtonSections.DELETE, [SamplesEditButtonSections.IMPORT])
        ).toBeTruthy();
        expect(shouldIncludeMenuItem(SamplesEditButtonSections.IMPORT, [SamplesEditButtonSections.IMPORT])).toBeFalsy();
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

describe('getSampleTypeTemplateUrl', () => {
    const BASE_URL =
        '/labkey/query/ExportExcelTemplate.view?exportAlias.name=Sample%20ID&exportAlias.aliquotedFromLSID=AliquotedFrom&exportAlias.sampleState=Status&schemaName=schema&query.queryName=query&headerType=DisplayFieldKey&excludeColumn=flag&excludeColumn=Ancestors&includeColumn=StorageLocation&includeColumn=StorageRow&includeColumn=StorageCol&includeColumn=StoredAmount&includeColumn=Units&includeColumn=FreezeThawCount&includeColumn=EnteredStorage&includeColumn=CheckedOut&includeColumn=CheckedOutBy&includeColumn=StorageComment&includeColumn=AliquotedFrom';

    test('no schemaQuery', () => {
        expect(getSampleTypeTemplateUrl(QueryInfo.create({}), undefined)).toBe(undefined);
    });

    test('without importAliases', () => {
        const qInfo = QueryInfo.fromJSON({ schemaName: 'schema', name: 'query', columns: {} });
        expect(getSampleTypeTemplateUrl(qInfo, undefined)).toBe(BASE_URL);
    });

    test('with importAliases', () => {
        const qInfo = QueryInfo.fromJSON({ schemaName: 'schema', name: 'query', columns: {} });
        expect(
            getSampleTypeTemplateUrl(qInfo, { a: '1', b: '2' }).indexOf('&includeColumn=a&includeColumn=b') > -1
        ).toBeTruthy();
    });

    test('with columns to exclude', () => {
        const qInfo = QueryInfo.fromJSON({
            schemaName: 'schema',
            name: 'query',
            columns: {
                nonFileCol: { fieldKey: 'nonFileCol', inputType: 'text' },
                fileCol: { fieldKey: 'fileCol', inputType: 'file' },
            },
        });
        expect(getSampleTypeTemplateUrl(qInfo, undefined).indexOf('&excludeColumn=fileCol') > -1).toBeTruthy();
    });

    test('with extra excluded columns', () => {
        const qInfo = QueryInfo.fromJSON({ schemaName: 'schema', name: 'query', columns: {} });
        const url = getSampleTypeTemplateUrl(qInfo, { a: '1', b: '2' }, ['flag', 'alias']);
        expect(url.indexOf('&includeColumn=a&includeColumn=b') > 1).toBeTruthy();
        expect(url.indexOf('&excludeColumn=flag&excludeColumn=alias') > -1).toBeTruthy();
    });

    test('with no exportConfig, exclude storage', () => {
        const qInfo = QueryInfo.fromJSON({ schemaName: 'schema', name: 'query', columns: {} });
        const url = getSampleTypeTemplateUrl(qInfo, undefined, SAMPLE_STORAGE_COLUMNS, {});
        expect(url.indexOf('exportAlias.name=SampleID')).toBe(-1);
        expect(url.indexOf('exportAlias.aliquotedFromLSID=AliquotedFrom')).toBe(-1);
        expect(url.indexOf('exportAlias.sampleState=Status')).toBe(-1);
        SAMPLE_STORAGE_COLUMNS.forEach(col => {
            expect(url.indexOf('includeColumn=' + col)).toBe(-1);
        });
    });
});

describe('getSampleWizardURL', () => {
    test('default props', () => {
        expect(getSampleWizardURL().toHref()).toBe('#/samples/new');
    });

    test('targetSampleSet', () => {
        expect(getSampleWizardURL('target1').toHref()).toBe('#/samples/new?target=target1');
    });

    test('parent', () => {
        expect(getSampleWizardURL(undefined, 'parent1').toHref()).toBe('#/samples/new?parent=parent1');
    });

    test('targetSampleSet and parent', () => {
        expect(getSampleWizardURL('target1', 'parent1').toHref()).toBe('#/samples/new?target=target1&parent=parent1');
    });

    test('targetSampleSet and parent and selectionKey', () => {
        expect(getSampleWizardURL('target1', 'parent1', 'grid-1|samples|type1').toHref()).toBe(
            '#/samples/new?target=target1&parent=parent1&selectionKey=grid-1%7Csamples%7Ctype1'
        );
    });

    test('default props, with productId', () => {
        expect(getSampleWizardURL(null, null, null, 'from', 'to').toString()).toBe('/labkey/to/app.view#/samples/new');
    });

    test('targetSampleSet, with productId', () => {
        expect(getSampleWizardURL('target1', null, null, 'from', 'to').toString()).toBe(
            '/labkey/to/app.view#/samples/new?target=target1'
        );
    });

    test('parent, with productId', () => {
        expect(getSampleWizardURL(undefined, 'parent1', null, 'from', 'to').toString()).toBe(
            '/labkey/to/app.view#/samples/new?parent=parent1'
        );
    });

    test('targetSampleSet and parent, with productId', () => {
        expect(getSampleWizardURL('target1', 'parent1', null, 'from', 'to').toString()).toBe(
            '/labkey/to/app.view#/samples/new?target=target1&parent=parent1'
        );
    });

    test('targetSampleSet and parent and selectionKey, with productId', () => {
        expect(getSampleWizardURL('target1', 'parent1', 'grid-1|samples|type1', 'from', 'to').toString()).toBe(
            '/labkey/to/app.view#/samples/new?target=target1&parent=parent1&selectionKey=grid-1%7Csamples%7Ctype1'
        );
    });
});
