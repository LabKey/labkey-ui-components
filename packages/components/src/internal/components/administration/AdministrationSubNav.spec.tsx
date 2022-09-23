import {
    TEST_USER_APP_ADMIN,
    TEST_USER_ASSAY_DESIGNER,
    TEST_USER_AUTHOR,
    TEST_USER_EDITOR,
    TEST_USER_FOLDER_ADMIN,
    TEST_USER_GUEST,
    TEST_USER_PROJECT_ADMIN,
    TEST_USER_READER,
} from '../../userFixtures';

import { getAdministrationSubNavTabs } from './AdministrationSubNav';

describe('AdministrationSubNav', () => {
    test('getAdministrationSubNavTabs', () => {
        expect(getAdministrationSubNavTabs(TEST_USER_GUEST).size).toBe(0);
        expect(getAdministrationSubNavTabs(TEST_USER_READER).size).toBe(0);
        expect(getAdministrationSubNavTabs(TEST_USER_AUTHOR).size).toBe(0);
        expect(getAdministrationSubNavTabs(TEST_USER_EDITOR).size).toBe(0);
        expect(getAdministrationSubNavTabs(TEST_USER_ASSAY_DESIGNER).size).toBe(0);
        expect(getAdministrationSubNavTabs(TEST_USER_FOLDER_ADMIN).size).toBe(5);
        expect(getAdministrationSubNavTabs(TEST_USER_PROJECT_ADMIN).size).toBe(5);
        expect(getAdministrationSubNavTabs(TEST_USER_APP_ADMIN).size).toBe(5);
    });
});
