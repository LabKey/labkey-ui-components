/*
 * Copyright (c) 2023-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
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
