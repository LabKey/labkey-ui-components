import React from 'react';

import { TEST_USER_APP_ADMIN, TEST_USER_READER } from '../../userFixtures';
import { NEW_SAMPLE_TYPE_HREF } from '../../app/constants';

import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';
import { Container } from '../base/models/Container';

import { SampleTypeEmptyAlert } from './SampleTypeEmptyAlert';
import {
    TEST_FOLDER_CONTAINER,
    TEST_FOLDER_CONTAINER_ADMIN,
    TEST_PROJECT_CONTAINER,
    TEST_PROJECT_CONTAINER_ADMIN,
} from '../../containerFixtures';
import { AppContext } from '../../AppContext';
import { getTestAPIWrapper } from '../../APIWrapper';
import { getSecurityTestAPIWrapper } from '../security/APIWrapper';

export const TEST_PROJECT_APP_CONTEXT_ADMIN: Partial<AppContext> = {
    api: getTestAPIWrapper(jest.fn, {
        security: getSecurityTestAPIWrapper(jest.fn, {
            fetchContainers: jest.fn().mockResolvedValue([TEST_PROJECT_CONTAINER_ADMIN, TEST_FOLDER_CONTAINER_ADMIN]),
        }),
    }),
};

export const TEST_PROJECT_APP_CONTEXT_NON_ADMIN: Partial<AppContext> = {
    api: getTestAPIWrapper(jest.fn, {
        security: getSecurityTestAPIWrapper(jest.fn, {
            fetchContainers: jest.fn().mockResolvedValue([TEST_PROJECT_CONTAINER, TEST_FOLDER_CONTAINER]),
        }),
    }),
};

const EMPTY_ALERT = '.empty-alert';

describe('SampleTypeEmptyAlert', () => {
    const topFolderContext = {
        container: new Container({ type: 'project', path: 'project' }),
        moduleContext: { query: { isProductProjectsEnabled: false } },
    };

    const adminHomeProjectContext = {
        container: new Container({ type: 'project', path: 'project' }),
        user: TEST_USER_APP_ADMIN,
        moduleContext: { query: { isProductProjectsEnabled: true } },
        isLoaded: true,
    };

    const readerHomeProjectContext = {
        container: new Container({ type: 'project', path: 'project' }),
        user: TEST_USER_READER,
        moduleContext: { query: { isProductProjectsEnabled: true } },
        isLoaded: true,
    };

    const childProjectContext = {
        container: new Container({
            type: 'folder',
            path: TEST_FOLDER_CONTAINER.path,
            parentPath: TEST_PROJECT_CONTAINER.path,
        }),
        user: TEST_USER_APP_ADMIN,
        moduleContext: { query: { isProductProjectsEnabled: true } },
        isLoaded: true,
    };

    const childFolderNonProjectContext = {
        container: new Container({
            type: 'folder',
            path: TEST_FOLDER_CONTAINER.path,
            parentPath: TEST_PROJECT_CONTAINER.path,
        }),
        moduleContext: { query: { isProductProjectsEnabled: false } },
        isLoaded: true,
    };

    test('with permissions', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleTypeEmptyAlert user={TEST_USER_APP_ADMIN} />,
            TEST_PROJECT_APP_CONTEXT_ADMIN,
            adminHomeProjectContext
        );
        await waitForLifecycle(wrapper);
        // Expect default message
        expect(wrapper.find(EMPTY_ALERT).at(0).text()).toContain('No sample types have been created');

        // Expect link to design
        expect(wrapper.find(`${EMPTY_ALERT} a`).prop('href')).toEqual(NEW_SAMPLE_TYPE_HREF.toHref());
    });
    test('without permissions', async () => {
        const expectedMessage = 'I am just a reader';
        const wrapper = mountWithAppServerContext(
            <SampleTypeEmptyAlert message={expectedMessage} user={TEST_USER_READER} />,
            TEST_PROJECT_APP_CONTEXT_NON_ADMIN,
            readerHomeProjectContext
        );
        await waitForLifecycle(wrapper);

        expect(wrapper.find(EMPTY_ALERT).at(0).text()).toEqual(expectedMessage);
    });
    test('top level folder context', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleTypeEmptyAlert user={TEST_USER_APP_ADMIN} />,
            TEST_PROJECT_APP_CONTEXT_ADMIN,
            topFolderContext
        );
        await waitForLifecycle(wrapper);

        // Expect link to design
        expect(wrapper.find(`${EMPTY_ALERT} a`).prop('href')).toEqual(NEW_SAMPLE_TYPE_HREF.toHref());
    });
    test('child project folder context', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleTypeEmptyAlert user={TEST_USER_APP_ADMIN} />,
            TEST_PROJECT_APP_CONTEXT_ADMIN,
            childProjectContext
        );
        await waitForLifecycle(wrapper);

        expect(wrapper.find(EMPTY_ALERT).at(0).text()).toContain('No sample types have been created.');
        // Expect link to design
        expect(wrapper.find(`${EMPTY_ALERT} a`).prop('href')).toEqual(NEW_SAMPLE_TYPE_HREF.toHref());
    });
    test('child folder but Projects feature not enabled for folder', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleTypeEmptyAlert user={TEST_USER_APP_ADMIN} />,
            TEST_PROJECT_APP_CONTEXT_ADMIN,
            childFolderNonProjectContext
        );
        await waitForLifecycle(wrapper);

        // Expect link to design
        expect(wrapper.find(`${EMPTY_ALERT} a`).prop('href')).toEqual(NEW_SAMPLE_TYPE_HREF.toHref());
    });
});
