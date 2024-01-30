import React from 'react';

import { TEST_PROJECT_CONTAINER, TEST_PROJECT_CONTAINER_ADMIN } from '../../containerFixtures';

import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';
import { TEST_USER_APP_ADMIN, TEST_USER_READER } from '../../userFixtures';
import { getSecurityTestAPIWrapper, SecurityAPIWrapper } from '../security/APIWrapper';
import { AppContext } from '../../AppContext';
import { getTestAPIWrapper } from '../../APIWrapper';

import { GroupsList } from './GroupsList';
import { SecurityPolicy } from './models';

describe('GroupsList', () => {
    function getDefaultAppContext(overrides?: Partial<SecurityAPIWrapper>): Partial<AppContext> {
        return {
            api: getTestAPIWrapper(jest.fn, {
                security: getSecurityTestAPIWrapper(jest.fn, {
                    ...overrides,
                }),
            }),
        };
    }

    const fetchContainers = jest.fn().mockResolvedValue([TEST_PROJECT_CONTAINER_ADMIN]);
    const fetchPolicy = jest.fn().mockResolvedValue(SecurityPolicy.create({}));
    const fetchGroups = jest.fn().mockResolvedValue([
        {
            id: 1,
            name: 'Group A',
            isProjectGroup: true,
        },
        {
            id: 2,
            name: 'Group B',
            isProjectGroup: true,
        },
        {
            id: 3,
            name: 'Group Site',
            isProjectGroup: false,
        },
    ]);
    const getGroupMemberships = jest.fn().mockResolvedValue([]);

    test('no groups', async () => {
        const wrapper = mountWithAppServerContext(
            <GroupsList groups={[]} />,
            getDefaultAppContext({ fetchContainers, fetchPolicy, fetchGroups, getGroupMemberships }),
            {
                container: TEST_PROJECT_CONTAINER,
                user: TEST_USER_APP_ADMIN,
            }
        );

        await waitForLifecycle(wrapper);

        expect(wrapper.find('.principal-detail-ul')).toHaveLength(1);
        expect(wrapper.find('.principal-detail-li')).toHaveLength(1);
        expect(wrapper.find('.principal-detail-ul').text()).toBe('None');

        wrapper.unmount();
    });

    test('just project groups', async () => {
        const wrapper = mountWithAppServerContext(
            <GroupsList
                groups={[
                    { value: 1, displayValue: 'Group A' },
                    { value: 2, displayValue: 'Group B' },
                ]}
            />,
            getDefaultAppContext({ fetchContainers, fetchPolicy, fetchGroups, getGroupMemberships }),
            {
                container: TEST_PROJECT_CONTAINER,
                user: TEST_USER_APP_ADMIN,
            }
        );

        await waitForLifecycle(wrapper);

        expect(wrapper.find('.principal-detail-ul')).toHaveLength(1);
        expect(wrapper.find('.principal-detail-li')).toHaveLength(2);
        expect(wrapper.find('a')).toHaveLength(2);
        expect(wrapper.find('a').at(0).prop('href')).toBe('#/admin/groups?expand=1');
        expect(wrapper.find('a').at(1).prop('href')).toBe('#/admin/groups?expand=2');
        expect(wrapper.find('.principal-detail-ul').text()).toBe('Group AGroup B');

        wrapper.unmount();
    });

    test('with site groups', async () => {
        const wrapper = mountWithAppServerContext(
            <GroupsList
                groups={[
                    { value: 1, displayValue: 'Group A' },
                    { value: 2, displayValue: 'Group B' },
                    { value: 3, displayValue: 'Group Site' },
                ]}
            />,
            getDefaultAppContext({ fetchContainers, fetchPolicy, fetchGroups, getGroupMemberships }),
            {
                container: TEST_PROJECT_CONTAINER,
                user: TEST_USER_APP_ADMIN,
            }
        );

        await waitForLifecycle(wrapper);

        expect(wrapper.find('.principal-detail-ul')).toHaveLength(1);
        expect(wrapper.find('.principal-detail-li')).toHaveLength(3);
        expect(wrapper.find('a')).toHaveLength(2);
        expect(wrapper.find('a').at(0).prop('href')).toBe('#/admin/groups?expand=1');
        expect(wrapper.find('a').at(1).prop('href')).toBe('#/admin/groups?expand=2');
        expect(wrapper.find('.principal-detail-ul').text()).toBe('Group AGroup BGroup Site');

        wrapper.unmount();
    });

    test('non admin', async () => {
        const wrapper = mountWithAppServerContext(
            <GroupsList
                groups={[
                    { value: 1, displayValue: 'Group A' },
                    { value: 2, displayValue: 'Group B' },
                    { value: 3, displayValue: 'Group Site' },
                ]}
            />,
            getDefaultAppContext({
                fetchContainers: jest.fn().mockResolvedValue([TEST_PROJECT_CONTAINER]),
                fetchPolicy,
                fetchGroups,
                getGroupMemberships,
            }),
            {
                container: TEST_PROJECT_CONTAINER,
                user: TEST_USER_READER,
            }
        );

        await waitForLifecycle(wrapper);

        expect(wrapper.find('.principal-detail-ul')).toHaveLength(1);
        expect(wrapper.find('.principal-detail-li')).toHaveLength(3);
        expect(wrapper.find('a')).toHaveLength(0);
        expect(wrapper.find('.principal-detail-ul').text()).toBe('Group AGroup BGroup Site');

        wrapper.unmount();
    });

    test('admin, showLinks false', async () => {
        const wrapper = mountWithAppServerContext(
            <GroupsList
                showLinks={false}
                groups={[
                    { value: 1, displayValue: 'Group A' },
                    { value: 2, displayValue: 'Group B' },
                    { value: 3, displayValue: 'Group Site' },
                ]}
            />,
            getDefaultAppContext({ fetchContainers, fetchPolicy, fetchGroups, getGroupMemberships }),
            {
                container: TEST_PROJECT_CONTAINER,
                user: TEST_USER_APP_ADMIN,
            }
        );

        await waitForLifecycle(wrapper);

        expect(wrapper.find('.principal-detail-ul')).toHaveLength(1);
        expect(wrapper.find('.principal-detail-li')).toHaveLength(3);
        expect(wrapper.find('a')).toHaveLength(0);
        expect(wrapper.find('.principal-detail-ul').text()).toBe('Group AGroup BGroup Site');

        wrapper.unmount();
    });
});
