import { PermissionTypes } from '@labkey/api';
import { hasAllPermissions } from './User';
import {
    TEST_USER_APP_ADMIN,
    TEST_USER_ASSAY_DESIGNER,
    TEST_USER_AUTHOR,
    TEST_USER_EDITOR, TEST_USER_FOLDER_ADMIN,
    TEST_USER_READER,
} from '../../../../test/data/users';

describe('hasAllPermissions', () => {
    test('user without permission', () => {
        expect(hasAllPermissions(TEST_USER_READER, [PermissionTypes.Insert])).toBe(false);
    });

    test('user has some but not all permissions', () => {
        expect(hasAllPermissions(TEST_USER_READER, [PermissionTypes.Insert, PermissionTypes.Read])).toBe(false);
    });

    test('user has only required permission', () => {
        expect(hasAllPermissions(TEST_USER_AUTHOR, [PermissionTypes.Insert])).toBe(true);
    });

    test('user has more permission', () => {
        expect(hasAllPermissions(TEST_USER_EDITOR, [PermissionTypes.Insert])).toBe(true);
    });

    test('user permissions do not intersect', () => {
        expect(hasAllPermissions(TEST_USER_ASSAY_DESIGNER, [PermissionTypes.Insert])).toBe(false);
    });

    test('user permissions admin prop', () => {
        expect(hasAllPermissions(TEST_USER_FOLDER_ADMIN, [PermissionTypes.ApplicationAdmin], true)).toBe(true);
        expect(hasAllPermissions(TEST_USER_FOLDER_ADMIN, [PermissionTypes.ApplicationAdmin], false)).toBe(false);
        expect(hasAllPermissions(TEST_USER_APP_ADMIN, [PermissionTypes.ApplicationAdmin], true)).toBe(true);
        expect(hasAllPermissions(TEST_USER_APP_ADMIN, [PermissionTypes.ApplicationAdmin], false)).toBe(true);
    });
});
