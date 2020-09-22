import React from 'react';
import { List, Map, fromJS } from 'immutable';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';

import policyJSON from '../../../test/data/security-getPolicy.json';

import rolesJSON from '../../../test/data/security-getRoles.json';

import { JEST_SITE_ADMIN_USER_ID, SECURITY_ROLE_EDITOR, SECURITY_ROLE_READER } from '../../../test/data/constants';

import { PermissionAssignments } from './PermissionAssignments';
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

describe('<PermissionAssignments/>', () => {
    test('default props', () => {
        const component = (
            <PermissionAssignments
                containerId="BOGUS"
                policy={POLICY}
                roles={ROLES}
                rolesByUniqueName={ROLES_BY_NAME}
                principals={List<Principal>()}
                principalsById={Map<number, Principal>()}
                inactiveUsersById={Map<number, Principal>()}
                error={undefined}
                onChange={jest.fn()}
                onSuccess={jest.fn()}
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('not editable', () => {
        const inheritPolicy = POLICY.set('containerId', 'NOT_RESOURCE_ID') as SecurityPolicy;

        const component = (
            <PermissionAssignments
                containerId="BOGUS"
                policy={inheritPolicy}
                roles={ROLES}
                rolesByUniqueName={ROLES_BY_NAME}
                principals={List<Principal>()}
                principalsById={Map<number, Principal>()}
                inactiveUsersById={Map<number, Principal>()}
                error={undefined}
                onChange={jest.fn()}
                onSuccess={jest.fn()}
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('custom props', () => {
        const component = (
            <PermissionAssignments
                containerId="BOGUS"
                policy={POLICY}
                roles={ROLES}
                rolesByUniqueName={ROLES_BY_NAME}
                principals={List<Principal>()}
                principalsById={Map<number, Principal>()}
                inactiveUsersById={Map<number, Principal>()}
                error={undefined}
                onChange={jest.fn()}
                onSuccess={jest.fn()}
                title="Custom panel title"
                rolesToShow={List<string>([SECURITY_ROLE_EDITOR, SECURITY_ROLE_READER])}
                typeToShow="u"
                showDetailsPanel={false}
                disabledId={USER.userId}
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with state', () => {
        const wrapper = mount(
            <PermissionAssignments
                containerId="BOGUS"
                policy={POLICY}
                roles={ROLES}
                rolesByUniqueName={ROLES_BY_NAME}
                principals={List<Principal>()}
                principalsById={Map<number, Principal>()}
                inactiveUsersById={Map<number, Principal>()}
                error={undefined}
                onChange={jest.fn()}
                onSuccess={jest.fn()}
                rolesToShow={List<string>([SECURITY_ROLE_EDITOR, SECURITY_ROLE_READER])}
            />
        );

        expect(wrapper.find('Alert')).toHaveLength(0);
        expect(wrapper.find('Button')).toHaveLength(1);
        expect(wrapper.find('.panel-body').filterWhere(panel => panel.text() === 'No user selected.')).toHaveLength(1);

        wrapper.setState({
            selectedUserId: USER.userId,
            dirty: true,
            submitting: true,
            saveErrorMsg: 'Save error message',
        });

        expect(wrapper.find('Alert')).toHaveLength(4); // dirty info alert and save error alert
        expect(wrapper.find('Button')).toHaveLength(2);
        expect(wrapper.find('.panel-body').filterWhere(panel => panel.text() === 'No user selected.')).toHaveLength(0);

        wrapper.unmount();
    });
});
