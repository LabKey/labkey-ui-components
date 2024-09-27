import React from 'react';
import { act } from '@testing-library/react';

import { TEST_USER_APP_ADMIN, TEST_USER_READER } from '../../userFixtures';
import { NEW_SAMPLE_TYPE_HREF } from '../../app/constants';

import {
    createTestProjectAppContextAdmin,
    createTestProjectAppContextNonAdmin,
    TEST_FOLDER_CONTAINER,
    TEST_PROJECT_CONTAINER,
} from '../../containerFixtures';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { SampleTypeEmptyAlert } from './SampleTypeEmptyAlert';

const EMPTY_ALERT = '.empty-alert';

describe('SampleTypeEmptyAlert', () => {
    const TEST_PROJECT_APP_CONTEXT_ADMIN = createTestProjectAppContextAdmin(jest.fn);
    const TEST_PROJECT_APP_CONTEXT_NON_ADMIN = createTestProjectAppContextNonAdmin(jest.fn);

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

    test('with permissions', async () => {
        await act(async () => {
            renderWithAppContext(<SampleTypeEmptyAlert user={TEST_USER_APP_ADMIN} />, {
                appContext: TEST_PROJECT_APP_CONTEXT_ADMIN,
                serverContext: homeProjectContext,
            });
        });
        // Expect default message
        expect(document.querySelector(EMPTY_ALERT).textContent).toBe(
            'No sample types have been created. Click here to get started.'
        );
        // Expect link to design
        expect(document.querySelector(`${EMPTY_ALERT} a`).getAttribute('href')).toEqual(NEW_SAMPLE_TYPE_HREF.toHref());
    });

    test('without permissions', async () => {
        const expectedMessage = 'I am just a reader';
        await act(async () => {
            renderWithAppContext(<SampleTypeEmptyAlert user={TEST_USER_READER} message={expectedMessage} />, {
                appContext: TEST_PROJECT_APP_CONTEXT_NON_ADMIN,
                serverContext: homeProjectContext,
            });
        });
        // Expect default message
        expect(document.querySelector(EMPTY_ALERT).textContent).toBe(expectedMessage);
        // Expect no link
        expect(document.querySelector(`${EMPTY_ALERT} a`)).toBeNull();
    });

    test('top level folder context', async () => {
        await act(async () => {
            renderWithAppContext(<SampleTypeEmptyAlert user={TEST_USER_APP_ADMIN} />, {
                appContext: TEST_PROJECT_APP_CONTEXT_ADMIN,
                serverContext: topFolderContext,
            });
        });
        // Expect default message
        expect(document.querySelector(EMPTY_ALERT).textContent).toBe(
            'No sample types have been created. Click here to get started.'
        );
        // Expect link to design
        expect(document.querySelector(`${EMPTY_ALERT} a`).getAttribute('href')).toEqual(NEW_SAMPLE_TYPE_HREF.toHref());
    });

    test('child folder context', async () => {
        await act(async () => {
            renderWithAppContext(<SampleTypeEmptyAlert user={TEST_USER_APP_ADMIN} />, {
                appContext: TEST_PROJECT_APP_CONTEXT_ADMIN,
                serverContext: childFolderContext,
            });
        });
        // Expect default message
        expect(document.querySelector(EMPTY_ALERT).textContent).toBe(
            'No sample types have been created. Click here to get started.'
        );
        // Expect link to design
        expect(document.querySelector(`${EMPTY_ALERT} a`).getAttribute('href')).toEqual(NEW_SAMPLE_TYPE_HREF.toHref());
    });

    test('excludedSampleTypes', async () => {
        await act(async () => {
            renderWithAppContext(<SampleTypeEmptyAlert user={TEST_USER_APP_ADMIN} />, {
                appContext: TEST_PROJECT_APP_CONTEXT_ADMIN,
                serverContext: {
                    container: TEST_PROJECT_CONTAINER,
                    moduleContext: {
                        samplemanagement: {
                            dataTypeExclusions: {
                                SampleType: [1],
                            },
                        },
                    },
                },
            });
        });
        // Expect exclusion message
        expect(document.querySelector(EMPTY_ALERT).textContent).toBe(
            'No sample types available. Click here to get started.'
        );
        // Expect link to design
        expect(document.querySelector(`${EMPTY_ALERT} a`).getAttribute('href')).toEqual(NEW_SAMPLE_TYPE_HREF.toHref());
    });

    test('excludedDashboardSampleTypes', async () => {
        await act(async () => {
            renderWithAppContext(<SampleTypeEmptyAlert user={TEST_USER_APP_ADMIN} />, {
                appContext: TEST_PROJECT_APP_CONTEXT_ADMIN,
                serverContext: {
                    container: TEST_PROJECT_CONTAINER,
                    moduleContext: {
                        samplemanagement: {
                            dataTypeExclusions: {
                                DashboardSampleType: [1],
                            },
                        },
                    },
                },
            });
        });
        // Expect exclusion message
        expect(document.querySelector(EMPTY_ALERT).textContent).toBe(
            'No sample types available. Click here to get started.'
        );
        // Expect link to design
        expect(document.querySelector(`${EMPTY_ALERT} a`).getAttribute('href')).toEqual(NEW_SAMPLE_TYPE_HREF.toHref());
    });
});
