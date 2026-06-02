/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { getIntegerSearchParam } from './utils';

describe('getInterSearchParam', () => {
    test('no param', () => {
        expect(getIntegerSearchParam(new URLSearchParams(), 'test')).toBeUndefined();
        expect(getIntegerSearchParam(new URLSearchParams({ other: '1' }), 'test')).toBeUndefined();
    });

    test('not a number', () => {
        expect(getIntegerSearchParam(new URLSearchParams({ test: 'a' }), 'test')).toBeUndefined();
    });

    test('is numeric value', () => {
        expect(getIntegerSearchParam(new URLSearchParams({ test: '1' }), 'test')).toBe(1);
        expect(getIntegerSearchParam(new URLSearchParams({ test: '1.4' }), 'test')).toBe(1);
        expect(getIntegerSearchParam(new URLSearchParams({ test: '1123' }), 'test')).toBe(1123);
    });
});
