/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { fromJS } from 'immutable'
import { getUserLastLogin, getUserPermissionsDisplay } from "./actions";
import { ADMIN, ASSAYDESIGNER, AUTHOR, EDITOR, GUEST, READER } from "../../test/data/users";

describe('User actions', () => {

    test('getUserPermissionsDisplay guest', () => {
        const displayStrs = getUserPermissionsDisplay(GUEST);
        expect(displayStrs.join(', ')).toBe('Reader');
    });

    test('getUserPermissionsDisplay reader', () => {
        const displayStrs = getUserPermissionsDisplay(READER);
        expect(displayStrs.join(', ')).toBe('Reader');
    });

    test('getUserPermissionsDisplay author', () => {
        const displayStrs = getUserPermissionsDisplay(AUTHOR);
        expect(displayStrs.join(', ')).toBe('Author');
    });

    test('getUserPermissionsDisplay editor', () => {
        const displayStrs = getUserPermissionsDisplay(EDITOR);
        expect(displayStrs.join(', ')).toBe('Sample Set Designer, Editor');
    });

    test('getUserPermissionsDisplay assaydesigner', () => {
        const displayStrs = getUserPermissionsDisplay(ASSAYDESIGNER);
        expect(displayStrs.join(', ')).toBe('Assay Designer, Reader');
    });

    test('getUserPermissionsDisplay admin', () => {
        const displayStrs = getUserPermissionsDisplay(ADMIN);
        expect(displayStrs.join(', ')).toBe('Administrator');
    });

    test('getUserLastLogin', () => {
        const lastLogin = '2019-11-15 13:50:17.987';
        expect(getUserLastLogin(fromJS({lastlogin: lastLogin}), undefined).indexOf('2019-11-15T')).toBe(0);
        expect(getUserLastLogin(fromJS({lastlogin: lastLogin}), 'YYYY-MM-DD')).toBe('2019-11-15');
        expect(getUserLastLogin(fromJS({lastLogin: lastLogin}), 'YYYY-MM-DD')).toBe('2019-11-15');
        expect(getUserLastLogin(fromJS({LastLogin: lastLogin}), 'YYYY-MM-DD')).toBe('2019-11-15');
    });
});