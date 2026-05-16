import { SchemaQuery } from '../../../public/SchemaQuery';

import { OntologyModel } from '../ontology/models';

import { Container } from '../base/models/Container';

import {
    expressionAssistant,
    ExpressionAssistOptions,
    ExpressionAssistResponse,
    fetchDomainDetails,
    FetchDomainDetailsOptions,
    fetchOntologies,
    getDomainNamePreviews,
    getGenId,
    getMaxPhiLevel,
    getRequiredParentTypes,
    parseCalculatedColumn,
    ParseCalculatedColumnResponse,
    saveDomain,
    SaveDomainOptions,
    setGenId,
    validateDomainNameExpressions,
} from './actions';
import { getValidPublishTargets } from './assay/actions';
import { PHILEVEL_FULL_PHI } from './constants';
import { getDataClassDetails } from './dataclasses/actions';
import { DomainDesign, DomainDetails, DomainField, NameExpressionsValidationResults, SystemField } from './models';

export interface DomainPropertiesAPIWrapper {
    expressionAssistant: (options: ExpressionAssistOptions) => Promise<ExpressionAssistResponse>;
    fetchDomainDetails: (options: FetchDomainDetailsOptions) => Promise<DomainDetails>;
    fetchOntologies: (containerPath?: string) => Promise<OntologyModel[]>;
    getDataClassDetails: (query?: SchemaQuery, domainId?: number, containerPath?: string) => Promise<DomainDetails>;
    getDomainNamePreviews: (schemaQuery?: SchemaQuery, domainId?: number, containerPath?: string) => Promise<string[]>;
    getGenId: (rowId: number, kindName: 'DataClass' | 'SampleSet', containerPath?: string) => Promise<number>;
    getMaxPhiLevel: (containerPath?: string) => Promise<string>;
    getRequiredParentTypes: (
        query: SchemaQuery,
        containerPath?: string
    ) => Promise<{ dataClasses: string[]; sampleTypes: string[] }>;
    getValidPublishTargets: (containerPath?: string) => Promise<Container[]>;
    parseCalculatedColumn: (
        expression: string,
        domainFields: DomainField[],
        systemFields: SystemField[],
        containerPath?: string
    ) => Promise<ParseCalculatedColumnResponse>;
    saveDomain: (options: SaveDomainOptions) => Promise<DomainDesign>;
    setGenId: (
        rowId: number,
        kindName: 'DataClass' | 'SampleSet',
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

export class DomainPropertiesServerAPIWrapper implements DomainPropertiesAPIWrapper {
    expressionAssistant = expressionAssistant;
    fetchDomainDetails = fetchDomainDetails;
    fetchOntologies = fetchOntologies;
    getDataClassDetails = getDataClassDetails;
    getDomainNamePreviews = getDomainNamePreviews;
    getGenId = getGenId;
    getMaxPhiLevel = getMaxPhiLevel;
    getRequiredParentTypes = getRequiredParentTypes;
    getValidPublishTargets = getValidPublishTargets;
    parseCalculatedColumn = parseCalculatedColumn;
    saveDomain = saveDomain;
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
        expressionAssistant: mockFn(),
        fetchDomainDetails: mockFn(),
        fetchOntologies: mockFn(),
        getDataClassDetails: mockFn(),
        getDomainNamePreviews: mockFn(),
        getGenId: mockFn(),
        // Because we don't want to have an explicit dependency on jest we cannot use mockFn().mockResolvedValue here
        // like we should be able to, because the default implementation for our mockFn cannot be Jest. We should
        // probably make Jest an explicit dependency since we are actually exporting test utilities.
        getMaxPhiLevel: () => Promise.resolve(PHILEVEL_FULL_PHI),
        getRequiredParentTypes: mockFn(),
        getValidPublishTargets: mockFn(),
        parseCalculatedColumn: mockFn(),
        saveDomain: mockFn(),
        setGenId: mockFn(),
        validateDomainNameExpressions: mockFn(),
        ...overrides,
    };
}
