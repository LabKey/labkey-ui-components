import { AssayDefinitionModel } from '../../AssayDefinitionModel';

import { AssayProtocolModel } from '../domainproperties/assay/models';

import {
    clearAssayDefinitionCache,
    GetAssayDefinitionsOptions,
    getAssayDefinitions,
    GetProtocolOptions,
    getProtocol,
    ImportAssayRunOptions,
    importAssayRun,
} from './actions';
import { AssayUploadResultModel } from './models';

export interface AssayAPIWrapper {
    clearAssayDefinitionCache: () => void;
    getAssayDefinitions: (options: GetAssayDefinitionsOptions) => Promise<AssayDefinitionModel[]>;
    getProtocol: (options: GetProtocolOptions) => Promise<AssayProtocolModel>;
    importAssayRun: (options: ImportAssayRunOptions) => Promise<AssayUploadResultModel>;
}

export class AssayServerAPIWrapper implements AssayAPIWrapper {
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
        clearAssayDefinitionCache: mockFn(),
        getAssayDefinitions: mockFn(),
        getProtocol: mockFn(),
        importAssayRun: mockFn(),
        ...overrides,
    };
}
