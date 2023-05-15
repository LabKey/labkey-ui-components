export enum SearchCategory {
    Assay = 'assay',
    AssayBatch = 'assayBatch',
    AssayRun = 'assayRun',
    Concept = 'concept',
    Data = 'data',
    DataClass = 'dataClass',
    File = 'file',
    FileWorkflowJob = 'file workflowJob',
    Material = 'material',
    MaterialSource = 'materialSource',
    Media = 'media',
    MediaData = 'mediaData',
    Notebook = 'notebook',
    NotebookTemplate = 'notebookTemplate',
    WorkflowJob = 'workflowJob',
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
