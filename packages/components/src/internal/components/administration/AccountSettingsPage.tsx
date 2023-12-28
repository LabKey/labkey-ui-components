import React, { FC } from 'react';

import { useServerContext } from '../base/ServerContext';
import { InsufficientPermissionsPage } from '../permissions/InsufficientPermissionsPage';
import { useAccountSubNav } from '../user/AccountSubNav';
import { useUserProperties } from '../user/hooks';
import { Page } from '../base/Page';
import { UserDetailHeader } from '../user/UserDetailHeader';
import { getUserRoleDisplay } from '../user/actions';
import { Notifications } from '../notifications/Notifications';
import { isELNEnabled, isWorkflowEnabled } from '../../app/utils';
import { getDateFormat } from '../../util/Date';

import { useAdminAppContext } from './useAdminAppContext';

const TITLE = 'User Settings';

export const AccountSettingsPage: FC = () => {
    const { container, moduleContext, user } = useServerContext();
    useAccountSubNav();
    const userProperties = useUserProperties(user);
    const { NotebookNotificationSettingsComponent, WorkflowNotificationSettingsComponent } = useAdminAppContext();

    if (!user.isSignedIn) {
        return <InsufficientPermissionsPage title={TITLE} />;
    }

    return (
        <Page title={TITLE} hasHeader>
            <UserDetailHeader
                user={user}
                userProperties={userProperties}
                title={user.displayName + "'s Settings"}
                description={getUserRoleDisplay(user)}
                dateFormat={getDateFormat(container).toUpperCase()}
            />
            <Notifications />
            {isELNEnabled(moduleContext) && <NotebookNotificationSettingsComponent />}
            {isWorkflowEnabled(moduleContext) && <WorkflowNotificationSettingsComponent />}
        </Page>
    );
};
