import React from 'react';
import { List, Map } from 'immutable';
import { mount, ReactWrapper } from 'enzyme';
import { LabKey, PermissionRoles } from '@labkey/api';

import { initQueryGridState } from '../../global';
import { initNotificationsState } from '../notifications/global';
import { BasePermissionsCheckPage } from '../permissions/BasePermissionsCheckPage';
import { UsersGridPanel } from '../user/UsersGridPanel';
import { SecurityPolicy } from '../permissions/models';
import { Container } from '../base/models/Container';

import { App } from '../../../index';

import { getNewUserRoles, UserManagement, UserManagementProps } from './UserManagement';
import { getSecurityTestAPIWrapper } from '../security/APIWrapper';
import { TEST_PROJECT_CONTAINER } from '../../../test/data/constants';

declare const LABKEY: LabKey;

beforeAll(() => {
    initQueryGridState();
    initNotificationsState();
});

beforeEach(() => {
    LABKEY.moduleContext.api = {};
});

describe('UserManagement', () => {
    function getDefaultProps(): UserManagementProps {
        return {
            error: undefined,
            api: getSecurityTestAPIWrapper(jest.fn),
            container: TEST_PROJECT_CONTAINER,
            extraRoles: undefined,
            inactiveUsersById: undefined,
            principals: List(),
            principalsById: Map(),
            project: undefined,
            roles: List(),
            rolesByUniqueName: Map(),
            user: App.TEST_USER_APP_ADMIN,
        };
    }

    function validate(wrapper: ReactWrapper, hasNewUserRoles = false, allowResetPassword = true): void {
        expect(wrapper.find(BasePermissionsCheckPage)).toHaveLength(1);
        expect(wrapper.find(UsersGridPanel)).toHaveLength(1);
        expect(wrapper.find(UsersGridPanel).prop('allowResetPassword')).toBe(allowResetPassword);

        const _hasNewUserRoles = wrapper.find(UsersGridPanel).prop('newUserRoleOptions') !== undefined;
        expect(_hasNewUserRoles).toBe(hasNewUserRoles);
    }

    test('default props', () => {
        const wrapper = mount(<UserManagement {...getDefaultProps()} />);
        validate(wrapper);
        wrapper.unmount();
    });

    test('non-inherit security policy', () => {
        const wrapper = mount(<UserManagement {...getDefaultProps()} />);
        wrapper.setState({ policy: new SecurityPolicy({ resourceId: '1', containerId: '1' }) });
        validate(wrapper, true);
        wrapper.unmount();
    });

    test('inherit security policy', () => {
        const wrapper = mount(<UserManagement {...getDefaultProps()} />);
        wrapper.setState({ policy: new SecurityPolicy({ resourceId: '1', containerId: '2' }) });
        validate(wrapper);
        wrapper.unmount();
    });

    test('allowResetPassword false', () => {
        LABKEY.moduleContext.api = { AutoRedirectSSOAuthConfiguration: true };
        const wrapper = mount(<UserManagement {...getDefaultProps()} />);
        validate(wrapper, false, false);
        wrapper.unmount();
    });
});

describe('getNewUsersRoles', () => {
    const CONTAINER = new Container({ parentId: 'projectid' });
    const PROJECT_CONTAINER = new Container({ parentId: 'rootid' });
    const PROJECT = { rootId: 'rootid' };
    // Copied from freezermanager/src/constants.ts
    const STORAGE_ROLES = [
        ['org.labkey.api.inventory.security.StorageDesignerRole', 'Storage Designer'],
        ['org.labkey.api.inventory.security.StorageDataEditorRole', 'Storage Editor'],
    ];

    test('non premium, non project, app admin', () => {
        const roles = getNewUserRoles(App.TEST_USER_APP_ADMIN, CONTAINER, PROJECT, STORAGE_ROLES);
        expect(roles.length).toBe(5);
        expect(roles.find(role => role.id === PermissionRoles.ApplicationAdmin)).toBeDefined();
    });

    test('premium, non project, app admin', () => {
        LABKEY.moduleContext = { api: { moduleNames: ['premium'] } };
        const roles = getNewUserRoles(App.TEST_USER_APP_ADMIN, CONTAINER, PROJECT, STORAGE_ROLES);
        expect(roles.length).toBe(6);
        expect(roles.find(role => role.id === PermissionRoles.FolderAdmin)).toBeDefined();
        expect(roles.find(role => role.id === PermissionRoles.ApplicationAdmin)).toBeDefined();
    });

    test('premium, project, app admin', () => {
        LABKEY.moduleContext = { api: { moduleNames: ['premium'] } };
        const roles = getNewUserRoles(App.TEST_USER_APP_ADMIN, PROJECT_CONTAINER, PROJECT, STORAGE_ROLES);
        expect(roles.length).toBe(7);
        expect(roles.find(role => role.id === PermissionRoles.FolderAdmin)).toBeDefined();
        expect(roles.find(role => role.id === PermissionRoles.ProjectAdmin)).toBeDefined();
        expect(roles.find(role => role.id === PermissionRoles.ApplicationAdmin)).toBeDefined();
    });

    test('non premium, non project, non app admin', () => {
        const roles = getNewUserRoles(App.TEST_USER_PROJECT_ADMIN, CONTAINER, PROJECT, STORAGE_ROLES);
        expect(roles.length).toBe(4);
        expect(roles.find(role => role.id === PermissionRoles.ApplicationAdmin)).toBeUndefined();
    });

    test('premium, non project, non app admin', () => {
        LABKEY.moduleContext = { api: { moduleNames: ['premium'] } };
        const roles = getNewUserRoles(App.TEST_USER_PROJECT_ADMIN, CONTAINER, PROJECT, STORAGE_ROLES);
        expect(roles.length).toBe(5);
        expect(roles.find(role => role.id === PermissionRoles.FolderAdmin)).toBeDefined();
        expect(roles.find(role => role.id === PermissionRoles.ApplicationAdmin)).toBeUndefined();
    });

    test('premium, project, non app admin', () => {
        LABKEY.moduleContext = { api: { moduleNames: ['premium'] } };
        const roles = getNewUserRoles(App.TEST_USER_PROJECT_ADMIN, PROJECT_CONTAINER, PROJECT, STORAGE_ROLES);
        expect(roles.length).toBe(6);
        expect(roles.find(role => role.id === PermissionRoles.FolderAdmin)).toBeDefined();
        expect(roles.find(role => role.id === PermissionRoles.ProjectAdmin)).toBeDefined();
        expect(roles.find(role => role.id === PermissionRoles.ApplicationAdmin)).toBeUndefined();
    });
});
