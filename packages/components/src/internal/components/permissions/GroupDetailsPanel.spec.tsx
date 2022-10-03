import React from 'react';
import { fromJS } from 'immutable';
import renderer from 'react-test-renderer';

import policyJSON from '../../../test/data/security-getPolicy.json';

import rolesJSON from '../../../test/data/security-getRoles.json';

import { MemberType } from '../administration/models';

import { GroupDetailsPanel } from './GroupDetailsPanel';
import { Principal, SecurityPolicy } from './models';
import { getRolesByUniqueName, processGetRolesResponse } from './actions';

const GROUP = Principal.createFromSelectRow(
    fromJS({
        UserId: { value: 11842 },
        Type: { value: MemberType.group },
        Name: { value: 'Editor User Group' },
    })
);

const POLICY = SecurityPolicy.create(policyJSON);
const ROLES = processGetRolesResponse(rolesJSON.roles);
const ROLES_BY_NAME = getRolesByUniqueName(ROLES);

describe('<GroupDetailsPanel/>', () => {
    test('no principal', () => {
        const component = (
            <GroupDetailsPanel
                principal={undefined}
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                members={[]}
                isSiteGroup={false}
                getAuditLogData={jest.fn()}
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with principal and members', () => {
        const component = (
            <GroupDetailsPanel
                principal={GROUP}
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                members={[
                    { id: 1, name: 'user1', type: MemberType.user },
                    { id: 2, name: 'user2', type: MemberType.user },
                    { id: 3, name: 'group1', type: MemberType.group },
                ]}
                isSiteGroup={false}
                getAuditLogData={jest.fn()}
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('as site group', () => {
        const component = (
            <GroupDetailsPanel
                principal={GROUP}
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                members={[
                    { id: 1, name: 'user1', type: MemberType.user },
                    { id: 3, name: 'group1', type: MemberType.group },
                ]}
                isSiteGroup={true}
                getAuditLogData={jest.fn()}
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
