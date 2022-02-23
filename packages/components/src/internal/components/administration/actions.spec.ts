/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import {
    getAdministrationSubNavTabs, getUserGridFilterURL,
} from "./actions";
import {App} from "../../../index";
import {List} from "immutable";

describe('Administration actions', () => {

    test('getAdministrationSubNavTabs', () => {
        expect(getAdministrationSubNavTabs(App.TEST_USER_GUEST).size).toBe(0);
        expect(getAdministrationSubNavTabs(App.TEST_USER_READER).size).toBe(0);
        expect(getAdministrationSubNavTabs(App.TEST_USER_AUTHOR).size).toBe(0);
        expect(getAdministrationSubNavTabs(App.TEST_USER_EDITOR).size).toBe(0);
        expect(getAdministrationSubNavTabs(App.TEST_USER_ASSAY_DESIGNER).size).toBe(0);
        expect(getAdministrationSubNavTabs(App.TEST_USER_FOLDER_ADMIN).size).toBe(2);
        expect(getAdministrationSubNavTabs(App.TEST_USER_PROJECT_ADMIN).size).toBe(2);
        expect(getAdministrationSubNavTabs(App.TEST_USER_APP_ADMIN).size).toBe(3);
    });

    test('getUserGridFilterURL', () => {
        const baseExpectedUrl = '/admin/users';
        expect(getUserGridFilterURL(undefined, 'query').toString()).toBe(baseExpectedUrl);
        expect(getUserGridFilterURL(List<number>(), 'query').toString()).toBe(baseExpectedUrl);
        expect(getUserGridFilterURL(List<number>([]), 'query').toString()).toBe(baseExpectedUrl);
        expect(getUserGridFilterURL(List<number>([1]), 'query').toString()).toBe(baseExpectedUrl + '?query.UserId~in=1');
        expect(getUserGridFilterURL(List<number>([1,2]), 'query').toString()).toBe(baseExpectedUrl + '?query.UserId~in=1%3B2');
    });
});
