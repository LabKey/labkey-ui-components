/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { getUserLastLogin } from './actions';

describe('User actions', () => {
    test('getUserLastLogin', () => {
        const lastLogin = '2019-11-15 13:50:17.987';
        expect(getUserLastLogin({ lastlogin: lastLogin })).toBe('2019-11-15');
        expect(getUserLastLogin({ lastlogin: lastLogin }, 'YYYY-MM-DD')).toBe('2019-11-15');
        expect(getUserLastLogin({ lastLogin }, 'YYYY-MM-DD')).toBe('2019-11-15');
        expect(getUserLastLogin({ LastLogin: lastLogin }, 'DD-MM-YYYY')).toBe('15-11-2019');
    });
});
