import { SchemaQuery } from '../../../public/SchemaQuery';

import { OntologyModel } from '../ontology/models';

import {
    getDomainNamePreviews,
    validateDomainNameExpressions,
    getGenId,
    setGenId,
    hasExistingDomainData,
    fetchDomainDetails,
    getMaxPhiLevel,
    fetchOntologies,
} from './actions';
import { getDataClassDetails } from './dataclasses/actions';
import { DomainDesign, DomainDetails, NameExpressionsValidationResults } from './models';

export interface DomainPropertiesAPIWrapper {
    fetchDomainDetails: (
        domainId: number,
        schemaName: string,
        queryName: string,
        domainKind?: string
    ) => Promise<DomainDetails>;
    fetchOntologies: (containerPath?: string) => Promise<OntologyModel[]>;
    getDataClassDetails: (query?: SchemaQuery, domainId?: number, containerPath?: string) => Promise<DomainDetails>;
    getDomainNamePreviews: (schemaQuery?: SchemaQuery, domainId?: number, containerPath?: string) => Promise<string[]>;
    getGenId: (rowId: number, kindName: 'SampleSet' | 'DataClass', containerPath?: string) => Promise<number>;
    getMaxPhiLevel: (containerPath?: string) => Promise<string>;
    hasExistingDomainData: (
        kindName: 'SampleSet' | 'DataClass',
        dataTypeLSID?: string,
        rowId?: number,
        containerPath?: string
    ) => Promise<boolean>;
    setGenId: (
        rowId: number,
        kindName: 'SampleSet' | 'DataClass',
        genId: number,
        containerPath?: string
    ) => Promise<any>;
    validateDomainNameExpressions: (
        domain: DomainDesign,
        kind?: string,
        options?: any,
        includeNamePreview?: boolean
    ) => Promise<NameExpressionsValidationResults>;
}

export class DomainPropertiesAPIWrapper implements DomainPropertiesAPIWrapper {
    fetchDomainDetails = fetchDomainDetails;
    fetchOntologies = fetchOntologies;
    getDataClassDetails = getDataClassDetails;
    getDomainNamePreviews = getDomainNamePreviews;
    getGenId = getGenId;
    getMaxPhiLevel = getMaxPhiLevel;
    hasExistingDomainData = hasExistingDomainData;
    setGenId = setGenId;
    validateDomainNameExpressions = validateDomainNameExpressions;
}

/**
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export function getDomainPropertiesTestAPIWrapper(
    mockFn = (): any => () => {},
    overrides: Partial<DomainPropertiesAPIWrapper> = {}
): DomainPropertiesAPIWrapper {
    return {
        fetchDomainDetails: mockFn(),
        fetchOntologies: mockFn(),
        getDataClassDetails: mockFn(),
        getDomainNamePreviews: mockFn(),
        getGenId: mockFn(),
        getMaxPhiLevel: mockFn(),
        hasExistingDomainData: mockFn(),
        setGenId: mockFn(),
        validateDomainNameExpressions: mockFn(),
        ...overrides,
    };
}
