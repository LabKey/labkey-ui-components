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

export const SAMPLE_FINDER_SESSION_PREFIX = 'Searched ';

export const SAMPLE_PROPERTY_ALL_SAMPLE_TYPE = {
    value: '~~allsampletypes~~',
    query: '~~allsampletypes~~',
    label: 'All Sample Types',
};
