import React from 'react';
import { List, Map } from 'immutable';
import { ReactWrapper } from 'enzyme';
import { PermissionRoles } from '@labkey/api';

import { mountWithAppServerContext } from '../../test/enzymeTestHelpers';
import { BasePermissionsCheckPage } from '../permissions/BasePermissionsCheckPage';
import { UsersGridPanel } from '../user/UsersGridPanel';
import { SecurityPolicy } from '../permissions/models';

import { TEST_FOLDER_CONTAINER, TEST_PROJECT, TEST_PROJECT_CONTAINER } from '../../containerFixtures';

import { ActiveUserLimitMessage } from '../settings/ActiveUserLimit';

import { TEST_USER_APP_ADMIN, TEST_USER_PROJECT_ADMIN } from '../../userFixtures';

import { InjectedPermissionsPage } from '../permissions/withPermissionsPage';

import { AdminAppContext } from '../../AppContext';

import { getNewUserRoles, UserManagementPageImpl } from './UserManagement';

describe('UserManagement', () => {
    function getDefaultProps(): InjectedPermissionsPage {
        return {
            error: undefined,
            inactiveUsersById: undefined,
            principals: List(),
            principalsById: Map(),
            roles: List(),
            rolesByUniqueName: Map(),
        };
    }

    function validate(wrapper: ReactWrapper, hasNewUserRoles = false, allowResetPassword = true): void {
        expect(wrapper.find(BasePermissionsCheckPage)).toHaveLength(1);
        expect(wrapper.find(ActiveUserLimitMessage)).toHaveLength(1);
        expect(wrapper.find(UsersGridPanel)).toHaveLength(1);
        expect(wrapper.find(UsersGridPanel).prop('allowResetPassword')).toBe(allowResetPassword);

        const _hasNewUserRoles = wrapper.find(UsersGridPanel).prop('newUserRoleOptions') !== undefined;
        expect(_hasNewUserRoles).toBe(hasNewUserRoles);
    }

    test('default props', () => {
        const wrapper = mountWithAppServerContext(
            <UserManagementPageImpl
                {...getDefaultProps()}
                createNotification={jest.fn()}
                dismissNotifications={jest.fn()}
            />,
            { admin: {} as AdminAppContext },
            {
                user: TEST_USER_APP_ADMIN,
            }
        );
        validate(wrapper);
        wrapper.unmount();
    });

    test('non-inherit security policy', () => {
        const wrapper = mountWithAppServerContext(
            <UserManagementPageImpl
                {...getDefaultProps()}
                createNotification={jest.fn()}
                dismissNotifications={jest.fn()}
            />,
            { admin: {} as AdminAppContext },
            {
                user: TEST_USER_APP_ADMIN,
            }
        );
        wrapper.find('UserManagement').setState({ policy: new SecurityPolicy({ resourceId: '1', containerId: '1' }) });
        validate(wrapper, true);
        wrapper.unmount();
    });

    test('inherit security policy', () => {
        const wrapper = mountWithAppServerContext(
            <UserManagementPageImpl
                {...getDefaultProps()}
                createNotification={jest.fn()}
                dismissNotifications={jest.fn()}
            />,
            { admin: {} as AdminAppContext },
            {
                user: TEST_USER_APP_ADMIN,
            }
        );
        wrapper.find('UserManagement').setState({ policy: new SecurityPolicy({ resourceId: '1', containerId: '2' }) });
        validate(wrapper);
        wrapper.unmount();
    });

    test('allowResetPassword false', () => {
        const wrapper = mountWithAppServerContext(
            <UserManagementPageImpl
                {...getDefaultProps()}
                createNotification={jest.fn()}
                dismissNotifications={jest.fn()}
            />,
            { admin: {} as AdminAppContext },
            {
                user: TEST_USER_APP_ADMIN,
                moduleContext: { api: { AutoRedirectSSOAuthConfiguration: true } },
            }
        );
        validate(wrapper, false, false);
        wrapper.unmount();
    });
});

describe('getNewUsersRoles', () => {
    // Copied from freezermanager/src/constants.ts
    const STORAGE_ROLES = [
        ['org.labkey.api.inventory.security.StorageDesignerRole', 'Storage Designer'],
        ['org.labkey.api.inventory.security.StorageDataEditorRole', 'Storage Editor'],
    ];

    test('non premium, non project, app admin', () => {
        const roles = getNewUserRoles(TEST_USER_APP_ADMIN, TEST_FOLDER_CONTAINER, TEST_PROJECT, STORAGE_ROLES);
        expect(roles.length).toBe(6);
        expect(roles.find(role => role.id === PermissionRoles.ApplicationAdmin)).toBeDefined();
    });

    test('premium, non project, app admin', () => {
        const moduleContext = { api: { moduleNames: ['premium'] } };
        const roles = getNewUserRoles(
            TEST_USER_APP_ADMIN,
            TEST_FOLDER_CONTAINER,
            TEST_PROJECT,
            STORAGE_ROLES,
            moduleContext
        );
        expect(roles.length).toBe(7);
        expect(roles.find(role => role.id === PermissionRoles.FolderAdmin)).toBeDefined();
        expect(roles.find(role => role.id === PermissionRoles.ApplicationAdmin)).toBeDefined();
    });

    test('premium, project, app admin', () => {
        const moduleContext = { api: { moduleNames: ['premium'] } };
        const roles = getNewUserRoles(
            TEST_USER_APP_ADMIN,
            TEST_PROJECT_CONTAINER,
            TEST_PROJECT,
            STORAGE_ROLES,
            moduleContext
        );
        expect(roles.length).toBe(8);
        expect(roles.find(role => role.id === PermissionRoles.FolderAdmin)).toBeDefined();
        expect(roles.find(role => role.id === PermissionRoles.ProjectAdmin)).toBeDefined();
        expect(roles.find(role => role.id === PermissionRoles.ApplicationAdmin)).toBeDefined();
    });

    test('non premium, non project, non app admin', () => {
        const roles = getNewUserRoles(TEST_USER_PROJECT_ADMIN, TEST_FOLDER_CONTAINER, TEST_PROJECT, STORAGE_ROLES);
        expect(roles.length).toBe(5);
        expect(roles.find(role => role.id === PermissionRoles.ApplicationAdmin)).toBeUndefined();
    });

    test('premium, non project, non app admin', () => {
        const moduleContext = { api: { moduleNames: ['premium'] } };
        const roles = getNewUserRoles(
            TEST_USER_PROJECT_ADMIN,
            TEST_FOLDER_CONTAINER,
            TEST_PROJECT,
            STORAGE_ROLES,
            moduleContext
        );
        expect(roles.length).toBe(6);
        expect(roles.find(role => role.id === PermissionRoles.FolderAdmin)).toBeDefined();
        expect(roles.find(role => role.id === PermissionRoles.ApplicationAdmin)).toBeUndefined();
    });

    test('premium, project, non app admin', () => {
        const moduleContext = { api: { moduleNames: ['premium'] } };
        const roles = getNewUserRoles(
            TEST_USER_PROJECT_ADMIN,
            TEST_PROJECT_CONTAINER,
            TEST_PROJECT,
            STORAGE_ROLES,
            moduleContext
        );
        expect(roles.length).toBe(7);
        expect(roles.find(role => role.id === PermissionRoles.FolderAdmin)).toBeDefined();
        expect(roles.find(role => role.id === PermissionRoles.ProjectAdmin)).toBeDefined();
        expect(roles.find(role => role.id === PermissionRoles.ApplicationAdmin)).toBeUndefined();
    });
});
