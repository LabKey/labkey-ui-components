import { List } from 'immutable';

import { QueryInfo } from '../public/QueryInfo';

/**
 * Use these methods with jest.mock() and jest.requireActual() in order to prevent network requests from
 * occurring in your tests. See DatasetPropertiesAdvancedSettings.test.tsx for an example.
 */

export function createMockSelectRowsDeprecatedResponse() {
    return Promise.resolve({
        key: 'test',
        models: { test: {} },
        orderedModels: { test: List() },
        queries: { test: QueryInfo.fromJsonForTests({}) },
        rowCount: 0,
    });
}

export function createMockSelectRowsResponse() {
    return Promise.resolve({
        messages: [],
        rows: [],
        rowCount: 0,
    });
}

export function createMockGetQueryDetails() {
    return Promise.resolve(QueryInfo.fromJsonForTests({}));
}
