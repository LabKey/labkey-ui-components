import { AssayDefinitionModel } from '../../AssayDefinitionModel';

import { AssayProtocolModel } from '../domainproperties/assay/models';

import {
    checkForDuplicateAssayFiles,
    clearAssayDefinitionCache,
    DuplicateFilesResponse,
    GetAssayDefinitionsOptions,
    getAssayDefinitions,
    GetProtocolOptions,
    getProtocol,
    ImportAssayRunOptions,
    importAssayRun,
} from './actions';
import { AssayUploadResultModel } from './models';

export interface AssayAPIWrapper {
    checkForDuplicateAssayFiles: (fileNames: string[], containerPath?: string) => Promise<DuplicateFilesResponse>;
    clearAssayDefinitionCache: () => void;
    getAssayDefinitions: (options: GetAssayDefinitionsOptions) => Promise<AssayDefinitionModel[]>;
    getProtocol: (options: GetProtocolOptions) => Promise<AssayProtocolModel>;
    importAssayRun: (options: ImportAssayRunOptions) => Promise<AssayUploadResultModel>;
}

export class AssayServerAPIWrapper implements AssayAPIWrapper {
    checkForDuplicateAssayFiles = checkForDuplicateAssayFiles;
    clearAssayDefinitionCache = clearAssayDefinitionCache;
    getAssayDefinitions = getAssayDefinitions;
    getProtocol = getProtocol;
    importAssayRun = importAssayRun;
}

/**
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export function getAssayTestAPIWrapper(
    mockFn = (): any => () => {},
    overrides: Partial<AssayAPIWrapper> = {}
): AssayAPIWrapper {
    return {
        checkForDuplicateAssayFiles: mockFn(),
        clearAssayDefinitionCache: mockFn(),
        getAssayDefinitions: mockFn(),
        getProtocol: mockFn(),
        importAssayRun: mockFn(),
        ...overrides,
    };
}
