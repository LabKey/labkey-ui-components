/*
 * Copyright (c) 2019-2020 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { FC, PropsWithChildren, useMemo } from 'react';

import { hasPermissions, User } from './models/User';
import { useServerContext } from './ServerContext';

interface Props extends PropsWithChildren {
    /** Indicates if user.isAdmin should override check */
    checkIsAdmin?: boolean;
    /**
     * Sets which "has permissions" check logic is used.
     * `all` - Require user to have all of the specified permissions (default).
     * `any` - Require user to have any of the specified permissions.
     */
    permissionCheck?: 'all' | 'any';
    /** The permission(s) to check against the user. */
    perms: string | string[];
    /** Optionally, specify the User object to check permissions against. Defaults to user from ServerContext. */
    user?: User;
}

/**
 * This component is intended to be used to wrap other components which should only be displayed when the
 * user has specific permissions. Permissions are defined on the application user and can be specified by
 * importing PermissionTypes. The component uses "useServerContext" to access the current user so it
 * requires access to the "ServerContext".
 */
export const RequiresPermission: FC<Props> = props => {
    const { checkIsAdmin, children, permissionCheck, perms } = props;
    const serverContext = useServerContext();
    const user = props.user ?? serverContext.user;

    const allow = useMemo<boolean>(
        () => hasPermissions(user, typeof perms === 'string' ? [perms] : perms, checkIsAdmin, permissionCheck),
        [checkIsAdmin, permissionCheck, perms, user]
    );

    return <>{React.Children.map(children, child => (allow ? child : null))}</>;
};

RequiresPermission.displayName = 'RequiresPermission';
