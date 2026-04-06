import React from 'react';
import { act } from '@testing-library/react';

import { TEST_PROJECT_CONTAINER, TEST_PROJECT_CONTAINER_ADMIN } from '../../containerFixtures';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';
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
        const { container } = renderWithAppContext(
            <GroupsList groups={[]} />,
            {
                appContext: getDefaultAppContext({ fetchContainers, fetchPolicy, fetchGroups, getGroupMemberships }),
                serverContext: { container: TEST_PROJECT_CONTAINER, user: TEST_USER_APP_ADMIN },
            }
        );

        await act(async () => {});

        expect(container.querySelectorAll('.principal-detail-ul')).toHaveLength(1);
        expect(container.querySelectorAll('.principal-detail-li')).toHaveLength(1);
        expect(container.querySelector('.principal-detail-ul').textContent).toBe('None');
    });

    test('just project groups', async () => {
        const { container } = renderWithAppContext(
            <GroupsList
                groups={[
                    { value: 1, displayValue: 'Group A' },
                    { value: 2, displayValue: 'Group B' },
                ]}
            />,
            {
                appContext: getDefaultAppContext({ fetchContainers, fetchPolicy, fetchGroups, getGroupMemberships }),
                serverContext: { container: TEST_PROJECT_CONTAINER, user: TEST_USER_APP_ADMIN },
            }
        );

        await act(async () => {});

        expect(container.querySelectorAll('.principal-detail-ul')).toHaveLength(1);
        expect(container.querySelectorAll('.principal-detail-li')).toHaveLength(2);
        const anchors = container.querySelectorAll('a');
        expect(anchors).toHaveLength(2);
        expect(anchors[0].getAttribute('href')).toBe('/admin/groups?expand=1');
        expect(anchors[1].getAttribute('href')).toBe('/admin/groups?expand=2');
        expect(container.querySelector('.principal-detail-ul').textContent).toBe('Group AGroup B');
    });

    test('with site groups', async () => {
        const { container } = renderWithAppContext(
            <GroupsList
                groups={[
                    { value: 1, displayValue: 'Group A' },
                    { value: 2, displayValue: 'Group B' },
                    { value: 3, displayValue: 'Group Site' },
                ]}
            />,
            {
                appContext: getDefaultAppContext({ fetchContainers, fetchPolicy, fetchGroups, getGroupMemberships }),
                serverContext: { container: TEST_PROJECT_CONTAINER, user: TEST_USER_APP_ADMIN },
            }
        );

        await act(async () => {});

        expect(container.querySelectorAll('.principal-detail-ul')).toHaveLength(1);
        expect(container.querySelectorAll('.principal-detail-li')).toHaveLength(3);
        const anchors = container.querySelectorAll('a');
        expect(anchors).toHaveLength(2);
        expect(anchors[0].getAttribute('href')).toBe('/admin/groups?expand=1');
        expect(anchors[1].getAttribute('href')).toBe('/admin/groups?expand=2');
        expect(container.querySelector('.principal-detail-ul').textContent).toBe('Group AGroup BGroup Site');
    });

    test('non admin', async () => {
        const { container } = renderWithAppContext(
            <GroupsList
                groups={[
                    { value: 1, displayValue: 'Group A' },
                    { value: 2, displayValue: 'Group B' },
                    { value: 3, displayValue: 'Group Site' },
                ]}
            />,
            {
                appContext: getDefaultAppContext({
                    fetchContainers: jest.fn().mockResolvedValue([TEST_PROJECT_CONTAINER]),
                    fetchPolicy,
                    fetchGroups,
                    getGroupMemberships,
                }),
                serverContext: { container: TEST_PROJECT_CONTAINER, user: TEST_USER_READER },
            }
        );

        await act(async () => {});

        expect(container.querySelectorAll('.principal-detail-ul')).toHaveLength(1);
        expect(container.querySelectorAll('.principal-detail-li')).toHaveLength(3);
        expect(container.querySelectorAll('a')).toHaveLength(0);
        expect(container.querySelector('.principal-detail-ul').textContent).toBe('Group AGroup BGroup Site');
    });

    test('admin, showLinks false', async () => {
        const { container } = renderWithAppContext(
            <GroupsList
                showLinks={false}
                groups={[
                    { value: 1, displayValue: 'Group A' },
                    { value: 2, displayValue: 'Group B' },
                    { value: 3, displayValue: 'Group Site' },
                ]}
            />,
            {
                appContext: getDefaultAppContext({ fetchContainers, fetchPolicy, fetchGroups, getGroupMemberships }),
                serverContext: { container: TEST_PROJECT_CONTAINER, user: TEST_USER_APP_ADMIN },
            }
        );

        await act(async () => {});

        expect(container.querySelectorAll('.principal-detail-ul')).toHaveLength(1);
        expect(container.querySelectorAll('.principal-detail-li')).toHaveLength(3);
        expect(container.querySelectorAll('a')).toHaveLength(0);
        expect(container.querySelector('.principal-detail-ul').textContent).toBe('Group AGroup BGroup Site');
    });
});
