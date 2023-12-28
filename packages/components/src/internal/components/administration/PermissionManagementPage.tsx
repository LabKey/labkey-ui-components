/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import { Map } from 'immutable';

import { useServerContext } from '../base/ServerContext';

import { useNotificationsContext } from '../notifications/NotificationsContext';
import { CreatedModified } from '../base/CreatedModified';
import { AppURL } from '../../url/AppURL';
import { AUDIT_KEY } from '../../app/constants';
import { AUDIT_EVENT_TYPE_PARAM, GROUP_AUDIT_QUERY } from '../auditlog/constants';

import { BasePermissionsCheckPage } from '../permissions/BasePermissionsCheckPage';
import { PermissionAssignments } from '../permissions/PermissionAssignments';
import { useRouteLeave } from '../../util/RouteLeave';
import { InjectedPermissionsPage, withPermissionsPage } from '../permissions/withPermissionsPage';

import { useAdministrationSubNav } from './useAdministrationSubNav';

import { useAdminAppContext } from './useAdminAppContext';
import { APPLICATION_SECURITY_ROLES, HOSTED_APPLICATION_SECURITY_ROLES, SITE_SECURITY_ROLES } from './constants';
import { showPremiumFeatures } from './utils';
import { getUpdatedPolicyRoles } from './actions';

// exported for testing
export type Props = InjectedPermissionsPage;

// exported for testing
export const PermissionManagementPageImpl: FC<Props> = memo(props => {
    const { roles } = props;
    useAdministrationSubNav();
    const [getIsDirty, setIsDirty] = useRouteLeave();
    const [policyLastModified, setPolicyLastModified] = useState<string>();
    const [hidePageDescription, setHidePageDescription] = useState<boolean>(false);
    const { dismissNotifications, createNotification } = useNotificationsContext();
    const { extraPermissionRoles } = useAdminAppContext();
    const { user, moduleContext, container } = useServerContext();
    const hasPermission = user.isAdmin || user.isRootAdmin;
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
                <a href={AppURL.create(AUDIT_KEY).addParam(AUDIT_EVENT_TYPE_PARAM, GROUP_AUDIT_QUERY.value).toHref()}>
                    View Audit History
                </a>
            </>
        );
    }, [policyLastModified]);

    const { updatedRoles, rolesToShow } = useMemo(() => {
        let roles_ = showPremium ? APPLICATION_SECURITY_ROLES : HOSTED_APPLICATION_SECURITY_ROLES;
        roles_ = roles_.merge(Map<string, string>(extraPermissionRoles));
        let updatedRoles_ = roles_;
        if (!showPremium) updatedRoles_ = updatedRoles_.merge(SITE_SECURITY_ROLES);
        return {
            updatedRoles: getUpdatedPolicyRoles(roles, updatedRoles_),
            rolesToShow: roles_.keySeq().toList(),
        };
    }, [extraPermissionRoles, showPremium, roles]);

    const setProjectCount = useCallback((projectCount: number) => {
        setHidePageDescription(projectCount > 1);
    }, []);

    return (
        <BasePermissionsCheckPage
            description={showPremium && !hidePageDescription ? description : null}
            hasPermission={hasPermission}
            renderButtons={renderButtons}
            title="Permissions"
            user={user}
        >
            <PermissionAssignments
                {...props}
                getIsDirty={getIsDirty}
                setIsDirty={setIsDirty}
                roles={updatedRoles}
                rolesToShow={rolesToShow}
                onSuccess={onSuccess}
                setLastModified={setPolicyLastModified}
                setProjectCount={setProjectCount}
                rootRolesToShow={!showPremium ? SITE_SECURITY_ROLES.keySeq().toList() : undefined}
            />
        </BasePermissionsCheckPage>
    );
});

export const PermissionManagementPage = withPermissionsPage(PermissionManagementPageImpl);
