import React from 'react';

import { fromJS, List, Map } from 'immutable';

import { ReactWrapper } from 'enzyme';

import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';

import { TEST_USER_APP_ADMIN, TEST_USER_EDITOR } from '../../userFixtures';
import { AdminAppContext, AppContext } from '../../AppContext';

import { TEST_LKS_STARTER_MODULE_CONTEXT, TEST_LKSM_STARTER_MODULE_CONTEXT } from '../../productFixtures';

import { JEST_SITE_ADMIN_USER_ID } from '../../../test/data/constants';
import { TEST_PROJECT, TEST_PROJECT_CONTAINER } from '../../containerFixtures';
import { getSecurityTestAPIWrapper } from '../security/APIWrapper';
import { getTestAPIWrapper } from '../../APIWrapper';
import { Principal, SecurityPolicy } from '../permissions/models';
import policyJSON from '../../../test/data/security-getPolicy.json';

import { initBrowserHistoryState } from '../../util/global';

import { PermissionAssignments } from '../permissions/PermissionAssignments';
import { createMockWithRouteLeave } from '../../mockUtils';
import { BasePermissionsCheckPage } from '../permissions/BasePermissionsCheckPage';

import { MemberType } from './models';
import { PermissionManagementPage, PermissionManagementPageImpl } from './PermissionManagementPage';

const USER = Principal.createFromSelectRow(
    fromJS({
        UserId: { value: JEST_SITE_ADMIN_USER_ID },
        Type: { value: MemberType.user },
        Name: { value: 'cnathe@labkey.com' },
        DisplayName: { value: 'Cory Nathe' },
    })
);
const GROUP = Principal.createFromSelectRow(
    fromJS({
        UserId: { value: 11842 },
        Type: { value: MemberType.group },
        Name: { value: 'Editor User Group' },
    })
);
const PRINCIPALS = List<Principal>([GROUP, USER]);
const PRINCIPALS_BY_ID = PRINCIPALS.reduce((map, principal) => {
    return map.set(principal.userId, principal);
}, Map<number, Principal>());
const POLICY = SecurityPolicy.updateAssignmentsData(SecurityPolicy.create(policyJSON), PRINCIPALS_BY_ID);

beforeAll(() => {
    initBrowserHistoryState();
});

describe('PermissionManagementPage', () => {
    function getDefaultProps() {
        return {
            roles: List(),
            ...createMockWithRouteLeave(jest.fn),
        };
    }

    function getDefaultAppContext(admin = {}): Partial<AppContext> {
        return {
            admin: admin as AdminAppContext,
            api: getTestAPIWrapper(jest.fn, {
                security: getSecurityTestAPIWrapper(jest.fn, {
                    fetchPolicy: jest.fn().mockResolvedValue(POLICY),
                }),
            }),
        };
    }

    function validate(wrapper: ReactWrapper, hasPermission, description?: string): void {
        expect(wrapper.find(BasePermissionsCheckPage)).toHaveLength(1);
        const props = wrapper.find(BasePermissionsCheckPage).props();
        expect(props.hasPermission).toBe(hasPermission);
        expect(props.description).toBe(description);
    }

    test('premium roles', async () => {
        const wrapper = mountWithAppServerContext(
            <PermissionManagementPageImpl {...getDefaultProps()} />,
            getDefaultAppContext(),
            {
                user: TEST_USER_APP_ADMIN,
                container: TEST_PROJECT_CONTAINER,
                moduleContext: TEST_LKS_STARTER_MODULE_CONTEXT,
                project: TEST_PROJECT,
            }
        );
        await waitForLifecycle(wrapper);

        validate(wrapper, true, TEST_PROJECT.path);
        const props = wrapper.find(PermissionAssignments).props();
        expect(Object.values(props.rolesToShow.toJS())).toStrictEqual([
            'org.labkey.api.security.roles.ProjectAdminRole',
            'org.labkey.api.security.roles.FolderAdminRole',
            'org.labkey.api.security.roles.EditorRole',
            'org.labkey.api.security.roles.EditorWithoutDeleteRole',
            'org.labkey.api.security.roles.ReaderRole',
        ]);
        expect(props.rootRolesToShow).toBeUndefined();
        wrapper.unmount();
    });

    test('hosted only roles', async () => {
        const wrapper = mountWithAppServerContext(
            <PermissionManagementPageImpl {...getDefaultProps()} />,
            getDefaultAppContext(),
            {
                user: TEST_USER_APP_ADMIN,
                container: TEST_PROJECT_CONTAINER,
                moduleContext: TEST_LKSM_STARTER_MODULE_CONTEXT,
                project: TEST_PROJECT,
            }
        );
        await waitForLifecycle(wrapper);

        validate(wrapper, true, null);
        const props = wrapper.find(PermissionAssignments).props();
        expect(Object.values(props.rolesToShow.toJS())).toStrictEqual([
            'org.labkey.api.security.roles.EditorRole',
            'org.labkey.api.security.roles.EditorWithoutDeleteRole',
            'org.labkey.api.security.roles.ReaderRole',
        ]);
        expect(Object.values(props.rootRolesToShow.toJS())).toStrictEqual([
            'org.labkey.api.security.roles.ApplicationAdminRole',
        ]);
        wrapper.unmount();
    });

    test('without perm', async () => {
        const wrapper = mountWithAppServerContext(
            <PermissionManagementPageImpl {...getDefaultProps()} />,
            getDefaultAppContext(),
            {
                user: TEST_USER_EDITOR,
                container: TEST_PROJECT_CONTAINER,
                moduleContext: TEST_LKS_STARTER_MODULE_CONTEXT,
                project: TEST_PROJECT,
            }
        );
        await waitForLifecycle(wrapper);

        validate(wrapper, false, TEST_PROJECT.path);

        wrapper.unmount();
    });

    test('extraPermissionRoles', async () => {
        const wrapper = mountWithAppServerContext(
            <PermissionManagementPageImpl {...getDefaultProps()} />,
            getDefaultAppContext({
                extraPermissionRoles: [['test', 'test role']],
            }),
            {
                user: TEST_USER_APP_ADMIN,
                container: TEST_PROJECT_CONTAINER,
                moduleContext: TEST_LKS_STARTER_MODULE_CONTEXT,
                project: TEST_PROJECT,
            }
        );
        await waitForLifecycle(wrapper);

        validate(wrapper, true, TEST_PROJECT.path);
        const props = wrapper.find(PermissionAssignments).props();
        expect(Object.values(props.rolesToShow.toJS())).toStrictEqual([
            'org.labkey.api.security.roles.ProjectAdminRole',
            'org.labkey.api.security.roles.FolderAdminRole',
            'org.labkey.api.security.roles.EditorRole',
            'org.labkey.api.security.roles.EditorWithoutDeleteRole',
            'org.labkey.api.security.roles.ReaderRole',
            'test',
        ]);
        expect(props.rootRolesToShow).toBeUndefined();
        wrapper.unmount();
    });
});
