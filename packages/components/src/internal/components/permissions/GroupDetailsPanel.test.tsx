import React from 'react';
import { fromJS } from 'immutable';
import { waitFor } from '@testing-library/react';

import policyJSON from '../../../test/data/security-getPolicy.json';

import rolesJSON from '../../../test/data/security-getRoles.json';

import { MemberType } from '../administration/models';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { TEST_USER_APP_ADMIN } from '../../userFixtures';

import { GroupDetailsPanel } from './GroupDetailsPanel';
import { Principal, SecurityPolicy } from './models';
import { getRolesByUniqueName, processGetRolesResponse } from './actions';
import { getTestAPIWrapper } from '../../APIWrapper';
import { getSecurityTestAPIWrapper } from '../security/APIWrapper';

const GROUP = Principal.createFromSelectRow(
    fromJS({
        UserId: { value: 11842 },
        Type: { value: MemberType.group },
        Name: { value: 'Editor User Group' },
    })
);

const POLICY = SecurityPolicy.create(policyJSON);
const ROLES = processGetRolesResponse(rolesJSON.roles);
const ROLES_BY_NAME = getRolesByUniqueName(ROLES);

const getDefaultAppContext = () => ({
    api: getTestAPIWrapper(jest.fn, {
        security: getSecurityTestAPIWrapper(jest.fn, {
            getAuditLogDate: jest.fn().mockResolvedValue(''),
        }),
    }),
});

describe('GroupDetailsPanel', () => {
    test('no principal', () => {
        renderWithAppContext(
            <GroupDetailsPanel policy={POLICY} rolesByUniqueName={ROLES_BY_NAME} members={[]} isSiteGroup={false} />,
            {
                appContext: getDefaultAppContext(),
                serverContext: { user: TEST_USER_APP_ADMIN },
            }
        );

        expect(document.querySelector('.panel-heading')).toHaveTextContent('Group Details');
        expect(document.querySelectorAll('.principal-detail-label')).toHaveLength(0);
        expect(document.querySelectorAll('.principal-detail-value')).toHaveLength(0);
        expect(document.querySelectorAll('.principal-detail-li')).toHaveLength(0);
    });

    test('with principal and members', async () => {
        renderWithAppContext(
            <GroupDetailsPanel
                principal={GROUP}
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                members={[
                    { id: 1, name: 'user1', type: MemberType.user },
                    { id: 2, name: 'user2', type: MemberType.user },
                    { id: 3, name: 'group1', type: MemberType.group },
                ]}
                isSiteGroup={false}
            />,
            {
                appContext: getDefaultAppContext(),
                serverContext: { user: TEST_USER_APP_ADMIN },
            }
        );

        await waitFor(() => {
            expect(document.querySelector('.panel-heading')).toHaveTextContent(GROUP.name);
        });

        const labels = document.querySelectorAll('.principal-detail-label');
        const values = document.querySelectorAll('.principal-detail-value');
        expect(labels).toHaveLength(5);
        expect(labels[0]).toHaveTextContent('User Count');
        expect(values[0]).toHaveTextContent('2');
        expect(labels[1]).toHaveTextContent('Group Count');
        expect(values[1]).toHaveTextContent('1');
        expect(labels[2]).toHaveTextContent('Created');
        expect(labels[3]).toHaveTextContent('Effective Roles');
        expect(values[3]).toHaveTextContent('Editor');
        expect(labels[4]).toHaveTextContent('Members');
        expect(values[4]).toHaveTextContent('user1user2group1');

        const items = document.querySelectorAll('.principal-detail-li');
        expect(items).toHaveLength(4);
        expect(items[0]).toHaveTextContent('Editor');
        expect(items[1]).toHaveTextContent('user1');
        expect(items[2]).toHaveTextContent('user2');
        expect(items[3]).toHaveTextContent('group1');
    });

    test('with inactive member filtered out', async () => {
        renderWithAppContext(
            <GroupDetailsPanel
                principal={GROUP}
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                members={[
                    { id: 1, name: 'user1', type: MemberType.user, userActive: false },
                    { id: 2, name: 'user2', type: MemberType.user, userActive: true },
                    { id: 3, name: 'group1', type: MemberType.group, userActive: undefined },
                ]}
                isSiteGroup={false}
            />,
            {
                appContext: getDefaultAppContext(),
                serverContext: { user: TEST_USER_APP_ADMIN },
            }
        );

        await waitFor(() => {
            expect(document.querySelector('.panel-heading')).toHaveTextContent(GROUP.name);
        });

        const labels = document.querySelectorAll('.principal-detail-label');
        const values = document.querySelectorAll('.principal-detail-value');
        expect(labels).toHaveLength(5);
        expect(labels[0]).toHaveTextContent('User Count');
        expect(values[0]).toHaveTextContent('1');
        expect(labels[1]).toHaveTextContent('Group Count');
        expect(values[1]).toHaveTextContent('1');
        expect(labels[2]).toHaveTextContent('Created');
        expect(labels[3]).toHaveTextContent('Effective Roles');
        expect(values[3]).toHaveTextContent('Editor');
        expect(labels[4]).toHaveTextContent('Members');
        expect(values[4]).toHaveTextContent('user2group1');

        const items = document.querySelectorAll('.principal-detail-li');
        expect(items).toHaveLength(3);
        expect(items[0]).toHaveTextContent('Editor');
        expect(items[1]).toHaveTextContent('user2');
        expect(items[2]).toHaveTextContent('group1');
    });

    test('with only inactive users', async () => {
        renderWithAppContext(
            <GroupDetailsPanel
                principal={GROUP}
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                members={[
                    { id: 1, name: 'user1', type: MemberType.user, userActive: false },
                    { id: 2, name: 'user2', type: MemberType.user, userActive: false },
                ]}
                isSiteGroup={false}
            />,
            {
                appContext: getDefaultAppContext(),
                serverContext: { user: TEST_USER_APP_ADMIN },
            }
        );

        await waitFor(() => {
            expect(document.querySelector('.panel-heading')).toHaveTextContent(GROUP.name);
        });

        const labels = document.querySelectorAll('.principal-detail-label');
        const values = document.querySelectorAll('.principal-detail-value');
        expect(labels).toHaveLength(4);
        expect(labels[0]).toHaveTextContent('User Count');
        expect(values[0]).toHaveTextContent('0');
        expect(labels[1]).toHaveTextContent('Group Count');
        expect(values[1]).toHaveTextContent('0');
        expect(labels[2]).toHaveTextContent('Created');
        expect(labels[3]).toHaveTextContent('Effective Roles');
        expect(values[3]).toHaveTextContent('Editor');

        const items = document.querySelectorAll('.principal-detail-li');
        expect(items).toHaveLength(1);
        expect(items[0]).toHaveTextContent('Editor');
    });

    test('as site group', async () => {
        renderWithAppContext(
            <GroupDetailsPanel
                principal={GROUP}
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                members={[
                    { id: 1, name: 'user1', type: MemberType.user },
                    { id: 3, name: 'group1', type: MemberType.group },
                ]}
                isSiteGroup
            />,
            {
                appContext: getDefaultAppContext(),
                serverContext: { user: TEST_USER_APP_ADMIN },
            }
        );

        await waitFor(() => {
            expect(document.querySelector('.panel-heading')).toHaveTextContent(GROUP.name);
        });

        const labels = document.querySelectorAll('.principal-detail-label');
        const values = document.querySelectorAll('.principal-detail-value');
        expect(labels).toHaveLength(6);
        expect(labels[0]).toHaveTextContent('User Count');
        expect(values[0]).toHaveTextContent('1');
        expect(labels[1]).toHaveTextContent('Group Count');
        expect(values[1]).toHaveTextContent('1');
        expect(labels[2]).toHaveTextContent('Created');
        expect(labels[3]).toHaveTextContent('Site Group');
        expect(values[3]).toHaveTextContent('true');
        expect(labels[4]).toHaveTextContent('Effective Roles');
        expect(values[4]).toHaveTextContent('Editor');
        expect(labels[5]).toHaveTextContent('Members');
        expect(values[5]).toHaveTextContent('user1group1');

        const items = document.querySelectorAll('.principal-detail-li');
        expect(items).toHaveLength(3);
        expect(items[0]).toHaveTextContent('Editor');
        expect(items[1]).toHaveTextContent('user1');
        expect(items[2]).toHaveTextContent('group1');
    });

    test("as site group, don't display counts", async () => {
        renderWithAppContext(
            <GroupDetailsPanel
                principal={GROUP}
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                members={[
                    { id: 1, name: 'user1', type: MemberType.user },
                    { id: 3, name: 'group1', type: MemberType.group },
                ]}
                isSiteGroup
                displayCounts={false}
            />,
            {
                appContext: getDefaultAppContext(),
                serverContext: { user: TEST_USER_APP_ADMIN },
            }
        );

        await waitFor(() => {
            expect(document.querySelector('.panel-heading')).toHaveTextContent(GROUP.name);
        });

        const labels = document.querySelectorAll('.principal-detail-label');
        const values = document.querySelectorAll('.principal-detail-value');
        expect(labels).toHaveLength(4);
        expect(labels[0]).toHaveTextContent('Created');
        expect(labels[1]).toHaveTextContent('Site Group');
        expect(values[1]).toHaveTextContent('true');
        expect(labels[2]).toHaveTextContent('Effective Roles');
        expect(values[2]).toHaveTextContent('Editor');
        expect(labels[3]).toHaveTextContent('Members');
        expect(values[3]).toHaveTextContent('user1group1');

        const items = document.querySelectorAll('.principal-detail-li');
        expect(items).toHaveLength(3);
        expect(items[0]).toHaveTextContent('Editor');
        expect(items[1]).toHaveTextContent('user1');
        expect(items[2]).toHaveTextContent('group1');
    });
});
