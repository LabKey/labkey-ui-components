/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import { ActionURL } from '@labkey/api';

import {
    getApiExpirationMessage,
    isApiKeyGenerationEnabled,
    isSessionKeyGenerationEnabled,
} from '../administration/utils';

import { useServerContext } from '../base/ServerContext';

import { Alert } from '../base/Alert';
import { AppContext, useAppContext } from '../../AppContext';
import { setCopyValue } from '../../events';
import { biologicsIsPrimaryApp, getPrimaryAppProperties, isFeatureEnabled } from '../../app/utils';
import { ProductFeature } from '../../app/constants';
import {
    InjectedQueryModels,
    QueryConfigMap,
    RequiresModelAndActions,
    withQueryModels,
} from '../../../public/QueryModel/withQueryModels';
import { SCHEMAS } from '../../schemas';
import { GridPanel } from '../../../public/QueryModel/GridPanel';
import { ConfirmModal } from '../base/ConfirmModal';
import { HelpLink } from '../../util/helpLinks';

interface ButtonsComponentProps extends RequiresModelAndActions {
    onDelete: (error?: string) => void;
}

const APIKeysButtonsComponent: FC<ButtonsComponentProps> = props => {
    const { model, actions, onDelete } = props;
    const { api } = useAppContext<AppContext>();
    const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);

    const onDeleteClicked = useCallback(() => setShowConfirmDelete(true), []);
    const closeDeleteModal = useCallback(() => setShowConfirmDelete(false), []);
    const onConfirmDelete = useCallback(async () => {
        try {
            await api.security.deleteApiKeys(model.selections);
            actions.clearSelections(model.id);
            actions.loadModel(model.id, true, true);
            actions.loadFirstPage(model.id);
            closeDeleteModal();
            onDelete();
        } catch (e) {
            console.error('Unable to delete selected api keys', e);
            onDelete(
                'Unable to delete the selected keys. If the problem persists, please contact your system administrator.'
            );
        }
    }, [model, actions, model.id]);

    const noun = model?.selections?.size > 1 ? 'Keys' : 'Key';
    return (
        <div className="btn-group">
            <button type="button" className="btn btn-default" disabled={!model.hasSelections} onClick={onDeleteClicked}>
                <span className="fa fa-trash" /> Delete
            </button>
            {showConfirmDelete && (
                <ConfirmModal
                    confirmVariant="danger"
                    onCancel={closeDeleteModal}
                    onConfirm={onConfirmDelete}
                    confirmButtonText="Yes, Delete"
                    cancelButtonText="Cancel"
                    title={`Delete ${model?.selections?.size} API ${noun}`}
                >
                    <strong>Deletion cannot be undone.</strong> Do you want to proceed?
                </ConfirmModal>
            )}
        </div>
    );
};

interface KeyGeneratorProps {
    type: string;
    afterCreate: (key: string) => void;
    keyValue?: string;
    noun: string;
}

// exported for jest testing
export const KeyGenerator: FC<KeyGeneratorProps> = props => {
    const { afterCreate, type, keyValue, noun } = props;
    const { api } = useAppContext<AppContext>();

    const [error, setError] = useState<boolean>(false);

    const onGenerateKey = useCallback(async () => {
        try {
            const key = await api.security.createApiKey(type);
            afterCreate(key);
        } catch (e) {
            setError(true);
        }
    }, [type, api]);

    const onCopyKey = useCallback(() => {
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
                <button className="btn btn-success api-key__button" onClick={onGenerateKey} disabled={!!keyValue}>
                    Generate {noun}
                </button>

                <input
                    disabled
                    type="text"
                    className="form-control api-key__input"
                    name={type + '_token'}
                    value={keyValue}
                />
                <button
                    className="btn btn-default api-key__button"
                    title="Copy to clipboard"
                    name={'copy_' + type + '_token'}
                    onClick={onCopyKey}
                    disabled={!keyValue}
                >
                    <i className="fa fa-clipboard"></i>
                </button>
            </div>
            {!!keyValue && (
                <div id="copy_advice">
                    Copy this key value and save it for use in authenticating to the server. This key value will not be
                    shown again.
                </div>
            )}
            {error && (
                <Alert className="margin-top">
                    There was a problem generating your API key. If the problem persists, please contact your system
                    administrator.
                </Alert>
            )}
        </>
    );
};

interface APIKeysPanelBodyProps {
    includeSessionKeys?: boolean;
}

const APIKeysPanelBody: FC<APIKeysPanelBodyProps & InjectedQueryModels> = props => {
    const { includeSessionKeys, actions, queryModels } = props;
    const { model } = queryModels;
    const { user, moduleContext, impersonatingUser } = useServerContext();
    const [apiKey, setApiKey] = useState<string>(''); // start with empty string not undefined to avoid warnings about controlled vs. uncontrolled inputs
    const [sessionKey, setSessionKey] = useState<string>('');
    const [error, setError] = useState<string>();
    const apiEnabled = isApiKeyGenerationEnabled(moduleContext);
    const sessionEnabled = isSessionKeyGenerationEnabled(moduleContext);
    const primaryApp = getPrimaryAppProperties(moduleContext)?.name;

    const onDelete = useCallback((deleteError?: string) => {
        if (deleteError) {
            setError(deleteError);
        } else {
            setError(undefined);
            setApiKey(''); // undefined and null here will not have the desired effect
        }
    }, []);

    const onApiKeyCreate = useCallback((key: string) => {
        setApiKey(key);
        actions?.loadModel(model?.id, true, true);
    }, []);

    const adminMsg = useMemo(
        () =>
            user.isSystemAdmin ? (
                <Alert bsStyle="info" id="admin-msg">
                    As a site administrator, you can configure API keys on the{' '}
                    <a href={ActionURL.buildURL('admin', 'customizeSite.view', '/')}>Site Settings page</a>. You can
                    manage API keys generated on the server via{' '}
                    <a
                        href={ActionURL.buildURL('query', 'executeQuery.view', '/', {
                            schemaName: 'core',
                            queryName: 'APIKeys',
                        })}
                    >
                        this query
                    </a>
                    .
                </Alert>
            ) : null,
        [user]
    );

    const configMsg = useMemo(
        () =>
            apiEnabled ? (
                <p id="config-msg">
                    API keys are currently configured to{' '}
                    <span className="api-key__expiration-config">{getApiExpirationMessage(moduleContext)}</span>.{' '}
                    <span>
                        {primaryApp ? (
                            <HelpLink topic="myAccount#apikey" useDefaultUrl={biologicsIsPrimaryApp(moduleContext)}>
                                More info
                            </HelpLink>
                        ) : (
                            <a href="https://www.labkey.org/Documentation/wiki-page.view?name=apiKey#usage">
                                More info
                            </a>
                        )}
                    </span>
                </p>
            ) : null,
        [moduleContext, apiEnabled]
    );

    // We are meant to not show this panel for LKSM Starter, but show it in LKS and LKSM Prof+
    if (primaryApp && !isFeatureEnabled(ProductFeature.ApiKeys, moduleContext)) return null;

    return (
        <div className="panel panel-content panel-default">
            <div className="panel-heading">API Keys</div>
            <div className="panel-body">
                <p>
                    API keys are used to authorize client code accessing {primaryApp ?? 'LabKey Server'} using one of
                    the{' '}
                    <a href="https://www.labkey.org/Documentation/wiki-page.view?referrer=inPage&name=viewApis">
                        LabKey Client APIs
                    </a>
                    . API keys are appropriate for authenticating ad hoc interactions within statistical tools (e.g., R,
                    RStudio, SAS) or programming languages (e.g., Java, Python), as well as authenticating API use from
                    automated scripts. A valid API key provides complete access to your data and actions, so it should
                    be kept secret.
                </p>

                {configMsg}
                {adminMsg}

                {!impersonatingUser && (
                    <>
                        <GridPanel
                            actions={actions}
                            model={model}
                            asPanel={false}
                            showSearchInput={false}
                            showFiltersButton={false}
                            showPagination={true}
                            showExport={false}
                            showViewMenu={false}
                            allowViewCustomization={false}
                            buttonsComponentProps={{
                                model,
                                actions,
                                onDelete,
                            }}
                            ButtonsComponent={APIKeysButtonsComponent}
                            emptyText="You currently do not have any API keys."
                        />
                        <Alert>{error}</Alert>
                    </>
                )}

                {apiEnabled && (
                    <>
                        {impersonatingUser !== undefined && (
                            <Alert bsStyle="warning" id="impersonating-msg">
                                API key generation is not available while impersonating.
                            </Alert>
                        )}
                        {!impersonatingUser && (
                            <KeyGenerator type="apikey" keyValue={apiKey} afterCreate={onApiKeyCreate} noun="API Key" />
                        )}
                    </>
                )}
                {!apiEnabled && (
                    <Alert bsStyle="warning" id="config-msg">
                        API key generation is currently not enabled on this server.
                    </Alert>
                )}
                {sessionEnabled && includeSessionKeys && (
                    <>
                        <div className="user-section-header top-spacing bottom-spacing">Session Keys</div>
                        {impersonatingUser !== undefined && (
                            <Alert bsStyle="warning" id="session-impersonating-msg">
                                Session key generation is not available while impersonating.
                            </Alert>
                        )}
                        {!impersonatingUser && (
                            <>
                                <p>
                                    A session key is tied to your current browser session, which means all API calls
                                    execute in your current context (e.g., your user, your authorizations, etc.). It
                                    also means the key will no longer represent a logged in user when the session
                                    expires, e.g., when you sign out via the browser or the server automatically times
                                    out your session. Since they expire quickly, session keys are most appropriate for
                                    deployments with regulatory compliance requirements.
                                </p>
                                <KeyGenerator
                                    type="session"
                                    keyValue={sessionKey}
                                    afterCreate={setSessionKey}
                                    noun="Session Key"
                                />
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

const APIKeysPanelWithQueryModels = withQueryModels(APIKeysPanelBody);

export const APIKeysPanel: FC<APIKeysPanelBodyProps> = props => {
    const { homeContainer, impersonatingUser } = useServerContext();
    const configs: QueryConfigMap = {};
    if (!impersonatingUser) {
        configs.model = {
            id: 'model',
            title: 'Current API Keys',
            schemaQuery: SCHEMAS.CORE_TABLES.USER_API_KEYS,
            includeTotalCount: true,
            containerPath: homeContainer,
        };
    }

    return <APIKeysPanelWithQueryModels autoLoad queryConfigs={configs} {...props} />;
};
