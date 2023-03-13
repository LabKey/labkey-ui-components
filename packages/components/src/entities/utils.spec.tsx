import React from 'react';
import { mount } from 'enzyme';
import { Map, List } from 'immutable';
import { Filter } from '@labkey/api';

import { SamplesEditButtonSections } from '../internal/components/samples/utils';
import {
    ALIQUOT_FILTER_MODE,
    SAMPLE_STATE_TYPE_COLUMN_NAME,
    SAMPLE_STORAGE_COLUMNS,
    SampleOperation,
    SampleStateType,
} from '../internal/components/samples/constants';
import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';
import { QueryInfo } from '../public/QueryInfo';

import { SchemaQuery } from '../public/SchemaQuery';
import { EntityChoice } from '../internal/components/entities/models';

import { makeQueryInfo } from '../internal/testHelpers';
import mixturesQueryInfo from '../test/data/mixtures-getQueryDetails.json';
import { DataClassDataType, SampleTypeDataType } from '../internal/components/entities/constants';

import { AssayStateModel } from '../internal/components/assay/models';
import { LoadingState } from '../public/LoadingState';
import { AssayDefinitionModel } from '../internal/AssayDefinitionModel';
import assayDefJSON from '../test/data/assayDefinitionModel.json';
import assayDefNoSampleIdJSON from '../test/data/assayDefinitionModelNoSampleId.json';
import sampleSet2QueryInfo from '../test/data/sampleSet2-getQueryDetails.json';

import { makeTestQueryModel } from '../public/QueryModel/testUtils';
import { ASSAY_DEFINITION_MODEL, TEST_ASSAY_STATE_MODEL } from '../test/data/constants';
import { getTestAPIWrapper } from '../internal/APIWrapper';
import { getSamplesTestAPIWrapper } from '../internal/components/samples/APIWrapper';

import { GENERAL_ASSAY_PROVIDER_NAME } from '../internal/components/assay/constants';

import {
    TEST_LKS_STARTER_MODULE_CONTEXT,
    TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
    TEST_LKSM_STARTER_AND_WORKFLOW_MODULE_CONTEXT,
    TEST_LKSM_STARTER_MODULE_CONTEXT,
} from '../internal/productFixtures';

import {
    getSampleWizardURL,
    filterMediaSampleTypes,
    filterSampleRowsForOperation,
    getCrossFolderSelectionMsg,
    shouldIncludeMenuItem,
    getSampleDeleteMessage,
    getSampleTypeTemplateUrl,
    createEntityParentKey,
    parentValuesDiffer,
    getUpdatedLineageRowsForBulkEdit,
    getImportItemsForAssayDefinitions,
    getSamplesAssayGridQueryConfigs,
    getJobCreationHref,
    processSampleBulkAdd,
} from './utils';

describe('getCrossFolderSelectionMsg', () => {
    test('without cross folder selection', () => {
        expect(getCrossFolderSelectionMsg(0, 0, 'sample', 'samples')).toBeUndefined();
        expect(getCrossFolderSelectionMsg(0, 1, 'sample', 'samples')).toBeUndefined();
    });
    test('with cross folder selection and without current folder selection', () => {
        expect(getCrossFolderSelectionMsg(1, 0, 'sample', 'samples')).toBe(
            'The sample you selected does not belong to this project. Please select samples from only this project, or navigate to the appropriate project to work with them.'
        );
        expect(getCrossFolderSelectionMsg(2, 0, 'sample', 'samples')).toBe(
            "The samples you selected don't belong to this project. Please select samples from only this project, or navigate to the appropriate project to work with them."
        );
    });
    test('with cross folder selection and with current folder selection', () => {
        expect(getCrossFolderSelectionMsg(1, 1, 'sample', 'samples')).toBe(
            "Some of the samples you selected don't belong to this project. Please select samples from only this project, or navigate to the appropriate project to work with them."
        );
        expect(getCrossFolderSelectionMsg(2, 1, 'sample', 'samples')).toBe(
            "Some of the samples you selected don't belong to this project. Please select samples from only this project, or navigate to the appropriate project to work with them."
        );
        expect(getCrossFolderSelectionMsg(1, 2, 'sample', 'samples')).toBe(
            "Some of the samples you selected don't belong to this project. Please select samples from only this project, or navigate to the appropriate project to work with them."
        );
        expect(getCrossFolderSelectionMsg(2, 2, 'sample', 'samples')).toBe(
            "Some of the samples you selected don't belong to this project. Please select samples from only this project, or navigate to the appropriate project to work with them."
        );
        expect(getCrossFolderSelectionMsg(2, 2, 'data', 'data')).toBe(
            "Some of the data you selected don't belong to this project. Please select data from only this project, or navigate to the appropriate project to work with them."
        );
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

describe('filterMediaSampleTypes', () => {
    test('expected filter', () => {
        expect(filterMediaSampleTypes().length).toEqual(1);
        expect(filterMediaSampleTypes(true).length).toEqual(0);

        const excludeMediaFilters = filterMediaSampleTypes(false);
        expect(excludeMediaFilters.length).toEqual(1);
        const filter = excludeMediaFilters[0];
        expect(filter.getColumnName()).toEqual('category');
        expect(filter.getValue()).toEqual('media');
        expect(filter.getFilterType()).toEqual(Filter.Types.NEQ_OR_NULL);
    });
});

describe('filterSampleRowsForOperation', () => {
    const availableRow1 = {
        rowId: { value: 1 },
        Name: { value: 1, displayValue: 'T-1' },
        [SAMPLE_STATE_TYPE_COLUMN_NAME]: { value: SampleStateType.Available },
    };
    const availableRow2 = {
        rowId: { value: 2 },
        Name: { value: 2, displayValue: 'T-2' },
        [SAMPLE_STATE_TYPE_COLUMN_NAME]: { value: SampleStateType.Available },
    };
    const consumedRow1 = {
        rowId: { value: 20 },
        name: { value: 20, displayValue: 'T-20' },
        [SAMPLE_STATE_TYPE_COLUMN_NAME]: { value: SampleStateType.Consumed },
    };
    const lockedRow1 = {
        rowId: { value: 30 },
        name: { value: 30, displayValue: 'T-30' },
        [SAMPLE_STATE_TYPE_COLUMN_NAME]: { value: SampleStateType.Locked },
    };
    const lockedRow2 = {
        rowId: { value: 31 },
        Name: { value: 310, displayValue: 'T-310' },
        [SAMPLE_STATE_TYPE_COLUMN_NAME]: { value: SampleStateType.Locked },
    };

    function validate(
        rows: { [p: string]: any },
        operation: SampleOperation,
        numAllowed: number,
        numNotAllowed: number
    ): void {
        const filteredData = filterSampleRowsForOperation(rows, operation, 'RowId', 'Name', {
            api: { moduleNames: ['samplemanagement'] },
        });
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
        const data = {
            1: availableRow1,
            2: availableRow2,
        };
        validate(data, SampleOperation.UpdateStorageMetadata, 2, 0);
    });

    test('all locked', () => {
        const data = {
            30: lockedRow1,
            31: lockedRow2,
        };
        validate(data, SampleOperation.EditMetadata, 0, 2);
        validate(data, SampleOperation.AddToPicklist, 2, 0);
    });

    test('mixed statuses', () => {
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
        expect(getSampleWizardURL(null, null, null, undefined, 'from', 'to').toString()).toBe(
            '/labkey/to/app.view#/samples/new'
        );
    });

    test('targetSampleSet, with productId', () => {
        expect(getSampleWizardURL('target1', null, null, undefined, 'from', 'to').toString()).toBe(
            '/labkey/to/app.view#/samples/new?target=target1'
        );
    });

    test('parent, with productId', () => {
        expect(getSampleWizardURL(undefined, 'parent1', null, undefined, 'from', 'to').toString()).toBe(
            '/labkey/to/app.view#/samples/new?parent=parent1'
        );
    });

    test('targetSampleSet and parent, with productId', () => {
        expect(getSampleWizardURL('target1', 'parent1', null, undefined, 'from', 'to').toString()).toBe(
            '/labkey/to/app.view#/samples/new?target=target1&parent=parent1'
        );
    });

    test('targetSampleSet and parent and selectionKey, with productId', () => {
        expect(
            getSampleWizardURL('target1', 'parent1', 'grid-1|samples|type1', undefined, 'from', 'to').toString()
        ).toBe('/labkey/to/app.view#/samples/new?target=target1&parent=parent1&selectionKey=grid-1%7Csamples%7Ctype1');
    });

    test('use snapshot selection', () => {
        expect(getSampleWizardURL('target1', 'parent1', 'grid-1|samples|type1', true).toHref()).toBe(
            '#/samples/new?target=target1&parent=parent1&selectionKey=grid-1%7Csamples%7Ctype1&selectionKeyType=snapshot'
        );
    });
});

describe('getSampleDeleteMessage', () => {
    test('loading', () => {
        LABKEY.moduleContext = {};
        const wrapper = mount(<span>{getSampleDeleteMessage(undefined, false)}</span>);
        expect(wrapper.find(LoadingSpinner).exists()).toBeTruthy();
    });

    test('cannot delete, professional', () => {
        LABKEY.moduleContext = { ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT };
        const wrapper = mount(<span>{getSampleDeleteMessage(false, false)}</span>);
        expect(wrapper.find(LoadingSpinner).exists()).toBeFalsy();
        expect(wrapper.text()).toContain(
            'This sample cannot be deleted because it has either derived sample, job, or assay data dependencies, status that prevents deletion, or references in one or more active notebooks.'
        );
    });

    test('cannot delete with error', () => {
        LABKEY.moduleContext = {};
        const wrapper = mount(<span>{getSampleDeleteMessage(false, true)}</span>);
        expect(wrapper.text()).toContain(
            'This sample cannot be deleted because there was a problem loading the delete confirmation data.'
        );
    });

    test('cannot delete, no workflow', () => {
        LABKEY.moduleContext = { ...TEST_LKS_STARTER_MODULE_CONTEXT };
        const wrapper = mount(<span>{getSampleDeleteMessage(false, false)}</span>);
        expect(wrapper.find(LoadingSpinner).exists()).toBeFalsy();
        expect(wrapper.text()).toContain(
            'This sample cannot be deleted because it has either derived sample or assay data dependencies, or status that prevents deletion.'
        );
    });

    test('cannot delete, workflow no assay', () => {
        LABKEY.moduleContext = { ...TEST_LKSM_STARTER_AND_WORKFLOW_MODULE_CONTEXT };
        const wrapper = mount(<span>{getSampleDeleteMessage(false, false)}</span>);
        expect(wrapper.find(LoadingSpinner).exists()).toBeFalsy();
        expect(wrapper.text()).toContain(
            'This sample cannot be deleted because it has either derived sample or job dependencies, or status that prevents deletion.'
        );
    });

    test('cannot delete no workflow or assay', () => {
        LABKEY.moduleContext = { ...TEST_LKSM_STARTER_MODULE_CONTEXT };
        const wrapper = mount(<span>{getSampleDeleteMessage(false, false)}</span>);
        expect(wrapper.find(LoadingSpinner).exists()).toBeFalsy();
        expect(wrapper.text()).toContain(
            'This sample cannot be deleted because it has derived sample dependencies or status that prevents deletion.'
        );
    });
});

describe('getSampleTypeTemplateUrl', () => {
    const BASE_URL =
        '/labkey/query/ExportExcelTemplate.view?' +
        'exportAlias.name=Sample%20ID' +
        '&exportAlias.aliquotedFromLSID=AliquotedFrom' +
        '&exportAlias.sampleState=Status' +
        '&exportAlias.storedAmount=Amount' +
        '&schemaName=schema' +
        '&query.queryName=query' +
        '&headerType=DisplayFieldKey' +
        '&excludeColumn=flag' +
        '&excludeColumn=Ancestors' +
        '&excludeColumn=RawAmount' +
        '&excludeColumn=RawUnits' +
        '&includeColumn=StoredAmount' +
        '&includeColumn=Units' +
        '&includeColumn=StorageLocation' +
        '&includeColumn=StorageRow' +
        '&includeColumn=StorageCol' +
        '&includeColumn=FreezeThawCount' +
        '&includeColumn=EnteredStorage' +
        '&includeColumn=CheckedOut' +
        '&includeColumn=CheckedOutBy' +
        '&includeColumn=StorageComment' +
        '&includeColumn=AliquotedFrom' +
        '&filenamePrefix=query';

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

    test('with queryInfo importTemplates', () => {
        const qInfo = QueryInfo.fromJSON({
            schemaName: 'schema',
            name: 'query',
            columns: {},
            importTemplates: [{ url: 'www.labkey.com' }],
        });
        expect(getSampleTypeTemplateUrl(qInfo, undefined)).toBe('www.labkey.com');
    });
});

describe('createEntityParentKey', () => {
    test('without id', () => {
        expect(createEntityParentKey(new SchemaQuery('schema', 'query'))).toBe('schema:query');
    });
    test('with id', () => {
        expect(createEntityParentKey(new SchemaQuery('schema', 'query'), 'id')).toBe('schema:query:id');
    });
});

describe('parentValuesDiffer', () => {
    test('empty lists', () => {
        expect(parentValuesDiffer(List<EntityChoice>(), List<EntityChoice>())).toBe(false);
    });
    const original = List<EntityChoice>([
        {
            type: {
                lsid: 'lsid1',
                rowId: 1,
                label: 'Label 1',
            },
            ids: ['id1', 'id2'],
            value: 'Val1,Val2',
        },
        {
            type: {
                lsid: 'lsid2',
                rowId: 2,
                label: 'Label 2',
            },
            ids: ['id3'],
            value: 'Val3',
        },
    ]);

    test('non-empty without differences', () => {
        const current = List<EntityChoice>([
            {
                type: {
                    lsid: 'lsid1',
                    rowId: 1,
                    label: 'Label 1',
                },
                ids: ['id1', 'id2'],
                value: 'Val1,Val2',
            },
            {
                type: {
                    lsid: 'lsid2',
                    rowId: 2,
                    label: 'Label 2',
                },
                ids: ['id3'],
                value: 'Val3',
            },
        ]);
        expect(parentValuesDiffer(original, current)).toBe(false);
    });

    test('order change only', () => {
        const current = List<EntityChoice>([
            {
                type: {
                    lsid: 'lsid2',
                    rowId: 2,
                    label: 'Label 2',
                },
                ids: ['id3'],
                value: 'Val3',
            },
            {
                type: {
                    lsid: 'lsid1',
                    rowId: 1,
                    label: 'Label 1',
                },
                ids: ['id1', 'id2'],
                value: 'Val1,Val2',
            },
        ]);
        expect(parentValuesDiffer(original, current)).toBe(false);
    });

    test('original list smaller', () => {
        const original = List<EntityChoice>([
            {
                type: {
                    lsid: 'lsid1',
                    rowId: 1,
                    label: 'Label 1',
                },
                ids: ['id1', 'id2'],
                value: 'Val1,Val2',
            },
        ]);
        const current = List<EntityChoice>([
            {
                type: {
                    lsid: 'lsid2',
                    rowId: 2,
                    label: 'Label 2',
                },
                ids: ['id3'],
                value: 'Val3',
            },
            {
                type: {
                    lsid: 'lsid1',
                    rowId: 1,
                    label: 'Label 1',
                },
                ids: ['id1', 'id2'],
                value: 'Val1,Val2',
            },
        ]);
        expect(parentValuesDiffer(original, current)).toBe(true);
    });

    test('original list larger', () => {
        const current = List<EntityChoice>([
            {
                type: {
                    lsid: 'lsid2',
                    rowId: 2,
                    label: 'Label 2',
                },
                ids: ['id3'],
                value: 'Val3',
            },
        ]);
        expect(parentValuesDiffer(original, current)).toBe(true);
    });

    test('same size, different types', () => {
        const current = List<EntityChoice>([
            {
                type: {
                    lsid: 'lsid31',
                    rowId: 31,
                    label: 'Label 31',
                },
                ids: ['id3.1'],
                value: 'Val3.1',
            },
            {
                type: {
                    lsid: 'lsid2',
                    rowId: 2,
                    label: 'Label 2',
                },
                ids: ['id3'],
                value: 'Val3',
            },
        ]);
        expect(parentValuesDiffer(original, current)).toBe(true);
    });

    test('same types, different values', () => {
        const current = List<EntityChoice>([
            {
                type: {
                    lsid: 'lsid1',
                    rowId: 1,
                    label: 'Label 1',
                },
                ids: ['id1', 'id2'],
                value: 'Val2,Val1.1',
            },
            {
                type: {
                    lsid: 'lsid2',
                    rowId: 2,
                    label: 'Label 2',
                },
                ids: ['id3'],
                value: 'Val3',
            },
        ]);
        expect(parentValuesDiffer(original, current)).toBe(true);
    });

    test('same types, same values, different order', () => {
        const current = List<EntityChoice>([
            {
                type: {
                    lsid: 'lsid1',
                    rowId: 1,
                    label: 'Label 1',
                },
                ids: ['id1', 'id2'],
                value: 'Val2,Val1',
            },
            {
                type: {
                    lsid: 'lsid2',
                    rowId: 2,
                    label: 'Label 2',
                },
                ids: ['id3'],
                value: 'Val3',
            },
        ]);
        expect(parentValuesDiffer(original, current)).toBe(false);
    });

    test('current list with unspecified type', () => {
        const current = List<EntityChoice>([
            {
                type: {
                    lsid: 'lsid1',
                    rowId: 1,
                    label: 'Label 1',
                },
                ids: ['id1', 'id2'],
                value: 'Val1,Val2',
            },
            {
                type: {
                    lsid: 'lsid2',
                    rowId: 2,
                    label: 'Label 2',
                },
                ids: ['id3'],
                value: 'Val3',
            },
            {
                type: {
                    lsid: undefined,
                    label: undefined,
                    rowId: undefined,
                },
            },
        ]);
        expect(parentValuesDiffer(original, current)).toBe(false);
    });

    test('current list with new type specified but no value', () => {
        const current = List<EntityChoice>([
            {
                type: {
                    lsid: 'lsid1',
                    rowId: 1,
                    label: 'Label 1',
                },
                ids: ['id1', 'id2'],
                value: 'Val1,Val2',
            },
            {
                type: {
                    lsid: 'lsid2',
                    rowId: 2,
                    label: 'Label 2',
                },
                ids: ['id3'],
                value: 'Val3',
            },
            {
                type: {
                    lsid: undefined,
                    label: 'Label 4',
                    rowId: 4,
                },
                ids: undefined,
                value: undefined,
            },
        ]);
        expect(parentValuesDiffer(original, current)).toBe(false);
    });
});

describe('getUpdatedLineageRowsForBulkEdit', () => {
    const QUERY_INFO = makeQueryInfo(mixturesQueryInfo);
    const original1 = List<EntityChoice>([
        {
            gridValues: [
                {
                    displayValue: 'Val1',
                },
                {
                    displayValue: 'Val2',
                },
            ],
            type: {
                lsid: 'lsid1',
                rowId: 1,
                label: 'Label 1',
            },
            ids: ['id1.1', 'id1.2'],
            value: undefined,
        },
        {
            gridValues: [
                {
                    displayValue: 'Val3',
                },
            ],
            type: {
                lsid: 'lsid2',
                rowId: 2,
                label: 'Label 2',
            },
            ids: ['id2.1'],
            value: undefined,
        },
    ]);
    const original2 = List<EntityChoice>([
        {
            gridValues: [
                {
                    displayValue: 'Val1',
                },
            ],
            type: {
                lsid: 'lsid1',
                rowId: 1,
                label: 'Label 1',
            },
            ids: ['id1.1'],
            value: 'Val1',
        },
    ]);

    const selected = List<EntityChoice>([
        {
            type: {
                lsid: 'lsid1',
                rowId: 1,
                label: 'Label 1',
                entityDataType: SampleTypeDataType,
            },
            ids: ['id1.1', 'id1.2'],
            value: 'Val1,Val2',
        },
    ]);
    const samples = {
        '1': {
            rowId: {
                value: '1',
            },
        },
        '2': {
            rowId: {
                value: '2',
            },
        },
    };
    test('no samples', () => {
        expect(getUpdatedLineageRowsForBulkEdit({}, selected, {}, QUERY_INFO)).toStrictEqual([]);
    });

    test('no selected parents', () => {
        expect(
            getUpdatedLineageRowsForBulkEdit(
                samples,
                List<EntityChoice>(),
                {
                    '1': original1,
                },
                QUERY_INFO
            )
        ).toStrictEqual([]);
    });

    test('no original parents', () => {
        const rows = getUpdatedLineageRowsForBulkEdit(
            samples,
            selected,
            { '1': List<EntityChoice>(), '2': List<EntityChoice>() },
            QUERY_INFO
        );
        expect(rows).toStrictEqual([
            {
                RowId: '1',
                'MaterialInputs/Label 1': 'Val1,Val2',
            },
            {
                RowId: '2',
                'MaterialInputs/Label 1': 'Val1,Val2',
            },
        ]);
    });

    test('change one original parent', () => {
        const rows = getUpdatedLineageRowsForBulkEdit(
            samples,
            selected,
            { '1': original1, '2': original2 },
            QUERY_INFO
        );
        expect(rows).toStrictEqual([
            {
                RowId: '2',
                'MaterialInputs/Label 1': 'Val1,Val2',
            },
        ]);
    });

    test('remove one of many original parents', () => {
        const selected = List<EntityChoice>([
            {
                type: {
                    lsid: 'lsid2',
                    rowId: 2,
                    label: 'Label 2',
                    entityDataType: SampleTypeDataType,
                },
                ids: [],
                value: undefined,
            },
        ]);
        const rows = getUpdatedLineageRowsForBulkEdit(
            samples,
            selected,
            { '1': original1, '2': original2 },
            QUERY_INFO
        );
        expect(rows).toHaveLength(1);
        expect(rows).toStrictEqual([
            {
                RowId: '1',
                'MaterialInputs/Label 2': null,
            },
        ]);
    });

    test('remove original parent entirely', () => {
        const selected = List<EntityChoice>([
            {
                type: {
                    lsid: 'lsid1',
                    rowId: 1,
                    label: 'Label 1',
                    entityDataType: SampleTypeDataType,
                },
                ids: ['id1.1'],
                value: 'Val1',
            },
        ]);
        const rows = getUpdatedLineageRowsForBulkEdit(
            samples,
            selected,
            { '1': original1, '2': original2 },
            QUERY_INFO
        );
        expect(rows).toStrictEqual([
            {
                RowId: '1',
                'MaterialInputs/Label 1': 'Val1',
            },
        ]);
    });

    test('multiple updates', () => {
        const selected = List<EntityChoice>([
            {
                type: {
                    lsid: 'lsid1',
                    rowId: 1,
                    label: 'Label 1',
                    entityDataType: SampleTypeDataType,
                },
                ids: ['id1.2'],
                value: 'Val2',
            },
            {
                type: {
                    lsid: 'lsid2',
                    rowId: 2,
                    label: 'Label 2',
                    entityDataType: SampleTypeDataType,
                },
                ids: [],
                value: undefined,
            },
        ]);
        const rows = getUpdatedLineageRowsForBulkEdit(
            samples,
            selected,
            { '1': original1, '2': original2 },
            QUERY_INFO
        );
        expect(rows).toStrictEqual([
            {
                RowId: '1',
                'MaterialInputs/Label 1': 'Val2',
                'MaterialInputs/Label 2': null,
            },
            {
                RowId: '2',
                'MaterialInputs/Label 1': 'Val2',
            },
        ]);
    });

    test('parents same except for ordering', () => {
        const selected = List<EntityChoice>([
            {
                type: {
                    lsid: 'lsid1',
                    rowId: 1,
                    label: 'Label 1',
                    entityDataType: SampleTypeDataType,
                },
                ids: ['id1.2, id1.1'],
                value: 'Val2,Val1',
            },
        ]);
        const rows = getUpdatedLineageRowsForBulkEdit(
            samples,
            selected,
            { '1': original1, '2': original2 },
            QUERY_INFO
        );
        expect(rows).toStrictEqual([
            {
                RowId: '2',
                'MaterialInputs/Label 1': 'Val1,Val2',
            },
        ]);
    });
});

describe('getImportItemsForAssayDefinitions', () => {
    test('empty list', () => {
        const sampleModel = makeTestQueryModel(new SchemaQuery('samples', 'samples'));
        const items = getImportItemsForAssayDefinitions(new AssayStateModel(), sampleModel);
        expect(items.size).toBe(0);
    });

    test('with expected match', () => {
        const assayStateModel = new AssayStateModel({ definitions: [ASSAY_DEFINITION_MODEL] });
        let queryInfo = QueryInfo.create(sampleSet2QueryInfo);

        // with a query name that DOES NOT match the assay def sampleColumn lookup
        queryInfo = queryInfo.set('schemaQuery', new SchemaQuery('samples', 'Sample set 1')) as QueryInfo;
        let sampleModel = makeTestQueryModel(queryInfo.schemaQuery, queryInfo);
        let items = getImportItemsForAssayDefinitions(assayStateModel, sampleModel);
        expect(items.size).toBe(0);

        // with a query name that DOES match the assay def sampleColumn lookup
        queryInfo = queryInfo.set('schemaQuery', new SchemaQuery('samples', 'Sample set 10')) as QueryInfo;
        sampleModel = makeTestQueryModel(queryInfo.schemaQuery, queryInfo);
        items = getImportItemsForAssayDefinitions(assayStateModel, sampleModel);
        expect(items.size).toBe(1);
    });

    test('providerType filter', () => {
        let items = getImportItemsForAssayDefinitions(TEST_ASSAY_STATE_MODEL, undefined, undefined);
        expect(items.size).toBe(5);
        items = getImportItemsForAssayDefinitions(TEST_ASSAY_STATE_MODEL, undefined, GENERAL_ASSAY_PROVIDER_NAME);
        expect(items.size).toBe(2);
        items = getImportItemsForAssayDefinitions(TEST_ASSAY_STATE_MODEL, undefined, 'NAb');
        expect(items.size).toBe(1);
    });
});

describe('getSamplesAssayGridQueryConfigs', () => {
    const modelWithSampleId = AssayDefinitionModel.create(assayDefJSON);
    const modelWithoutSampleId = AssayDefinitionModel.create(assayDefNoSampleIdJSON);
    const ASSAY_STATE_MODEL = new AssayStateModel({
        definitionsLoadingState: LoadingState.LOADED,
        definitions: [modelWithSampleId, modelWithoutSampleId],
    });
    const sessionQueryResponse = {
        key: 'key',
        queries: { key: QueryInfo.create({ schemaName: 'exp', name: 'AssayRunsPerSample' }) },
        models: undefined,
        orderedModels: undefined,
    };

    test('default props', async () => {
        const configs = await getSamplesAssayGridQueryConfigs(
            getTestAPIWrapper(jest.fn, {
                samples: getSamplesTestAPIWrapper(jest.fn, {
                    createSessionAssayRunSummaryQuery: () => Promise.resolve(sessionQueryResponse),
                    getSampleAssayResultViewConfigs: () => Promise.resolve([]),
                }),
            }).samples,
            ASSAY_STATE_MODEL,
            'S-1',
            [{ RowId: { value: 1 }, Name: { value: 'S-1' } }],
            'suffix',
            'prefix'
        );
        expect(Object.keys(configs)).toStrictEqual(['prefix:5051:suffix', 'prefix:assayruncount:suffix']);
        expect(configs['prefix:5051:suffix'].baseFilters[0].getURLParameterValue()).toBe('1');
        expect(configs['prefix:assayruncount:suffix'].baseFilters[0].getURLParameterValue()).toBe('1');
    });

    test('sampleAssayResultViewConfigs', async () => {
        LABKEY.container.activeModules = ['testModule'];

        const configs = await getSamplesAssayGridQueryConfigs(
            getTestAPIWrapper(jest.fn, {
                samples: getSamplesTestAPIWrapper(jest.fn, {
                    createSessionAssayRunSummaryQuery: () => Promise.resolve(sessionQueryResponse),
                    getSampleAssayResultViewConfigs: () =>
                        Promise.resolve([
                            {
                                filterKey: 'testFilterKey',
                                moduleName: 'testModule',
                                queryName: 'testQuery',
                                schemaName: 'testSchema',
                                title: 'testTitle',
                            },
                        ]),
                }),
            }).samples,
            ASSAY_STATE_MODEL,
            'S-1',
            [{ RowId: { value: 1 }, Name: { value: 'S-1' } }],
            'suffix',
            'prefix'
        );
        expect(Object.keys(configs)).toStrictEqual([
            'prefix:5051:suffix',
            'prefix:assayruncount:suffix',
            'prefix:testTitle:S-1',
        ]);
        expect(configs['prefix:5051:suffix'].baseFilters[0].getURLParameterValue()).toBe('1');
        expect(configs['prefix:assayruncount:suffix'].baseFilters[0].getURLParameterValue()).toBe('1');
        expect(configs['prefix:testTitle:S-1'].baseFilters[0].getURLParameterValue()).toBe('1');
    });

    test('activeSampleAliquotType', async () => {
        const configs = await getSamplesAssayGridQueryConfigs(
            getTestAPIWrapper(jest.fn, {
                samples: getSamplesTestAPIWrapper(jest.fn, {
                    createSessionAssayRunSummaryQuery: () => Promise.resolve(sessionQueryResponse),
                    getSampleAssayResultViewConfigs: () => Promise.resolve([]),
                }),
            }).samples,
            ASSAY_STATE_MODEL,
            'S-1',
            [{ RowId: { value: 1 }, Name: { value: 'S-1' } }],
            'suffix',
            'prefix',
            undefined,
            true,
            ALIQUOT_FILTER_MODE.aliquots,
            [
                { RowId: { value: 1 }, Name: { value: 'S-1' } },
                { RowId: { value: 2 }, Name: { value: 'S-1-aliquot' } },
            ],
            'unfiltered'
        );
        expect(Object.keys(configs)).toStrictEqual([
            'prefix:5051:suffix',
            'prefix:assayruncount:suffix',
            'unfiltered:5051:suffix',
            'unfiltered:assayruncount:suffix',
        ]);
        expect(configs['prefix:5051:suffix'].baseFilters[0].getURLParameterValue()).toBe('1');
        expect(configs['prefix:assayruncount:suffix'].baseFilters[0].getURLParameterValue()).toBe('1');
        expect(configs['unfiltered:5051:suffix'].baseFilters[0].getURLParameterValue()).toBe('1;2');
        expect(configs['unfiltered:assayruncount:suffix'].baseFilters).toBeUndefined();
    });
});

describe('getJobCreationHref', () => {
    const schemaQuery = new SchemaQuery('s', 'q');
    const queryInfo = new QueryInfo({ pkCols: List(['pk']), schemaQuery });
    const modelId = 'id';
    const queryModel = makeTestQueryModel(schemaQuery, queryInfo, undefined, undefined, undefined, modelId);

    test('singleSelect', () => {
        expect(getJobCreationHref(queryModel)).toContain('selectionKey=id');
        const queryModelWithKeyValue = queryModel.mutate({ keyValue: 'key' });
        expect(getJobCreationHref(queryModelWithKeyValue)).toContain('selectionKey=appkey%7Cs%2Fq%7Ckey');
    });
    test('filters', () => {
        expect(getJobCreationHref(queryModel, undefined, true)).toBe('#/workflow/new?selectionKey=id');

        const queryModelWithFilters = queryModel.mutate({ filterArray: [Filter.create('TEST COL', 'TEST VALUE')] });
        expect(getJobCreationHref(queryModelWithFilters, undefined, true)).toBe(
            '#/workflow/new?selectionKey=id&query.TEST%20COL~eq=TEST%20VALUE'
        );
    });
    test('with filters but ignoreFilter', () => {
        expect(getJobCreationHref(queryModel, undefined, true)).toBe('#/workflow/new?selectionKey=id');

        const queryModelWithFilters = queryModel.mutate({ filterArray: [Filter.create('TEST COL', 'TEST VALUE')] });
        expect(
            getJobCreationHref(queryModelWithFilters, undefined, true, undefined, false, null, null, null, true)
        ).toBe('#/workflow/new?selectionKey=id');
    });
    test('templateId', () => {
        expect(getJobCreationHref(queryModel).indexOf('templateId')).toBe(-1);
        expect(getJobCreationHref(queryModel, 1)).toContain('templateId=1');
        expect(getJobCreationHref(queryModel, '1')).toContain('templateId=1');
    });
    test('samplesIncluded', () => {
        expect(getJobCreationHref(queryModel)).toBe('#/workflow/new?selectionKey=id&sampleTab=2');
        expect(getJobCreationHref(queryModel, undefined, true)).toBe('#/workflow/new?selectionKey=id');
    });
    test('picklistName', () => {
        expect(getJobCreationHref(queryModel).indexOf('picklistName')).toBe(-1);
        expect(getJobCreationHref(queryModel, undefined, false, 'name')).toContain('picklistName=name');
    });
    test('isAssay', () => {
        expect(getJobCreationHref(queryModel).indexOf('isAssay')).toBe(-1);
        expect(getJobCreationHref(queryModel, undefined, true, undefined, true)).toBe('#/workflow/new?selectionKey=id');
        expect(getJobCreationHref(queryModel, undefined, true, undefined, false, 'sampleFieldKey')).toBe(
            '#/workflow/new?selectionKey=id'
        );
        expect(getJobCreationHref(queryModel, undefined, true, undefined, true, 'sampleFieldKey')).toBe(
            '#/workflow/new?selectionKey=id&assayProtocol=s&isAssay=true&sampleFieldKey=sampleFieldKey'
        );
    });
    test('with product id', () => {
        expect(getJobCreationHref(queryModel, undefined, true, undefined, false, null, 'from', 'to')).toBe(
            '/labkey/to/app.view#/workflow/new?selectionKey=id'
        );
    });
});

describe('processSampleBulkAdd', () => {
    test('no parents', () => {
        const data = Map.of(
            'numItems',
            2,
            'creationType',
            'Derivatives',
            SampleTypeDataType.insertColumnNamePrefix,
            []
        );
        const result = processSampleBulkAdd(data, false);
        expect(result.validationMsg).toBe(undefined);
        expect(result.pivotKey).toBe(undefined);
        expect(result.pivotValues).toStrictEqual([]);
        expect(result.totalItems).toBe(2);
    });

    test('one parent', () => {
        const data = Map.of('numItems', 2, 'creationType', 'Derivatives', SampleTypeDataType.insertColumnNamePrefix, [
            's1',
        ]);
        const result = processSampleBulkAdd(data, false);
        expect(result.validationMsg).toBe(undefined);
        expect(result.pivotKey).toBe(undefined);
        expect(result.pivotValues).toStrictEqual([]);
        expect(result.totalItems).toBe(2);
    });

    test('derivatives, sampleParent', () => {
        const data = Map.of('numItems', 2, 'creationType', 'Derivatives', SampleTypeDataType.insertColumnNamePrefix, [
            's1,s2',
        ]);
        const result = processSampleBulkAdd(data, false);
        expect(result.validationMsg).toBe(undefined);
        expect(result.pivotKey).toBe('MaterialInputs/');
        expect(result.pivotValues).toStrictEqual(['s1', 's2']);
        expect(result.totalItems).toBe(4);
    });

    test('derivatives, dataClassParent', () => {
        const data = Map.of('numItems', 2, 'creationType', 'Derivatives', DataClassDataType.insertColumnNamePrefix, [
            'd1,d2',
        ]);
        const result = processSampleBulkAdd(data, false);
        expect(result.validationMsg).toBe(undefined);
        expect(result.pivotKey).toBe('DataInputs/');
        expect(result.pivotValues).toStrictEqual(['d1', 'd2']);
        expect(result.totalItems).toBe(4);
    });

    test('derivatives, multiple parent types', () => {
        const data = Map.of(
            'numItems',
            2,
            'creationType',
            'Derivatives',
            SampleTypeDataType.insertColumnNamePrefix,
            ['s1,s2'],
            DataClassDataType.insertColumnNamePrefix,
            ['d1,d2']
        );
        const result = processSampleBulkAdd(data, false);
        expect(result.validationMsg).toBe(
            'Only one source or parent with more than one value is allowed when creating non-pooled samples in bulk.'
        );
        expect(result.pivotKey).toBe(undefined);
        expect(result.pivotValues).toBe(undefined);
        expect(result.totalItems).toBe(undefined);
    });

    test('derivatives, multiple parent types, combineParentTypes', () => {
        const data = Map.of(
            'numItems',
            2,
            'creationType',
            'Derivatives',
            SampleTypeDataType.insertColumnNamePrefix,
            ['s1,s2'],
            DataClassDataType.insertColumnNamePrefix,
            ['d1,d2']
        );
        const result = processSampleBulkAdd(data, true);
        expect(result.validationMsg).toBe(
            'Only one parent type with more than one value is allowed when creating non-pooled samples in bulk.'
        );
        expect(result.pivotKey).toBe(undefined);
        expect(result.pivotValues).toBe(undefined);
        expect(result.totalItems).toBe(undefined);
    });

    test('pooled samples, sampleParent', () => {
        const data = Map.of(
            'numItems',
            2,
            'creationType',
            'Pooled Samples',
            SampleTypeDataType.insertColumnNamePrefix,
            ['s1,s2']
        );
        const result = processSampleBulkAdd(data, false);
        expect(result.validationMsg).toBe(undefined);
        expect(result.pivotKey).toBe(undefined);
        expect(result.pivotValues).toStrictEqual([]);
        expect(result.totalItems).toBe(2);
    });

    test('pooled samples, dataClassParent', () => {
        const data = Map.of('numItems', 2, 'creationType', 'Pooled Samples', DataClassDataType.insertColumnNamePrefix, [
            'd1,d2',
        ]);
        const result = processSampleBulkAdd(data, false);
        expect(result.validationMsg).toBe(undefined);
        expect(result.pivotKey).toBe('DataInputs/');
        expect(result.pivotValues).toStrictEqual(['d1', 'd2']);
        expect(result.totalItems).toBe(4);
    });

    test('pooled samples, multiple parent types', () => {
        const data = Map.of(
            'numItems',
            2,
            'creationType',
            'Pooled Samples',
            SampleTypeDataType.insertColumnNamePrefix,
            ['s1,s2'],
            DataClassDataType.insertColumnNamePrefix,
            ['d1,d2']
        );
        const result = processSampleBulkAdd(data, false);
        expect(result.validationMsg).toBe(undefined);
        expect(result.pivotKey).toBe('DataInputs/');
        expect(result.pivotValues).toStrictEqual(['d1', 'd2']);
        expect(result.totalItems).toBe(4);
    });

    test('pooled samples, multiple parent types, combineParentTypes', () => {
        const data = Map.of(
            'numItems',
            2,
            'creationType',
            'Pooled Samples',
            SampleTypeDataType.insertColumnNamePrefix,
            ['s1,s2'],
            DataClassDataType.insertColumnNamePrefix,
            ['d1,d2']
        );
        const result = processSampleBulkAdd(data, true);
        expect(result.validationMsg).toBe(undefined);
        expect(result.pivotKey).toBe('DataInputs/');
        expect(result.pivotValues).toStrictEqual(['d1', 'd2']);
        expect(result.totalItems).toBe(4);
    });
});
