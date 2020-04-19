import React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';

import { JEST_SITE_ADMIN_USER_ID } from '../../test/data/constants';

import policyJSON from '../../test/data/security-getPolicy.json';

import rolesJSON from '../../test/data/security-getRoles.json';

import { EffectiveRolesList } from './EffectiveRolesList';
import { SecurityPolicy } from './models';
import { getRolesByUniqueName, processGetRolesResponse } from './actions';

const POLICY = SecurityPolicy.create(policyJSON);
const ROLES = processGetRolesResponse(rolesJSON.roles);
const ROLES_BY_NAME = getRolesByUniqueName(ROLES);

describe('<EffectiveRolesList/>', () => {
    test('without policy', () => {
        const component = <EffectiveRolesList userId={4971} />;

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('single role', () => {
        const component = (
            <EffectiveRolesList
                userId={4971} // reader only
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('multiple roles', () => {
        const component = (
            <EffectiveRolesList userId={JEST_SITE_ADMIN_USER_ID} policy={POLICY} rolesByUniqueName={ROLES_BY_NAME} />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('no roles', () => {
        const component = (
            <EffectiveRolesList
                userId={1} // user doesn't have an assignment
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
