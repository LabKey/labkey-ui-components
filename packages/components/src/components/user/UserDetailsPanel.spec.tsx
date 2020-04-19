import React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';

import { SecurityPolicy } from '../permissions/models';
import { getRolesByUniqueName, processGetRolesResponse } from '../permissions/actions';
import policyJSON from '../../test/data/security-getPolicy.json';
import rolesJSON from '../../test/data/security-getRoles.json';
import { initUnitTestMocks } from '../../testHelpers';
import { JEST_SITE_ADMIN_USER_ID } from '../../test/data/constants';

import { UserDetailsPanel } from './UserDetailsPanel';

beforeAll(() => {
    initUnitTestMocks();
});

const POLICY = SecurityPolicy.create(policyJSON);
const ROLES = processGetRolesResponse(rolesJSON.roles);
const ROLES_BY_NAME = getRolesByUniqueName(ROLES);

describe('<UserDetailsPanel/>', () => {
    test('no principal', done => {
        const component = <UserDetailsPanel userId={undefined} policy={POLICY} rolesByUniqueName={ROLES_BY_NAME} />;

        const tree = renderer.create(component);
        setTimeout(() => {
            expect(tree.toJSON()).toMatchSnapshot();
            done();
        });
    });

    test('with principal no buttons because of self', done => {
        const component = (
            <UserDetailsPanel
                userId={JEST_SITE_ADMIN_USER_ID} // see components/package.json "jest" config for the setting of self's userId
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                onUsersStateChangeComplete={jest.fn()}
            />
        );

        const tree = renderer.create(component);
        setTimeout(() => {
            expect(tree.toJSON()).toMatchSnapshot();
            done();
        });
    });

    test('with principal and buttons', done => {
        const component = (
            <UserDetailsPanel
                userId={1005} // self is JEST_SITE_ADMIN_USER_ID which will prevent buttons from rendering
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                onUsersStateChangeComplete={jest.fn()}
            />
        );

        const tree = renderer.create(component);
        setTimeout(() => {
            expect(tree.toJSON()).toMatchSnapshot();
            done();
        });
    });

    test('with principal and buttons not allowDelete or allowResetPassword', done => {
        const component = (
            <UserDetailsPanel
                userId={1005} // self is JEST_SITE_ADMIN_USER_ID which will prevent buttons from rendering
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                allowDelete={false}
                allowResetPassword={false}
                onUsersStateChangeComplete={jest.fn()}
            />
        );

        const tree = renderer.create(component);
        setTimeout(() => {
            expect(tree.toJSON()).toMatchSnapshot();
            done();
        });
    });
});
