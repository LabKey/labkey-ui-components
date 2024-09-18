import React, { ReactElement } from 'react';

import { getTestAPIWrapper } from '../../APIWrapper';
import { TEST_FOLDER_CONTAINER, TEST_PROJECT_CONTAINER, TEST_PROJECT_CONTAINER_ADMIN } from '../../containerFixtures';
import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';
import { AppURL } from '../../url/AppURL';

import { TEST_USER_APP_ADMIN, TEST_USER_EDITOR, TEST_USER_READER } from '../../userFixtures';
import { useSubNavTabsContext } from '../navigation/hooks';
import { getSecurityTestAPIWrapper } from '../security/APIWrapper';

import { useAdministrationSubNav } from './useAdministrationSubNav';

describe('useAdministrationSubNav', () => {
    const getAppContextWithProjectAdmin = () => ({
        api: getTestAPIWrapper(jest.fn, {
            security: getSecurityTestAPIWrapper(jest.fn, {
                fetchContainers: () => Promise.resolve([TEST_PROJECT_CONTAINER_ADMIN]),
            }),
        }),
    });
    let tabsContext;
    const TestComponent = (): ReactElement => {
        useAdministrationSubNav();
        tabsContext = useSubNavTabsContext();
        return <div>I am a test component</div>;
    };

    test('reader, home admin', async () => {
        const wrapper = mountWithAppServerContext(<TestComponent />, getAppContextWithProjectAdmin(), {
            user: TEST_USER_READER,
            container: TEST_FOLDER_CONTAINER,
        });
        await waitForLifecycle(wrapper);
        expect(tabsContext.noun).toEqual({ text: 'Dashboard', url: AppURL.create('home') });
        expect(tabsContext.tabs).toEqual([]);
    });

    test('editor, home admin', async () => {
        const wrapper = mountWithAppServerContext(<TestComponent />, getAppContextWithProjectAdmin(), {
            user: TEST_USER_EDITOR,
            container: TEST_FOLDER_CONTAINER,
        });
        await waitForLifecycle(wrapper);
        expect(tabsContext.noun).toEqual({ text: 'Dashboard', url: AppURL.create('home') });
        expect(tabsContext.tabs).toEqual([]);
    });

    test('app admin, home admin', async () => {
        const wrapper = mountWithAppServerContext(<TestComponent />, getAppContextWithProjectAdmin(), {
            user: TEST_USER_APP_ADMIN,
            container: TEST_FOLDER_CONTAINER,
        });
        await waitForLifecycle(wrapper);
        expect(tabsContext.noun).toEqual({ text: 'Dashboard', url: AppURL.create('home') });
        expect(tabsContext.tabs.length).toEqual(5);
        expect(tabsContext.tabs[0].text).toEqual('Application Settings');
        expect(tabsContext.tabs[1].text).toEqual('Audit Logs');
        expect(tabsContext.tabs[2].text).toEqual('Users');
        expect(tabsContext.tabs[3].text).toEqual('Groups');
        expect(tabsContext.tabs[4].text).toEqual('Permissions');
    });

    test('folder admin, but not app home admin', async () => {
        const wrapper = mountWithAppServerContext(
            <TestComponent />,
            {
                api: getTestAPIWrapper(jest.fn, {
                    security: getSecurityTestAPIWrapper(jest.fn, {
                        fetchContainers: () => Promise.resolve([TEST_PROJECT_CONTAINER]),
                    }),
                }),
            },
            {
                user: TEST_USER_APP_ADMIN,
                container: TEST_FOLDER_CONTAINER,
            }
        );
        await waitForLifecycle(wrapper);
        expect(tabsContext.noun).toEqual({ text: 'Dashboard', url: AppURL.create('home') });
        expect(tabsContext.tabs.length).toEqual(4);
        // Applications settings should not be visible
        expect(tabsContext.tabs.findIndex(t => t.text === 'Application Settings')).toBe(-1);
    });

    test('displays "folders", but not users and groups in sub folder', async () => {
        const wrapper = mountWithAppServerContext(<TestComponent />, getAppContextWithProjectAdmin(), {
            user: TEST_USER_APP_ADMIN,
            container: TEST_FOLDER_CONTAINER,
            moduleContext: { query: { isProductProjectsEnabled: true } },
        });
        await waitForLifecycle(wrapper);
        expect(tabsContext.noun).toEqual({ text: 'Dashboard', url: AppURL.create('home') });
        expect(tabsContext.tabs.length).toEqual(4);
        expect(tabsContext.tabs[0].text).toEqual('Application Settings');
        expect(tabsContext.tabs[1].text).toEqual('Folders');
        expect(tabsContext.tabs[2].text).toEqual('Audit Logs');
        // TODO, Users and Groups will be available in project container as part of "User Administration Improvements"
        // expect(tabsContext.tabs[3].text).toEqual('Users');
        // expect(tabsContext.tabs[4].text).toEqual('Groups');
        expect(tabsContext.tabs[3].text).toEqual('Permissions');
    });
    test('display of Users or Groups in home folder when projects enabled', async () => {
        const wrapper = mountWithAppServerContext(<TestComponent />, getAppContextWithProjectAdmin(), {
            user: TEST_USER_APP_ADMIN,
            container: TEST_PROJECT_CONTAINER_ADMIN,
            moduleContext: { query: { isProductProjectsEnabled: true } },
        });
        await waitForLifecycle(wrapper);
        expect(tabsContext.noun).toEqual({ text: 'Dashboard', url: AppURL.create('home') });
        expect(tabsContext.tabs.length).toEqual(6);
        expect(tabsContext.tabs[0].text).toEqual('Application Settings');
        expect(tabsContext.tabs[1].text).toEqual('Folders');
        expect(tabsContext.tabs[2].text).toEqual('Audit Logs');
        expect(tabsContext.tabs[3].text).toEqual('Users');
        expect(tabsContext.tabs[4].text).toEqual('Groups');
        expect(tabsContext.tabs[5].text).toEqual('Permissions');
    });
});
