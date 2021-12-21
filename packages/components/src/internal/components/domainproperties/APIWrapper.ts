import { SchemaQuery } from "../../../public/SchemaQuery";
import { getDomainNamePreviews, validateDomainNameExpressions } from "./actions";
import { DomainDesign, NameExpressionsValidationResults } from "./models";

export interface DomainPropertiesAPIWrapper {
    getDomainNamePreviews: (
        schemaQuery?: SchemaQuery,
        domainId?: number,
        containerPath?: string
    ) => Promise<string[]>,
    validateDomainNameExpressions: (
        domain: DomainDesign,
        kind?: string,
        options?: any,
        includeNamePreview?: boolean
    ) => Promise<NameExpressionsValidationResults>
}

export class DomainPropertiesAPIWrapper implements DomainPropertiesAPIWrapper {
    getDomainNamePreviews = getDomainNamePreviews;
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
        getDomainNamePreviews: mockFn(),
        validateDomainNameExpressions: mockFn(),
        ...overrides,
    };
}
