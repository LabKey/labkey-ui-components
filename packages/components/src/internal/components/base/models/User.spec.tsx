import { PermissionTypes } from '@labkey/api';

import {
    TEST_USER_APP_ADMIN,
    TEST_USER_ASSAY_DESIGNER,
    TEST_USER_AUTHOR,
    TEST_USER_EDITOR,
    TEST_USER_FOLDER_ADMIN,
    TEST_USER_GUEST,
    TEST_USER_READER,
} from '../../../../test/data/users';

import { hasAllPermissions, hasAnyPermissions } from './User';

describe('hasAllPermissions', () => {
    test('empty permissions', () => {
        expect(hasAllPermissions(TEST_USER_APP_ADMIN, undefined)).toBe(false);
        expect(hasAllPermissions(TEST_USER_APP_ADMIN, null)).toBe(false);
        expect(hasAllPermissions(TEST_USER_APP_ADMIN, [])).toBe(false);
    });

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

describe('hasAnyPermissions', () => {
    test('empty permissions', () => {
        expect(hasAnyPermissions(TEST_USER_APP_ADMIN, undefined)).toBe(false);
        expect(hasAnyPermissions(TEST_USER_APP_ADMIN, null)).toBe(false);
        expect(hasAnyPermissions(TEST_USER_APP_ADMIN, [])).toBe(false);
    });

    test('user without permission', () => {
        expect(hasAnyPermissions(TEST_USER_READER, [PermissionTypes.Insert])).toBe(false);
    });

    test('user has some but not all permissions', () => {
        expect(hasAnyPermissions(TEST_USER_READER, [PermissionTypes.Insert, PermissionTypes.Read])).toBe(true);
    });

    test('user has only required permission', () => {
        expect(hasAnyPermissions(TEST_USER_AUTHOR, [PermissionTypes.Insert])).toBe(true);
    });

    test('user has more permission', () => {
        expect(hasAnyPermissions(TEST_USER_EDITOR, [PermissionTypes.Insert])).toBe(true);
    });

    test('user permissions do not intersect', () => {
        expect(hasAnyPermissions(TEST_USER_ASSAY_DESIGNER, [PermissionTypes.Insert])).toBe(false);
    });

    test('user permissions admin prop', () => {
        expect(hasAnyPermissions(TEST_USER_FOLDER_ADMIN, [PermissionTypes.ApplicationAdmin], true)).toBe(true);
        expect(hasAnyPermissions(TEST_USER_FOLDER_ADMIN, [PermissionTypes.ApplicationAdmin], false)).toBe(false);
        expect(hasAnyPermissions(TEST_USER_APP_ADMIN, [PermissionTypes.ApplicationAdmin], true)).toBe(true);
        expect(hasAnyPermissions(TEST_USER_APP_ADMIN, [PermissionTypes.ApplicationAdmin], false)).toBe(true);
    });
});

describe('User permissions', () => {
    test('hasInsertPermission', () => {
        expect(TEST_USER_GUEST.hasInsertPermission()).toBeFalsy();
        expect(TEST_USER_READER.hasInsertPermission()).toBeFalsy();
        expect(TEST_USER_AUTHOR.hasInsertPermission()).toBeTruthy();
        expect(TEST_USER_EDITOR.hasInsertPermission()).toBeTruthy();
        expect(TEST_USER_ASSAY_DESIGNER.hasInsertPermission()).toBeFalsy();
        expect(TEST_USER_FOLDER_ADMIN.hasInsertPermission()).toBeTruthy();
        expect(TEST_USER_APP_ADMIN.hasInsertPermission()).toBeTruthy();
    });

    test('hasUpdatePermission', () => {
        expect(TEST_USER_GUEST.hasUpdatePermission()).toBeFalsy();
        expect(TEST_USER_READER.hasUpdatePermission()).toBeFalsy();
        expect(TEST_USER_AUTHOR.hasUpdatePermission()).toBeFalsy();
        expect(TEST_USER_EDITOR.hasUpdatePermission()).toBeTruthy();
        expect(TEST_USER_ASSAY_DESIGNER.hasUpdatePermission()).toBeFalsy();
        expect(TEST_USER_FOLDER_ADMIN.hasUpdatePermission()).toBeTruthy();
        expect(TEST_USER_APP_ADMIN.hasUpdatePermission()).toBeTruthy();
    });

    test('hasDeletePermission', () => {
        expect(TEST_USER_GUEST.hasDeletePermission()).toBeFalsy();
        expect(TEST_USER_READER.hasDeletePermission()).toBeFalsy();
        expect(TEST_USER_AUTHOR.hasDeletePermission()).toBeFalsy();
        expect(TEST_USER_EDITOR.hasDeletePermission()).toBeTruthy();
        expect(TEST_USER_ASSAY_DESIGNER.hasDeletePermission()).toBeFalsy();
        expect(TEST_USER_FOLDER_ADMIN.hasDeletePermission()).toBeTruthy();
        expect(TEST_USER_APP_ADMIN.hasDeletePermission()).toBeTruthy();
    });

    test('hasDesignAssaysPermission', () => {
        expect(TEST_USER_GUEST.hasDesignAssaysPermission()).toBeFalsy();
        expect(TEST_USER_READER.hasDesignAssaysPermission()).toBeFalsy();
        expect(TEST_USER_AUTHOR.hasDesignAssaysPermission()).toBeFalsy();
        expect(TEST_USER_EDITOR.hasDesignAssaysPermission()).toBeFalsy();
        expect(TEST_USER_ASSAY_DESIGNER.hasDesignAssaysPermission()).toBeTruthy();
        expect(TEST_USER_FOLDER_ADMIN.hasDesignAssaysPermission()).toBeTruthy();
        expect(TEST_USER_APP_ADMIN.hasDesignAssaysPermission()).toBeTruthy();
    });

    test('hasDesignSampleSetsPermission', () => {
        expect(TEST_USER_GUEST.hasDesignSampleSetsPermission()).toBeFalsy();
        expect(TEST_USER_READER.hasDesignSampleSetsPermission()).toBeFalsy();
        expect(TEST_USER_AUTHOR.hasDesignSampleSetsPermission()).toBeFalsy();
        expect(TEST_USER_EDITOR.hasDesignSampleSetsPermission()).toBeFalsy();
        expect(TEST_USER_ASSAY_DESIGNER.hasDesignSampleSetsPermission()).toBeFalsy();
        expect(TEST_USER_FOLDER_ADMIN.hasDesignSampleSetsPermission()).toBeTruthy();
        expect(TEST_USER_APP_ADMIN.hasDesignSampleSetsPermission()).toBeTruthy();
    });

    test('hasManageUsersPermission', () => {
        expect(TEST_USER_GUEST.hasManageUsersPermission()).toBeFalsy();
        expect(TEST_USER_READER.hasManageUsersPermission()).toBeFalsy();
        expect(TEST_USER_AUTHOR.hasManageUsersPermission()).toBeFalsy();
        expect(TEST_USER_EDITOR.hasManageUsersPermission()).toBeFalsy();
        expect(TEST_USER_ASSAY_DESIGNER.hasManageUsersPermission()).toBeFalsy();
        expect(TEST_USER_FOLDER_ADMIN.hasManageUsersPermission()).toBeFalsy();
        expect(TEST_USER_APP_ADMIN.hasManageUsersPermission()).toBeTruthy();
    });

    test('isAppAdmin', () => {
        expect(TEST_USER_GUEST.isAppAdmin()).toBeFalsy();
        expect(TEST_USER_READER.isAppAdmin()).toBeFalsy();
        expect(TEST_USER_AUTHOR.isAppAdmin()).toBeFalsy();
        expect(TEST_USER_EDITOR.isAppAdmin()).toBeFalsy();
        expect(TEST_USER_ASSAY_DESIGNER.isAppAdmin()).toBeFalsy();
        expect(TEST_USER_FOLDER_ADMIN.isAppAdmin()).toBeFalsy();
        expect(TEST_USER_APP_ADMIN.isAppAdmin()).toBeTruthy();
    });
});
