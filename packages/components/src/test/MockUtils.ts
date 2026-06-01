/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List } from 'immutable';

import { QueryInfo } from '../public/QueryInfo';

/**
 * Use these methods with jest.mock() and jest.requireActual() in order to prevent network requests from
 * occurring in your tests. See DatasetPropertiesAdvancedSettings.test.tsx for an example.
 */

export function createMockSelectRowsDeprecatedResponse(result?: Record<string, any>) {
    return Promise.resolve(
        result ?? {
            key: 'test',
            models: { test: {} },
            orderedModels: { test: List() },
            queries: { test: QueryInfo.fromJsonForTests({}) },
            rowCount: 0,
        }
    );
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
