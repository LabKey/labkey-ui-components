import React from 'react';
import { render } from '@testing-library/react';
import { List, Map, fromJS } from 'immutable';

import policyJSON from '../../../test/data/security-getPolicy.json';

import rolesJSON from '../../../test/data/security-getRoles.json';

import { JEST_SITE_ADMIN_USER_ID, SECURITY_ROLE_AUTHOR, SECURITY_ROLE_EDITOR } from '../../../test/data/constants';

import { MemberType } from '../administration/models';

import { PermissionsRole } from './PermissionsRole';
import { Principal, SecurityPolicy } from './models';
import { getRolesByUniqueName, processGetRolesResponse } from './actions';

const GROUP = Principal.createFromSelectRow(
    fromJS({
        UserId: { value: 11842 },
        Type: { value: MemberType.group },
        Name: { value: 'Editor User Group' },
    })
);

const USER = Principal.createFromSelectRow(
    fromJS({
        UserId: { value: JEST_SITE_ADMIN_USER_ID },
        Type: { value: MemberType.user },
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
                principals={List<Principal>()}
                onAddAssignment={jest.fn()}
                onRemoveAssignment={jest.fn()}
                onClickAssignment={jest.fn()}
                selectedUserId={undefined}
                initExpanded={true}
                groupMembership={{}}
            />
        );

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('with both group and user assignments', () => {
        const role = ROLES_BY_NAME.get(SECURITY_ROLE_EDITOR);

        const component = (
            <PermissionsRole
                role={role}
                assignments={POLICY.assignmentsByRole.get(role.uniqueName)}
                principals={List<Principal>()}
                onAddAssignment={jest.fn()}
                onRemoveAssignment={jest.fn()}
                onClickAssignment={jest.fn()}
                selectedUserId={undefined}
                initExpanded={true}
                groupMembership={{}}
            />
        );

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('showing a selected and disabled principal', () => {
        const role = ROLES_BY_NAME.get(SECURITY_ROLE_EDITOR);

        const component = (
            <PermissionsRole
                role={role}
                assignments={POLICY.assignmentsByRole.get(role.uniqueName)}
                principals={List<Principal>()}
                onAddAssignment={jest.fn()}
                onRemoveAssignment={jest.fn()}
                onClickAssignment={jest.fn()}
                selectedUserId={USER.userId}
                disabledId={USER.userId}
                initExpanded={true}
                groupMembership={{}}
            />
        );

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('not editable', () => {
        const role = ROLES_BY_NAME.get(SECURITY_ROLE_EDITOR);

        const component = (
            <PermissionsRole
                role={role}
                assignments={POLICY.assignmentsByRole.get(role.uniqueName)}
                principals={List<Principal>()}
                onClickAssignment={jest.fn()}
                selectedUserId={undefined}
                initExpanded={true}
                groupMembership={{}}
            />
        );

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });
});
