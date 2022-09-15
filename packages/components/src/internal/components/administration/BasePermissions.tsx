/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { MenuItem } from 'react-bootstrap';
import { Map } from 'immutable';

import { getServerContext } from '@labkey/api';

import { isLoading, LoadingState } from '../../../public/LoadingState';
import { resolveErrorMessage } from '../../util/messaging';
import { SecurityPolicy } from '../permissions/models';
import { InjectedRouteLeaveProps, withRouteLeave } from '../../util/RouteLeave';
import { CreatedModified } from '../base/CreatedModified';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { ManageDropdownButton } from '../buttons/ManageDropdownButton';
import { useServerContext } from '../base/ServerContext';
import { AppURL } from '../../url/AppURL';
import { BasePermissionsCheckPage } from '../permissions/BasePermissionsCheckPage';
import { InjectedPermissionsPage, withPermissionsPage } from '../permissions/withPermissionsPage';

import { Alert } from '../base/Alert';
import { PermissionAssignments } from '../permissions/PermissionAssignments';

import { AppContext, useAppContext } from '../../AppContext';

import { useNotificationsContext } from '../notifications/NotificationsContext';

import { getUpdatedPolicyRoles, getUpdatedPolicyRolesByUniqueName } from './actions';

interface OwnProps {
    containerId: string;
    description?: ReactNode;
    disableRemoveSelf: boolean;
    hasPermission: boolean;
    pageTitle: string;
    panelTitle: string;
    rolesMap: Map<string, string>;
    showDetailsPanel: boolean;
}

// exported for testing
export type BasePermissionsImplProps = OwnProps & InjectedRouteLeaveProps & InjectedPermissionsPage;

// exported for testing
export const BasePermissionsImpl: FC<BasePermissionsImplProps> = memo(props => {
    const {
        children,
        containerId,
        description,
        disableRemoveSelf,
        hasPermission,
        inactiveUsersById,
        pageTitle,
        panelTitle,
        principalsById,
        roles,
        rolesMap,
        setIsDirty,
    } = props;
    const [error, setError] = useState<string>();
    const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [policy, setPolicy] = useState<SecurityPolicy>();
    const { api } = useAppContext<AppContext>();
    const { dismissNotifications, createNotification } = useNotificationsContext();
    const { user } = useServerContext();
    const loaded = !isLoading(loadingState);
    const isRoot = getServerContext().project.rootId === containerId;
    const showAssignments = (!isRoot && user.isAdmin) || user.isRootAdmin;

    const loadPolicy = useCallback(async () => {
        setError(undefined);
        setIsDirty(false);

        if (showAssignments) {
            setLoadingState(LoadingState.LOADING);

            try {
                const policy_ = await api.security.fetchPolicy(containerId, principalsById, inactiveUsersById);
                setPolicy(policy_);
            } catch (e) {
                setError(resolveErrorMessage(e) ?? 'Failed to load security policy');
            }
        }

        setLoadingState(LoadingState.LOADED);
    }, [api.security, containerId, inactiveUsersById, principalsById, setIsDirty, showAssignments]);

    useEffect(() => {
        loadPolicy();
    }, [loadPolicy]);

    const onChange = useCallback(
        (policy_: SecurityPolicy) => {
            setIsDirty(true);
            setPolicy(policy_);
        },
        [setIsDirty]
    );

    const onSuccess = useCallback(() => {
        dismissNotifications();
        createNotification('Successfully updated roles and assignments.');

        loadPolicy();
    }, [createNotification, dismissNotifications, loadPolicy]);

    const renderButtons = useCallback(() => {
        const row = policy ? { Modified: { value: policy.modified } } : {};

        return (
            <>
                <CreatedModified row={row} />
                <ManageDropdownButton collapsed id="admin-page-manage" pullRight>
                    <MenuItem href={AppURL.create('audit', 'groupauditevent').toHref()}>View Audit History</MenuItem>
                </ManageDropdownButton>
            </>
        );
    }, [policy]);

    const rolesProps = useMemo(
        () => ({
            roles: getUpdatedPolicyRoles(roles, rolesMap),
            rolesByUniqueName: getUpdatedPolicyRolesByUniqueName(roles, rolesMap),
            rolesToShow: rolesMap.keySeq().toList(),
        }),
        [roles, rolesMap]
    );

    return (
        <BasePermissionsCheckPage
            description={description}
            hasPermission={hasPermission}
            renderButtons={renderButtons}
            title={pageTitle}
            user={user}
        >
            {!loaded && <LoadingSpinner />}
            {!!error && <Alert>{error}</Alert>}
            {loaded && !error && showAssignments && (
                <PermissionAssignments
                    {...props}
                    {...rolesProps}
                    disabledId={disableRemoveSelf ? user.id : undefined}
                    onChange={onChange}
                    onSuccess={onSuccess}
                    policy={policy}
                    title={panelTitle}
                />
            )}
            {children}
        </BasePermissionsCheckPage>
    );
});

export const BasePermissions = withRouteLeave<OwnProps>(withPermissionsPage(BasePermissionsImpl));
