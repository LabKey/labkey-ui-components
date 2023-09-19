import React from 'react';
import { List, Map, fromJS } from 'immutable';
import { act } from 'react-dom/test-utils';

import policyJSON from '../../../test/data/security-getPolicy.json';

import policyRootJSON from '../../../test/data/security-getPolicyRoot.json';

import rolesJSON from '../../../test/data/security-getRoles.json';

import {
    JEST_SITE_ADMIN_USER_ID,
    SECURITY_ROLE_APPADMIN,
    SECURITY_ROLE_EDITOR,
    SECURITY_ROLE_READER,
} from '../../../test/data/constants';
import {
    TEST_PROJECT,
    TEST_PROJECT_CONTAINER_ADMIN,
    TEST_FOLDER_CONTAINER_ADMIN,
    TEST_FOLDER_OTHER_CONTAINER_ADMIN,
} from '../../containerFixtures';

import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';
import { ServerContext } from '../base/ServerContext';
import { TEST_USER_APP_ADMIN, TEST_USER_FOLDER_ADMIN, TEST_USER_PROJECT_ADMIN } from '../../userFixtures';
import { getSecurityTestAPIWrapper, SecurityAPIWrapper } from '../security/APIWrapper';
import { AppContext } from '../../AppContext';
import { getTestAPIWrapper } from '../../APIWrapper';
import { Alert } from '../base/Alert';

import { MemberType } from '../administration/models';

import { initBrowserHistoryState } from '../../util/global';

import { FolderAPIWrapper, getFolderTestAPIWrapper } from '../container/FolderAPIWrapper';

import { ProjectListing } from '../project/ProjectListing';

import { UserDetailsPanel } from '../user/UserDetailsPanel';

import { PermissionsRole } from './PermissionsRole';
import { getRolesByUniqueName, processGetRolesResponse } from './actions';
import { Principal, SecurityPolicy } from './models';
import { PermissionAssignments, PermissionAssignmentsProps } from './PermissionAssignments';

import { GroupDetailsPanel } from './GroupDetailsPanel';

const allProjects = [TEST_PROJECT_CONTAINER_ADMIN, TEST_FOLDER_CONTAINER_ADMIN, TEST_FOLDER_OTHER_CONTAINER_ADMIN];

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
const ROOT_POLICY = SecurityPolicy.updateAssignmentsData(SecurityPolicy.create(policyRootJSON), PRINCIPALS_BY_ID);
const ROLES = processGetRolesResponse(rolesJSON.roles);
const ROLES_BY_NAME = getRolesByUniqueName(ROLES);

beforeAll(() => {
    initBrowserHistoryState();
});

describe('PermissionAssignments', () => {
    function getDefaultProps(): PermissionAssignmentsProps {
        return {
            error: undefined,
            inactiveUsersById: Map<number, Principal>(),
            onSuccess: jest.fn(),
            principals: PRINCIPALS,
            principalsById: PRINCIPALS_BY_ID,
            roles: ROLES,
            rolesByUniqueName: ROLES_BY_NAME,
            getIsDirty: jest.fn(),
            setIsDirty: jest.fn(),
        };
    }

    const fetchProjects = jest.fn().mockResolvedValue(allProjects);
    const getInheritedProjects = jest.fn().mockResolvedValue([TEST_FOLDER_OTHER_CONTAINER_ADMIN.name]);
    const fetchPolicy = jest.fn().mockResolvedValue(POLICY);
    const fetchRootPolicy = jest.fn().mockResolvedValue(ROOT_POLICY);
    const inheritPolicy = POLICY.set('containerId', 'NOT_RESOURCE_ID') as SecurityPolicy;
    const fetchPolicyInherited = jest.fn().mockResolvedValue(inheritPolicy);
    const fetchGroups = jest.fn().mockResolvedValue(GROUPS);
    const getGroupMemberships = jest.fn().mockResolvedValue([]);

    function getDefaultAppContext(
        overrides?: Partial<SecurityAPIWrapper>,
        overridesFolder?: Partial<FolderAPIWrapper>
    ): Partial<AppContext> {
        return {
            api: getTestAPIWrapper(jest.fn, {
                security: getSecurityTestAPIWrapper(jest.fn, {
                    fetchPolicy: jest.fn().mockResolvedValue(POLICY),
                    getInheritedProjects,
                    ...overrides,
                }),
                folder: getFolderTestAPIWrapper(jest.fn, {
                    getProjects: fetchProjects,
                    ...overridesFolder,
                }),
            }),
        };
    }

    function getDefaultServerContext(overrides?: Partial<ServerContext>): Partial<ServerContext> {
        return {
            container: TEST_PROJECT_CONTAINER_ADMIN,
            project: TEST_PROJECT,
            user: TEST_USER_FOLDER_ADMIN,
            ...overrides,
        };
    }

    test('loads root policy', async () => {
        const container = TEST_FOLDER_CONTAINER_ADMIN;
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

    test('not inherited, can inherit', async () => {
        const defaultProps = getDefaultProps();

        const wrapper = mountWithAppServerContext(
            <PermissionAssignments {...defaultProps} />,
            getDefaultAppContext(),
            getDefaultServerContext({
                container: TEST_FOLDER_CONTAINER_ADMIN,
                moduleContext: { query: { isProductProjectsEnabled: true } },
            })
        );

        await waitForLifecycle(wrapper, 1);

        // Does not display inherit checkbox
        expect(wrapper.find('.permissions-assignment-inherit').exists()).toEqual(true);
        expect(wrapper.find(PermissionsRole).length).toEqual(POLICY.relevantRoles.size);

        wrapper.unmount();
    });

    test('inherited', async () => {
        const defaultProps = getDefaultProps();

        const wrapper = mountWithAppServerContext(
            <PermissionAssignments {...defaultProps} />,
            getDefaultAppContext({ fetchPolicy: fetchPolicyInherited }),
            getDefaultServerContext({
                container: TEST_FOLDER_OTHER_CONTAINER_ADMIN,
                moduleContext: { query: { isProductProjectsEnabled: true } },
            })
        );

        await waitForLifecycle(wrapper, 1);

        expect(fetchPolicyInherited).toHaveBeenNthCalledWith(
            1,
            TEST_FOLDER_OTHER_CONTAINER_ADMIN.id,
            defaultProps.principalsById,
            defaultProps.inactiveUsersById
        );

        expect(wrapper.find(Alert).text()).toContain(
            'Permissions for this project are being inherited from the application.'
        );

        // project is selected by default and has inherited icon
        const projectList = wrapper.find(ProjectListing);
        expect(projectList.prop('selectedProject')).toEqual(TEST_FOLDER_OTHER_CONTAINER_ADMIN);
        expect(projectList.prop('inheritedProjects')).toEqual([TEST_FOLDER_OTHER_CONTAINER_ADMIN.name]);

        // Displays inherit checkbox
        const inheritCheckbox = wrapper.find('.permissions-assignment-inherit');
        expect(inheritCheckbox.exists()).toEqual(true);
        expect(inheritCheckbox.at(0).prop('checked')).toEqual(true);

        // no roles are displayed
        expect(wrapper.find(PermissionsRole).length).toBe(0);

        wrapper.unmount();
    });

    test('cannot inherit', async () => {
        const defaultProps = getDefaultProps();

        // permission assignments for the root project
        const wrapper = mountWithAppServerContext(
            <PermissionAssignments {...defaultProps} />,
            getDefaultAppContext(),
            getDefaultServerContext({
                container: TEST_PROJECT_CONTAINER_ADMIN,
                moduleContext: { query: { isProductProjectsEnabled: true } },
            })
        );

        await waitForLifecycle(wrapper, 1);

        expect(fetchPolicy).toHaveBeenCalledTimes(2);

        const projectList = wrapper.find(ProjectListing);
        expect(projectList.prop('selectedProject')).toEqual(TEST_PROJECT_CONTAINER_ADMIN);
        expect(projectList.prop('inheritedProjects')).toEqual([TEST_FOLDER_OTHER_CONTAINER_ADMIN.name]);

        // Does not display inherit checkbox
        expect(wrapper.find('.permissions-assignment-inherit').exists()).toEqual(false);
        expect(wrapper.find(PermissionsRole).length).toEqual(POLICY.relevantRoles.size);

        wrapper.unmount();
    });

    test('respects rolesToShow', async () => {
        const defaultProps = getDefaultProps();
        const rolesToShow = List<string>([SECURITY_ROLE_EDITOR, SECURITY_ROLE_READER]);

        const wrapper = mountWithAppServerContext(
            <PermissionAssignments {...defaultProps} rolesToShow={rolesToShow} />,
            getDefaultAppContext(),
            getDefaultServerContext()
        );

        await waitForLifecycle(wrapper, 1);

        expect(wrapper.find(PermissionsRole).length).toEqual(rolesToShow.size);

        wrapper.setProps({ rolesToShow: undefined });

        expect(wrapper.find(PermissionsRole).length).toEqual(POLICY.relevantRoles.size);

        wrapper.unmount();
    });

    test('respects rootRolesToShow at appHome, as root admin', async () => {
        const defaultProps = getDefaultProps();
        const rolesToShow = List<string>([]);
        const rootRolesToShow = List<string>([SECURITY_ROLE_APPADMIN]);

        const wrapper = mountWithAppServerContext(
            <PermissionAssignments {...defaultProps} rolesToShow={rolesToShow} rootRolesToShow={rootRolesToShow} />,
            getDefaultAppContext({ fetchPolicy: fetchRootPolicy }),
            getDefaultServerContext({
                container: TEST_PROJECT_CONTAINER_ADMIN,
                moduleContext: { query: { isProductProjectsEnabled: true } },
                user: TEST_USER_APP_ADMIN,
            })
        );

        await waitForLifecycle(wrapper, 1);

        expect(wrapper.find(PermissionsRole).length).toEqual(rootRolesToShow.size);

        wrapper.setProps({ rootRolesToShow: undefined });

        expect(wrapper.find(PermissionsRole).length).toEqual(0);

        wrapper.unmount();
    });

    test('ignore rootRolesToShow at appHome, as non root admin', async () => {
        const defaultProps = getDefaultProps();
        const rolesToShow = List<string>([]);
        const rootRolesToShow = List<string>([SECURITY_ROLE_APPADMIN]);

        const wrapper = mountWithAppServerContext(
            <PermissionAssignments {...defaultProps} rolesToShow={rolesToShow} rootRolesToShow={rootRolesToShow} />,
            getDefaultAppContext({ fetchPolicy: fetchRootPolicy }),
            getDefaultServerContext({
                container: TEST_PROJECT_CONTAINER_ADMIN,
                moduleContext: { query: { isProductProjectsEnabled: true } },
                user: TEST_USER_PROJECT_ADMIN,
            })
        );

        await waitForLifecycle(wrapper, 1);

        expect(wrapper.find(PermissionsRole).length).toEqual(0);

        wrapper.setProps({ rootRolesToShow: undefined });

        expect(wrapper.find(PermissionsRole).length).toEqual(0);

        wrapper.unmount();
    });

    test('ignore rootRolesToShow at non appHome, as root admin', async () => {
        const defaultProps = getDefaultProps();
        const rolesToShow = List<string>([]);
        const rootRolesToShow = List<string>([SECURITY_ROLE_APPADMIN]);

        const wrapper = mountWithAppServerContext(
            <PermissionAssignments {...defaultProps} rolesToShow={rolesToShow} rootRolesToShow={rootRolesToShow} />,
            getDefaultAppContext({ fetchPolicy: fetchRootPolicy }),
            getDefaultServerContext({
                container: TEST_FOLDER_CONTAINER_ADMIN,
                moduleContext: { query: { isProductProjectsEnabled: true } },
                user: TEST_USER_APP_ADMIN,
            })
        );

        await waitForLifecycle(wrapper, 1);

        expect(wrapper.find(PermissionsRole).length).toEqual(0);

        wrapper.setProps({ rootRolesToShow: undefined });

        expect(wrapper.find(PermissionsRole).length).toEqual(0);

        wrapper.unmount();
    });

    test('displays details', async () => {
        const wrapper = mountWithAppServerContext(
            <PermissionAssignments {...getDefaultProps()} />,
            getDefaultAppContext({ fetchPolicy, fetchGroups, getGroupMemberships }),
            getDefaultServerContext()
        );

        await waitForLifecycle(wrapper, 1);

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
        const setIsDirty = jest.fn();
        const firstRole = ROLES.get(0);
        const wrapper = mountWithAppServerContext(
            <PermissionAssignments {...getDefaultProps()} setIsDirty={setIsDirty} />,
            getDefaultAppContext({ fetchPolicy, fetchGroups, getGroupMemberships }),
            getDefaultServerContext()
        );

        await waitForLifecycle(wrapper, 1);

        expect(wrapper.find(PermissionsRole).exists()).toEqual(true);

        const onAddAssignment = wrapper.find(PermissionsRole).at(0).prop('onAddAssignment');
        act(() => {
            onAddAssignment(USER, firstRole);
        });

        await waitForLifecycle(wrapper);
        expect(setIsDirty).toHaveBeenCalledTimes(1);

        const onRemoveAssignment = wrapper.find(PermissionsRole).at(0).prop('onRemoveAssignment');
        act(() => {
            onRemoveAssignment(USER.userId, firstRole);
        });

        await waitForLifecycle(wrapper);
        expect(setIsDirty).toHaveBeenCalledTimes(2);

        wrapper.unmount();
    });
});
