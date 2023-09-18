import React from 'react';
import { List, Map, fromJS } from 'immutable';
import { act } from 'react-dom/test-utils';

import policyJSON from '../../../test/data/security-getPolicy.json';

import rolesJSON from '../../../test/data/security-getRoles.json';

import { JEST_SITE_ADMIN_USER_ID, SECURITY_ROLE_EDITOR, SECURITY_ROLE_READER } from '../../../test/data/constants';
import { TEST_FOLDER_CONTAINER, TEST_PROJECT_CONTAINER, TEST_PROJECT } from '../../containerFixtures';

import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';
import { ServerContext } from '../base/ServerContext';
import { TEST_USER_APP_ADMIN, TEST_USER_FOLDER_ADMIN } from '../../userFixtures';
import { getSecurityTestAPIWrapper, SecurityAPIWrapper } from '../security/APIWrapper';
import { AppContext } from '../../AppContext';
import { getTestAPIWrapper } from '../../APIWrapper';
import { Alert } from '../base/Alert';

import { UserDetailsPanel } from '../user/UserDetailsPanel';

import { MemberType } from '../administration/models';

import { initBrowserHistoryState } from '../../util/global';

import { PermissionsRole } from './PermissionsRole';
import { getRolesByUniqueName, processGetRolesResponse } from './actions';
import { Principal, SecurityPolicy } from './models';
import { PermissionAssignments, PermissionAssignmentsProps } from './PermissionAssignments';
import { GroupDetailsPanel } from './GroupDetailsPanel';

const GROUP = Principal.createFromSelectRow(
    fromJS({
        UserId: { value: 11842 },
        Type: { value: MemberType.group },
        Name: { value: 'Editor User Group' },
    })
);

const USER = Principal.createFromSelectRow(
    fromJS({
        UserId: { value: JEST_SITE_ADMIN_USER_ID },
        Type: { value: MemberType.user },
        Name: { value: 'cnathe@labkey.com' },
        DisplayName: { value: 'Cory Nathe' },
    })
);

const GROUPS = [
    {
        id: 11842,
        name: 'Editor User Group',
        isProjectGroup: true,
    },
];

const PRINCIPALS = List<Principal>([GROUP, USER]);
const PRINCIPALS_BY_ID = PRINCIPALS.reduce((map, principal) => {
    return map.set(principal.userId, principal);
}, Map<number, Principal>());

const POLICY = SecurityPolicy.updateAssignmentsData(SecurityPolicy.create(policyJSON), PRINCIPALS_BY_ID);
const ROLES = processGetRolesResponse(rolesJSON.roles);
const ROLES_BY_NAME = getRolesByUniqueName(ROLES);

beforeAll(() => {
    initBrowserHistoryState();
});

describe('PermissionAssignments', () => {
    function getDefaultProps(): PermissionAssignmentsProps {
        return {
            containerId: TEST_PROJECT_CONTAINER.id,
            error: undefined,
            inactiveUsersById: Map<number, Principal>(),
            onChange: jest.fn(),
            onSuccess: jest.fn(),
            policy: POLICY,
            principals: PRINCIPALS,
            principalsById: PRINCIPALS_BY_ID,
            roles: ROLES,
            rolesByUniqueName: ROLES_BY_NAME,
            getIsDirty: jest.fn(),
            setIsDirty: jest.fn(),
        };
    }

    function getDefaultAppContext(overrides?: Partial<SecurityAPIWrapper>): Partial<AppContext> {
        return {
            api: getTestAPIWrapper(jest.fn, {
                security: getSecurityTestAPIWrapper(jest.fn, {
                    fetchPolicy: jest.fn().mockResolvedValue(POLICY),
                    ...overrides,
                }),
            }),
        };
    }

    function getDefaultServerContext(overrides?: Partial<ServerContext>): Partial<ServerContext> {
        return {
            container: TEST_PROJECT_CONTAINER,
            project: TEST_PROJECT,
            user: TEST_USER_FOLDER_ADMIN,
            ...overrides,
        };
    }

    const fetchPolicy = jest.fn().mockResolvedValue(POLICY);
    const fetchGroups = jest.fn().mockResolvedValue(GROUPS);
    const getGroupMemberships = jest.fn().mockResolvedValue([]);

    test('loads root policy', async () => {
        const container = TEST_FOLDER_CONTAINER;
        const defaultProps = getDefaultProps();

        const wrapper = mountWithAppServerContext(
            <PermissionAssignments {...defaultProps} containerId={container.id} />,
            getDefaultAppContext({ fetchPolicy, fetchGroups, getGroupMemberships }),
            getDefaultServerContext({
                container,
                user: TEST_USER_APP_ADMIN, // has "isRootAdmin" privileges
            })
        );

        await waitForLifecycle(wrapper);

        expect(fetchPolicy).toHaveBeenNthCalledWith(
            1,
            TEST_PROJECT.rootId,
            defaultProps.principalsById,
            defaultProps.inactiveUsersById
        );

        wrapper.unmount();
    });

    test('not inherited', () => {
        const defaultProps = getDefaultProps();

        const wrapper = mountWithAppServerContext(
            <PermissionAssignments {...defaultProps} />,
            getDefaultAppContext(),
            getDefaultServerContext()
        );

        // Does not display inherit checkbox
        expect(wrapper.find('.permissions-assignment-inherit').exists()).toEqual(false);
        expect(wrapper.find(PermissionsRole).length).toEqual(defaultProps.policy.relevantRoles.size);

        wrapper.unmount();
    });

    test('inherited', () => {
        const defaultProps = getDefaultProps();
        const inheritPolicy = POLICY.set('containerId', 'NOT_RESOURCE_ID') as SecurityPolicy;

        const wrapper = mountWithAppServerContext(
            <PermissionAssignments {...defaultProps} policy={inheritPolicy} />,
            getDefaultAppContext(),
            getDefaultServerContext({ container: TEST_FOLDER_CONTAINER })
        );

        expect(wrapper.find(Alert).text()).toContain(
            'Permissions for this container are being inherited from its parent.'
        );

        // Displays inherit checkbox
        const inheritCheckbox = wrapper.find('.permissions-assignment-inherit');
        expect(inheritCheckbox.exists()).toEqual(true);
        expect(inheritCheckbox.at(0).prop('checked')).toEqual(true);
        expect(wrapper.find(PermissionsRole).length).toEqual(defaultProps.policy.relevantRoles.size);

        wrapper.unmount();
    });

    test('cannot inherit', () => {
        const defaultProps = getDefaultProps();

        // permission assignments for the root project from a subfolder
        const wrapper = mountWithAppServerContext(
            <PermissionAssignments {...defaultProps} containerId={TEST_PROJECT.rootId} />,
            getDefaultAppContext(),
            getDefaultServerContext({ container: TEST_FOLDER_CONTAINER })
        );

        // Does not display inherit checkbox
        expect(wrapper.find('.permissions-assignment-inherit').exists()).toEqual(false);
        expect(wrapper.find(PermissionsRole).length).toEqual(defaultProps.policy.relevantRoles.size);

        wrapper.unmount();
    });

    test('respects rolesToShow', () => {
        const defaultProps = getDefaultProps();
        const rolesToShow = List<string>([SECURITY_ROLE_EDITOR, SECURITY_ROLE_READER]);

        const wrapper = mountWithAppServerContext(
            <PermissionAssignments {...defaultProps} rolesToShow={rolesToShow} />,
            getDefaultAppContext(),
            getDefaultServerContext()
        );

        expect(wrapper.find(PermissionsRole).length).toEqual(rolesToShow.size);

        wrapper.setProps({ rolesToShow: undefined });

        expect(wrapper.find(PermissionsRole).length).toEqual(defaultProps.policy.relevantRoles.size);

        wrapper.unmount();
    });

    test('displays details', async () => {
        const wrapper = mountWithAppServerContext(
            <PermissionAssignments {...getDefaultProps()} />,
            getDefaultAppContext({ fetchPolicy, fetchGroups, getGroupMemberships }),
            getDefaultServerContext()
        );

        // The prop "showDetailsPanel" is expected to default to true
        expect(wrapper.find(GroupDetailsPanel).exists()).toEqual(false);
        expect(wrapper.find(UserDetailsPanel).exists()).toEqual(true);

        wrapper.setProps({ showDetailsPanel: false });

        expect(wrapper.find(GroupDetailsPanel).exists()).toEqual(false);
        expect(wrapper.find(UserDetailsPanel).exists()).toEqual(false);

        wrapper.setProps({ showDetailsPanel: true });

        const onShowDetails = wrapper.find(PermissionsRole).at(0).prop('onClickAssignment');
        act(() => {
            onShowDetails(USER.userId);
        });

        await waitForLifecycle(wrapper);

        expect(wrapper.find(GroupDetailsPanel).exists()).toEqual(false);
        expect(wrapper.find(UserDetailsPanel).exists()).toEqual(true);
        expect(wrapper.find(UserDetailsPanel).prop('userId')).toEqual(USER.userId);

        wrapper.unmount();
    });

    test('add and remove assignment', async () => {
        const onChange = jest.fn();
        const firstRole = ROLES.get(0);
        const wrapper = mountWithAppServerContext(
            <PermissionAssignments {...getDefaultProps()} onChange={onChange} />,
            getDefaultAppContext({ fetchPolicy, fetchGroups, getGroupMemberships }),
            getDefaultServerContext()
        );

        expect(wrapper.find(PermissionsRole).exists()).toEqual(true);

        const onAddAssignment = wrapper.find(PermissionsRole).at(0).prop('onAddAssignment');
        act(() => {
            onAddAssignment(USER, firstRole);
        });

        await waitForLifecycle(wrapper);
        expect(onChange).toHaveBeenCalledTimes(1);

        const onRemoveAssignment = wrapper.find(PermissionsRole).at(0).prop('onRemoveAssignment');
        act(() => {
            onRemoveAssignment(USER.userId, firstRole);
        });

        await waitForLifecycle(wrapper);
        expect(onChange).toHaveBeenCalledTimes(2);

        wrapper.unmount();
    });

    // error case
});
