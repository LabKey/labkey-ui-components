import React from 'react';
import { act } from '@testing-library/react';
import { AppContext } from '../../AppContext';
import { getTestAPIWrapper } from '../../APIWrapper';
import { TEST_FOLDER_CONTAINER, TEST_PROJECT } from '../../containerFixtures';
import { getFolderTestAPIWrapper } from '../container/FolderAPIWrapper';
import { AuditSettings } from './AuditSettings';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';
import { TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT, TEST_LKSM_STARTER_MODULE_CONTEXT } from '../../productFixtures';
import { TEST_USER_APP_ADMIN, TEST_USER_EDITOR } from '../../userFixtures';

describe('AuditSettings', () => {
    const APP_CONTEXT: Partial<AppContext> = {
        api: getTestAPIWrapper(jest.fn, {
            folder: getFolderTestAPIWrapper(jest.fn, {
                getAuditSettings: jest.fn().mockResolvedValue({ requireUserComments: true }),
            }),
        }),
    };

    test('feature not enabled', async () => {
        await act(async () => {
            const { container } = renderWithAppContext(<AuditSettings />, {
                serverContext: {
                    user: TEST_USER_APP_ADMIN,
                    project: TEST_PROJECT,
                    container: TEST_FOLDER_CONTAINER,
                    moduleContext: TEST_LKSM_STARTER_MODULE_CONTEXT,
                },
                appContext: APP_CONTEXT,
            });
            expect(container.firstChild).toBeNull();
        });
    });

    test('feature is enabled, prop is false', async () => {
        await act(async () => {
            renderWithAppContext(<AuditSettings />, {
                serverContext: {
                    user: TEST_USER_APP_ADMIN,
                    project: TEST_PROJECT,
                    container: TEST_FOLDER_CONTAINER,
                    moduleContext: TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
                },
                appContext: {
                    api: getTestAPIWrapper(jest.fn, {
                        folder: getFolderTestAPIWrapper(jest.fn, {
                            getAuditSettings: jest.fn().mockResolvedValue({ requireUserComments: false }),
                        }),
                    }),
                },
            });
        });
        const radioInputs = document.querySelectorAll('input[name="requireComments"]');
        expect(radioInputs.item(0).getAttribute('checked')).toBe('');
        expect(radioInputs.item(1).getAttribute('checked')).toBe(null);
    });

    test('feature is enabled, user not admin', async () => {
        await act(async () => {
            const { container } = renderWithAppContext(<AuditSettings />, {
                serverContext: {
                    user: TEST_USER_EDITOR,
                    project: TEST_PROJECT,
                    container: TEST_FOLDER_CONTAINER,
                    moduleContext: TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
                },
                appContext: {
                    api: getTestAPIWrapper(jest.fn, {
                        folder: getFolderTestAPIWrapper(jest.fn, {
                            getAuditSettings: jest.fn().mockResolvedValue({ requireUserComments: false }),
                        }),
                    }),
                },
            });
            expect(container.firstChild).toBeNull();
        });
    });
});
