import React from 'react';
import { fromJS } from 'immutable';
import renderer from 'react-test-renderer'
import { mount } from 'enzyme';
import { PrincipalDetailsPanel } from "./PrincipalDetailsPanel";
import { Principal, SecurityPolicy } from "./models";
import { getRolesByUniqueName, processGetRolesResponse } from "./actions";
import policyJSON from "../../test/data/security-getPolicy.json";
import rolesJSON from "../../test/data/security-getRoles.json";

const GROUP = Principal.createFromSelectRow(fromJS({
    UserId: {value: 11842},
    Type: {value: 'g'},
    Name: {value: 'Editor User Group'}
}));

const USER = Principal.createFromSelectRow(fromJS({
    UserId: {value: 1004},
    Type: {value: 'u'},
    Name: {value: 'cnathe@labkey.com'},
    DisplayName: {value: 'Cory Nathe'},
}));

const POLICY = SecurityPolicy.create(policyJSON);
const ROLES = processGetRolesResponse(rolesJSON.roles);
const ROLES_BY_NAME = getRolesByUniqueName(ROLES);

describe("<PrincipalDetailsPanel/>", () => {

    test("no principal", () => {
        const component = (
            <PrincipalDetailsPanel
                principal={undefined}
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("for user", () => {
        const component = (
            <PrincipalDetailsPanel
                principal={USER}
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("for group", () => {
        const component = (
            <PrincipalDetailsPanel
                principal={GROUP}
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

});
