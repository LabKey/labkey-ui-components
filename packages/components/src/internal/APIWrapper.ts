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
import {
    DomainPropertiesAPIWrapper,
    getDomainPropertiesTestAPIWrapper,
} from './components/domainproperties/APIWrapper';
import { getQueryTestAPIWrapper, QueryAPIWrapper, QueryServerAPIWrapper } from './query/APIWrapper';
import { EntityAPIWrapper, EntityServerAPIWrapper, getEntityTestAPIWrapper } from './components/entities/APIWrapper';

export interface ComponentsAPIWrapper {
    picklist: PicklistAPIWrapper;
    samples: SamplesAPIWrapper;
    security: SecurityAPIWrapper;
    domain: DomainPropertiesAPIWrapper;
    query: QueryAPIWrapper;
    entity: EntityAPIWrapper;
}

export function getDefaultAPIWrapper(): ComponentsAPIWrapper {
    return {
        picklist: new PicklistServerAPIWrapper(),
        samples: new SamplesServerAPIWrapper(),
        security: new ServerSecurityAPIWrapper(),
        domain: new DomainPropertiesAPIWrapper(),
        query: new QueryServerAPIWrapper(),
        entity: new EntityServerAPIWrapper(),
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
        domain: getDomainPropertiesTestAPIWrapper(mockFn, overrides.domain),
        query: getQueryTestAPIWrapper(mockFn, overrides.query),
        entity: getEntityTestAPIWrapper(mockFn, overrides.entity),
        ...overrides,
    };
}
