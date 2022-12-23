import React, { FC, useCallback } from 'react';

import { InjectedRouteLeaveProps, withRouteLeave } from '../../util/RouteLeave';
import { useServerContext } from '../base/ServerContext';
import { useNotificationsContext } from '../notifications/NotificationsContext';
import { InsufficientPermissionsPage } from '../permissions/InsufficientPermissionsPage';

import { ActiveUserLimit } from '../settings/ActiveUserLimit';
import { NameIdSettings } from '../settings/NameIdSettings';
import { ManageSampleStatusesPanel } from '../samples/ManageSampleStatusesPanel';
import { biologicsIsPrimaryApp, isELNEnabled, isProductProjectsEnabled, isSampleStatusEnabled } from '../../app/utils';
import { ProjectSettings } from '../settings/ProjectSettings';
import { BasePermissionsCheckPage } from '../permissions/BasePermissionsCheckPage';

import { BarTenderSettingsForm } from '../labels/BarTenderSettingsForm';

import { SITE_SECURITY_ROLES } from './constants';
import { BasePermissions } from './BasePermissions';
import { showPremiumFeatures } from './utils';
import { useAdminAppContext } from './useAdminAppContext';

const TITLE = 'Settings';

// export for jest testing
export const AdminSettingsPageImpl: FC<InjectedRouteLeaveProps> = props => {
    const { setIsDirty, getIsDirty, children } = props;
    const { moduleContext, user, project } = useServerContext();
    const { createNotification, dismissNotifications } = useNotificationsContext();
    const { NotebookProjectSettingsComponent } = useAdminAppContext();

    const onSettingsChange = useCallback(() => {
        setIsDirty(true);
    }, [setIsDirty]);

    const onSettingsSuccess = useCallback(() => {
        setIsDirty(false);
    }, [setIsDirty]);

    const onBarTenderSuccess = useCallback(() => {
        setIsDirty(false);
        dismissNotifications();
        createNotification('Successfully updated BarTender configuration.');
    }, [createNotification, dismissNotifications, setIsDirty]);

    if (!user.isAdmin) {
        return <InsufficientPermissionsPage title={TITLE} />;
    }

    if (!showPremiumFeatures(moduleContext)) {
        return (
            <BasePermissions
                pageTitle={TITLE}
                panelTitle="Site Roles and Assignments"
                containerId={project.rootId}
                hasPermission={user.isAdmin}
                rolesMap={SITE_SECURITY_ROLES}
                showDetailsPanel={false}
                disableRemoveSelf
            >
                <ActiveUserLimit />
                <BarTenderSettingsForm
                    onChange={onSettingsChange}
                    onSuccess={onBarTenderSuccess}
                    setIsDirty={setIsDirty}
                    getIsDirty={getIsDirty}
                />
                <NameIdSettings {...props} />
                {isSampleStatusEnabled(moduleContext) && <ManageSampleStatusesPanel {...props} />}
            </BasePermissions>
        );
    }

    return (
        <BasePermissionsCheckPage user={user} title={TITLE} hasPermission={user.isAdmin}>
            <ActiveUserLimit />
            {isProductProjectsEnabled(moduleContext) && (
                <ProjectSettings onChange={onSettingsChange} onSuccess={onSettingsSuccess} />
            )}
            {biologicsIsPrimaryApp(moduleContext) && isELNEnabled(moduleContext) && (
                <NotebookProjectSettingsComponent />
            )}
            <BarTenderSettingsForm
                onChange={onSettingsChange}
                onSuccess={onBarTenderSuccess}
                setIsDirty={setIsDirty}
                getIsDirty={getIsDirty}
            />
            <NameIdSettings {...props} />
            {isSampleStatusEnabled(moduleContext) && <ManageSampleStatusesPanel {...props} />}
            {children}
        </BasePermissionsCheckPage>
    );
};

export const AdminSettingsPage = withRouteLeave(AdminSettingsPageImpl);
