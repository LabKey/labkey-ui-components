import React from 'react';

import { fromJS, List, Map } from 'immutable';

import { ReactWrapper } from 'enzyme';

import { mountWithAppServerContext, waitForLifecycle } from '../../enzymeTestHelpers';

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

import { BasePermissions } from './BasePermissions';
import { PermissionManagementPage } from './PermissionManagementPage';
import { MemberType } from './models';

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

    function validate(wrapper: ReactWrapper, hasPermission = true): void {
        expect(wrapper.find(BasePermissions)).toHaveLength(1);
        const props = wrapper.find(BasePermissions).props();
        expect(props.containerId).toBe(TEST_PROJECT_CONTAINER.id);
        expect(props.hasPermission).toBe(hasPermission);
        expect(props.showDetailsPanel).toBe(hasPermission);
    }

    test('premium roles', async () => {
        const wrapper = mountWithAppServerContext(<PermissionManagementPage />, getDefaultAppContext(), {
            user: TEST_USER_APP_ADMIN,
            container: TEST_PROJECT_CONTAINER,
            moduleContext: TEST_LKS_STARTER_MODULE_CONTEXT,
            project: TEST_PROJECT,
        });
        await waitForLifecycle(wrapper);

        validate(wrapper);
        const props = wrapper.find(BasePermissions).props();
        expect(props.description).toBe(TEST_PROJECT_CONTAINER.path);
        expect(Object.values(props.rolesMap.toJS())).toStrictEqual([
            'Project Administrator',
            'Folder Administrator',
            'Editor',
            'Editor without Delete',
            'Reader',
        ]);

        wrapper.unmount();
    });

    test('hosted only roles', async () => {
        const wrapper = mountWithAppServerContext(<PermissionManagementPage />, getDefaultAppContext(), {
            user: TEST_USER_APP_ADMIN,
            container: TEST_PROJECT_CONTAINER,
            moduleContext: TEST_LKSM_STARTER_MODULE_CONTEXT,
            project: TEST_PROJECT,
        });
        await waitForLifecycle(wrapper);

        validate(wrapper);
        const props = wrapper.find(BasePermissions).props();
        expect(props.description).toBe(undefined);
        expect(Object.values(props.rolesMap.toJS())).toStrictEqual(['Editor', 'Editor without Delete', 'Reader']);

        wrapper.unmount();
    });

    test('without perm', async () => {
        const wrapper = mountWithAppServerContext(<PermissionManagementPage />, getDefaultAppContext(), {
            user: TEST_USER_EDITOR,
            container: TEST_PROJECT_CONTAINER,
            moduleContext: TEST_LKS_STARTER_MODULE_CONTEXT,
            project: TEST_PROJECT,
        });
        await waitForLifecycle(wrapper);

        validate(wrapper, false);

        wrapper.unmount();
    });

    test('extraPermissionRoles', async () => {
        const wrapper = mountWithAppServerContext(
            <PermissionManagementPage />,
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

        validate(wrapper);
        const props = wrapper.find(BasePermissions).props();
        expect(Object.values(props.rolesMap.toJS())).toStrictEqual([
            'Project Administrator',
            'Folder Administrator',
            'Editor',
            'Editor without Delete',
            'Reader',
            'test role',
        ]);

        wrapper.unmount();
    });
});
