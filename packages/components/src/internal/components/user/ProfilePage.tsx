/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, useCallback, useState } from 'react';
import { Button, Panel } from 'react-bootstrap';

import {
    getApiExpirationMessage,
    isApiKeyGenerationEnabled,
    isLoginAutoRedirectEnabled
} from '../administration/utils';
import { InsufficientPermissionsPage } from '../permissions/InsufficientPermissionsPage';

import { Page } from '../base/Page';

import { Section } from '../base/Section';

import { Notifications } from '../notifications/Notifications';

import { useServerContext } from '../base/ServerContext';

import { getDateFormat } from '../../util/Date';

import { useNotificationsContext } from '../notifications/NotificationsContext';

import { useRouteLeave } from '../../util/RouteLeave';
import { useAccountSubNav } from './AccountSubNav';

import { UserDetailHeader } from './UserDetailHeader';
import { getUserRoleDisplay } from './actions';

import { UserProfile } from './UserProfile';
import { ChangePasswordModal } from './ChangePasswordModal';

import { useUserProperties } from './hooks';
import { Alert } from '../base/Alert';
import { Grid } from '../base/Grid';
import { fromJS } from 'immutable';
import { HelpIcon } from '../HelpIcon';
import { hasAllPermissions } from '../base/models/User';
import { ActionURL, getServerContext } from '@labkey/api';

interface Props {
    updateUserDisplayName: (displayName: string) => void;
}

const TITLE = 'User Profile';

export const APIKeysPanel: FC<any> = props => {
    const { user, moduleContext, impersonatingUser } = useServerContext();
    const [ error, setError ] = useState<string>();
    const [ generatedKey, setGeneratedKey ] = useState<string>();

    if (!isApiKeyGenerationEnabled(moduleContext))
        return null;

    return (
        <Panel>
            <Panel.Heading>API Keys</Panel.Heading>
            <Panel.Body>
                {user.isSystemAdmin && (
                    <p>
                        <Alert bsStyle={'info'}>
                            As a site administrator, you can configure API keys on the <a
                            href={ActionURL.buildURL("admin", "customizeSite.view", "/")}>Site Settings page</a>. You
                            can manage API keys generated on the server via <a
                            href={ActionURL.buildURL("query", "executeQuery.view", "/", {schemaName: "core", queryName: "APIKeys"})}>this
                            query</a>.
                        </Alert>
                    </p>
                )}
                <p>
                    API keys are used to authorize client code accessing LabKey Sample Manager using one of the{' '}
                    <a href="https://www.labkey.org/Documentation/wiki-page.view?referrer=inPage&name=viewApis">LabKey Client APIs</a>
                    . API keys are appropriate for authenticating ad hoc interactions within statistical tools
                    (e.g., R, RStudio, SAS) or programming languages (e.g., Java, Python), as well as
                    authenticating API use from automated scripts. A valid API key provides complete access to your data
                    and actions, so it should be kept secret.
                </p>
                <p>
                    API keys are currently configured to {getApiExpirationMessage(moduleContext)}.{' '}
                    <span><a href={'http://'}>More info</a></span>
                </p>
                {impersonatingUser !== undefined && (
                    <Alert bsStyle="info">
                        API Key generation is not available while impersonating.
                    </Alert>
                    )
                }
                {!impersonatingUser && (
                    <>
                        <div className="top-spacing">
                            <button className="btn btn-success" style={{marginBottom: '3px'}}>Generate API Key
                            </button>

                            <input disabled type="text" className="form-control"
                                   style={{width: '275px', display: 'inline-block'}}
                                   value={generatedKey}
                            />
                            <button className=" btn btn-default" title="Copy to clipboard" style={{marginBottom: '3px'}}>
                                <i className="fa fa-clipboard"></i>
                            </button>
                            <span className="left-spacing">Expiration Date: 2024-04-29</span>
                            <button className=" btn btn-default pull-right" title="Delete key"
                                    style={{marginBottom: '3px'}}>
                                Delete <i className="fa fa-trash"></i>
                            </button>
                        </div>
                        <Alert>{error}</Alert>
                    </>
                )}
            </Panel.Body>
        </Panel>
    )
}

export const ProfilePage: FC<Props> = props => {
    const { updateUserDisplayName } = props;
    useAccountSubNav();
    const [_, setIsDirty] = useRouteLeave();
    const [showChangePassword, setShowChangePassword] = useState<boolean>(false);
    const { moduleContext, user } = useServerContext();
    const userProperties = useUserProperties(user);
    const { createNotification } = useNotificationsContext();

    const navigate = useCallback(
        (result: any, shouldReload: boolean): void => {
            setIsDirty(false);
            const successMsg = 'Successfully updated your user profile.';

            if (shouldReload) {
                createNotification(successMsg);
                window.location.reload();
                return;
            }

            if (result) {
                const row = result.updatedRows[0];

                if (row !== undefined && row.DisplayName !== undefined) {
                    // push any display name changes to the app state user object
                    updateUserDisplayName(row.DisplayName);
                }

                if (result.success) {
                    createNotification(successMsg);
                }
            }
        },
        [createNotification, setIsDirty, updateUserDisplayName]
    );

    const onChangePassword = useCallback((): void => {
        createNotification('Successfully changed password.');
    }, [createNotification]);

    const toggleChangePassword = useCallback((): void => {
        setShowChangePassword(!showChangePassword);
    }, [showChangePassword]);

    if (!user.isSignedIn) {
        return <InsufficientPermissionsPage title={TITLE} />;
    }

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
                <UserProfile userProperties={userProperties} user={user} onSuccess={navigate} setIsDirty={setIsDirty} />
            </Section>
            {allowChangePassword && showChangePassword && (
                <ChangePasswordModal user={user} onHide={toggleChangePassword} onSuccess={onChangePassword} />
            )}
            <APIKeysPanel />
        </Page>
    );
};
