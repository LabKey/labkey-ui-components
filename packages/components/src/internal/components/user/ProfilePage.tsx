/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import {
    getApiExpirationMessage,
    isApiKeyGenerationEnabled,
    isLoginAutoRedirectEnabled,
    isSessionKeyGenerationEnabled
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
import { getPrimaryAppProperties, isFeatureEnabled } from '../../app/utils';
import { ProductFeature } from '../../app/constants';
import {
    InjectedQueryModels,
    QueryConfigMap,
    RequiresModelAndActions,
    withQueryModels
} from '../../../public/QueryModel/withQueryModels';
import { SCHEMAS } from '../../schemas';
import { GridPanel } from '../../../public/QueryModel/GridPanel';
import { ConfirmModal } from '../base/ConfirmModal';
import { deleteRows } from '../../query/api';

interface ButtonsComponentProps extends RequiresModelAndActions {
    onDelete: () => void;
}

const APIKeysButtonsComponent: FC<ButtonsComponentProps> = props => {
    const { model, actions, onDelete } = props;
    const [ showConfirmDelete, setShowConfirmDelete ] = useState<boolean>(false);

    const onDeleteClicked = useCallback(() => setShowConfirmDelete(true), []);
    const closeDeleteModal = useCallback(() => setShowConfirmDelete(false), []);
    const onConfirmDelete = useCallback(async () => {
        const rows = [];
        model.selections.forEach(selection => {
            rows.push({rowId: selection});
        });

        await deleteRows({
            schemaQuery: SCHEMAS.CORE_TABLES.USER_API_KEYS,
            rows,
        });
        actions.clearSelections(model.id);
        actions.loadModel(model.id, true, true);
        actions.loadFirstPage(model.id);
        closeDeleteModal();
        onDelete();
    }, [model, actions, model.id]);

    const noun = model?.selections?.size > 1 ? "Keys" : "Key";
    return (
        <div className="btn-group">

            <button type="button" className="btn btn-default" disabled={!model.hasSelections} onClick={onDeleteClicked}>
                <span className="fa fa-trash"/> Delete
            </button>
            {showConfirmDelete && (
                <ConfirmModal
                    confirmVariant="danger"
                    onCancel={closeDeleteModal}
                    onConfirm={onConfirmDelete}
                    confirmButtonText={"Yes, Delete"}
                    cancelButtonText={"Cancel"}
                    title={`Delete ${model?.selections?.size} API ${noun}`}
                >
                    <strong>Deletion cannot be undone.</strong> Do you want to proceed?
                </ConfirmModal>
            )}
        </div>
    )
}

interface KeyGeneratorProps {
    type: string;
    afterCreate: (key: string) => void;
    keyValue?: string;
    noun: string;
}

const KeyGenerator: FC<KeyGeneratorProps> = props => {
    const { afterCreate, type, keyValue, noun } = props;
    const { api } = useAppContext<AppContext>();

    const [ error, setError ] = useState<boolean>(false);

    const onGenerateKey = useCallback(async () => {
        try {
            const key =  await api.security.createApiKey(type);
            afterCreate(key);
        } catch (e) {
            setError(true);
        }
    }, [type, api]);

    const onCopyKey = useCallback(()  => {
        const handleCopy = (event: ClipboardEvent): void => {
            setCopyValue(event, keyValue);
            event.preventDefault();
            document.removeEventListener('copy', handleCopy, true);
        };
        document.addEventListener('copy', handleCopy, true);
        document.execCommand('copy');
    }, [keyValue]);

    return (
        <>
            <div className="top-spacing form-group">
                <button className="btn btn-success api-key__button"
                        onClick={onGenerateKey}
                        disabled={!!keyValue}
                >
                    Generate {noun}
                </button>

                <input disabled
                       type="text"
                       className="form-control api-key__input"
                       name={"key_input"}
                       value={keyValue}
                />
                <button className="btn btn-default api-key__button"
                        title="Copy to clipboard"
                        name={"copy_key"}
                        onClick={onCopyKey}
                        disabled={!keyValue}
                >
                    <i className="fa fa-clipboard"></i>
                </button>

            </div>
            {!!keyValue && (
                <div>Copy this key value and save it for use in authenticating to the server. This key value will not be shown again.</div>
            )}
            {error && (
                <Alert className={"margin-top"}>
                    There was a problem generating your API key.
                    If the problem persists, please contact your system administrator.
                </Alert>
            )}
        </>
    )
}

interface APIKeysPanelBodyProps {
    includeSessionKeys?: boolean;
}

const APIKeysPanelBody: FC<APIKeysPanelBodyProps & InjectedQueryModels> = props => {
    const { includeSessionKeys, actions, queryModels } = props;
    const { model } =  queryModels;
    const { user, moduleContext, impersonatingUser } = useServerContext();
    const [ apiKey, setApiKey ] = useState<string>();
    const [ sessionKey, setSessionKey ] = useState<string>();
    const apiEnabled = isApiKeyGenerationEnabled(moduleContext);
    const sessionEnabled = isSessionKeyGenerationEnabled(moduleContext);

    const onDelete = useCallback(() => {
        setApiKey("");
    }, []);

    const onApiKeyCreate = useCallback((key: string)  => {
        setApiKey(key);
        actions?.loadModel(model?.id, true, true);
    }, []);

    const adminMsg = useMemo(() => user.isSystemAdmin ? (
        <Alert bsStyle="info" id={"admin-msg"}>
            As a site administrator, you can configure API keys on the <a
            href={ActionURL.buildURL("admin", "customizeSite.view", "/")}>Site Settings page</a>. You
            can manage API keys generated on the server via <a
            href={ActionURL.buildURL("query", "executeQuery.view", "/", {schemaName: "core", queryName: "APIKeys"})}>this
            query</a>.
        </Alert>
    ) : null, [user]);

    const configMsg = useMemo(() => apiEnabled ?
        <p id={"config-msg"}>
            API keys are currently configured to <span className="api-key__expiration-config">{getApiExpirationMessage(moduleContext)}</span>.{' '}
            <span><a href={'https://www.labkey.org/Documentation/wiki-page.view?name=apiKey#usage'}>More info</a></span>
        </p>
        : null
        ,
    [moduleContext, apiEnabled]);

    if (!isFeatureEnabled(ProductFeature.ApiKeys, moduleContext))
        return null;

    return (
        <div className="panel panel-content panel-default">
            <div className="panel-heading">API Keys</div>
            <div className="panel-body">
                <p>
                    API keys are used to authorize client code accessing {getPrimaryAppProperties(moduleContext)?.name ?? "LabKey Server"} using one of the{' '}
                    <a href="https://www.labkey.org/Documentation/wiki-page.view?referrer=inPage&name=viewApis">LabKey Client APIs</a>
                    . API keys are appropriate for authenticating ad hoc interactions within statistical tools
                    (e.g., R, RStudio, SAS) or programming languages (e.g., Java, Python), as well as
                    authenticating API use from automated scripts. A valid API key provides complete access to your data
                    and actions, so it should be kept secret.
                </p>

                {configMsg}
                {adminMsg}

                {!impersonatingUser &&
                    <GridPanel
                        actions={actions}
                        model={model}
                        asPanel={false}
                        showSearchInput={false}
                        showFiltersButton={false}
                        showPagination={true}
                        showExport={false}
                        showViewMenu={false}
                        buttonsComponentProps={{
                            model,
                            actions,
                            onDelete
                        }}
                        ButtonsComponent={APIKeysButtonsComponent}
                        emptyText="You currently do not have any API keys"
                    />
                }

                {apiEnabled && (
                    <>
                        {impersonatingUser !== undefined && (
                            <Alert bsStyle="warning" id={"impersonating-msg"}>
                                API Key generation is not available while impersonating.
                            </Alert>
                            )
                        }
                        {!impersonatingUser && (
                            <KeyGenerator type={"apikey"} keyValue={apiKey} afterCreate={onApiKeyCreate} noun={"API Key"}/>
                        )}
                    </>
                )}
                {!apiEnabled && (
                    <Alert bsStyle="warning" id={"config-msg"}>
                        API key generation is currently not enabled on this server.
                    </Alert>
                )}
                {sessionEnabled && includeSessionKeys && (
                    <>
                        {impersonatingUser !== undefined && (
                            <div className={'user-section-header bottom-spacing'}>Session Keys</div>
                        )}
                        {impersonatingUser !== undefined && !apiEnabled && (
                            <Alert bsStyle="warning" id={'impersonating-msg'}>
                                API key generation is not available while impersonating.
                            </Alert>
                        )}
                        {!impersonatingUser && (
                            <>
                                <p>
                                    A session key is tied to your current browser session, which means all API calls
                                    execute in your current context (e.g., your user, your authorizations, etc.).
                                    It also means the key will no longer represent a logged in user when the session
                                    expires, e.g., when you sign out via the browser or the server automatically times
                                    out your session. Since they expire quickly, session keys are most appropriate for
                                    deployments with regulatory compliance requirements.
                                </p>
                                <KeyGenerator type={'session'} keyValue={sessionKey} afterCreate={setSessionKey}
                                              noun={'Session Key'}/>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

const APIKeysPanelWithQueryModels = withQueryModels(APIKeysPanelBody)

export const APIKeysPanel: FC<APIKeysPanelBodyProps> = (props) => {
    const configs: QueryConfigMap = {
       model: {
            id: 'model',
            title: 'Current API Keys',
            schemaQuery: SCHEMAS.CORE_TABLES.USER_API_KEYS,
            includeTotalCount: true,
        }
    }
    return (
        <APIKeysPanelWithQueryModels autoLoad queryConfigs={configs} {...props} />
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
                    allowChangePassword ? (
                        <button className="btn btn-default" onClick={toggleChangePassword} type="button">
                            Change Password
                        </button>
                    ) : null
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
