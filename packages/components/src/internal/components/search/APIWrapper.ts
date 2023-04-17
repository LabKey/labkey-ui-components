import { search, Search } from './actions';

export interface SearchAPIWrapper {
    search: Search;
}

export class SearchServerAPIWrapper implements SearchAPIWrapper {
    search = search;
}

/**
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export function getSearchTestAPIWrapper(
    mockFn = (): any => () => {},
    overrides: Partial<SearchAPIWrapper> = {}
): SearchAPIWrapper {
    return {
        search: mockFn(),
        ...overrides,
    };
}
