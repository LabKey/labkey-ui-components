import { AssayAPIWrapper, AssayServerAPIWrapper, getAssayTestAPIWrapper } from './components/assay/APIWrapper';
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
} from './components/labelsPrinting/APIWrapper';
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
import {
    FolderAPIWrapper,
    getFolderTestAPIWrapper,
    ServerFolderAPIWrapper,
} from './components/container/FolderAPIWrapper';
import {
    getLabelsTestAPIWrapper,
    LabelsAPIWrapper,
    ServerLabelsAPIWrapper,
} from './components/labels/APIWrapper';
import {
    getNavigationTestAPIWrapper,
    NavigationAPIWrapper,
    ServerNavigationAPIWrapper,
} from './components/navigation/NavigationAPIWrapper';
import { getSearchTestAPIWrapper, SearchAPIWrapper, SearchServerAPIWrapper } from './components/search/APIWrapper';

export interface ComponentsAPIWrapper {
    assay: AssayAPIWrapper;
    domain: DomainPropertiesAPIWrapper;
    entity: EntityAPIWrapper;
    folder: FolderAPIWrapper;
    labelprinting: LabelPrintingAPIWrapper;
    navigation: NavigationAPIWrapper;
    picklist: PicklistAPIWrapper;
    query: QueryAPIWrapper;
    samples: SamplesAPIWrapper;
    search: SearchAPIWrapper;
    security: SecurityAPIWrapper;
    labels: LabelsAPIWrapper;
}

let DEFAULT_WRAPPER: ComponentsAPIWrapper;

export function getDefaultAPIWrapper(): ComponentsAPIWrapper {
    if (!DEFAULT_WRAPPER) {
        DEFAULT_WRAPPER = {
            assay: new AssayServerAPIWrapper(),
            domain: new DomainPropertiesAPIWrapper(),
            entity: new EntityServerAPIWrapper(),
            folder: new ServerFolderAPIWrapper(),
            query: new QueryServerAPIWrapper(),
            labelprinting: new LabelPrintingServerAPIWrapper(),
            navigation: new ServerNavigationAPIWrapper(),
            picklist: new PicklistServerAPIWrapper(),
            samples: new SamplesServerAPIWrapper(),
            search: new SearchServerAPIWrapper(),
            security: new ServerSecurityAPIWrapper(),
            labels: new ServerLabelsAPIWrapper(),
        };
    }

    return DEFAULT_WRAPPER;
}

/**
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export function getTestAPIWrapper(
    mockFn = (): any => () => {},
    overrides: Partial<ComponentsAPIWrapper> = {}
): ComponentsAPIWrapper {
    return {
        assay: getAssayTestAPIWrapper(mockFn, overrides.assay),
        domain: getDomainPropertiesTestAPIWrapper(mockFn, overrides.domain),
        entity: getEntityTestAPIWrapper(mockFn, overrides.entity),
        folder: getFolderTestAPIWrapper(mockFn, overrides.folder),
        query: getQueryTestAPIWrapper(mockFn, overrides.query),
        labelprinting: getLabelPrintingTestAPIWrapper(mockFn, overrides.labelprinting),
        navigation: getNavigationTestAPIWrapper(mockFn, overrides.navigation),
        picklist: getPicklistTestAPIWrapper(mockFn, overrides.picklist),
        samples: getSamplesTestAPIWrapper(mockFn, overrides.samples),
        search: getSearchTestAPIWrapper(mockFn, overrides.search),
        security: getSecurityTestAPIWrapper(mockFn, overrides.security),
        labels: getLabelsTestAPIWrapper(mockFn, overrides.labels),
        ...overrides,
    };
}
