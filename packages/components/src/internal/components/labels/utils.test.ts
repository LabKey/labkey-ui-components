import { TEST_USER_GUEST, TEST_USER_READER, TEST_USER_EDITOR, TEST_USER_APP_ADMIN } from '../../userFixtures';

import { userCanPrintLabels } from './utils';

describe('userCanPrintLabels', () => {
    test('guest', () => {
        expect(userCanPrintLabels(TEST_USER_GUEST)).toBeFalsy();
    });

    test('non guest', () => {
        expect(userCanPrintLabels(TEST_USER_READER)).toBeTruthy();
        expect(userCanPrintLabels(TEST_USER_EDITOR)).toBeTruthy();
        expect(userCanPrintLabels(TEST_USER_APP_ADMIN)).toBeTruthy();
    });
});
