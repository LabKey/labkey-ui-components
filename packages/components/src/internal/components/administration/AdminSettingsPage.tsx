import React, { FC, useCallback, useMemo, useState } from 'react';
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
    getProjectDataExclusion,
    isAppHomeFolder,
    isELNEnabled,
    isProductProjectsEnabled,
    isSampleStatusEnabled,
} from '../../app/utils';
import { ProjectSettings } from '../project/ProjectSettings';
import { BasePermissionsCheckPage } from '../permissions/BasePermissionsCheckPage';

import { BarTenderSettingsForm } from '../labels/BarTenderSettingsForm';

import { Alert } from '../base/Alert';

import { ProjectDataTypeSelections } from '../project/ProjectDataTypeSelections';
import { AppContext, useAppContext } from '../../AppContext';

import { ProjectLookAndFeelForm } from '../project/ProjectLookAndFeelForm';

import { useAdminAppContext } from './useAdminAppContext';
import { showPremiumFeatures } from './utils';
import { BasePermissions } from './BasePermissions';
import { SITE_SECURITY_ROLES } from './constants';

// export for jest testing
export const AdminSettingsPageImpl: FC<InjectedRouteLeaveProps> = props => {
    const { setIsDirty, getIsDirty, children } = props;
    const [error, setError] = useState<string>();
    const { moduleContext, user, project, container } = useServerContext();
    const { createNotification, dismissNotifications } = useNotificationsContext();
    const { NotebookProjectSettingsComponent, projectDataTypes, ProjectFreezerSelectionComponent } =
        useAdminAppContext();
    const { api } = useAppContext<AppContext>();

    const disabledTypesMap = getProjectDataExclusion(moduleContext);

    const onError = useCallback((e: string) => {
        setError(e);
    }, []);

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

    const commonSettings = useMemo((): React.ReactNode => {
        return (
            <>
                <ActiveUserLimit />
                {isProductProjectsEnabled(moduleContext) && (
                    <ProjectSettings onChange={onSettingsChange} onSuccess={onSettingsSuccess} onPageError={onError} />
                )}
                {isAppHomeFolder(container, moduleContext) && (
                    <ProjectLookAndFeelForm
                        api={api.folder}
                        onChange={onSettingsChange}
                        onSuccess={onSettingsSuccess}
                    />
                )}
                {isProductProjectsEnabled(moduleContext) && !isAppHomeFolder(container, moduleContext) && (
                    <>
                        <ProjectDataTypeSelections
                            entityDataTypes={projectDataTypes}
                            projectId={container.id}
                            key={container.id}
                            updateDataTypeExclusions={onSettingsChange}
                            disabledTypesMap={disabledTypesMap}
                            api={api.folder}
                            onSuccess={onSettingsSuccess}
                        />
                        {!!ProjectFreezerSelectionComponent && (
                            <ProjectFreezerSelectionComponent
                                projectId={container.id}
                                updateDataTypeExclusions={onSettingsChange}
                                disabledTypesMap={disabledTypesMap}
                                onSuccess={onSettingsSuccess}
                            />
                        )}
                    </>
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
            </>
        );
    }, [moduleContext, projectDataTypes, disabledTypesMap, container]);

    const _title = isAppHomeFolder(container, moduleContext) ? 'Settings' : 'Project Settings';

    if (!user.isAdmin) {
        return <InsufficientPermissionsPage title={_title} />;
    }

    if (!showPremiumFeatures(moduleContext)) {
        return (
            <BasePermissions
                pageTitle={_title}
                panelTitle="Site Roles and Assignments"
                containerId={project.rootId}
                hasPermission={user.isAdmin}
                rolesMap={SITE_SECURITY_ROLES}
                showDetailsPanel={false}
                disableRemoveSelf
                lkVersion={lkVersion}
            >
                {commonSettings}
            </BasePermissions>
        );
    }

    return (
        <>
            {error && <Alert className="admin-settings-error"> {error} </Alert>}
            <BasePermissionsCheckPage
                user={user}
                title={_title}
                description={!isAppHomeFolder(container, moduleContext) ? container.path : undefined}
                hasPermission={user.isAdmin}
                renderButtons={lkVersion}
            >
                {commonSettings}
            </BasePermissionsCheckPage>
        </>
    );
};

export const AdminSettingsPage = withRouteLeave(AdminSettingsPageImpl);
