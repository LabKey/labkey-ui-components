import React from 'react';
import renderer from 'react-test-renderer';
import { List, Map } from 'immutable';

import { Principal, SecurityPolicy, SecurityRole } from '../permissions/models';

import { PermissionsPanel } from './PermissionsPanel';

describe('<PermissionsPanel/>', () => {
    test('loading', () => {
        const component = (
            <PermissionsPanel
                title="Permissions Panel Title"
                containerId="BOGUS"
                loading={true}
                error={undefined}
                showDetailsPanel={true}
                disableRemoveSelf={false}
                onChange={jest.fn()}
                onSuccess={jest.fn()}
                policy={SecurityPolicy.create({})}
                rolesMap={Map<string, string>()}
                roles={List<SecurityRole>()}
                rolesByUniqueName={Map<string, SecurityRole>()}
                principals={List<Principal>()}
                principalsById={Map<number, Principal>()}
                inactiveUsersById={Map<number, Principal>()}
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('error', () => {
        const component = (
            <PermissionsPanel
                title="Permissions Panel Title"
                containerId="BOGUS"
                loading={false}
                error="There is an error."
                showDetailsPanel={true}
                disableRemoveSelf={false}
                onChange={jest.fn()}
                onSuccess={jest.fn()}
                policy={SecurityPolicy.create({})}
                rolesMap={Map<string, string>()}
                roles={List<SecurityRole>()}
                rolesByUniqueName={Map<string, SecurityRole>()}
                principals={List<Principal>()}
                principalsById={Map<number, Principal>()}
                inactiveUsersById={Map<number, Principal>()}
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('rendered with details', () => {
        const component = (
            <PermissionsPanel
                title="Permissions Panel Title"
                containerId="BOGUS"
                loading={false}
                error={undefined}
                showDetailsPanel={true}
                disableRemoveSelf={false}
                onChange={jest.fn()}
                onSuccess={jest.fn()}
                policy={SecurityPolicy.create({})}
                rolesMap={Map<string, string>()}
                roles={List<SecurityRole>()}
                rolesByUniqueName={Map<string, SecurityRole>()}
                principals={List<Principal>()}
                principalsById={Map<number, Principal>()}
                inactiveUsersById={Map<number, Principal>()}
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('rendered without details', () => {
        const component = (
            <PermissionsPanel
                title="Permissions Panel Title"
                containerId="BOGUS"
                loading={false}
                error={undefined}
                showDetailsPanel={false}
                disableRemoveSelf={false}
                onChange={jest.fn()}
                onSuccess={jest.fn()}
                policy={SecurityPolicy.create({})}
                rolesMap={Map<string, string>()}
                roles={List<SecurityRole>()}
                rolesByUniqueName={Map<string, SecurityRole>()}
                principals={List<Principal>()}
                principalsById={Map<number, Principal>()}
                inactiveUsersById={Map<number, Principal>()}
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
