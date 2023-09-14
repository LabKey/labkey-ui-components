/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, ReactNode, useCallback, useMemo, useState } from 'react';
import { MenuItem } from 'react-bootstrap';
import { Map } from 'immutable';

import { WithRouterProps } from 'react-router';

import { InjectedRouteLeaveProps, withRouteLeave } from '../../util/RouteLeave';
import { CreatedModified } from '../base/CreatedModified';
import { ManageDropdownButton } from '../buttons/ManageDropdownButton';
import { useServerContext } from '../base/ServerContext';
import { AppURL } from '../../url/AppURL';
import { BasePermissionsCheckPage } from '../permissions/BasePermissionsCheckPage';
import { InjectedPermissionsPage, withPermissionsPage } from '../permissions/withPermissionsPage';

import { PermissionAssignments } from '../permissions/PermissionAssignments';

import { useNotificationsContext } from '../notifications/NotificationsContext';

import { AUDIT_EVENT_TYPE_PARAM, GROUP_AUDIT_QUERY } from '../auditlog/constants';
import { AUDIT_KEY } from '../../app/constants';

import { getUpdatedPolicyRoles, getUpdatedPolicyRolesByUniqueName } from './actions';
import { showPremiumFeatures } from './utils';
import { SITE_SECURITY_ROLES } from './constants';

interface OwnProps {
    description?: ReactNode;
    disableRemoveSelf: boolean;
    hasPermission: boolean;
    lkVersion?: () => ReactNode;
    pageTitle: string;
    panelTitle: string;
    rolesMap: Map<string, string>;
    showDetailsPanel: boolean;
}

// exported for testing
export type BasePermissionsImplProps = OwnProps & InjectedRouteLeaveProps & InjectedPermissionsPage & WithRouterProps;

// exported for testing
export const BasePermissionsImpl: FC<BasePermissionsImplProps> = memo(props => {
    const {
        children,
        description,
        disableRemoveSelf,
        hasPermission,
        pageTitle,
        panelTitle,
        roles,
        rolesMap,
        lkVersion,
    } = props;

    const [policyLastModified, setPolicyLastModified] = useState<string>(undefined);
    const [hidePageDescription, setHidePageDescription] = useState<boolean>(false);
    const { dismissNotifications, createNotification } = useNotificationsContext();
    const { user } = useServerContext();
    const showAssignments = user.isAdmin || user.isRootAdmin;

    const onSuccess = useCallback(() => {
        dismissNotifications();
        createNotification('Successfully updated roles and assignments.');
    }, [createNotification, dismissNotifications]);

    const renderButtons = useCallback(() => {
        const row = policyLastModified ? { Modified: { value: policyLastModified } } : {};

        return (
            <>
                {lkVersion?.()}
                {!lkVersion && <CreatedModified row={row} />}
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

    const rolesProps = useMemo(
        () => ({
            roles: getUpdatedPolicyRoles(roles, rolesMap),
            rolesByUniqueName: getUpdatedPolicyRolesByUniqueName(roles, rolesMap),
            rolesToShow: rolesMap.keySeq().toList(),
        }),
        [roles, rolesMap]
    );

    const setProjectCount = useCallback((projectCount: number) => {
        setHidePageDescription(projectCount > 1 ? true : false);
    }, []);

    return (
        <BasePermissionsCheckPage
            description={hidePageDescription ? null : description}
            hasPermission={hasPermission}
            renderButtons={renderButtons}
            title={pageTitle}
            user={user}
        >
            {showAssignments && (
                <PermissionAssignments
                    {...props}
                    {...rolesProps}
                    disabledId={disableRemoveSelf ? user.id : undefined}
                    onSuccess={onSuccess}
                    title={panelTitle}
                    setLastModified={setPolicyLastModified}
                    setProjectCount={setProjectCount}
                    rootRolesToShow={!showPremiumFeatures() ? SITE_SECURITY_ROLES.keySeq().toList() : undefined}
                />
            )}
            {children}
        </BasePermissionsCheckPage>
    );
});

// TODO: Instead of wrapping with useRouteLeave we should use useRouteLeave in the child component.
export const BasePermissions = withRouteLeave<OwnProps>(withPermissionsPage(BasePermissionsImpl));
