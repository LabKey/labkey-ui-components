/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { List } from 'immutable';
import { Filter, PermissionRoles } from '@labkey/api';

import { AssayWizardModel } from '../../internal/components/assay/AssayWizardModel';

import { AssayDefinitionModel, AssayDomainTypes } from '../../internal/AssayDefinitionModel';
import { QueryInfo } from '../../public/QueryInfo';
import { IFile } from '../../internal/components/files/models';

import { SchemaQuery } from '../../public/SchemaQuery';
import { EntityDataType } from '../../internal/components/entities/models';

import assayWizardJSON from './assayWizardModel.json';

const ASSAY_DEFINITION_MODEL = AssayDefinitionModel.create(assayWizardJSON.assayDef);
export const ASSAY_WIZARD_MODEL = new AssayWizardModel({
    isInit: true,
    assayDef: ASSAY_DEFINITION_MODEL,
    batchColumns: ASSAY_DEFINITION_MODEL.getDomainColumns(AssayDomainTypes.BATCH),
    runColumns: ASSAY_DEFINITION_MODEL.getDomainColumns(AssayDomainTypes.RUN),
    queryInfo: QueryInfo.fromJsonForTests(assayWizardJSON.queryInfo),
});

export const FILES_DATA = List<IFile>([
    {
        name: 'exam.xlsx',
        description: "i'm an excel file",
        created: '2019-11-08 12:26:30.064',
        createdById: 1005,
        createdBy: 'Vader',
        iconFontCls: 'fa fa-file-excel-o',
        downloadUrl:
            '/labkey/sm/sampleManagement-downloadAttachments.view?jobId=282&names=exam.xlsx&returnUrl=%2Flabkey%2Fgpat3%2FsampleManagement-appDev.view%23%2Fworkflow%2F282%2Ffiles',
    },
    {
        name: 'xray.gif',
        description: "i'm gif",
        created: '2019-11-14 15:47:51.931',
        createdById: 1100,
        createdBy: 'Skywalker',
        iconFontCls: 'fa fa-file-image-o',
        downloadUrl:
            '/labkey/sm/sampleManagement-downloadAttachments.view?jobId=282&names=xray.gif&returnUrl=%2Flabkey%2Fgpat3%2FsampleManagement-appDev.view%23%2Fworkflow%2F282%2Ffiles',
    },
    {
        name: 'report.json',
        description: "i'm a json file",
        created: '2019-11-14 15:48:11.472',
        createdById: 1005,
        createdBy: 'Vader',
        iconFontCls: 'fa fa-file-o',
        downloadUrl:
            '/labkey/sm/sampleManagement-downloadAttachments.view?jobId=282&names=sreport.json&returnUrl=%2Flabkey%2Fgpat3%2FsampleManagement-appDev.view%23%2Fworkflow%2F282%2Ffiles',
    },
]);

export const FILES_DATA_2 = List<IFile>([
    {
        name: 'second.xlsx',
        description: "i'm a second excel file",
        created: '2019-11-08 12:26:30.064',
        createdById: 1005,
        createdBy: 'Someone',
        iconFontCls: 'fa fa-file-excel-o',
        downloadUrl:
            '/labkey/sm/sampleManagement-downloadAttachments.view?jobId=282&names=exam.xlsx&returnUrl=%2Flabkey%2Fgpat3%2FsampleManagement-appDev.view%23%2Fworkflow%2F282%2Ffiles',
    },
    {
        name: 'pretty.gif',
        description: "i'm a pretty gif",
        created: '2019-11-14 15:47:51.931',
        createdById: 1100,
        createdBy: 'Skywalker',
        iconFontCls: 'fa fa-file-image-o',
        downloadUrl:
            '/labkey/sm/sampleManagement-downloadAttachments.view?jobId=282&names=xray.gif&returnUrl=%2Flabkey%2Fgpat3%2FsampleManagement-appDev.view%23%2Fworkflow%2F282%2Ffiles',
    },
]);

export const DEFAULT_LIST_SETTINGS = {
    listId: 0,
    name: null,
    domainId: 0,
    keyName: null,
    keyType: null,
    titleColumn: null,
    description: null,
    lastIndexed: null,
    allowDelete: true,
    allowUpload: true,
    allowExport: true,
    discussionSetting: 0,
    entireListTitleTemplate: '',
    entireListIndexSetting: 0,
    entireListBodySetting: 0,
    eachItemTitleTemplate: '',
    eachItemBodySetting: 0,
    entireListIndex: false,
    entireListBodyTemplate: null,
    eachItemIndex: false,
    eachItemBodyTemplate: null,
    fileAttachmentIndex: false,
};

export const NEW_DATASET_MODEL_WITHOUT_DATASPACE = {
    datasetId: null,
    name: null,
    typeURI: null,
    category: null,
    visitDatePropertyName: null,
    keyProperty: null,
    demographicData: null,
    label: null,
    cohortId: null,
    tag: null,
    showByDefault: null,
    description: null,
    sourceAssayName: null,
    sourceAssayURL: null,
    dataSharing: null,
    definitionIsShared: false,
};

export const NEW_DATASET_MODEL_WITH_DATASPACE = {
    datasetId: null,
    name: null,
    typeURI: null,
    category: null,
    visitDatePropertyName: null,
    keyProperty: null,
    demographicData: null,
    label: null,
    cohortId: null,
    tag: null,
    showByDefault: null,
    description: null,
    sourceAssayName: null,
    sourceAssayURL: null,
    dataSharing: null,
    definitionIsShared: true,
};

export const SECURITY_ROLE_APPADMIN = PermissionRoles.ApplicationAdmin;
export const SECURITY_ROLE_FOLDERADMIN = PermissionRoles.FolderAdmin;
export const SECURITY_ROLE_EDITOR = PermissionRoles.Editor;
export const SECURITY_ROLE_AUTHOR = PermissionRoles.Author;
export const SECURITY_ROLE_READER = PermissionRoles.Reader;

export const JEST_SITE_ADMIN_USER_ID = 1004;

export const TIMELINE_DATA = [
    {
        rowId: 462022,
        eventType: 'samples',
        user: {
            value: 1005,
            urlType: 'user',
            displayValue: 'Vader',
        },
        timestamp: {
            value: '2020-04-04 21:57:36.941',
            formattedValue: '2020-04-04 21:57',
        },
        summary: 'Sample Registered',
        oldData: {},
        newData: {},
    },
    {
        rowId: 544,
        eventType: 'workflow',
        user: {
            value: 1005,
            urlType: 'user',
            displayValue: 'Vader',
        },
        timestamp: {
            value: '2020-04-04 22:57:36.941',
            formattedValue: '2020-04-04 22:57',
        },
        summary: 'Added to job',
        metadata: {
            'Job Name': {
                value: 687,
                urlType: 'workflow',
                displayValue: 'job-1',
            },
            'Job Owner': {
                value: 1005,
                urlType: 'user',
                displayValue: 'Vader',
            },
            'Job Status': 'In Progress',
        },
        entity: {
            value: 687,
            urlType: 'workflow',
            displayValue: 'job-1',
        },
    },
    {
        summary: 'Added to storage',
        eventType: 'inventory',
        user: { displayValue: 'xyang', urlType: 'user', value: 1005 },
        entity: { displayValue: 'S-1', value: 6, url: '/labkey/inventory0804/experiment-showMaterial.view?rowId=6' },
        rowId: 46,
        timestamp: { formattedValue: '2020-04-05 22:58', value: '2020-04-05 22:58:36.941' },
    },
    {
        rowId: 1548,
        eventType: 'assays',
        user: {
            value: 1005,
            urlType: 'user',
            displayValue: 'Vader',
        },
        timestamp: {
            value: '2020-04-08 22:57:36.941',
            formattedValue: '2020-04-08 22:57',
        },
        summary: 'Assay Data Uploaded',
        metadata: {
            Assay: {
                value: 'xlsx assay',
                urlType: 'assays',
                displayValue: 'XLSX Assay',
            },
            'Completed By': {
                value: 1005,
                urlType: 'user',
                displayValue: 'Vader',
            },
            Date: {
                value: '2020-04-08 21:57:36.941',
                formattedValue: '2020-04-08 21:57',
            },
        },
        entity: {
            value: 'xlsx assay',
            urlType: 'assays',
            displayValue: 'XLSX Assay',
        },
    },
    {
        rowId: 546,
        eventType: 'workflow',
        user: {
            value: 1038,
            urlType: 'user',
            displayValue: 'Test Lab User',
        },
        timestamp: {
            value: '2020-04-09 18:57:36.941',
            formattedValue: '2020-04-09 18:57',
        },
        summary: 'Added to job',
        metadata: {
            'Job Name': {
                value: 688,
                urlType: 'workflow',
                displayValue: 'job-3',
            },
            'Job Owner': {
                value: 1038,
                urlType: 'user',
                displayValue: 'Test Lab User',
            },
            'Job Status': 'In Progress',
        },
        entity: {
            value: 688,
            urlType: 'workflow',
            displayValue: 'job-3',
        },
    },
    {
        rowId: 547,
        eventType: 'workflow',
        user: {
            value: 1038,
            urlType: 'user',
            displayValue: 'Test Lab User',
        },
        timestamp: {
            value: '2020-04-09 19:57:36.941',
            formattedValue: '2020-04-09 19:57',
        },
        summary: 'Removed from job',
        metadata: {
            'Job Name': {
                value: 688,
                urlType: 'workflow',
                displayValue: 'job-3',
            },
            'Job Owner': {
                value: 1038,
                urlType: 'user',
                displayValue: 'Test Lab User',
            },
            'Job Status': 'In Progress',
        },
        entity: {
            value: 688,
            urlType: 'workflow',
            displayValue: 'job-3',
        },
    },
    {
        rowId: 548,
        eventType: 'workflow',
        user: {
            value: 1005,
            urlType: 'user',
            displayValue: 'Vader',
        },
        timestamp: {
            value: '2020-04-09 20:57:36.941',
            formattedValue: '2020-04-09 20:57',
        },
        summary: 'Completed job',
        metadata: {
            'Job Name': {
                value: 687,
                urlType: 'workflow',
                displayValue: 'job-1',
            },
            'Job Owner': {
                value: 1005,
                urlType: 'user',
                displayValue: 'Vader',
            },
            'Job Status': 'Completed',
        },
        entity: {
            value: 687,
            urlType: 'workflow',
            displayValue: 'job-1',
        },
    },
    {
        summary: 'Checked out',
        eventType: 'inventory',
        user: undefined, // simulate a deleted user
        entity: { displayValue: 'S-1', value: 6, url: '/labkey/inventory0804/experiment-showMaterial.view?rowId=6' },
        rowId: 49,
        timestamp: { formattedValue: '2020-05-04 23:00', value: '2020-05-04 23:00:23.403' },
        metadata: {
            'Checked Out': { formattedValue: '2020-05-4 23:00', value: '2020-5-4 23:00:23.403' },
            'Checked Out By': { displayValue: 'xyang', urlType: 'user', value: 1005 },
            Reason: 'This is why I checked it out.',
            'Storage box': { displayValue: 'Box f', urlType: 'box', value: '38' },
            'Storage space': { displayValue: 'A-1', urlType: 'boxCell', value: '38-1-1' },
        },
    },
];

export const TestTypeDataType: EntityDataType = {
    typeListingSchemaQuery: new SchemaQuery('TestListing', 'query'),
    listingSchemaQuery: new SchemaQuery('Test', 'query'),
    instanceSchemaName: 'TestSchema',
    operationConfirmationControllerName: 'controller',
    operationConfirmationActionName: 'test-delete-confirmation.api',
    nounSingular: 'test',
    nounPlural: 'tests',
    nounAsParentSingular: 'test Parent',
    nounAsParentPlural: 'test Parents',
    typeNounSingular: 'Test Type',
    typeNounAsParentSingular: 'Test Parent Type',
    descriptionSingular: 'parent test type',
    descriptionPlural: 'parent test types',
    uniqueFieldKey: 'Name',
    dependencyText: 'test data dependencies',
    deleteHelpLinkTopic: 'viewSampleSets#delete',
    inputColumnName: 'Inputs/Materials/First',
    ancestorColumnName: 'Ancestors/Samples',
    inputTypeValueField: 'lsid',
    insertColumnNamePrefix: 'MaterialInputs/',
    editTypeAppUrlPrefix: 'Test',
    importFileAction: 'importSamples',
    filterCardHeaderClass: 'filter-card__header-success',
    sampleFinderCardType: 'sampleparent',
};

export const TestTypeDataTypeWithEntityFilter: EntityDataType = {
    ...TestTypeDataType,
    filterArray: [Filter.create('Category', 'Source')],
};
