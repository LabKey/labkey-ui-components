/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
export enum SearchCategory {
    Assay = 'assay',
    AssayBatch = 'assayBatch',
    AssayRun = 'assayRun',
    Concept = 'concept',
    Data = 'data',
    DataClass = 'dataClass',
    File = 'file',
    FileWorkflowJob = 'fileWorkflowJob',
    Material = 'material',
    MaterialSource = 'materialSource',
    Media = 'media',
    MediaData = 'mediaData',
    Notebook = 'notebook',
    NotebookTemplate = 'notebookTemplate',
    Plate = 'plate',
    PlateSet = 'plateSet',
    StorageLocation = 'storageLocation',
    TerminalStorageLocation = 'terminalStorageLocation',
    WorkflowJob = 'workflowJob',
}

export enum SearchField {
    Body = 'body',
    IdentifiersHi = 'identifiersHi',
    IdentifiersLo = 'identifiersLo',
    IdentifiersMed = 'identifiersMed',
    KeywordsHi = 'keywordsHi',
    KeywordsLo = 'keywordsLo',
    KeywordsMed = 'keywordsMed',
}

export enum SearchScope {
    All = 'All',
    Folder = 'Folder',
    FolderAndProject = 'FolderAndProject',
    FolderAndProjectAndShared = 'FolderAndProjectAndShared',
    FolderAndShared = 'FolderAndShared',
    FolderAndSubfolders = 'FolderAndSubfolders',
    FolderAndSubfoldersAndShared = 'FolderAndSubfoldersAndShared',
    Project = 'Project',
    ProjectAndShared = 'ProjectAndShared',
}

export const SAMPLE_PROPERTY_ALL_SAMPLE_TYPE = {
    value: '~~allsampletypes~~',
    query: '~~allsampletypes~~',
    label: 'All Sample Types',
};

export const SEARCH_HELP_TOPIC = 'luceneSearch';

export const SEARCH_PAGE_DEFAULT_SIZE = 20;
