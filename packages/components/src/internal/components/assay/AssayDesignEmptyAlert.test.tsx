import React from 'react';

import { waitFor } from '@testing-library/dom';

import { TEST_USER_ASSAY_DESIGNER, TEST_USER_READER } from '../../userFixtures';
import { NEW_ASSAY_DESIGN_HREF } from '../../app/constants';

import {
    createTestProjectAppContextAdmin,
    createTestProjectAppContextNonAdmin,
    TEST_FOLDER_CONTAINER,
    TEST_PROJECT_CONTAINER,
} from '../../containerFixtures';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { AssayDesignEmptyAlert } from './AssayDesignEmptyAlert';

const EMPTY_ALERT = '.empty-alert';

const topFolderContext = {
    container: TEST_PROJECT_CONTAINER,
    moduleContext: { query: { isProductFoldersEnabled: false } },
};

const homeProjectContext = {
    container: TEST_PROJECT_CONTAINER,
    moduleContext: { query: { isProductFoldersEnabled: true } },
};

const childFolderContext = {
    container: TEST_FOLDER_CONTAINER,
    moduleContext: { query: { isProductFoldersEnabled: true } },
};

const childFolderNonFolderContext = {
    container: TEST_FOLDER_CONTAINER,
    moduleContext: { query: { isProductFoldersEnabled: false } },
};

describe('AssayDesignEmptyAlert', () => {
    const TEST_PROJECT_APP_CONTEXT_ADMIN = createTestProjectAppContextAdmin(jest.fn);
    const TEST_PROJECT_APP_CONTEXT_NON_ADMIN = createTestProjectAppContextNonAdmin(jest.fn);
    test('with permissions', async () => {
        renderWithAppContext(<AssayDesignEmptyAlert user={TEST_USER_ASSAY_DESIGNER} />, {
            appContext: TEST_PROJECT_APP_CONTEXT_ADMIN,
            serverContext: homeProjectContext,
        });
        await waitFor(() => {
            // Expect default message
            expect(document.querySelectorAll(EMPTY_ALERT)[0].textContent).toContain('No assays are currently active.');

            // Expect link to design
            expect(document.querySelectorAll(`${EMPTY_ALERT} a`)[0].getAttribute('href')).toEqual(
                NEW_ASSAY_DESIGN_HREF.toHref()
            );
        });
    });
    test('without permissions', async () => {
        const expectedMessage = 'I am just a reader';
        renderWithAppContext(<AssayDesignEmptyAlert message={expectedMessage} user={TEST_USER_READER} />, {
            appContext: TEST_PROJECT_APP_CONTEXT_NON_ADMIN,
            serverContext: homeProjectContext,
        });
        await waitFor(() => {
            expect(document.querySelectorAll(EMPTY_ALERT)[0].textContent).toEqual(expectedMessage);
        });
    });
    test('top level folder context', async () => {
        renderWithAppContext(<AssayDesignEmptyAlert user={TEST_USER_ASSAY_DESIGNER} />, {
            appContext: TEST_PROJECT_APP_CONTEXT_ADMIN,
            serverContext: topFolderContext,
        });
        await waitFor(() => {
            // Expect link to design
            expect(document.querySelectorAll(`${EMPTY_ALERT} a`)[0].getAttribute('href')).toEqual(
                NEW_ASSAY_DESIGN_HREF.toHref()
            );
        });
    });
    test('child folder folder context', async () => {
        renderWithAppContext(<AssayDesignEmptyAlert user={TEST_USER_ASSAY_DESIGNER} />, {
            appContext: TEST_PROJECT_APP_CONTEXT_ADMIN,
            serverContext: childFolderContext,
        });
        await waitFor(() => {
            expect(document.querySelectorAll(EMPTY_ALERT)[0].textContent).toContain('No assays are currently active.');
            // Expect link to design
            expect(document.querySelectorAll(`${EMPTY_ALERT} a`)[0].getAttribute('href')).toEqual(
                NEW_ASSAY_DESIGN_HREF.toHref()
            );
        });
    });
    test('child folder but Folders feature not enabled for folder', async () => {
        renderWithAppContext(<AssayDesignEmptyAlert user={TEST_USER_ASSAY_DESIGNER} />, {
            appContext: TEST_PROJECT_APP_CONTEXT_ADMIN,
            serverContext: childFolderNonFolderContext,
        });
        await waitFor(() => {
            // Expect link to design
            expect(document.querySelectorAll(`${EMPTY_ALERT} a`)[0].getAttribute('href')).toEqual(
                NEW_ASSAY_DESIGN_HREF.toHref()
            );
        });
    });
});
