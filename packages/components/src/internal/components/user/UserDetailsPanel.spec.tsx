import React from 'react';
import renderer from 'react-test-renderer';

import { SecurityPolicy } from '../permissions/models';
import { getRolesByUniqueName, processGetRolesResponse } from '../permissions/actions';
import policyJSON from '../../../test/data/security-getPolicy.json';
import rolesJSON from '../../../test/data/security-getRoles.json';
import { initUnitTestMocks, sleep } from '../../testHelpers';
import { JEST_SITE_ADMIN_USER_ID } from '../../../test/data/constants';

import { UserDetailsPanel } from './UserDetailsPanel';

beforeAll(() => {
    initUnitTestMocks();
});

const POLICY = SecurityPolicy.create(policyJSON);
const ROLES = processGetRolesResponse(rolesJSON.roles);
const ROLES_BY_NAME = getRolesByUniqueName(ROLES);

describe('<UserDetailsPanel/>', () => {
    test('no principal', async () => {
        const tree = renderer.create(
            <UserDetailsPanel userId={undefined} policy={POLICY} rolesByUniqueName={ROLES_BY_NAME} />
        );

        await sleep();

        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('with principal no buttons because of self', async () => {
        const tree = renderer.create(
            <UserDetailsPanel
                userId={JEST_SITE_ADMIN_USER_ID} // see components/package.json "jest" config for the setting of self's userId
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                onUsersStateChangeComplete={jest.fn()}
            />
        );

        await sleep();

        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('with principal and buttons', async () => {
        const tree = renderer.create(
            <UserDetailsPanel
                userId={1005} // self is JEST_SITE_ADMIN_USER_ID which will prevent buttons from rendering
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                onUsersStateChangeComplete={jest.fn()}
            />
        );

        await sleep();

        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('with principal and buttons not allowDelete or allowResetPassword', async () => {
        const tree = renderer.create(
            <UserDetailsPanel
                userId={1005} // self is JEST_SITE_ADMIN_USER_ID which will prevent buttons from rendering
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                allowDelete={false}
                allowResetPassword={false}
                onUsersStateChangeComplete={jest.fn()}
            />
        );

        await sleep();

        expect(tree.toJSON()).toMatchSnapshot();
    });
});
