/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { User } from "..";


function isAllowed(user: User, perms: Array<string>): boolean {

    let allow = false;

    if (perms) {
        const allPerms = user.get('permissionsList');

        let hasAll = true;
        for (let i=0; i < perms.length; i++) {
            if (allPerms.indexOf(perms[i]) === -1) {
                hasAll = false;
                break;
            }
        }
        allow = hasAll || user.isAdmin;
    }

    return allow;
}


interface RequiresPermissionProps {
    perms: string | Array<string>
    user: User
}

/**
 * This component is intended to be used to wrap other components which should only be displayed when the
 * user has specific permissions. Permissions are defined on the application user and can be specified by
 * importing PermissionTypes.
 *
 * This is using the React recommended method for checking types, however without specifically importing 'prop-types'
 * PropTypes.instanceOf()
 * https://reactjs.org/docs/typechecking-with-proptypes.html#proptypes
 *
 * Example:
 * import { PermissionTypes, RequiresPermissionHOC } from 'Permissions'
 *
 * ...
 *
 * class SomeComponent extends React.Component<...> {
 *      ...
 *
 *      render() {
 *          return (
 *              <RequiresPermissionHOC user={user} perms={PermissionTypes.Insert, PermissionTypes.Delete}>
 *                  <span>Only visible if user has Insert and Delete permissions</span>
 *              </RequiresPermissionHOC>
 *          );
 *      }
 * }
 */
export class RequiresPermissionHOC extends React.Component<RequiresPermissionProps, any> {

    allow() : boolean {

        const perms = (typeof this.props.perms === 'string' ? [this.props.perms] : this.props.perms) as Array<string>;

        return isAllowed(this.props.user, perms)
    }

    render() {

        return (
            <>
                {React.Children.map(this.props.children, (child: any) => {
                    const isNotAllowed = child && child.props.permType === PermissionTypeProps.NotAllowed;
                    if (this.allow()) {
                        return !isNotAllowed ? child : null;
                    }
                    return isNotAllowed ? child : null;
                })}
            </>
        );
    }
}

enum PermissionTypeProps {
    Allowed,
    NotAllowed
}

interface PermissionProps {
    permType?: PermissionTypeProps
}

/**
 * Used in conjunction with RequiresPermissionHOC and PermissionNotAllowed to selectively render content based on permissions.
 */
export class PermissionAllowed extends React.Component<PermissionProps, any> {

    static defaultProps = {
        permType: PermissionTypeProps.Allowed
    };

    render() {
        return React.Children.only(this.props.children);
    }
}

/**
 * Used in conjunction with RequiresPermissionHOC and PermissionNotAllows to selectively render content based on permissions.
 */
export class PermissionNotAllowed extends React.Component<PermissionProps, any> {

    static defaultProps = {
        permType: PermissionTypeProps.NotAllowed
    };

    render() {
        return React.Children.only(this.props.children);
    }
}
