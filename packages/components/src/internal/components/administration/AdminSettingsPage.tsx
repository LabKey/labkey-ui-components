import React, { FC, useCallback } from 'react';

import { useRouteLeave } from '../../util/RouteLeave';
import { useServerContext } from '../base/ServerContext';
import { useNotificationsContext } from '../notifications/NotificationsContext';

import { ActiveUserLimit } from '../settings/ActiveUserLimit';
import { NameIdSettings } from '../settings/NameIdSettings';
import { ManageSampleStatusesPanel } from '../samples/ManageSampleStatusesPanel';
import {
    biologicsIsPrimaryApp,
    getAppHomeFolderPath,
    hasModule,
    isELNEnabled,
    isProtectedDataEnabled,
    isSampleStatusEnabled,
} from '../../app/utils';
import { BasePermissionsCheckPage } from '../permissions/BasePermissionsCheckPage';

import { BarTenderSettingsForm } from '../labels/BarTenderSettingsForm';

import { AppContext, useAppContext } from '../../AppContext';

import { ProjectLookAndFeelForm } from '../project/ProjectLookAndFeelForm';

import { useContainerUser } from '../container/actions';

import { LoadingPage } from '../base/LoadingPage';

import { useAdministrationSubNav } from './useAdministrationSubNav';

import { useAdminAppContext } from './useAdminAppContext';
import { ProtectedDataSettingsPanel } from './ProtectedDataSettingsPanel';
import { RequestsSettingsPanel } from './RequestsSettingsPanel';

// export for jest testing
export const AdminSettingsPage: FC = () => {
    useAdministrationSubNav();
    const [getIsDirty, setIsDirty] = useRouteLeave();
    const { moduleContext, container } = useServerContext();
    const homeFolderPath = getAppHomeFolderPath(container, moduleContext);
    const { createNotification, dismissNotifications } = useNotificationsContext();
    const { NotebookProjectSettingsComponent } = useAdminAppContext();
    const { api } = useAppContext<AppContext>();
    const homeProjectContainer = useContainerUser(homeFolderPath, { includeStandardProperties: true });

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

    if (!homeProjectContainer.isLoaded) return <LoadingPage title="Application Settings" />;

    return (
        <>
            <BasePermissionsCheckPage
                user={homeProjectContainer.user}
                title="Application Settings"
                description={undefined}
                hasPermission={homeProjectContainer.user.isAdmin}
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
                <NameIdSettings
                    container={homeProjectContainer.container}
                    getIsDirty={getIsDirty}
                    isAppHome={true}
                    setIsDirty={setIsDirty}
                />
                {isSampleStatusEnabled(moduleContext) && (
                    <ManageSampleStatusesPanel
                        container={homeProjectContainer.container}
                        getIsDirty={getIsDirty}
                        setIsDirty={setIsDirty}
                    />
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
