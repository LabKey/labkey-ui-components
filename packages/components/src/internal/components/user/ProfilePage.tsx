/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, useState } from 'react';
import { Button } from 'react-bootstrap';

import { isLoginAutoRedirectEnabled } from '../administration/utils';
import { InsufficientPermissionsPage } from '../permissions/InsufficientPermissionsPage';

import { Page } from '../base/Page';

import { Section } from '../base/Section';

import { Notifications } from '../notifications/Notifications';

import { useServerContext } from '../base/ServerContext';

import { getDateFormat } from '../../util/Date';

import { useNotificationsContext } from '../notifications/NotificationsContext';

import { InjectedRouteLeaveProps, withRouteLeave } from '../../util/RouteLeave';

import { UserDetailHeader } from './UserDetailHeader';
import { getUserRoleDisplay } from './actions';

import { UserProfile } from './UserProfile';
import { ChangePasswordModal } from './ChangePasswordModal';

import { useUserProperties } from './UserProvider';

interface OwnProps {
    goBack: (n?: number) => any;
    setReloadRequired: () => any;
    updateUserDisplayName: (displayName: string) => any;
}

type Props = OwnProps & InjectedRouteLeaveProps;

const TITLE = 'User Profile';

const ProfilePageImpl: FC<Props> = props => {
    const { goBack, setReloadRequired, updateUserDisplayName, setIsDirty, getIsDirty } = props;
    const [showChangePassword, setShowChangePassword] = useState<boolean>(false);
    const { moduleContext, user } = useServerContext();
    const userProperties = useUserProperties(user);
    const { createNotification } = useNotificationsContext();

    if (!user.isSignedIn) {
        return <InsufficientPermissionsPage title={TITLE} />;
    }

    const navigate = (result: {}, shouldReload: boolean): void => {
        setIsDirty(false);
        const successMsg = 'Successfully updated your user profile.';

        if (shouldReload) {
            createNotification(successMsg);
            setReloadRequired();
        } else if (result) {
            // push any display name changes to the app state user object
            if (result['updatedRows'].length === 1) {
                const row = result['updatedRows'][0];
                if (row.DisplayName !== undefined) {
                    updateUserDisplayName(row.DisplayName);
                }
            }
        }

        goBack();
        if (result && result['success']) {
            createNotification(successMsg, true);
        }
    };

    const onCancel = (): void => {
        navigate(undefined, false);
    };

    const onChangePassword = (): void => {
        createNotification('Successfully changed password.');
    };

    const toggleChangePassword = (): void => {
        setShowChangePassword(!showChangePassword);
    };

    const allowChangePassword = !isLoginAutoRedirectEnabled(moduleContext);

    return (
        <Page title={TITLE} hasHeader>
            <UserDetailHeader
                userProperties={userProperties}
                user={user}
                title={user.displayName + "'s Profile"}
                description={getUserRoleDisplay(user)}
                dateFormat={getDateFormat().toUpperCase()}
                renderButtons={
                    allowChangePassword ? <Button onClick={toggleChangePassword}>Change Password</Button> : null
                }
            />
            <Notifications />
            <Section>
                <UserProfile
                    userProperties={userProperties}
                    user={user}
                    onCancel={onCancel}
                    onSuccess={navigate}
                    setIsDirty={setIsDirty}
                    getIsDirty={getIsDirty}
                />
            </Section>
            {allowChangePassword && showChangePassword && (
                <ChangePasswordModal user={user} onHide={toggleChangePassword} onSuccess={onChangePassword} />
            )}
        </Page>
    );
};

export const ProfilePage = withRouteLeave(ProfilePageImpl);
