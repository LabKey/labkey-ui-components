import React from 'react';
import { act } from 'react-dom/test-utils';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';
import { APIKeysPanel } from './ProfilePage';
import { TEST_USER_APP_ADMIN, TEST_USER_EDITOR, TEST_USER_SITE_ADMIN } from '../../userFixtures';
import { TEST_PROJECT_CONTAINER } from '../../containerFixtures';
import { ServerContext } from '../base/ServerContext';
import { TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT, TEST_LKSM_STARTER_MODULE_CONTEXT } from '../../productFixtures';

describe("APIKeysPanel", () => {
    function defaultServerContext(overrides?: Partial<ServerContext>): Partial<ServerContext> {
        return {
            container: TEST_PROJECT_CONTAINER,
            user: TEST_USER_EDITOR,
            ...overrides,
        };
    }

    test("SM Starter, not enabled", async () => {
        await act(async () => {
            const { container } = renderWithAppContext(<APIKeysPanel/>, {
                serverContext: defaultServerContext({
                    moduleContext: {
                        ...TEST_LKSM_STARTER_MODULE_CONTEXT,
                    }
                }),
            });
            expect(container.firstChild).toBeNull();
        })
    });

    test("SM Starter, enabled", async () => {
        await act(async () => {
            const { container } = renderWithAppContext(<APIKeysPanel/>, {
                serverContext: defaultServerContext({
                    moduleContext: {
                        ...TEST_LKSM_STARTER_MODULE_CONTEXT,
                        api: { allowApiKeys: true },
                    }
                }),
            });
            expect(container.firstChild).toBeNull();
        });
    });

    function validate(isAdmin: boolean , isEnabled: boolean, isImpersonating: boolean = false)
    {
        const adminMsg = document.querySelector('#admin-msg');
        if (isAdmin) {
            expect(adminMsg).not.toBeNull();
        } else {
            expect(adminMsg).toBeNull();
        }

        const configMsg = document.querySelector('#config-msg');
        const impersonatingMsg = document.querySelector('#impersonating-msg');
        if (isEnabled) {
            expect(configMsg.textContent).toContain("API keys are currently configured");
            if (isImpersonating) {
                expect(impersonatingMsg.textContent).toBe("API Key generation is not available while impersonating.");
                expect(document.querySelector("button")).toBeNull();
            } else {
                expect(impersonatingMsg).toBeNull();
                expect(document.querySelectorAll("button")).toHaveLength(2)
            }
        }
        else {
            expect(configMsg.textContent).toBe("API keys are currently not enabled on this server.");
            expect(impersonatingMsg).toBeNull();
            expect(document.querySelector("button")).toBeNull();
        }
    }

    test("SM Pro, non-admin, not enabled", async () => {
        await act(async () => {
           renderWithAppContext(<APIKeysPanel/>, {
                serverContext: defaultServerContext({
                    moduleContext: {
                        ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
                    }
                }),
            });
        });
        validate(false, false);
    });

    test("SM Pro, app admin, not enabled", async () => {
        await act(async () => {
            renderWithAppContext(<APIKeysPanel/>, {
                serverContext: defaultServerContext({
                    user: TEST_USER_APP_ADMIN,
                    moduleContext: {
                        ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
                    }
                }),
            });
        });
        validate(false, false);
    });

    test('SM Pro, non-admin, enabled, not impersonating', async () => {
        await act(async () => {
            renderWithAppContext(<APIKeysPanel/>, {
                serverContext: defaultServerContext({
                    moduleContext: {
                        ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
                        api: { allowApiKeys: true },
                    }
                }),
            });
        });
        validate(false, true);
    });

    test('SM Pro, non-admin, enabled, impersonating', async () => {
        await act(async () => {
            renderWithAppContext(<APIKeysPanel/>, {
                serverContext: defaultServerContext({
                    impersonatingUser: TEST_USER_APP_ADMIN,
                    moduleContext: {
                        ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
                        api: { allowApiKeys: true },
                    }
                }),
            });
        });
        validate(false, true, true);
    });

    test("SM Pro, site admin, not enabled", async () => {
        await act(async () => {
            renderWithAppContext(<APIKeysPanel/>, {
                serverContext: defaultServerContext({
                    user: TEST_USER_SITE_ADMIN,
                    moduleContext: {
                        ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
                    }
                }),
            });
        });
        validate(true, false);
    });

    test('SM Pro, site admin, enabled', async () => {
        await act(async () => {
            renderWithAppContext(<APIKeysPanel/>, {
                serverContext: defaultServerContext({
                    user: TEST_USER_SITE_ADMIN,
                    moduleContext: {
                        ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
                        api: { allowApiKeys: true },
                    }
                }),
            });
        });
        validate(true, true);
    });

    test('SM Pro, site admin, enabled, impersonating', async () => {
        await act(async () => {
            renderWithAppContext(<APIKeysPanel/>, {
                serverContext: defaultServerContext({
                    impersonatingUser: TEST_USER_APP_ADMIN,
                    user: TEST_USER_SITE_ADMIN,
                    moduleContext: {
                        ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
                        api: { allowApiKeys: true },
                    }
                }),
            });
        });
        validate(true, true, true);
    });
});
