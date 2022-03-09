import {App} from "../../../index";
import {getAdministrationSubNavTabs} from "./AdministrationSubNav";

describe('AdministrationSubNav', () => {
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
});
