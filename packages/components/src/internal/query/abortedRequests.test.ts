/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Ajax, Query } from '@labkey/api';

import { SchemaQuery } from '../../public/SchemaQuery';
import { isAbortedRequest } from '../request';

import { selectDistinctRows, selectRowsDeprecated } from './api';
import { executeSql } from './executeSql';
import { selectRows } from './selectRows';

jest.mock('@labkey/api', () => {
    const actual = jest.requireActual('@labkey/api');
    return {
        ...actual,
        Ajax: { ...actual.Ajax, isAborted: jest.fn() },
        Query: {
            ...actual.Query,
            executeSql: jest.fn(),
            getQueryDetails: jest.fn(),
            selectDistinctRows: jest.fn(),
            selectRows: jest.fn(),
        },
    };
});
jest.mock('./api', () => ({
    ...jest.requireActual('./api'),
    getQueryDetails: jest.fn(() => Promise.resolve(undefined)),
}));

const xhr = { status: 0 } as XMLHttpRequest;
const failWith =
    (data: Record<string, unknown>) =>
    (options: { failure: (data: unknown, request: unknown) => void }): XMLHttpRequest => {
        options.failure(data, xhr);
        return xhr;
    };

describe('rejections from aborted requests', () => {
    const schemaQuery = new SchemaQuery('samples', 'Blood');
    const wrappers: [string, jest.Mock, () => Promise<unknown>][] = [
        ['selectRows', jest.mocked(Query.selectRows), () => selectRows({ schemaQuery })],
        ['executeSql', jest.mocked(Query.executeSql), () => executeSql({ schemaName: 'samples', sql: 'SELECT 1' })],
        [
            'selectRowsDeprecated',
            jest.mocked(Query.selectRows),
            () => selectRowsDeprecated({ queryName: 'Blood', schemaName: 'samples' }),
        ],
        [
            'selectDistinctRows',
            jest.mocked(Query.selectDistinctRows),
            () => selectDistinctRows({ column: 'Name', queryName: 'Blood', schemaName: 'samples' }),
        ],
    ];
    let consoleError: jest.SpyInstance;

    beforeEach(() => {
        consoleError = jest.spyOn(console, 'error').mockImplementation(jest.fn());
    });

    afterEach(() => {
        consoleError.mockRestore();
    });

    test.each(wrappers)('%s marks an aborted request and does not log it', async (_, api, call) => {
        api.mockImplementation(failWith({ exception: 'Communication failure.' }));
        jest.mocked(Ajax.isAborted).mockReturnValue(true);

        const reason = await call().catch(e => e);
        expect(isAbortedRequest(reason)).toBe(true);
        expect(consoleError).not.toHaveBeenCalled();
    });

    test.each(wrappers)('%s logs a failed request that was not aborted', async (_, api, call) => {
        api.mockImplementation(failWith({ exception: 'Communication failure.' }));
        jest.mocked(Ajax.isAborted).mockReturnValue(false);

        const reason = await call().catch(e => e);
        expect(isAbortedRequest(reason)).toBe(false);
        expect(consoleError).toHaveBeenCalled();
    });
});
