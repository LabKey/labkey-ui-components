import React from 'react';
import { List, Map } from 'immutable';

import { mountWithAppServerContext, waitForLifecycle } from '../../testHelpers';
import { createMockWithRouteLeave } from '../../mockUtils';
import { ServerContext } from '../base/ServerContext';
import { TEST_PROJECT_CONTAINER, TEST_PROJECT } from '../../containerFixtures';
import { TEST_USER_FOLDER_ADMIN } from '../../userFixtures';

import policyJSON from '../../../test/data/security-getPolicy.json';

import { Alert } from '../base/Alert';

import { AppContext } from '../../AppContext';
import { getTestAPIWrapper } from '../../APIWrapper';
import { getSecurityTestAPIWrapper, SecurityAPIWrapper } from '../security/APIWrapper';
import { SecurityPolicy, SecurityRole } from '../permissions/models';
import { PermissionAssignments } from '../permissions/PermissionAssignments';

import { initBrowserHistoryState } from '../../util/global';

import { BasePermissionsImpl, BasePermissionsImplProps } from './BasePermissions';

const TEST_POLICY = SecurityPolicy.create(policyJSON);

beforeAll(() => {
    initBrowserHistoryState();
});

describe('BasePermissions', () => {
    function getDefaultProps(): BasePermissionsImplProps {
        return {
            error: undefined,
            containerId: TEST_PROJECT_CONTAINER.id,
            disableRemoveSelf: false,
            hasPermission: true,
            inactiveUsersById: Map(),
            pageTitle: 'page title',
            panelTitle: 'panel title',
            principals: List(),
            principalsById: Map(),
            roles: List(),
            rolesByUniqueName: Map(),
            rolesMap: Map(),
            showDetailsPanel: false,
            ...createMockWithRouteLeave(jest.fn),
        };
    }

    function getDefaultAppContext(overrides?: Partial<SecurityAPIWrapper>): Partial<AppContext> {
        return {
            api: getTestAPIWrapper(jest.fn, {
                security: getSecurityTestAPIWrapper(jest.fn, {
                    fetchPolicy: jest.fn().mockResolvedValue(TEST_POLICY),
                    fetchGroups: jest.fn().mockResolvedValue([]),
                    getGroupMemberships: jest.fn().mockResolvedValue([]),
                    ...overrides,
                }),
            }),
        };
    }

    function getDefaultServerContext(): Partial<ServerContext> {
        return {
            container: TEST_PROJECT_CONTAINER,
            project: TEST_PROJECT,
            user: TEST_USER_FOLDER_ADMIN,
        };
    }

    test('loads policy', async () => {
        const wrapper = mountWithAppServerContext(
            <BasePermissionsImpl {...getDefaultProps()} />,
            getDefaultAppContext(),
            getDefaultServerContext()
        );

        expect(wrapper.find(PermissionAssignments).exists()).toBe(false);

        await waitForLifecycle(wrapper);

        expect(wrapper.find(PermissionAssignments).exists()).toBe(true);
        expect(wrapper.find(PermissionAssignments).prop('policy')).toEqual(TEST_POLICY);

        wrapper.unmount();
    });

    test('handles error', async () => {
        const wrapper = mountWithAppServerContext(
            <BasePermissionsImpl {...getDefaultProps()} />,
            getDefaultAppContext({
                fetchPolicy: jest.fn().mockRejectedValue(undefined),
            }),
            getDefaultServerContext()
        );

        await waitForLifecycle(wrapper);

        expect(wrapper.find(Alert).text()).toEqual('Failed to load security policy');
        expect(wrapper.find(PermissionAssignments).exists()).toBe(false);

        wrapper.unmount();
    });

    test('processes roles', async () => {
        const donutRole = SecurityRole.create({
            displayName: 'Donut Role',
            uniqueName: 'org.bakery.api.security.roles.donutRole',
        });
        const pizzaRole = SecurityRole.create({
            displayName: 'Pizza Role',
            uniqueName: 'org.bakery.api.security.roles.pizzaRole',
        });
        const roles = List<SecurityRole>([donutRole, pizzaRole]);
        const roleMap = roles.reduce((map, role) => {
            return map.set(role.uniqueName, role.displayName);
        }, Map<string, string>());

        const wrapper = mountWithAppServerContext(
            <BasePermissionsImpl {...getDefaultProps()} roles={roles} rolesMap={roleMap} />,
            getDefaultAppContext(),
            getDefaultServerContext()
        );

        await waitForLifecycle(wrapper);
        expect(wrapper.find(PermissionAssignments).prop('roles').size).toEqual(roles.size);

        wrapper.unmount();
    });
});
