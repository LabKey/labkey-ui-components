import React from 'react';
import { fromJS } from 'immutable';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';

import policyJSON from '../../test/data/security-getPolicy.json';

import rolesJSON from '../../test/data/security-getRoles.json';

import { GroupDetailsPanel } from './GroupDetailsPanel';
import { Principal, SecurityPolicy } from './models';
import { getRolesByUniqueName, processGetRolesResponse } from './actions';

const GROUP = Principal.createFromSelectRow(
    fromJS({
        UserId: { value: 11842 },
        Type: { value: 'g' },
        Name: { value: 'Editor User Group' },
    })
);

const POLICY = SecurityPolicy.create(policyJSON);
const ROLES = processGetRolesResponse(rolesJSON.roles);
const ROLES_BY_NAME = getRolesByUniqueName(ROLES);

describe('<GroupDetailsPanel/>', () => {
    test('no principal', () => {
        const component = <GroupDetailsPanel principal={undefined} policy={POLICY} rolesByUniqueName={ROLES_BY_NAME} />;

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with principal', () => {
        const component = <GroupDetailsPanel principal={GROUP} policy={POLICY} rolesByUniqueName={ROLES_BY_NAME} />;

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
