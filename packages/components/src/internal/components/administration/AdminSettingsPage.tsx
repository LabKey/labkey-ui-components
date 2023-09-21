import React, { FC, useCallback } from 'react';
import { getServerContext } from '@labkey/api';

import classNames from 'classnames';

import { InjectedRouteLeaveProps, withRouteLeave } from '../../util/RouteLeave';
import { useServerContext } from '../base/ServerContext';
import { useNotificationsContext } from '../notifications/NotificationsContext';
import { InsufficientPermissionsPage } from '../permissions/InsufficientPermissionsPage';

import { ActiveUserLimit } from '../settings/ActiveUserLimit';
import { NameIdSettings } from '../settings/NameIdSettings';
import { ManageSampleStatusesPanel } from '../samples/ManageSampleStatusesPanel';
import {
    biologicsIsPrimaryApp,
    hasModule,
    isAppHomeFolder,
    isELNEnabled,
    isProtectedDataEnabled,
    isSampleStatusEnabled,
} from '../../app/utils';
import { BasePermissionsCheckPage } from '../permissions/BasePermissionsCheckPage';

import { BarTenderSettingsForm } from '../labels/BarTenderSettingsForm';

import { AppContext, useAppContext } from '../../AppContext';

import { ProjectLookAndFeelForm } from '../project/ProjectLookAndFeelForm';

import { Hooks, LoadingPage } from '../../../index';

import { useAdminAppContext } from './useAdminAppContext';
import { showPremiumFeatures } from './utils';
import { ProtectedDataSettingsPanel } from './ProtectedDataSettingsPanel';
import { RequestsSettingsPanel } from './RequestsSettingsPanel';

// export for jest testing
export const AdminSettingsPageImpl: FC<InjectedRouteLeaveProps> = props => {
    const { setIsDirty, getIsDirty } = props;
    const { moduleContext, container } = useServerContext();
    const homeFolderPath = isAppHomeFolder(container, moduleContext) ? container.path : container.parentPath;
    const { createNotification, dismissNotifications } = useNotificationsContext();
    const { NotebookProjectSettingsComponent } = useAdminAppContext();
    const { api } = useAppContext<AppContext>();
    const homeProjectContainer = Hooks.useContainerUser(homeFolderPath, { includeStandardProperties: true });

    const onSettingsChange = useCallback(() => {
        setIsDirty(true);
    }, [setIsDirty]);

    const onSettingsSuccess = useCallback(
        (reload?: boolean) => {
            setIsDirty(false);
            if (reload) window.location.reload();
        },
        [setIsDirty]
    );

    const onBarTenderSuccess = useCallback(() => {
        setIsDirty(false);
        dismissNotifications();
        createNotification('Successfully updated BarTender configuration.');
    }, [createNotification, dismissNotifications, setIsDirty]);

    const lkVersion = useCallback(() => {
        return (
            <span
                className={classNames('gray-text', 'admin-settings-version', {
                    'margin-right': !showPremiumFeatures(moduleContext),
                })}
            >
                Version: {getServerContext().versionString}
            </span>
        );
    }, [moduleContext]);

    if (!homeProjectContainer.isLoaded) return <LoadingPage title="Application Settings" />;

    if (!homeProjectContainer.user.isAdmin) {
        return <InsufficientPermissionsPage title="Application Settings" />;
    }

    return (
        <>
            <BasePermissionsCheckPage
                user={homeProjectContainer.user}
                title="Application Settings"
                description={undefined}
                hasPermission={homeProjectContainer.user.isAdmin}
                renderButtons={lkVersion}
            >
                <ActiveUserLimit user={homeProjectContainer.user} container={homeProjectContainer.container} />
                <ProjectLookAndFeelForm
                    api={api.folder}
                    onChange={onSettingsChange}
                    onSuccess={onSettingsSuccess}
                    container={homeProjectContainer.container}
                />
                {biologicsIsPrimaryApp(moduleContext) && isELNEnabled(moduleContext) && (
                    <NotebookProjectSettingsComponent containerPath={homeProjectContainer.container.path} />
                )}
                <BarTenderSettingsForm
                    onChange={onSettingsChange}
                    onSuccess={onBarTenderSuccess}
                    container={homeProjectContainer.container}
                    setIsDirty={setIsDirty}
                    getIsDirty={getIsDirty}
                />
                <NameIdSettings {...props} container={homeProjectContainer.container} isAppHome={true} />
                {isSampleStatusEnabled(moduleContext) && (
                    <ManageSampleStatusesPanel {...props} container={homeProjectContainer.container} />
                )}
                {biologicsIsPrimaryApp(moduleContext) && isProtectedDataEnabled(moduleContext) && (
                    <ProtectedDataSettingsPanel containerPath={homeProjectContainer.container.path} />
                )}
                {biologicsIsPrimaryApp(moduleContext) && hasModule('assayRequest', moduleContext) && (
                    <RequestsSettingsPanel />
                )}
            </BasePermissionsCheckPage>
        </>
    );
};

export const AdminSettingsPage = withRouteLeave(AdminSettingsPageImpl);
