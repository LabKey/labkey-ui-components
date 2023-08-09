import React from 'react';

import { shallow } from 'enzyme';

import { getRolesByUniqueName, processGetRolesResponse } from '../permissions/actions';
import policyJSON from '../../../test/data/security-getPolicy.json';
import rolesJSON from '../../../test/data/security-getRoles.json';
import userPropsInfo from '../../../test/data/user-getUserProps.json';
import { JEST_SITE_ADMIN_USER_ID } from '../../../test/data/constants';

import { SecurityPolicy } from '../permissions/models';

import { TEST_USER_APP_ADMIN } from '../../userFixtures';

import { getSecurityTestAPIWrapper } from '../security/APIWrapper';
import { waitForLifecycle } from '../../test/enzymeTestHelpers';

import { UserDetailsPanel } from './UserDetailsPanel';

const POLICY = SecurityPolicy.create(policyJSON);
const ROLES = processGetRolesResponse(rolesJSON.roles);
const ROLES_BY_NAME = getRolesByUniqueName(ROLES);
const API = getSecurityTestAPIWrapper(jest.fn, {
    fetchPolicy: jest.fn().mockResolvedValue(POLICY),
    fetchRoles: jest.fn().mockResolvedValue(ROLES),
    getUserProperties: jest.fn().mockResolvedValue(userPropsInfo),
    getUserPropertiesForOther: jest.fn().mockResolvedValue({
        Email: 'cnathe@labkey.com',
        UserId: 1004,
        LastLogin: '2020-01-06 15:30:12.027',
        DisplayName: 'cnathe',
        Created: '2017-05-08 08:43:49.710',
    }),
});

describe('<UserDetailsPanel/>', () => {
    test('no principal', async () => {
        const tree = shallow(
            <UserDetailsPanel
                currentUser={TEST_USER_APP_ADMIN}
                userId={undefined}
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                api={API}
            />
        );

        await waitForLifecycle(tree);

        expect(tree).toMatchSnapshot();
    });

    test('with principal no buttons because of self', async () => {
        const tree = shallow(
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

        await waitForLifecycle(tree);

        expect(tree).toMatchSnapshot();
    });

    test('with principal and buttons', async () => {
        const tree = shallow(
            <UserDetailsPanel
                currentUser={TEST_USER_APP_ADMIN}
                userId={1005} // self is JEST_SITE_ADMIN_USER_ID which will prevent buttons from rendering
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                onUsersStateChangeComplete={jest.fn()}
                api={API}
            />
        );

        await waitForLifecycle(tree);

        expect(tree).toMatchSnapshot();
    });

    test('with principal and buttons not allowDelete or allowResetPassword', async () => {
        const tree = shallow(
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

        await waitForLifecycle(tree);

        expect(tree).toMatchSnapshot();
    });
});
