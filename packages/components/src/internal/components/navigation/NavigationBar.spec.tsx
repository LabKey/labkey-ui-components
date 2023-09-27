/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import { ReactWrapper } from 'enzyme';

import { TEST_USER_APP_ADMIN, TEST_USER_GUEST, TEST_USER_READER } from '../../userFixtures';
import { ServerNotifications } from '../notifications/ServerNotifications';

import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';
import { markAllNotificationsRead } from '../../../test/data/notificationData';
import { ServerNotificationModel } from '../notifications/model';

import { FindAndSearchDropdown } from '../search/FindAndSearchDropdown';
import { ProductNavigation } from '../productnavigation/ProductNavigation';

import { SearchBox } from '../search/SearchBox';

import { TEST_FOLDER_CONTAINER, TEST_PROJECT_CONTAINER } from '../../containerFixtures';

import { getSecurityTestAPIWrapper, SecurityAPIWrapper } from '../security/APIWrapper';
import { AppContext } from '../../AppContext';
import { getTestAPIWrapper } from '../../APIWrapper';
import { ServerContext } from '../base/ServerContext';

import { TEST_LKS_STARTER_MODULE_CONTEXT } from '../../productFixtures';

import { ProductMenuButton } from './ProductMenu';
import { UserMenuGroup } from './UserMenuGroup';
import { NavigationBar } from './NavigationBar';

describe('NavigationBar', () => {
    function getDefaultAppContext(overrides?: Partial<SecurityAPIWrapper>): Partial<AppContext> {
        return {
            api: getTestAPIWrapper(jest.fn, {
                security: getSecurityTestAPIWrapper(jest.fn, {
                    fetchContainers: jest.fn().mockResolvedValue([TEST_PROJECT_CONTAINER, TEST_FOLDER_CONTAINER]),
                    ...overrides,
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

    function validate(wrapper: ReactWrapper, compCounts: Record<string, number> = {}): void {
        expect(wrapper.find('.project-name')).toHaveLength(compCounts.ProjectName ?? 0);
        expect(wrapper.find(ProductMenuButton)).toHaveLength(compCounts.ProductMenu ?? 1);
        expect(wrapper.find(UserMenuGroup)).toHaveLength(compCounts.UserMenu ?? 0);
        expect(wrapper.find(SearchBox)).toHaveLength(compCounts.SearchBox ?? 0);
        expect(wrapper.find('.navbar__xs-search-icon')).toHaveLength(compCounts.SearchBox ?? 0);
        expect(wrapper.find(ServerNotifications)).toHaveLength(compCounts.ServerNotifications ?? 0);
        expect(wrapper.find(ProductNavigation)).toHaveLength(compCounts.ProductNavigation ?? 0);
        expect(wrapper.find(FindAndSearchDropdown)).toHaveLength(compCounts.FindAndSearchDropdown ?? 0);
    }

    const notificationsConfig = {
        maxRows: 1,
        markAllNotificationsRead,
        serverActivity: new ServerNotificationModel(),
        onViewAll: jest.fn(),
    };

    test('default props', async () => {
        const component = mountWithAppServerContext(
            <NavigationBar />,
            getDefaultAppContext(),
            getDefaultServerContext()
        );
        await waitForLifecycle(component);
        validate(component);
        component.unmount();
    });

    test('with search box', async () => {
        const component = mountWithAppServerContext(
            <NavigationBar showSearchBox />,
            getDefaultAppContext(),
            getDefaultServerContext()
        );
        await waitForLifecycle(component);
        validate(component, { SearchBox: 1 });
        component.unmount();
    });

    test('with findByIds', async () => {
        const component = mountWithAppServerContext(
            <NavigationBar onFindByIds={jest.fn()} showSearchBox />,
            getDefaultAppContext(),
            getDefaultServerContext()
        );
        await waitForLifecycle(component);
        validate(component, { FindAndSearchDropdown: 2, SearchBox: 1 });
        component.unmount();
    });

    test('without search but with findByIds', async () => {
        const component = mountWithAppServerContext(
            <NavigationBar onFindByIds={jest.fn()} showSearchBox={false} />,
            getDefaultAppContext(),
            getDefaultServerContext()
        );
        await waitForLifecycle(component);
        validate(component, { FindAndSearchDropdown: 0, SearchBox: 0 });
        component.unmount();
    });

    test('with notifications no user', async () => {
        const component = mountWithAppServerContext(
            <NavigationBar notificationsConfig={notificationsConfig} />,
            getDefaultAppContext(),
            getDefaultServerContext()
        );
        await waitForLifecycle(component);
        validate(component, { ServerNotifications: 0 });
        component.unmount();
    });

    test('with notifications, guest user', async () => {
        const component = mountWithAppServerContext(
            <NavigationBar user={TEST_USER_GUEST} notificationsConfig={notificationsConfig} />,
            getDefaultAppContext(),
            getDefaultServerContext()
        );
        await waitForLifecycle(component);
        validate(component, { UserMenu: 1, ServerNotifications: 0 });
        component.unmount();
    });

    test('with notifications, non-guest user', async () => {
        const component = mountWithAppServerContext(
            <NavigationBar user={TEST_USER_READER} notificationsConfig={notificationsConfig} />,
            getDefaultAppContext(),
            getDefaultServerContext()
        );
        await waitForLifecycle(component);
        validate(component, { UserMenu: 1, ServerNotifications: 1 });
        component.unmount();
    });

    test('show ProductNavigation for hasPremiumModule, non-admin', async () => {
        const component = mountWithAppServerContext(<NavigationBar user={TEST_USER_READER} />, getDefaultAppContext(), {
            container: TEST_PROJECT_CONTAINER,
            moduleContext: {
                ...TEST_LKS_STARTER_MODULE_CONTEXT,
                api: {
                    moduleNames: ['samplemanagement', 'premium'],
                    applicationMenuDisplayMode: 'ALWAYS',
                },
            },
        });
        await waitForLifecycle(component);
        validate(component, { UserMenu: 1, ProductNavigation: 1 });
        component.unmount();
    });

    test('hide ProductNavigation for non-admin', async () => {
        const component = mountWithAppServerContext(<NavigationBar user={TEST_USER_READER} />, getDefaultAppContext(), {
            container: TEST_PROJECT_CONTAINER,
            moduleContext: {
                ...TEST_LKS_STARTER_MODULE_CONTEXT,
                api: {
                    moduleNames: ['samplemanagement', 'premium'],
                    applicationMenuDisplayMode: 'ADMIN',
                },
            },
        });
        await waitForLifecycle(component);
        validate(component, { UserMenu: 1, ProductNavigation: 0 });
        component.unmount();
    });

    test('show ProductNavigation for hasPremiumModule, admin always', async () => {
        const component = mountWithAppServerContext(
            <NavigationBar showFolderMenu={false} user={TEST_USER_APP_ADMIN} />,
            getDefaultAppContext(),
            {
                container: TEST_PROJECT_CONTAINER,
                moduleContext: {
                    ...TEST_LKS_STARTER_MODULE_CONTEXT,
                    api: {
                        moduleNames: ['samplemanagement', 'premium'],
                        applicationMenuDisplayMode: 'ALWAYS',
                    },
                },
            }
        );
        await waitForLifecycle(component);
        validate(component, { UserMenu: 1, ProductNavigation: 1 });
        expect(component.find(ProductMenuButton).prop('showFolderMenu')).toBeFalsy();
        component.unmount();
    });

    test('show ProductNavigation for hasPremiumModule, admin only', async () => {
        const component = mountWithAppServerContext(
            <NavigationBar showFolderMenu user={TEST_USER_APP_ADMIN} />,
            getDefaultAppContext(),
            {
                container: TEST_PROJECT_CONTAINER,
                moduleContext: {
                    ...TEST_LKS_STARTER_MODULE_CONTEXT,
                    api: {
                        moduleNames: ['samplemanagement', 'premium'],
                        applicationMenuDisplayMode: 'ADMIN',
                    },
                },
            }
        );
        await waitForLifecycle(component);
        validate(component, { UserMenu: 1, ProductNavigation: 1 });
        expect(component.find(ProductMenuButton).prop('showFolderMenu')).toBeTruthy();
        component.unmount();
    });
});
