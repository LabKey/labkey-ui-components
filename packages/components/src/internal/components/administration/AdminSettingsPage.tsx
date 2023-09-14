import React, { FC, useCallback, useMemo } from 'react';
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
import { BasePermissionsCheckPage } from '../permissions/BasePermissionsCheckPage';

import { BarTenderSettingsForm } from '../labels/BarTenderSettingsForm';

import { AppContext, useAppContext } from '../../AppContext';

import { ProjectLookAndFeelForm } from '../project/ProjectLookAndFeelForm';

import { useAdminAppContext } from './useAdminAppContext';
import { showPremiumFeatures } from './utils';

// export for jest testing
export const AdminSettingsPageImpl: FC<InjectedRouteLeaveProps> = props => {
    const { setIsDirty, getIsDirty, children } = props;
    const { moduleContext, user, container } = useServerContext();
    const { createNotification, dismissNotifications } = useNotificationsContext();
    const { NotebookProjectSettingsComponent, projectDataTypes } = useAdminAppContext();
    const { api } = useAppContext<AppContext>();

    const disabledTypesMap = getProjectDataExclusion(moduleContext);

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

    const projectSettings = useMemo((): React.ReactNode => {
        if (!isProductProjectsEnabled(moduleContext)) return null;

        return (
            <>
                {isAppHomeFolder(container, moduleContext) && (
                    <ProjectLookAndFeelForm
                        api={api.folder}
                        onChange={onSettingsChange}
                        onSuccess={onSettingsSuccess}
                    />
                )}
            </>
        );
    }, [moduleContext, projectDataTypes, disabledTypesMap, container]);

    const _title = isAppHomeFolder(container, moduleContext) ? 'Application Settings' : 'Project Settings';

    if (!user.isAdmin) {
        return <InsufficientPermissionsPage title={_title} />;
    }

    return (
        <>
            <BasePermissionsCheckPage
                user={user}
                title={_title}
                description={!isAppHomeFolder(container, moduleContext) ? container.path : undefined}
                hasPermission={user.isAdmin}
                renderButtons={lkVersion}
            >
                <ActiveUserLimit />
                {isAppHomeFolder(container, moduleContext) && (
                    <ProjectLookAndFeelForm
                        api={api.folder}
                        onChange={onSettingsChange}
                        onSuccess={onSettingsSuccess}
                    />
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
        </>
    );
};

export const AdminSettingsPage = withRouteLeave(AdminSettingsPageImpl);
