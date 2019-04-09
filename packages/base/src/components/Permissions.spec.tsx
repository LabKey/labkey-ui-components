import * as React from 'react';
import renderer from 'react-test-renderer'
import { PermissionAllowed, PermissionNotAllowed, RequiresPermissionHOC } from "./Permissions";
import { User } from "../models/model";
import { PermissionTypes } from "../models/constants";

describe("<RequiresPermissionHOC/>", () => {
    test("user without permission", () => {
        const tree = renderer.create(
            <RequiresPermissionHOC user={new User()} perms={PermissionTypes.Insert}>
                <span>Only visible if user has Insert permissions</span>
            </RequiresPermissionHOC>
        ).toJSON();
        expect(tree).toMatchSnapshot();

    });


    test("user has some but not all permissions", () => {
        const tree = renderer.create(
            <RequiresPermissionHOC user={new User({
                permissionsList: [PermissionTypes.Read]
            })} perms={[PermissionTypes.Insert, PermissionTypes.Read]}>
                <span>Only visible if user has Read and Insert permissions</span>
            </RequiresPermissionHOC>
        ).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("user has permission", () => {
        const tree = renderer.create(
            <RequiresPermissionHOC user={new User({
                permissionsList: [PermissionTypes.Insert, PermissionTypes.Delete, PermissionTypes.Read]
            })} perms={PermissionTypes.Insert}>
                <span>Only visible if user has Insert permissions</span>
            </RequiresPermissionHOC>
        ).toJSON();
        expect(tree).toMatchSnapshot();
    });


    test("user without permissions and permission not allowed component", () => {
        const tree = renderer.create(
            <RequiresPermissionHOC user={new User({
                permissionsList: [PermissionTypes.Read]
            })} perms={PermissionTypes.Insert}>
                <PermissionAllowed>
                    <span>Only visible if user has Insert permissions</span>
                </PermissionAllowed>
                <PermissionNotAllowed>
                    <span>Visible when user does not have insert permissions</span>
                </PermissionNotAllowed>
            </RequiresPermissionHOC>
        ).toJSON();
        expect(tree).toMatchSnapshot();
    });
});