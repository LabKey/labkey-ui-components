import React from 'react';
import { render } from '@testing-library/react';

import { JEST_SITE_ADMIN_USER_ID } from '../../../test/data/constants';

import policyJSON from '../../../test/data/security-getPolicy.json';
import rootPolicyJSON from '../../../test/data/security-getPolicyRoot.json';
import rolesJSON from '../../../test/data/security-getRoles.json';

import { TEST_USER_APP_ADMIN, TEST_USER_READER } from '../../userFixtures';

import { EffectiveRolesList } from './EffectiveRolesList';
import { SecurityPolicy } from './models';
import { getRolesByUniqueName, processGetRolesResponse } from './actions';

const POLICY = SecurityPolicy.create(policyJSON);
const ROOT_POLICY = SecurityPolicy.create(rootPolicyJSON);
const ROLES = processGetRolesResponse(rolesJSON.roles);
const ROLES_BY_NAME = getRolesByUniqueName(ROLES);

describe('<EffectiveRolesList/>', () => {
    test('without policy', () => {
        const component = <EffectiveRolesList userId={4971} currentUser={TEST_USER_APP_ADMIN} />;

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('single role', () => {
        const component = (
            <EffectiveRolesList
                currentUser={TEST_USER_APP_ADMIN}
                userId={4971} // reader only
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
            />
        );

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('admin, showLinks false', () => {
        const component = (
            <EffectiveRolesList
                currentUser={TEST_USER_APP_ADMIN}
                userId={4971} // reader only
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                showLinks={false}
            />
        );

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('non admin', () => {
        const component = (
            <EffectiveRolesList
                currentUser={TEST_USER_READER}
                userId={4971} // reader only
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
            />
        );

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('multiple roles', () => {
        const component = (
            <EffectiveRolesList
                currentUser={TEST_USER_APP_ADMIN}
                userId={JEST_SITE_ADMIN_USER_ID}
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
            />
        );

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('no roles', () => {
        const component = (
            <EffectiveRolesList
                currentUser={TEST_USER_APP_ADMIN}
                userId={1} // user doesn't have an assignment
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
            />
        );

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('with root policy', () => {
        const component = (
            <EffectiveRolesList
                currentUser={TEST_USER_APP_ADMIN}
                userId={1004}
                policy={POLICY}
                rootPolicy={ROOT_POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
            />
        );

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });
});
