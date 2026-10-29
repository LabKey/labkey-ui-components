/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC } from 'react';

import { screen, waitFor } from '@testing-library/dom';
import { userEvent } from '@testing-library/user-event';
import * as rrd from 'react-router';

import { TEST_USER_APP_ADMIN, TEST_USER_GUEST, TEST_USER_READER } from '../../userFixtures';

import { markAllNotificationsRead } from '../../../test/data/notificationData';
import { ServerNotificationModel } from '../notifications/model';

import { TEST_FOLDER_CONTAINER, TEST_PROJECT_CONTAINER } from '../../containerFixtures';

import { getSecurityTestAPIWrapper, SecurityAPIWrapper } from '../security/APIWrapper';
import { AppContext } from '../../AppContext';
import { getTestAPIWrapper } from '../../APIWrapper';
import { ServerContext } from '../base/ServerContext';

import { TEST_LKS_STARTER_MODULE_CONTEXT, TEST_LKSM_STARTER_MODULE_CONTEXT } from '../../productFixtures';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { NavigationBar } from './NavigationBar';
import { getNavigationTestAPIWrapper } from './NavigationAPIWrapper';
import { MenuSectionModel } from './model';
import { AssistantService, useAssistantService } from '../mcp/AssistantService';

const setPathname = (pathname: string): void =>
    (rrd as unknown as { __setLocation: (location: Partial<Location>) => void }).__setLocation({ pathname });

describe('NavigationBar', () => {
    function getDefaultAppContext(overrides?: Partial<SecurityAPIWrapper>): Partial<AppContext> {
        return {
            api: getTestAPIWrapper(jest.fn, {
                security: getSecurityTestAPIWrapper(jest.fn, {
                    fetchContainers: jest.fn().mockResolvedValue([TEST_PROJECT_CONTAINER, TEST_FOLDER_CONTAINER]),
                    ...overrides,
                }),
                navigation: getNavigationTestAPIWrapper(jest.fn, {
                    loadUserMenu: jest.fn().mockResolvedValue(new MenuSectionModel()),
                }),
            }),
        };
    }

    function getDefaultServerContext(): Partial<ServerContext> {
        return {
            container: TEST_PROJECT_CONTAINER,
            moduleContext: { ...TEST_LKS_STARTER_MODULE_CONTEXT },
        };
    }

    function validate(compCounts: Record<string, number> = {}): void {
        expect(document.querySelectorAll('.project-name')).toHaveLength(compCounts.ProjectName ?? 0);
        expect(document.querySelectorAll('.product-menu')).toHaveLength(compCounts.ProductMenu ?? 1);
        expect(document.querySelectorAll('.user-dropdown')).toHaveLength(compCounts.UserMenu ?? 0);
        expect(document.querySelectorAll('.navbar__search-form')).toHaveLength(1);
        expect(document.querySelectorAll('.navbar__xs-search-icon')).toHaveLength(compCounts.XsSearchIcon ?? 1);
        expect(document.querySelectorAll('.server-notifications')).toHaveLength(compCounts.ServerNotifications ?? 0);
        expect(document.querySelectorAll('.fa-th-large')).toHaveLength(compCounts.ProductNavigation ?? 0);
        expect(document.querySelectorAll('.navbar__find-and-search-button')).toHaveLength(
            compCounts.FindAndSearchDropdown ?? 0
        );
    }

    const notificationsConfig = {
        maxRows: 1,
        markAllNotificationsRead,
        serverActivity: new ServerNotificationModel(),
        onRead: jest.fn(),
    };

    test('default props', async () => {
        renderWithAppContext(<NavigationBar />, {
            appContext: getDefaultAppContext(),
            serverContext: getDefaultServerContext(),
        });
        await waitFor(() => {
            expect(document.querySelectorAll('.app-navigation')).toHaveLength(1);
        });

        validate();
    });

    test('with findByIds', async () => {
        renderWithAppContext(<NavigationBar onFindByIds={jest.fn()} />, {
            appContext: getDefaultAppContext(),
            serverContext: getDefaultServerContext(),
        });
        await waitFor(() => {
            expect(document.querySelectorAll('.app-navigation')).toHaveLength(1);
        });
        validate({ FindAndSearchDropdown: 1, SearchBox: 1, XsSearchIcon: 0 });
    });

    test('with notifications no user', async () => {
        renderWithAppContext(<NavigationBar notificationsConfig={notificationsConfig} />, {
            appContext: getDefaultAppContext(),
            serverContext: getDefaultServerContext(),
        });
        await waitFor(() => {
            expect(document.querySelectorAll('.app-navigation')).toHaveLength(1);
        });
        validate({ ServerNotifications: 0 });
    });

    test('with notifications, guest user', async () => {
        renderWithAppContext(<NavigationBar notificationsConfig={notificationsConfig} user={TEST_USER_GUEST} />, {
            appContext: getDefaultAppContext(),
            serverContext: getDefaultServerContext(),
        });
        await waitFor(() => {
            expect(document.querySelectorAll('.app-navigation')).toHaveLength(1);
        });
        validate({ UserMenu: 1, ServerNotifications: 0 });
    });

    test('with notifications, non-guest user', async () => {
        renderWithAppContext(<NavigationBar notificationsConfig={notificationsConfig} user={TEST_USER_READER} />, {
            appContext: getDefaultAppContext(),
            serverContext: getDefaultServerContext(),
        });
        await waitFor(() => {
            expect(document.querySelectorAll('.app-navigation')).toHaveLength(1);
        });
        validate({ UserMenu: 1, ServerNotifications: 1 });
    });

    test('show ProductNavigation for hasPremiumModule, non-admin', async () => {
        renderWithAppContext(<NavigationBar user={TEST_USER_READER} />, {
            appContext: getDefaultAppContext(),
            serverContext: {
                container: TEST_PROJECT_CONTAINER,
                moduleContext: {
                    ...TEST_LKS_STARTER_MODULE_CONTEXT,
                    api: {
                        moduleNames: ['samplemanagement', 'premium'],
                        applicationMenuDisplayMode: 'ALWAYS',
                    },
                },
            },
        });
        await waitFor(() => {
            expect(document.querySelectorAll('.app-navigation')).toHaveLength(1);
        });
        validate({ UserMenu: 1, ProductNavigation: 1 });
    });

    test('hide ProductNavigation for non-admin', async () => {
        renderWithAppContext(<NavigationBar user={TEST_USER_READER} />, {
            appContext: getDefaultAppContext(),
            serverContext: {
                container: TEST_PROJECT_CONTAINER,
                moduleContext: {
                    ...TEST_LKS_STARTER_MODULE_CONTEXT,
                    api: {
                        moduleNames: ['samplemanagement', 'premium'],
                        applicationMenuDisplayMode: 'ADMIN',
                    },
                },
            },
        });
        await waitFor(() => {
            expect(document.querySelectorAll('.app-navigation')).toHaveLength(1);
        });
        validate({ UserMenu: 1, ProductNavigation: 0 });
    });

    test('show ProductNavigation for hasPremiumModule, admin always', async () => {
        renderWithAppContext(<NavigationBar showFolderMenu={false} showNavMenu user={TEST_USER_APP_ADMIN} />, {
            appContext: getDefaultAppContext(),
            serverContext: {
                container: TEST_PROJECT_CONTAINER,
                moduleContext: {
                    ...TEST_LKS_STARTER_MODULE_CONTEXT,
                    api: {
                        moduleNames: ['samplemanagement', 'premium'],
                        applicationMenuDisplayMode: 'ALWAYS',
                    },
                },
            },
        });
        await waitFor(() => {
            expect(document.querySelectorAll('.app-navigation')).toHaveLength(1);
        });
        validate({ UserMenu: 1, ProductNavigation: 1 });
        expect(document.querySelectorAll('.col-folders')).toHaveLength(0);
    });

    test('show ProductNavigation for hasPremiumModule, admin only', async () => {
        renderWithAppContext(<NavigationBar showFolderMenu showNavMenu user={TEST_USER_APP_ADMIN} />, {
            appContext: getDefaultAppContext(),
            serverContext: {
                container: TEST_PROJECT_CONTAINER,
                moduleContext: {
                    ...TEST_LKS_STARTER_MODULE_CONTEXT,
                    api: {
                        moduleNames: ['samplemanagement', 'premium'],
                        applicationMenuDisplayMode: 'ADMIN',
                    },
                },
            },
        });
        await waitFor(() => {
            expect(document.querySelectorAll('.app-navigation')).toHaveLength(1);
        });
        validate({ UserMenu: 1, ProductNavigation: 1 });
        expect(document.querySelectorAll('.col-folders')).toHaveLength(0);
    });

    test('applies server theme to header', async () => {
        renderWithAppContext(<NavigationBar />, {
            appContext: getDefaultAppContext(),
            serverContext: { ...getDefaultServerContext(), extThemeName_42: 'harvest' },
        });
        await waitFor(() => {
            expect(document.querySelectorAll('.app-navigation')).toHaveLength(1);
        });
        expect(document.querySelectorAll('.app-navigation.app-navigation--harvest')).toHaveLength(1);
    });

    test('no theme class without server theme', async () => {
        renderWithAppContext(<NavigationBar />, {
            appContext: getDefaultAppContext(),
            serverContext: getDefaultServerContext(),
        });
        await waitFor(() => {
            expect(document.querySelectorAll('.app-navigation')).toHaveLength(1);
        });
        expect(document.querySelector('.app-navigation').className).toBe('app-navigation');
    });

    describe('admin pages', () => {
        afterEach(() => {
            setPathname('');
        });

        test.each([
            ['with findByIds', jest.fn()],
            ['without findByIds', undefined],
        ])('hide search and notifications, %s', async (_, onFindByIds) => {
            setPathname('/admin/settings');
            renderWithAppContext(
                <NavigationBar
                    notificationsConfig={notificationsConfig}
                    onFindByIds={onFindByIds}
                    user={TEST_USER_READER}
                />,
                {
                    appContext: getDefaultAppContext(),
                    serverContext: getDefaultServerContext(),
                }
            );
            await waitFor(() => {
                expect(document.querySelectorAll('.app-navigation')).toHaveLength(1);
            });
            expect(document.querySelector('.app-navigation')).toHaveClass('app-navigation--admin');
            expect(document.querySelectorAll('.navbar__search-form')).toHaveLength(0);
            expect(document.querySelectorAll('.navbar__xs-search-icon')).toHaveLength(0);
            expect(screen.queryByRole('button', { name: 'Find and Search Menu' })).not.toBeInTheDocument();
            expect(document.querySelectorAll('.server-notifications')).toHaveLength(0);
            expect(document.querySelectorAll('.user-dropdown')).toHaveLength(1);
        });
    });

    describe('LabKey Assistant', () => {
        const ShowState: FC = () => <div>{useAssistantService().show ? 'assistant open' : 'assistant closed'}</div>;

        function renderWithAssistant(mcpReady: boolean, labKeyAssistantEnabled: boolean): void {
            renderWithAppContext(
                <AssistantService>
                    <NavigationBar />
                    <ShowState />
                </AssistantService>,
                {
                    appContext: getDefaultAppContext(),
                    serverContext: {
                        container: TEST_PROJECT_CONTAINER,
                        mcpReady,
                        moduleContext: {
                            ...TEST_LKSM_STARTER_MODULE_CONTEXT,
                            samplemanagement: {
                                ...TEST_LKSM_STARTER_MODULE_CONTEXT.samplemanagement,
                                labKeyAssistantEnabled,
                            },
                        },
                    },
                }
            );
        }

        test('the assistant button opens the assistant', async () => {
            renderWithAssistant(true, true);
            await waitFor(() => {
                expect(document.querySelectorAll('.app-navigation')).toHaveLength(1);
            });
            expect(screen.getByText('assistant closed')).toBeInTheDocument();

            await userEvent.click(screen.getByRole('button', { name: 'LabKey Assistant' }));

            expect(screen.getByText('assistant open')).toBeInTheDocument();
        });

        test('no assistant button when MCP is not ready', async () => {
            renderWithAssistant(false, true);
            await waitFor(() => {
                expect(document.querySelectorAll('.app-navigation')).toHaveLength(1);
            });
            expect(document.querySelectorAll('.navbar-assistant-button')).toHaveLength(0);
        });

        test('no assistant button when the assistant is not enabled', async () => {
            renderWithAssistant(true, false);
            await waitFor(() => {
                expect(document.querySelectorAll('.app-navigation')).toHaveLength(1);
            });
            expect(document.querySelectorAll('.navbar-assistant-button')).toHaveLength(0);
        });
    });
});
