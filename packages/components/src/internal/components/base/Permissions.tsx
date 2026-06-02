/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
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
