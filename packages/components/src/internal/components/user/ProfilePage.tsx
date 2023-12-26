/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

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
import { ActionURL } from '@labkey/api';
import { AppContext, useAppContext } from '../../AppContext';
import { setCopyValue } from '../../events';
import { isFeatureEnabled } from '../../app/utils';
import { ProductFeature } from '../../app/constants';


export const APIKeysPanel: FC<any> = () => {
    const { user, moduleContext, impersonatingUser } = useServerContext();
    const { api } = useAppContext<AppContext>();
    const [ error, setError ] = useState<boolean>(false);
    const [ generatedKey, setGeneratedKey ] = useState<string>();
    // const [ expirationDate, setExpirationDae ] = useState<number>();

    const onGenerateKey = useCallback(async () => {
        try {
            const key =  await api.security.createApiKey();
            setGeneratedKey(key);
        } catch (e) {
            setError(true);
        }
    }, []);

    const onCopyKey = useCallback(()  => {
        const handleCopy = (event: ClipboardEvent): void => {
            setCopyValue(event, generatedKey);
            event.preventDefault();
            document.removeEventListener('copy', handleCopy, true);
        };
        document.addEventListener('copy', handleCopy, true);
        document.execCommand('copy');
    }, [generatedKey]);

    const adminMsg = useMemo(() => user.isSystemAdmin ? (
        <Alert bsStyle="info" id={"admin-msg"}>
            As a site administrator, you can configure API keys on the <a
            href={ActionURL.buildURL("admin", "customizeSite.view", "/")}>Site Settings page</a>. You
            can manage API keys generated on the server via <a
            href={ActionURL.buildURL("query", "executeQuery.view", "/", {schemaName: "core", queryName: "APIKeys"})}>this
            query</a>.
        </Alert>
    ) : null, [user]);

    const configMsg = useMemo(() => isApiKeyGenerationEnabled(moduleContext) ?
        <p id={"config-msg"}>
            API keys are currently configured to <span className="api-key__expiration-config">{getApiExpirationMessage(moduleContext)}</span>.{' '}
            <span><a href={'https://www.labkey.org/Documentation/wiki-page.view?name=apiKey#usage'}>More info</a></span>
        </p>
        :
        <Alert bsStyle="warning" id={"config-msg"}>
            API keys are currently not enabled on this server.
        </Alert>,
    [moduleContext]);

    if (!isFeatureEnabled(ProductFeature.ApiKeys, moduleContext))
        return null;

    return (
        <div className="panel panel-default">
            <div className="panel-heading">API Keys</div>
            <div className="panel-body">
                <p>
                    API keys are used to authorize client code accessing LabKey Sample Manager using one of the{' '}
                    <a href="https://www.labkey.org/Documentation/wiki-page.view?referrer=inPage&name=viewApis">LabKey Client APIs</a>
                    . API keys are appropriate for authenticating ad hoc interactions within statistical tools
                    (e.g., R, RStudio, SAS) or programming languages (e.g., Java, Python), as well as
                    authenticating API use from automated scripts. A valid API key provides complete access to your data
                    and actions, so it should be kept secret.
                </p>

                {configMsg}
                {adminMsg}
                {isApiKeyGenerationEnabled(moduleContext) && (
                    <>
                        {impersonatingUser !== undefined && (
                            <Alert bsStyle="warning" id={"impersonating-msg"}>
                                API Key generation is not available while impersonating.
                            </Alert>
                            )
                        }
                        {!impersonatingUser && (
                            <>
                                <div className="top-spacing form-group">
                                    <button className="btn btn-success api-key__button"
                                            onClick={onGenerateKey}
                                            disabled={!!generatedKey}
                                    >
                                        Generate API Key
                                    </button>

                                    <input disabled type="text" className="form-control api-key__input"
                                           value={generatedKey}
                                    />
                                    <button className="btn btn-default api-key__button"
                                            title="Copy to clipboard"
                                            onClick={onCopyKey}
                                            disabled={!generatedKey}
                                    >
                                        <i className="fa fa-clipboard"></i>
                                    </button>
                                    {/*{expirationDate && <span className="left-spacing">Expiration Date: {expirationDate}</span>}*/}
                                    {/*<button className=" btn btn-default api-key__button pull-right" title="Delete key"*/}
                                    {/*        disabled={!generatedKey}>*/}
                                    {/*    Delete <i className="fa fa-trash"></i>*/}
                                    {/*</button>*/}
                                </div>
                                {error && (
                                    <Alert className={"margin-top"}>
                                        There was a problem generating your API key.
                                        If the problem persists, please contact your system administrator.
                                    </Alert>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

interface Props {
    updateUserDisplayName: (displayName: string) => void;
}

const TITLE = 'User Profile';

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
                    allowChangePassword ? <button className={"btn btn-default"} onClick={toggleChangePassword} type={"button"}>Change Password</button> : null
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
