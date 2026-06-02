/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { handleRequestFailure } from './request';

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
