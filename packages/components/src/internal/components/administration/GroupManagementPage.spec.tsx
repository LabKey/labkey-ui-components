import React from 'react';
import { List, Map } from 'immutable';

import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';
import { createMockWithRouteLeave } from '../../mockUtils';
import { getSecurityTestAPIWrapper, SecurityAPIWrapper } from '../security/APIWrapper';
import { AppContext } from '../../AppContext';
import { getTestAPIWrapper } from '../../APIWrapper';
import { SecurityPolicy } from '../permissions/models';
import policyJSON from '../../../test/data/security-getPolicy.json';
import { ServerContext } from '../base/ServerContext';
import { TEST_USER_FOLDER_ADMIN } from '../../userFixtures';
import { TEST_PROJECT, TEST_PROJECT_CONTAINER } from '../../containerFixtures';

import { Alert } from '../base/Alert';

import { GroupManagementPageImpl, GroupManagementPageProps } from './GroupManagementPage';
import { GroupAssignments } from './GroupAssignments';

describe('GroupManagementPage', () => {
    function getDefaultProps(): GroupManagementPageProps {
        return {
            error: undefined,
            inactiveUsersById: Map(),
            principals: List(),
            principalsById: Map(),
            roles: List(),
            rolesByUniqueName: Map(),
            ...createMockWithRouteLeave(jest.fn),
        };
    }

    const TEST_POLICY = SecurityPolicy.create(policyJSON);

    function getDefaultAppContext(overrides?: Partial<SecurityAPIWrapper>): Partial<AppContext> {
        return {
            api: getTestAPIWrapper(jest.fn, {
                security: getSecurityTestAPIWrapper(jest.fn, {
                    fetchPolicy: jest.fn().mockResolvedValue(TEST_POLICY),
                    fetchGroups: jest.fn().mockResolvedValue([]),
                    getGroupMemberships: jest.fn().mockResolvedValue([]),
                    getAuditLogData: jest.fn().mockResolvedValue('Modified a day ago'),
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

    test('loads', async () => {
        const wrapper = mountWithAppServerContext(
            <GroupManagementPageImpl {...getDefaultProps()} />,
            getDefaultAppContext(),
            getDefaultServerContext()
        );

        expect(wrapper.find(GroupAssignments).exists()).toBe(false);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(GroupAssignments).exists()).toBe(true);

        wrapper.unmount();
    });

    test('handles error', async () => {
        const wrapper = mountWithAppServerContext(
            <GroupManagementPageImpl {...getDefaultProps()} />,
            getDefaultAppContext({ fetchPolicy: jest.fn().mockRejectedValue(undefined) }),
            getDefaultServerContext()
        );

        await waitForLifecycle(wrapper);
        expect(wrapper.find(Alert).text()).toEqual('Failed to load group data');
        expect(wrapper.find(GroupAssignments).exists()).toBe(false);

        wrapper.unmount();
    });
});
