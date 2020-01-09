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

    test("with principal no buttons because of self", (done) => {
        const component = (
            <UserDetailsPanel
                userId={1004}
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                allowDelete={true}
                onUsersStateChangeComplete={jest.fn()}
            />
        );

        const tree = renderer.create(component);
        setTimeout(() => {
            expect(tree.toJSON()).toMatchSnapshot();
            done();
        });
    });

    test("with principal and buttons", (done) => {
        const component = (
            <UserDetailsPanel
                userId={1005} // self is 1004 which will prevent buttons from rendering
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                allowDelete={true}
                onUsersStateChangeComplete={jest.fn()}
            />
        );

        const tree = renderer.create(component);
        setTimeout(() => {
            expect(tree.toJSON()).toMatchSnapshot();
            done();
        });
    });

    test("with principal and buttons not allowDelete", (done) => {
        const component = (
            <UserDetailsPanel
                userId={1005} // self is 1004 which will prevent buttons from rendering
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                allowDelete={false}
                onUsersStateChangeComplete={jest.fn()}
            />
        );

        const tree = renderer.create(component);
        setTimeout(() => {
            expect(tree.toJSON()).toMatchSnapshot();
            done();
        });
    });

});
