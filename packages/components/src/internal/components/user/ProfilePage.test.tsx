import React from 'react';
import { act } from 'react-dom/test-utils';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';
import { APIKeysPanel, KeyGenerator } from './ProfilePage';
import { TEST_USER_APP_ADMIN, TEST_USER_EDITOR, TEST_USER_SITE_ADMIN } from '../../userFixtures';
import { TEST_PROJECT_CONTAINER } from '../../containerFixtures';
import { ServerContext } from '../base/ServerContext';
import {
    TEST_LKS_STARTER_MODULE_CONTEXT,
    TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
    TEST_LKSM_STARTER_MODULE_CONTEXT
} from '../../productFixtures';

beforeAll(() => {
    global.console.error = jest.fn();
});

describe("KeyGenerator", () => {
    test("without key value", () => {
        const { container } = renderWithAppContext(<KeyGenerator type={"session"} afterCreate={jest.fn()} noun={"Keys"}/>);
        const buttons = container.querySelectorAll("button");
        expect(buttons).toHaveLength(2);
        expect(buttons.item(0).textContent).toBe("Generate Keys");
        expect(buttons.item(1).name).toBe("copy_session_token");
        expect(container.querySelector("#copy_advice")).toBeNull();
        expect(container.querySelector(".alert")).toBeNull();
    });

    test("with key value", () => {
        const { container } = renderWithAppContext(<KeyGenerator type={"apikey"} afterCreate={jest.fn()} noun={"Goodwill"} keyValue={"mikey"}/>);
        const buttons = container.querySelectorAll("button");
        expect(buttons).toHaveLength(2);
        expect(buttons.item(0).textContent).toBe("Generate Goodwill");
        expect(buttons.item(1).name).toBe("copy_apikey_token");
        expect(container.querySelector("input").value).toBe("mikey")
        expect(container.querySelector("#copy_advice")).not.toBeNull();
        expect(container.querySelector(".alert")).toBeNull();
    });
});

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

    function validate(isAdmin: boolean, apiKeysEnabled: boolean, isImpersonating: boolean = false, sessionKeysEnabled: boolean = false) {
        const adminMsg = document.querySelector('#admin-msg');
        if (isAdmin) {
            expect(adminMsg).not.toBeNull();
        } else {
            expect(adminMsg).toBeNull();
        }
        let expectedButtonCount = 0;
        if (!isImpersonating){
            if (apiKeysEnabled) expectedButtonCount += 2;
            if (sessionKeysEnabled) expectedButtonCount += 2;
        }
        if (expectedButtonCount == 0)
            expect(document.querySelector("button")).toBeNull();
        else
            expect(document.querySelectorAll("button")).toHaveLength(expectedButtonCount);

        const configMsg = document.querySelector('#config-msg');
        const impersonatingMsg = document.querySelector('#impersonating-msg');
        if (apiKeysEnabled) {
            expect(configMsg.textContent).toContain("API keys are currently configured");
            if (isImpersonating) {
                expect(impersonatingMsg.textContent).toBe("API key generation is not available while impersonating.");
                expect(document.querySelector("button")).toBeNull();
            } else {
                expect(impersonatingMsg).toBeNull();
            }
        } else {
            expect(configMsg.textContent).toBe("API key generation is currently not enabled on this server.");
            expect(impersonatingMsg).toBeNull();
        }

        const sessionImpersonatingMsg = document.querySelector("#session-impersonating-msg");
        if (sessionKeysEnabled) {
            if (isImpersonating) {
                expect(sessionImpersonatingMsg.textContent).toBe("Session key generation is not available while impersonating.");
            } else {
                expect(sessionImpersonatingMsg).toBeNull();
            }
        } else {
            expect(sessionImpersonatingMsg).toBeNull();
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
                        api: { allowApiKeys: true, allowSessionKeys: false },
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
                    impersonatingUser: TEST_USER_EDITOR,
                    moduleContext: {
                        ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
                        api: { allowApiKeys: true },
                    }
                }),
            });
        });
        validate(false, true, true, false);
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
        validate(true, true, true, false);
    });

    test("Include session keys, session enabled, not impersonating", async () => {
        await act(async () => {
            renderWithAppContext(<APIKeysPanel includeSessionKeys={true} />, {
                serverContext: defaultServerContext({
                    user: TEST_USER_EDITOR,
                    moduleContext: {
                        ...TEST_LKS_STARTER_MODULE_CONTEXT,
                        api: { allowApiKeys: false, allowSessionKeys: true },
                    }
                }),
            });
        });
        validate(false, false, false, true);
    });

    test("Include session keys, both enabled, not impersonating", async () => {
        await act(async () => {
            renderWithAppContext(<APIKeysPanel includeSessionKeys={true} />, {
                serverContext: defaultServerContext({
                    user: TEST_USER_EDITOR,
                    moduleContext: {
                        ...TEST_LKS_STARTER_MODULE_CONTEXT,
                        api: { allowApiKeys: true, allowSessionKeys: true },
                    }
                }),
            });
        });
        validate(false, true, false, true);
    });


    test("Include session keys, session enabled, impersonating", async () => {
        await act(async () => {
            renderWithAppContext(<APIKeysPanel includeSessionKeys={true} />, {
                serverContext: defaultServerContext({
                    impersonatingUser: TEST_USER_EDITOR,
                    user: TEST_USER_APP_ADMIN,
                    moduleContext: {
                        ...TEST_LKS_STARTER_MODULE_CONTEXT,
                        api: { allowApiKeys: false, allowSessionKeys: true },
                    }
                }),
            });
        });
        validate(false, false, true, true);
    });

    test("Include session keys, both enabled, impersonating", async () => {
        await act(async () => {
            renderWithAppContext(<APIKeysPanel includeSessionKeys={true} />, {
                serverContext: defaultServerContext({
                    impersonatingUser: TEST_USER_EDITOR,
                    user: TEST_USER_APP_ADMIN,
                    moduleContext: {
                        ...TEST_LKS_STARTER_MODULE_CONTEXT,
                        api: { allowApiKeys: true, allowSessionKeys: true },
                    }
                }),
            });
        });
        validate(false, true, true, true);
    });
});
