/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import { Map } from 'immutable';
import { MenuItem } from 'react-bootstrap';

import { WithRouterProps } from 'react-router';

import { useServerContext } from '../base/ServerContext';

import { useNotificationsContext } from '../notifications/NotificationsContext';
import { CreatedModified } from '../base/CreatedModified';
import { ManageDropdownButton } from '../buttons/ManageDropdownButton';
import { AppURL } from '../../url/AppURL';
import { AUDIT_KEY } from '../../app/constants';
import { AUDIT_EVENT_TYPE_PARAM, GROUP_AUDIT_QUERY } from '../auditlog/constants';

import { BasePermissionsCheckPage } from '../permissions/BasePermissionsCheckPage';
import { PermissionAssignments } from '../permissions/PermissionAssignments';
import { InjectedRouteLeaveProps, withRouteLeave } from '../../util/RouteLeave';
import { InjectedPermissionsPage, withPermissionsPage } from '../permissions/withPermissionsPage';

import { useAdminAppContext } from './useAdminAppContext';
import { APPLICATION_SECURITY_ROLES, HOSTED_APPLICATION_SECURITY_ROLES, SITE_SECURITY_ROLES } from './constants';
import { showPremiumFeatures } from './utils';

// exported for testing
export type Props = InjectedRouteLeaveProps & InjectedPermissionsPage & WithRouterProps;

// exported for testing
export const PermissionManagementPageImpl: FC<Props> = memo(props => {
    const { children } = props;

    const [policyLastModified, setPolicyLastModified] = useState<string>(undefined);
    const [hidePageDescription, setHidePageDescription] = useState<boolean>(false);
    const { dismissNotifications, createNotification } = useNotificationsContext();
    const { extraPermissionRoles } = useAdminAppContext();
    const { user, moduleContext, container } = useServerContext();
    const showAssignments = user.isAdmin || user.isRootAdmin;
    const showPremium = showPremiumFeatures(moduleContext);
    const description = showPremium ? container.path : undefined;

    const onSuccess = useCallback(() => {
        dismissNotifications();
        createNotification('Successfully updated roles and assignments.');
    }, [createNotification, dismissNotifications]);

    const renderButtons = useCallback(() => {
        const row = policyLastModified ? { Modified: { value: policyLastModified } } : {};

        return (
            <>
                <CreatedModified row={row} />
                <ManageDropdownButton collapsed id="admin-page-manage" pullRight>
                    <MenuItem
                        href={AppURL.create(AUDIT_KEY)
                            .addParam(AUDIT_EVENT_TYPE_PARAM, GROUP_AUDIT_QUERY.value)
                            .toHref()}
                    >
                        View Audit History
                    </MenuItem>
                </ManageDropdownButton>
            </>
        );
    }, [policyLastModified]);

    const rolesToShow = useMemo(() => {
        let roles_ = showPremium ? APPLICATION_SECURITY_ROLES : HOSTED_APPLICATION_SECURITY_ROLES;
        roles_ = roles_.merge(Map<string, string>(extraPermissionRoles));
        return roles_.keySeq().toList();
    }, [extraPermissionRoles, showPremium]);

    const setProjectCount = useCallback((projectCount: number) => {
        setHidePageDescription(projectCount > 1);
    }, []);

    return (
        <BasePermissionsCheckPage
            description={hidePageDescription ? null : description}
            hasPermission={user.isAdmin}
            renderButtons={renderButtons}
            title="Permissions"
            user={user}
        >
            {showAssignments && (
                <PermissionAssignments
                    {...props}
                    rolesToShow={rolesToShow}
                    onSuccess={onSuccess}
                    setLastModified={setPolicyLastModified}
                    setProjectCount={setProjectCount}
                    rootRolesToShow={!showPremium ? SITE_SECURITY_ROLES.keySeq().toList() : undefined}
                />
            )}
            {children}
        </BasePermissionsCheckPage>
    );
});

export const PermissionManagementPage = withRouteLeave(withPermissionsPage(PermissionManagementPageImpl));

