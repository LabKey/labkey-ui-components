import React, { act } from 'react';

import { getRolesByUniqueName, processGetRolesResponse } from '../permissions/actions';
import policyJSON from '../../../test/data/security-getPolicy.json';
import rolesJSON from '../../../test/data/security-getRoles.json';
import userPropsInfo from '../../../test/data/user-getUserProps.json';
import { JEST_SITE_ADMIN_USER_ID } from '../../../test/data/constants';

import { Principal, SecurityPolicy } from '../permissions/models';

import { TEST_USER_APP_ADMIN } from '../../userFixtures';

import { getSecurityTestAPIWrapper } from '../security/APIWrapper';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';
import { TEST_PROJECT_CONTAINER, TEST_PROJECT_CONTAINER_ADMIN } from '../../containerFixtures';
import { getTestAPIWrapper } from '../../APIWrapper';

import { UserDetailsPanel } from './UserDetailsPanel';

const POLICY = SecurityPolicy.create(policyJSON);
const ROLES = processGetRolesResponse(rolesJSON.roles);
const ROLES_BY_NAME = getRolesByUniqueName(ROLES);
const API = getSecurityTestAPIWrapper(jest.fn, {
    fetchPolicy: jest.fn().mockResolvedValue(POLICY),
    fetchRoles: jest.fn().mockResolvedValue(ROLES),
    fetchContainers: jest.fn().mockResolvedValue([TEST_PROJECT_CONTAINER_ADMIN]),
    fetchGroups: jest.fn().mockResolvedValue([]),
    getGroupMemberships: jest.fn().mockResolvedValue([]),
    getUserProperties: jest.fn().mockResolvedValue(userPropsInfo),
    getUserPropertiesForOther: jest.fn().mockResolvedValue({
        Email: 'cnathe@labkey.com',
        UserId: 1004,
        LastLogin: '2020-01-06 15:30:12.027',
        DisplayName: 'cnathe',
        Created: '2017-05-08 08:43:49.710',
    }),
});

const APP_CONTEXT = { api: getTestAPIWrapper(jest.fn, { security: API }) };
const SERVER_CONTEXT = {
    container: TEST_PROJECT_CONTAINER,
    user: TEST_USER_APP_ADMIN,
    moduleContext: {
        samplemanagement: {},
    }
};

describe('<UserDetailsPanel/>', () => {
    test('no principal', async () => {
        const component = (
            <UserDetailsPanel
                currentUser={TEST_USER_APP_ADMIN}
                userId={undefined}
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                api={API}
            />
        );
        let container;
        await act(async () => {
            container = renderWithAppContext(component, {
                appContext: APP_CONTEXT,
                serverContext: SERVER_CONTEXT,
            }).container;
        });
        expect(container).toMatchSnapshot();
    });

    test('with principal no buttons because of self', async () => {
        const component = (
            <UserDetailsPanel
                currentUser={TEST_USER_APP_ADMIN}
                userId={JEST_SITE_ADMIN_USER_ID} // see components/package.json "jest" config for the setting of self's userId
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                onUsersStateChangeComplete={jest.fn()}
                isSelf={true}
                api={API}
            />
        );
        let container;
        await act(async () => {
            container = renderWithAppContext(component, {
                appContext: APP_CONTEXT,
                serverContext: SERVER_CONTEXT,
            }).container;
        });
        expect(container).toMatchSnapshot();
    });

    test('with principal and buttons', async () => {
        const component = (
            <UserDetailsPanel
                currentUser={TEST_USER_APP_ADMIN}
                userId={1005} // self is JEST_SITE_ADMIN_USER_ID which will prevent buttons from rendering
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                onUsersStateChangeComplete={jest.fn()}
                api={API}
            />
        );
        let container;
        await act(async () => {
            container = renderWithAppContext(component, {
                appContext: APP_CONTEXT,
                serverContext: SERVER_CONTEXT,
            }).container;
        });
        expect(container).toMatchSnapshot();
    });

    test('with principal and buttons not allowDelete or allowResetPassword', async () => {
        const component = (
            <UserDetailsPanel
                currentUser={TEST_USER_APP_ADMIN}
                userId={1005} // self is JEST_SITE_ADMIN_USER_ID which will prevent buttons from rendering
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                allowDelete={false}
                allowResetPassword={false}
                onUsersStateChangeComplete={jest.fn()}
                api={API}
            />
        );
        let container;
        await act(async () => {
            container = renderWithAppContext(component, {
                appContext: APP_CONTEXT,
                serverContext: SERVER_CONTEXT,
            }).container;
        });
        expect(container).toMatchSnapshot();
    });

    test('unknown user props', async () => {
        const component = (
            <UserDetailsPanel
                currentUser={TEST_USER_APP_ADMIN}
                userId={1234}
                displayName="TestDisplayName"
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                onUsersStateChangeComplete={jest.fn()}
                api={{
                    ...API,
                    getUserPropertiesForOther: jest.fn().mockResolvedValue({}),
                }}
            />
        );
        let container;
        await act(async () => {
            container = renderWithAppContext(component, {
                appContext: APP_CONTEXT,
                serverContext: SERVER_CONTEXT,
            }).container;
        });
        expect(container).toMatchSnapshot();
    });

    test('with principal that isGroup', async () => {
        const GROUP_ID = 1006;
        const groupPrincipal = Principal.create({ userId: GROUP_ID, type: 'g', displayName: 'Test Group' });
        const component = (
            <UserDetailsPanel
                currentUser={TEST_USER_APP_ADMIN}
                userId={GROUP_ID}
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                api={{
                    ...API,
                    getPrincipalById: jest.fn().mockResolvedValue(groupPrincipal),
                    getUserPropertiesForOther: jest.fn().mockResolvedValue({
                        UserId: GROUP_ID,
                        DisplayName: 'Test Group',
                    }),
                }}
            />
        );
        let container;
        await act(async () => {
            container = renderWithAppContext(component, {
                appContext: APP_CONTEXT,
                serverContext: SERVER_CONTEXT,
            }).container;
        });
        expect(container).toMatchSnapshot();
    });

    test('with principal that isGroup in modal uses Close button and hides Manage footer', async () => {
        const GROUP_ID = 1006;
        const groupPrincipal = Principal.create({ userId: GROUP_ID, type: 'g', displayName: 'Test Group' });
        await act(async () => {
            renderWithAppContext(
                <UserDetailsPanel
                    api={{
                        ...API,
                        getPrincipalById: jest.fn().mockResolvedValue(groupPrincipal),
                        getUserPropertiesForOther: jest.fn().mockResolvedValue({
                            UserId: GROUP_ID,
                            DisplayName: 'Test Group',
                        }),
                    }}
                    currentUser={TEST_USER_APP_ADMIN}
                    policy={POLICY}
                    rolesByUniqueName={ROLES_BY_NAME}
                    toggleDetailsModal={jest.fn()}
                    userId={GROUP_ID}
                />,
                { appContext: APP_CONTEXT, serverContext: SERVER_CONTEXT }
            );
        });
        const modalFooter = document.body.querySelector('.modal-footer');
        expect(modalFooter.querySelector('button')).toHaveTextContent('Close');
        expect(modalFooter.textContent).not.toContain('Cancel');
        expect(modalFooter.textContent).not.toContain('Manage');
        expect(document.body.querySelector('.modal-body').textContent).toContain('ID');
        expect(document.body.querySelector('.modal-body').textContent).not.toContain('Email');
    });

    test('with user in modal shows Cancel button and user fields', async () => {
        await act(async () => {
            renderWithAppContext(
                <UserDetailsPanel
                    api={API}
                    currentUser={TEST_USER_APP_ADMIN}
                    policy={POLICY}
                    rolesByUniqueName={ROLES_BY_NAME}
                    toggleDetailsModal={jest.fn()}
                    userId={1005}
                />,
                { appContext: APP_CONTEXT, serverContext: SERVER_CONTEXT }
            );
        });
        const modalFooter = document.body.querySelector('.modal-footer');
        expect(modalFooter.querySelector('button')).toHaveTextContent('Cancel');
        expect(modalFooter.textContent).not.toContain('Close');
        expect(document.body.querySelector('.modal-body').textContent).toContain('Email');
        expect(document.body.querySelector('.modal-body').textContent).toContain('ID');
    });

    test('with principal that isGroup and onUsersStateChangeComplete suppresses action buttons', async () => {
        const GROUP_ID = 1006;
        const groupPrincipal = Principal.create({ userId: GROUP_ID, type: 'g', displayName: 'Test Group' });
        let container;
        await act(async () => {
            container = renderWithAppContext(
                <UserDetailsPanel
                    api={{
                        ...API,
                        getPrincipalById: jest.fn().mockResolvedValue(groupPrincipal),
                        getUserPropertiesForOther: jest.fn().mockResolvedValue({
                            UserId: GROUP_ID,
                            DisplayName: 'Test Group',
                        }),
                    }}
                    currentUser={TEST_USER_APP_ADMIN}
                    onUsersStateChangeComplete={jest.fn()}
                    policy={POLICY}
                    rolesByUniqueName={ROLES_BY_NAME}
                    userId={GROUP_ID}
                />,
                { appContext: APP_CONTEXT, serverContext: SERVER_CONTEXT }
            ).container;
        });
        // Action buttons (Delete, Reactivate) must not appear for groups
        expect(container.querySelectorAll('button')).toHaveLength(0);
    });
});
