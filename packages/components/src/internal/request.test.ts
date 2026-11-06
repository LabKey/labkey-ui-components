/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Ajax } from '@labkey/api';

import { handleRequestFailure, isAbortedRequest } from './request';

describe('handleRequestFailure', () => {
    test('handles failure', () => {
        const badResponse = { responseJSON: { error: 'This is bad' } };
        const reject = jest.fn();
        handleRequestFailure(reject)(badResponse as any, undefined);
        expect(reject).toHaveBeenCalledWith(expect.objectContaining({ error: 'This is bad' }));
    });
    test('with response status', () => {
        const badResponse = { responseJSON: { error: 'This is bad' }, status: 500 };
        const reject = jest.fn();
        handleRequestFailure(reject)(badResponse as any, undefined);
        expect(reject).toHaveBeenCalledWith(expect.objectContaining({ error: 'This is bad', status: 500 }));
    });
});

describe('aborted requests', () => {
    let consoleError: jest.SpyInstance;

    beforeEach(() => {
        consoleError = jest.spyOn(console, 'error').mockImplementation(jest.fn());
    });

    afterEach(() => {
        consoleError.mockRestore();
    });

    test('handleRequestFailure marks an aborted request and does not log it', async () => {
        const reason = await new Promise(resolve => {
            Ajax.request({
                url: '/labkey/query-selectRows.api',
                failure: handleRequestFailure(resolve, 'Should not be logged'),
            }).abort();
        });

        expect(isAbortedRequest(reason)).toBe(true);
        expect(consoleError).not.toHaveBeenCalled();
    });

    test('isAbortedRequest is true only for rejections flagged as aborted', () => {
        expect(isAbortedRequest({ aborted: true, status: 0 })).toBe(true);
        expect(isAbortedRequest({ aborted: false, status: 0 })).toBe(false);
        expect(isAbortedRequest({ status: 0 })).toBe(false);
        expect(isAbortedRequest(undefined)).toBe(false);
        expect(isAbortedRequest('Communication failure.')).toBe(false);
    });
});
