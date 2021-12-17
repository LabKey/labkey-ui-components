import { SamplesAPIWrapper, SamplesServerAPIWrapper, getSamplesTestAPIWrapper } from './components/samples/APIWrapper';
import {
    PicklistAPIWrapper,
    PicklistServerAPIWrapper,
    getPicklistTestAPIWrapper,
} from './components/picklist/APIWrapper';
import {
    getSecurityTestAPIWrapper,
    SecurityAPIWrapper,
    ServerSecurityAPIWrapper,
} from './components/security/APIWrapper';

export interface ComponentsAPIWrapper {
    picklist: PicklistAPIWrapper;
    samples: SamplesAPIWrapper;
    security: SecurityAPIWrapper;
}

export function getDefaultAPIWrapper(): ComponentsAPIWrapper {
    return {
        picklist: new PicklistServerAPIWrapper(),
        samples: new SamplesServerAPIWrapper(),
        security: new ServerSecurityAPIWrapper(),
    };
}

/**
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export function getTestAPIWrapper(
    mockFn = (): any => () => {},
    overrides: Partial<ComponentsAPIWrapper> = {}
): ComponentsAPIWrapper {
    return {
        picklist: getPicklistTestAPIWrapper(mockFn, overrides.picklist),
        samples: getSamplesTestAPIWrapper(mockFn, overrides.samples),
        security: getSecurityTestAPIWrapper(mockFn, overrides.security),
        ...overrides,
    };
}
