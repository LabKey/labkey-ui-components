/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { AppModel, LogoutReason } from "./models";
import { GUEST, READER } from "../../test/data/users";

describe('AppModel', () => {

    test('hasUserChanged', () => {
        let model = new AppModel({initialUserId: 1, user: GUEST});
        expect(model.hasUserChanged()).toBeTruthy();
        model = new AppModel({initialUserId: 1, user: READER});
        expect(model.hasUserChanged()).toBeTruthy();
        model = new AppModel({initialUserId: READER.id, user: READER});
        expect(model.hasUserChanged()).toBeFalsy();
    });

    test('shouldReload', () => {
        let model = new AppModel({reloadRequired: false, initialUserId: 1, user: READER});
        expect(model.shouldReload()).toBeTruthy();
        model = new AppModel({reloadRequired: false, initialUserId: READER.id, user: READER});
        expect(model.shouldReload()).toBeFalsy();
        model = new AppModel({reloadRequired: true, initialUserId: READER.id, user: READER});
        expect(model.shouldReload()).toBeTruthy();
    });

    test('getLogoutTitle', () => {
        let model = new AppModel({});
        expect(model.getLogoutTitle()).toBe(undefined);
        model = new AppModel({logoutReason: LogoutReason.SERVER_LOGOUT});
        expect(model.getLogoutTitle()).toBe('Logged Out');
        model = new AppModel({logoutReason: LogoutReason.SESSION_EXPIRED});
        expect(model.getLogoutTitle()).toBe('Session Expired');
        model = new AppModel({logoutReason: LogoutReason.SERVER_UNAVAILABLE});
        expect(model.getLogoutTitle()).toBe('Server Unavailable');
    });

    test('getLogoutReason', () => {
        let model = new AppModel({});
        expect(model.getLogoutReason()).toBe(undefined);
        model = new AppModel({logoutReason: LogoutReason.SERVER_LOGOUT});
        expect(model.getLogoutReason()).toContain('logged out');
        model = new AppModel({logoutReason: LogoutReason.SESSION_EXPIRED});
        expect(model.getLogoutReason()).toContain('session has expired');
        model = new AppModel({logoutReason: LogoutReason.SERVER_UNAVAILABLE});
        expect(model.getLogoutReason()).toContain('server is currently unavailable');
    });

});
