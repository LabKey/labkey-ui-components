/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useMemo } from 'react';
import { Map } from 'immutable';

import { useServerContext } from '../base/ServerContext';

import { showPremiumFeatures } from './utils';
import { APPLICATION_SECURITY_ROLES, HOSTED_APPLICATION_SECURITY_ROLES } from './constants';
import { BasePermissions } from './BasePermissions';
import { useAdminAppContext } from './useAdminAppContext';

export const PermissionManagementPage: FC = memo(() => {
    const { container, moduleContext, user } = useServerContext();
    const { extraPermissionRoles } = useAdminAppContext();
    const showPremium = showPremiumFeatures(moduleContext);

    const rolesMap = useMemo(() => {
        let roles = showPremium ? APPLICATION_SECURITY_ROLES : HOSTED_APPLICATION_SECURITY_ROLES;
        roles = roles.merge(Map<string, string>(extraPermissionRoles));
        return roles;
    }, [extraPermissionRoles, showPremium]);

    return (
        <BasePermissions
            hasPermission={user.isAdmin}
            pageTitle="Permissions"
            rolesMap={rolesMap}
            showDetailsPanel={user.hasManageUsersPermission()}
            description={showPremium ? container.path : undefined}
        />
    );
});
