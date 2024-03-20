import React from 'react';
import { fromJS } from 'immutable';

import policyJSON from '../../../test/data/security-getPolicy.json';

import rolesJSON from '../../../test/data/security-getRoles.json';

import { MemberType } from '../administration/models';

import { mountWithAppServerContext } from '../../test/enzymeTestHelpers';

import { TEST_USER_APP_ADMIN } from '../../userFixtures';

import { UserProperties } from '../user/UserProperties';

import { GroupDetailsPanel } from './GroupDetailsPanel';
import { Principal, SecurityPolicy } from './models';
import { getRolesByUniqueName, processGetRolesResponse } from './actions';
import { getTestAPIWrapper } from '../../APIWrapper';
import { getSecurityTestAPIWrapper } from '../security/APIWrapper';

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

const getDefaultAppContext = () => ({
    api: getTestAPIWrapper(jest.fn, {
        security: getSecurityTestAPIWrapper(jest.fn, {
            getAuditLogDate: jest.fn().mockResolvedValue(''),
        }),
    }),
});

describe('GroupDetailsPanel', () => {
    test('no principal', () => {
        const component = mountWithAppServerContext(
            <GroupDetailsPanel policy={POLICY} rolesByUniqueName={ROLES_BY_NAME} members={[]} isSiteGroup={false} />,
            getDefaultAppContext(),
            { user: TEST_USER_APP_ADMIN }
        );

        expect(component.find('.panel-heading').text()).toBe('Group Details');
        expect(component.find(UserProperties)).toHaveLength(0);
        expect(component.find('.principal-detail-li')).toHaveLength(0);

        component.unmount();
    });

    test('with principal and members', () => {
        const component = mountWithAppServerContext(
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
            />,
            getDefaultAppContext(),
            { user: TEST_USER_APP_ADMIN }
        );

        expect(component.find('.panel-heading').text()).toBe(GROUP.name);

        expect(component.find(UserProperties)).toHaveLength(3);
        expect(component.find(UserProperties).at(0).text()).toBe('User Count2');
        expect(component.find(UserProperties).at(1).text()).toBe('Group Count1');

        expect(component.find('.principal-detail-li')).toHaveLength(4);
        expect(component.find('.principal-detail-li').at(0).text()).toBe('Editor');
        expect(component.find('.principal-detail-li').at(1).text()).toBe('user1');
        expect(component.find('.principal-detail-li').at(2).text()).toBe('user2');
        expect(component.find('.principal-detail-li').at(3).text()).toBe('group1');

        component.unmount();
    });

    test('as site group', () => {
        const component = mountWithAppServerContext(
            <GroupDetailsPanel
                principal={GROUP}
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                members={[
                    { id: 1, name: 'user1', type: MemberType.user },
                    { id: 3, name: 'group1', type: MemberType.group },
                ]}
                isSiteGroup
            />,
            getDefaultAppContext(),
            { user: TEST_USER_APP_ADMIN }
        );

        expect(component.find('.panel-heading').text()).toBe(GROUP.name);

        expect(component.find(UserProperties)).toHaveLength(4);
        expect(component.find(UserProperties).at(0).text()).toBe('User Count1');
        expect(component.find(UserProperties).at(1).text()).toBe('Group Count1');
        expect(component.find(UserProperties).at(3).text()).toBe('Site Grouptrue');

        expect(component.find('.principal-detail-li')).toHaveLength(3);
        expect(component.find('.principal-detail-li').at(0).text()).toBe('Editor');
        expect(component.find('.principal-detail-li').at(1).text()).toBe('user1');
        expect(component.find('.principal-detail-li').at(2).text()).toBe('group1');

        component.unmount();
    });

    test("as site group, don't display counts", () => {
        const component = mountWithAppServerContext(
            <GroupDetailsPanel
                principal={GROUP}
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                members={[
                    { id: 1, name: 'user1', type: MemberType.user },
                    { id: 3, name: 'group1', type: MemberType.group },
                ]}
                isSiteGroup
                displayCounts={false}
            />,
            getDefaultAppContext(),
            { user: TEST_USER_APP_ADMIN }
        );

        expect(component.find('.panel-heading').text()).toBe(GROUP.name);

        expect(component.find(UserProperties)).toHaveLength(2);
        expect(component.find(UserProperties).at(0).text()).toBe('Created');
        expect(component.find(UserProperties).at(1).text()).toBe('Site Grouptrue');

        expect(component.find('.principal-detail-li')).toHaveLength(3);
        expect(component.find('.principal-detail-li').at(0).text()).toBe('Editor');
        expect(component.find('.principal-detail-li').at(1).text()).toBe('user1');
        expect(component.find('.principal-detail-li').at(2).text()).toBe('group1');

        component.unmount();
    });
});
