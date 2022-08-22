import { SamplesAPIWrapper, SamplesServerAPIWrapper, getSamplesTestAPIWrapper } from './components/samples/APIWrapper';
import {
    PicklistAPIWrapper,
    PicklistServerAPIWrapper,
    getPicklistTestAPIWrapper,
} from './components/picklist/APIWrapper';
import {
    LabelPrintingAPIWrapper,
    LabelPrintingServerAPIWrapper,
    getLabelPrintingTestAPIWrapper,
} from './components/labels/APIWrapper';
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
    domain: DomainPropertiesAPIWrapper;
    entity: EntityAPIWrapper;
    labelprinting: LabelPrintingAPIWrapper;
    picklist: PicklistAPIWrapper;
    query: QueryAPIWrapper;
    samples: SamplesAPIWrapper;
    security: SecurityAPIWrapper;
}

export function getDefaultAPIWrapper(): ComponentsAPIWrapper {
    return {
        domain: new DomainPropertiesAPIWrapper(),
        entity: new EntityServerAPIWrapper(),
        query: new QueryServerAPIWrapper(),
        labelprinting: new LabelPrintingServerAPIWrapper(),
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
        domain: getDomainPropertiesTestAPIWrapper(mockFn, overrides.domain),
        entity: getEntityTestAPIWrapper(mockFn, overrides.entity),
        query: getQueryTestAPIWrapper(mockFn, overrides.query),
        labelprinting: getLabelPrintingTestAPIWrapper(mockFn, overrides.labelprinting),
        picklist: getPicklistTestAPIWrapper(mockFn, overrides.picklist),
        samples: getSamplesTestAPIWrapper(mockFn, overrides.samples),
        security: getSecurityTestAPIWrapper(mockFn, overrides.security),
        ...overrides,
    };
}
