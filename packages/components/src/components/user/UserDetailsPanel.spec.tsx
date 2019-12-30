import React from 'react';
import { fromJS } from 'immutable';
import renderer from 'react-test-renderer'
import { mount } from 'enzyme';
import { UserDetailsPanel } from "./UserDetailsPanel";
import { Principal, SecurityPolicy } from "../permissions/models";
import { getRolesByUniqueName, processGetRolesResponse } from "../permissions/actions";
import policyJSON from "../../test/data/security-getPolicy.json";
import rolesJSON from "../../test/data/security-getRoles.json";

const USER = Principal.createFromSelectRow(fromJS({
    UserId: {value: 1004},
    Type: {value: 'u'},
    Name: {value: 'cnathe@labkey.com'},
    DisplayName: {value: 'Cory Nathe'},
}));

const POLICY = SecurityPolicy.create(policyJSON);
const ROLES = processGetRolesResponse(rolesJSON.roles);
const ROLES_BY_NAME = getRolesByUniqueName(ROLES);

describe("<UserDetailsPanel/>", () => {

    test("no principal", () => {
        const component = (
            <UserDetailsPanel
                principal={undefined}
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("with principal", () => {
        const component = (
            <UserDetailsPanel
                principal={USER}
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

});
