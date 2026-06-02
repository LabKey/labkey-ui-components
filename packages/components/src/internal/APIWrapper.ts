/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { AssayAPIWrapper, AssayServerAPIWrapper, getAssayTestAPIWrapper } from './components/assay/APIWrapper';
import { getSamplesTestAPIWrapper, SamplesAPIWrapper, SamplesServerAPIWrapper } from './components/samples/APIWrapper';
import {
    getPicklistTestAPIWrapper,
    PicklistAPIWrapper,
    PicklistServerAPIWrapper,
} from './components/picklist/APIWrapper';
import {
    getLabelPrintingTestAPIWrapper,
    LabelPrintingAPIWrapper,
    LabelPrintingServerAPIWrapper,
} from './components/labelPrinting/APIWrapper';
import {
    getSecurityTestAPIWrapper,
    SecurityAPIWrapper,
    ServerSecurityAPIWrapper,
} from './components/security/APIWrapper';
import {
    DomainPropertiesAPIWrapper,
    DomainPropertiesServerAPIWrapper,
    getDomainPropertiesTestAPIWrapper,
} from './components/domainproperties/APIWrapper';
import { getQueryTestAPIWrapper, QueryAPIWrapper, QueryServerAPIWrapper } from './query/APIWrapper';
import { EntityAPIWrapper, EntityServerAPIWrapper, getEntityTestAPIWrapper } from './components/entities/APIWrapper';
import {
    FolderAPIWrapper,
    getFolderTestAPIWrapper,
    ServerFolderAPIWrapper,
} from './components/container/FolderAPIWrapper';
import { getLabelsTestAPIWrapper, LabelsAPIWrapper, ServerLabelsAPIWrapper } from './components/labels/APIWrapper';
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
    labels: LabelsAPIWrapper;
    navigation: NavigationAPIWrapper;
    picklist: PicklistAPIWrapper;
    query: QueryAPIWrapper;
    samples: SamplesAPIWrapper;
    search: SearchAPIWrapper;
    security: SecurityAPIWrapper;
}

let DEFAULT_WRAPPER: ComponentsAPIWrapper;

export function getDefaultAPIWrapper(): ComponentsAPIWrapper {
    if (!DEFAULT_WRAPPER) {
        DEFAULT_WRAPPER = {
            assay: new AssayServerAPIWrapper(),
            domain: new DomainPropertiesServerAPIWrapper(),
            entity: new EntityServerAPIWrapper(),
            folder: new ServerFolderAPIWrapper(),
            query: new QueryServerAPIWrapper(),
            labelprinting: new LabelPrintingServerAPIWrapper(),
            labels: new ServerLabelsAPIWrapper(),
            navigation: new ServerNavigationAPIWrapper(),
            picklist: new PicklistServerAPIWrapper(),
            samples: new SamplesServerAPIWrapper(),
            search: new SearchServerAPIWrapper(),
            security: new ServerSecurityAPIWrapper(),
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
        labels: getLabelsTestAPIWrapper(mockFn, overrides.labels),
        navigation: getNavigationTestAPIWrapper(mockFn, overrides.navigation),
        picklist: getPicklistTestAPIWrapper(mockFn, overrides.picklist),
        samples: getSamplesTestAPIWrapper(mockFn, overrides.samples),
        search: getSearchTestAPIWrapper(mockFn, overrides.search),
        security: getSecurityTestAPIWrapper(mockFn, overrides.security),
        ...overrides,
    };
}
