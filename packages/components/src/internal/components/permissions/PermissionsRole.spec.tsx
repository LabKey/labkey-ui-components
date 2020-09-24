import React from 'react';
import { List, Map, fromJS } from 'immutable';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';

import policyJSON from '../../../test/data/security-getPolicy.json';

import rolesJSON from '../../../test/data/security-getRoles.json';

import { JEST_SITE_ADMIN_USER_ID, SECURITY_ROLE_AUTHOR, SECURITY_ROLE_EDITOR } from '../../../test/data/constants';

import { PermissionsRole } from './PermissionsRole';
import { Principal, SecurityPolicy } from './models';
import { getRolesByUniqueName, processGetRolesResponse } from './actions';

const GROUP = Principal.createFromSelectRow(
    fromJS({
        UserId: { value: 11842 },
        Type: { value: 'g' },
        Name: { value: 'Editor User Group' },
    })
);

const USER = Principal.createFromSelectRow(
    fromJS({
        UserId: { value: JEST_SITE_ADMIN_USER_ID },
        Type: { value: 'u' },
        Name: { value: 'cnathe@labkey.com' },
        DisplayName: { value: 'Cory Nathe' },
    })
);

const POLICY = SecurityPolicy.updateAssignmentsData(
    SecurityPolicy.create(policyJSON),
    Map<number, Principal>([
        [GROUP.userId, GROUP],
        [USER.userId, USER],
    ])
);
const ROLES = processGetRolesResponse(rolesJSON.roles);
const ROLES_BY_NAME = getRolesByUniqueName(ROLES);

describe('<PermissionsRole/>', () => {
    test('without assignments', () => {
        const role = ROLES_BY_NAME.get(SECURITY_ROLE_AUTHOR);

        const component = (
            <PermissionsRole
                role={role}
                assignments={POLICY.assignmentsByRole.get(role.uniqueName)}
                typeToShow={undefined}
                principals={List<Principal>()}
                onAddAssignment={jest.fn()}
                onRemoveAssignment={jest.fn()}
                onClickAssignment={jest.fn()}
                selectedUserId={undefined}
                initExpanded={true}
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with both group and user assignments', () => {
        const role = ROLES_BY_NAME.get(SECURITY_ROLE_EDITOR);

        const component = (
            <PermissionsRole
                role={role}
                assignments={POLICY.assignmentsByRole.get(role.uniqueName)}
                typeToShow={undefined}
                principals={List<Principal>()}
                onAddAssignment={jest.fn()}
                onRemoveAssignment={jest.fn()}
                onClickAssignment={jest.fn()}
                selectedUserId={undefined}
                initExpanded={true}
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('showing only a single type and a selected and disabled principal', () => {
        const role = ROLES_BY_NAME.get(SECURITY_ROLE_EDITOR);

        const component = (
            <PermissionsRole
                role={role}
                assignments={POLICY.assignmentsByRole.get(role.uniqueName)}
                typeToShow="u"
                principals={List<Principal>()}
                onAddAssignment={jest.fn()}
                onRemoveAssignment={jest.fn()}
                onClickAssignment={jest.fn()}
                selectedUserId={USER.userId}
                disabledId={USER.userId}
                initExpanded={true}
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('not editable', () => {
        const role = ROLES_BY_NAME.get(SECURITY_ROLE_EDITOR);

        const component = (
            <PermissionsRole
                role={role}
                assignments={POLICY.assignmentsByRole.get(role.uniqueName)}
                typeToShow={undefined}
                principals={List<Principal>()}
                onClickAssignment={jest.fn()}
                selectedUserId={undefined}
                initExpanded={true}
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
