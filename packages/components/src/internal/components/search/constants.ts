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

export const ALLOWED_FINDER_SAMPLE_PROPERTY_MAP = {
    'name' : 'string',
    'materialexpdate': 'date',
    'storedamount': 'float',
    'aliquotcount': 'int',
    'aliquotvolume': 'float',
    'availablealiquotcount': 'int',
    'freezethawcount': 'int',
    'storagestatus': 'string',
    'storagerow': 'string',
    'storagecol': 'string',
    'isaliquot': 'boolean',
    'created': 'date',
    'createdby': 'int',
};

export const ALLOWED_FINDER_SAMPLE_PROPERTIES = Object.keys(ALLOWED_FINDER_SAMPLE_PROPERTY_MAP);
