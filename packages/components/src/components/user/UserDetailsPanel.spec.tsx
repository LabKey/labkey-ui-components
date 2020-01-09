import React from 'react';
import { fromJS } from 'immutable';
import renderer from 'react-test-renderer'
import { mount } from 'enzyme';
import { UserDetailsPanel } from "./UserDetailsPanel";
import { Principal, SecurityPolicy } from "../permissions/models";
import { getRolesByUniqueName, processGetRolesResponse } from "../permissions/actions";
import policyJSON from "../../test/data/security-getPolicy.json";
import rolesJSON from "../../test/data/security-getRoles.json";
import { initUnitTestMocks } from "../../testHelpers";

beforeAll(() => {
    initUnitTestMocks();
});

const POLICY = SecurityPolicy.create(policyJSON);
const ROLES = processGetRolesResponse(rolesJSON.roles);
const ROLES_BY_NAME = getRolesByUniqueName(ROLES);

describe("<UserDetailsPanel/>", () => {

    test("no principal", (done) => {
        const component = (
            <UserDetailsPanel
                userId={undefined}
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
            />
        );

        const tree = renderer.create(component);
        setTimeout(() => {
            expect(tree.toJSON()).toMatchSnapshot();
            done();
        });
    });

    test("with principal", (done) => {
        const component = (
            <UserDetailsPanel
                userId={1004}
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
            />
        );

        const tree = renderer.create(component);
        setTimeout(() => {
            expect(tree.toJSON()).toMatchSnapshot();
            done();
        });
    });

});
