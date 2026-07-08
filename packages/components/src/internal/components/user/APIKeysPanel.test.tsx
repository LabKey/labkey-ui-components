/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';

import { waitFor } from '@testing-library/dom';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { TEST_USER_APP_ADMIN, TEST_USER_EDITOR, TEST_USER_SITE_ADMIN } from '../../userFixtures';
import { TEST_PROJECT_CONTAINER } from '../../containerFixtures';
import { ServerContext } from '../base/ServerContext';
import {
    TEST_LKS_STARTER_MODULE_CONTEXT,
    TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
    TEST_LKSM_STARTER_MODULE_CONTEXT,
} from '../../productFixtures';

import { createMockGetQueryDetails, createMockSelectRowsDeprecatedResponse } from '../../../test/MockUtils';
import { LABKEY_VIS } from '../../constants';

import { APIKeysPanel, KeyGenerator, KeyGeneratorModal } from './APIKeysPanel';

LABKEY_VIS = {
    GenericChartHelper: {
        TRENDLINE_OPTIONS: {},
    },
};

jest.mock('../../query/api', () => ({
    ...jest.requireActual('../../query/api'),
    getQueryDetails: () => createMockGetQueryDetails(),
    selectRowsDeprecated: () => createMockSelectRowsDeprecatedResponse(),
}));

beforeAll(() => {
    global.console.error = jest.fn();
});

describe('KeyGenerator', () => {
    test('text display', () => {
        const { container } = renderWithAppContext(
            <KeyGenerator type="apikey" afterCreate={jest.fn()} noun="Goodwill" />
        );
        const buttons = container.querySelectorAll('button');
        expect(buttons).toHaveLength(1);
        expect(buttons.item(0).textContent).toBe('Generate Goodwill');
    });
});

describe('KeyGeneratorModal', () => {
    test('sessionKey', async () => {
        const keyValue = 'session_key';
        const apiKeyFn = jest.fn().mockResolvedValue(keyValue);
        renderWithAppContext(
            <KeyGeneratorModal type="session" afterCreate={jest.fn()} noun="Session" onClose={jest.fn()} />,
            {
                appContext: {
                    api: {
                        security: {
                            createApiKey: apiKeyFn,
                        },
                    },
                },
            }
        );
        await waitFor(() => {
            expect(document.querySelector('input[name="session_token"]').getAttribute('value')).toBe(keyValue);
        });
        expect(apiKeyFn).toHaveBeenCalledTimes(1);
    });

    test('apiKey shows description', async () => {
        const apiKeyFn = jest.fn();
        renderWithAppContext(
            <KeyGeneratorModal type="apikey" afterCreate={jest.fn()} noun="Session" onClose={jest.fn()} />,
            {
                appContext: {
                    api: {
                        security: {
                            createApiKey: apiKeyFn,
                            getApiKeyRoles: jest.fn().mockResolvedValue([]),
                        },
                    },
                },
            }
        );
        await waitFor(() => {
            expect(document.querySelector('#keyDescription')).not.toBeNull();
        });
        expect(apiKeyFn).not.toHaveBeenCalled();
    });
});

describe('APIKeysPanel', () => {
    beforeEach(() => {
        window.history.pushState({}, 'Test Title', '/');
    });

    function defaultServerContext(overrides?: Partial<ServerContext>): Partial<ServerContext> {
        return {
            container: TEST_PROJECT_CONTAINER,
            user: TEST_USER_EDITOR,
            ...overrides,
        };
    }

    function waitForGrid(): Promise<void> {
        return waitFor(() => expect(document.querySelector('.fa-trash')).toBeInTheDocument());
    }

    function waitForPanel(): Promise<void> {
        return waitFor(() => expect(document.querySelector('.api-keys-panel')).toBeInTheDocument());
    }

    test('SM Starter, not enabled', async () => {
        window.history.pushState({}, 'Test Title', '/samplemanager-app.view#'); // isApp()

        const { container } = renderWithAppContext(<APIKeysPanel />, {
            serverContext: defaultServerContext({
                moduleContext: {
                    ...TEST_LKSM_STARTER_MODULE_CONTEXT,
                },
            }),
        });
        expect(container.firstChild).toBeNull();
    });

    test('SM Starter, enabled', async () => {
        window.history.pushState({}, 'Test Title', '/samplemanager-app.view#'); // isApp()

        const { container } = renderWithAppContext(<APIKeysPanel />, {
            serverContext: defaultServerContext({
                moduleContext: {
                    ...TEST_LKSM_STARTER_MODULE_CONTEXT,
                    api: { allowApiKeys: true },
                },
            }),
        });
        expect(container.firstChild).toBeNull();
    });

    function validate(
        isAdmin: boolean,
        apiKeysEnabled: boolean,
        isImpersonating: boolean = false,
        sessionKeysEnabled: boolean = false
    ): void {
        const adminMsg = document.querySelector('#admin-msg');
        if (isAdmin) {
            expect(adminMsg).not.toBeNull();
        } else {
            expect(adminMsg).toBeNull();
        }
        let expectedButtonCount = 0;
        if (!isImpersonating) {
            expectedButtonCount += 1;
            if (apiKeysEnabled) expectedButtonCount += 1;
            if (sessionKeysEnabled) expectedButtonCount += 1;
        }
        if (expectedButtonCount === 0) expect(document.querySelector('button')).toBeNull();
        else expect(document.querySelectorAll('button')).toHaveLength(expectedButtonCount);

        const configMsg = document.querySelector('#config-msg');
        const impersonatingMsg = document.querySelector('#impersonating-msg');

        if (isImpersonating && apiKeysEnabled && sessionKeysEnabled) {
            expect(impersonatingMsg).toHaveTextContent(
                'API and session key generation is not available while impersonating'
            );
        } else if (isImpersonating && apiKeysEnabled) {
            expect(impersonatingMsg).toHaveTextContent('API key generation is not available while impersonating');
        } else if (isImpersonating && sessionKeysEnabled) {
            expect(impersonatingMsg).toHaveTextContent('Session key generation is not available while impersonating');
        }

        if (apiKeysEnabled) {
            expect(configMsg.textContent).toContain('API keys are currently configured');
        } else {
            expect(configMsg).toHaveTextContent('API key generation is currently not enabled on this server.');
        }
    }

    test('SM Pro, non-admin, not enabled', async () => {
        renderWithAppContext(<APIKeysPanel />, {
            serverContext: defaultServerContext({
                moduleContext: {
                    ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
                },
            }),
        });
        await waitForGrid();
        validate(false, false);
    });

    test('SM Pro, app admin, not enabled', async () => {
        renderWithAppContext(<APIKeysPanel />, {
            serverContext: defaultServerContext({
                user: TEST_USER_APP_ADMIN,
                moduleContext: {
                    ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
                },
            }),
        });
        await waitForGrid();
        validate(false, false);
    });

    test('SM Pro, non-admin, enabled, not impersonating', async () => {
        renderWithAppContext(<APIKeysPanel />, {
            serverContext: defaultServerContext({
                moduleContext: {
                    ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
                    api: { allowApiKeys: true, allowSessionKeys: false },
                },
            }),
        });
        await waitForGrid();
        validate(false, true);
    });

    test('SM Pro, non-admin, enabled, impersonating', async () => {
        renderWithAppContext(<APIKeysPanel />, {
            serverContext: defaultServerContext({
                impersonatingUser: TEST_USER_EDITOR,
                moduleContext: {
                    ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
                    api: { allowApiKeys: true },
                },
            }),
        });
        await waitForPanel();
        validate(false, true, true, false);
    });

    test('SM Pro, site admin, not enabled', async () => {
        renderWithAppContext(<APIKeysPanel />, {
            serverContext: defaultServerContext({
                user: TEST_USER_SITE_ADMIN,
                moduleContext: {
                    ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
                },
            }),
        });
        await waitForGrid();
        validate(true, false);
    });

    test('SM Pro, site admin, enabled', async () => {
        renderWithAppContext(<APIKeysPanel />, {
            serverContext: defaultServerContext({
                user: TEST_USER_SITE_ADMIN,
                moduleContext: {
                    ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
                    api: { allowApiKeys: true },
                },
            }),
        });
        await waitForGrid();
        validate(true, true);
    });

    test('SM Pro, site admin, enabled, impersonating', async () => {
        renderWithAppContext(<APIKeysPanel />, {
            serverContext: defaultServerContext({
                impersonatingUser: TEST_USER_APP_ADMIN,
                user: TEST_USER_SITE_ADMIN,
                moduleContext: {
                    ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
                    api: { allowApiKeys: true },
                },
            }),
        });
        await waitForPanel();
        validate(true, true, true, false);
    });

    test('Include session keys, session enabled, not impersonating', async () => {
        renderWithAppContext(<APIKeysPanel includeSessionKeys={true} />, {
            serverContext: defaultServerContext({
                user: TEST_USER_EDITOR,
                moduleContext: {
                    ...TEST_LKS_STARTER_MODULE_CONTEXT,
                    api: { allowApiKeys: false, allowSessionKeys: true },
                },
            }),
        });
        await waitForGrid();
        validate(false, false, false, true);
    });

    test('Include session keys, both enabled, not impersonating', async () => {
        renderWithAppContext(<APIKeysPanel includeSessionKeys={true} />, {
            serverContext: defaultServerContext({
                user: TEST_USER_EDITOR,
                moduleContext: {
                    ...TEST_LKS_STARTER_MODULE_CONTEXT,
                    api: { allowApiKeys: true, allowSessionKeys: true },
                },
            }),
        });
        await waitForGrid();
        validate(false, true, false, true);
    });

    test('Include session keys, session enabled, impersonating', async () => {
        renderWithAppContext(<APIKeysPanel includeSessionKeys={true} />, {
            serverContext: defaultServerContext({
                impersonatingUser: TEST_USER_EDITOR,
                user: TEST_USER_APP_ADMIN,
                moduleContext: {
                    ...TEST_LKS_STARTER_MODULE_CONTEXT,
                    api: { allowApiKeys: false, allowSessionKeys: true },
                },
            }),
        });
        await waitForPanel();
        validate(false, false, true, true);
    });

    test('Include session keys, both enabled, impersonating', async () => {
        renderWithAppContext(<APIKeysPanel includeSessionKeys={true} />, {
            serverContext: defaultServerContext({
                impersonatingUser: TEST_USER_EDITOR,
                user: TEST_USER_APP_ADMIN,
                moduleContext: {
                    ...TEST_LKS_STARTER_MODULE_CONTEXT,
                    api: { allowApiKeys: true, allowSessionKeys: true },
                },
            }),
        });
        await waitForPanel();
        validate(false, true, true, true);
    });
});
