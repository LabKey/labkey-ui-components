import { SchemaQuery } from '../../../public/SchemaQuery';

import { getDomainNamePreviews, validateDomainNameExpressions, getGenId, setGenId } from './actions';
import { DomainDesign, NameExpressionsValidationResults } from './models';

export interface DomainPropertiesAPIWrapper {
    getDomainNamePreviews: (schemaQuery?: SchemaQuery, domainId?: number, containerPath?: string) => Promise<string[]>;
    validateDomainNameExpressions: (
        domain: DomainDesign,
        kind?: string,
        options?: any,
        includeNamePreview?: boolean
    ) => Promise<NameExpressionsValidationResults>;
    getGenId: (rowId: number, kindName: 'SampleSet' | "DataClass", containerPath?: string) => Promise<number>;
    setGenId: (rowId: number, kindName: 'SampleSet' | "DataClass", genId: number, containerPath?: string) => Promise<any>;
}

export class DomainPropertiesAPIWrapper implements DomainPropertiesAPIWrapper {
    getDomainNamePreviews = getDomainNamePreviews;
    validateDomainNameExpressions = validateDomainNameExpressions;
    getGenId = getGenId;
    setGenId = setGenId;
}

/**
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export function getDomainPropertiesTestAPIWrapper(
    mockFn = (): any => () => {},
    overrides: Partial<DomainPropertiesAPIWrapper> = {}
): DomainPropertiesAPIWrapper {
    return {
        getDomainNamePreviews: mockFn(),
        validateDomainNameExpressions: mockFn(),
        getGenId: mockFn(),
        setGenId: mockFn(),
        ...overrides,
    };
}
