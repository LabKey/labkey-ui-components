import React from 'react';
import { act } from '@testing-library/react';

import { TEST_USER_APP_ADMIN } from '../../userFixtures';
import {
    TEST_FOLDER_CONTAINER,
    TEST_PROJECT,
    TEST_PROJECT_CONTAINER,
    TEST_PROJECT_CONTAINER_ADMIN,
} from '../../containerFixtures';

import { TEST_LKS_STARTER_MODULE_CONTEXT, TEST_LKSM_STARTER_MODULE_CONTEXT } from '../../productFixtures';
import { getTestAPIWrapper } from '../../APIWrapper';
import { getSecurityTestAPIWrapper } from '../security/APIWrapper';

import policyJSON from '../../../test/data/security-getPolicy.json';
import { SecurityPolicy } from '../permissions/models';

import { AdminAppContext, AppContext } from '../../AppContext';

import { ServerContext } from '../base/ServerContext';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';
import { UserLimitSettings } from '../permissions/actions';

import { SampleTypeDataType } from '../entities/constants';

import { AdminSettingsPage } from './AdminSettingsPage';
import { getFolderTestAPIWrapper } from '../container/FolderAPIWrapper';

const TEST_POLICY = SecurityPolicy.create(policyJSON);

beforeAll(() => {
    global.window.scrollTo = jest.fn();
    global.console.error = jest.fn();
});

describe('AdminSettingsPage', () => {
    const USER_LIMIT_ENABLED = {
        userLimit: true,
        userLimitLevel: 10,
        remainingUsers: 1,
    } as UserLimitSettings;

    const APP_CONTEXT: Partial<AppContext> = {
        admin: {
            sampleTypeDataType: SampleTypeDataType,
        } as AdminAppContext,
        api: getTestAPIWrapper(jest.fn, {
            security: getSecurityTestAPIWrapper(jest.fn, {
                fetchPolicy: jest.fn().mockResolvedValue(TEST_POLICY),
                fetchContainers: jest.fn().mockResolvedValue([TEST_PROJECT_CONTAINER_ADMIN]),
                getUserLimitSettings: jest.fn().mockResolvedValue(USER_LIMIT_ENABLED),
            }),
            folder: getFolderTestAPIWrapper(jest.fn, {
                getAuditSettings: jest.fn().mockResolvedValue({ requireUserComments: true }),
            }),
        }),
    };

    const SERVER_CONTEXT: Partial<ServerContext> = {
        user: TEST_USER_APP_ADMIN,
        project: TEST_PROJECT,
        container: TEST_FOLDER_CONTAINER,
        moduleContext: TEST_LKS_STARTER_MODULE_CONTEXT,
    };

    function validate(manageSampleStatusCount = 1, dashboardIndex = 5): void {
        expect(document.querySelectorAll('.alert')).toHaveLength(0);

        const panelTitles = [];
        document.querySelectorAll('.panel-heading').forEach(heading => panelTitles.push(heading.textContent));

        expect(panelTitles[0]).toBe('Active Users');
        expect(panelTitles[1]).toBe('Display Settings');
        expect(panelTitles[2]).toBe('BarTender Web Service Configuration');
        expect(panelTitles[3]).toBe('ID/Name Settings');
        if (manageSampleStatusCount === 1) {
            expect(panelTitles[4]).toBe('Manage Sample Statuses');
        } else {
            expect(panelTitles.indexOf('Manage Sample Statuses')).toBe(-1);
        }
        expect(panelTitles.indexOf('Dashboard')).toBe(dashboardIndex);
    }

    test('showPremiumFeatures, isAppHomeFolder subfolder', async () => {
        await act(async () => {
            renderWithAppContext(<AdminSettingsPage />, {
                serverContext: SERVER_CONTEXT,
                appContext: APP_CONTEXT,
            });
        });
        validate();
        expect(document.querySelector('.detail__header--name').textContent).toBe('Application Settings');
        expect(document.querySelectorAll('.detail__header--desc')).toHaveLength(0);
    });

    test('showPremiumFeatures, isAppHomeFolder LK project', async () => {
        await act(async () => {
            renderWithAppContext(<AdminSettingsPage />, {
                serverContext: {
                    ...SERVER_CONTEXT,
                    container: TEST_PROJECT_CONTAINER,
                },
                appContext: APP_CONTEXT,
            });
        });
        validate();
        expect(document.querySelector('.detail__header--name').textContent).toBe('Application Settings');
        expect(document.querySelectorAll('.detail__header--desc')).toHaveLength(0);
    });

    test('not showPremiumFeatures, isAppHomeFolder subfolder', async () => {
        await act(async () => {
            renderWithAppContext(<AdminSettingsPage />, {
                serverContext: {
                    ...SERVER_CONTEXT,
                    moduleContext: TEST_LKSM_STARTER_MODULE_CONTEXT,
                },
                appContext: APP_CONTEXT,
            });
        });
        validate();
        expect(document.querySelector('.detail__header--name').textContent).toBe('Application Settings');
        expect(document.querySelectorAll('.detail__header--desc')).toHaveLength(0);
    });

    test('isProductProjectsEnabled, LK project', async () => {
        await act(async () => {
            renderWithAppContext(<AdminSettingsPage />, {
                serverContext: {
                    ...SERVER_CONTEXT,
                    container: TEST_PROJECT_CONTAINER,
                    moduleContext: { ...TEST_LKS_STARTER_MODULE_CONTEXT, query: { isProductProjectsEnabled: true } },
                },
                appContext: APP_CONTEXT,
            });
        });
        validate();
        expect(document.querySelector('.detail__header--name').textContent).toBe('Application Settings');
        expect(document.querySelectorAll('.detail__header--desc')).toHaveLength(0);
    });

    test('isProductProjectsEnabled, subfolder', async () => {
        await act(async () => {
            renderWithAppContext(<AdminSettingsPage />, {
                serverContext: {
                    ...SERVER_CONTEXT,
                    moduleContext: { ...TEST_LKS_STARTER_MODULE_CONTEXT, query: { isProductProjectsEnabled: true } },
                },
                appContext: APP_CONTEXT,
            });
        });
        validate();
        expect(document.querySelector('.detail__header--name').textContent).toBe('Application Settings');
        expect(document.querySelectorAll('.detail__header--desc')).toHaveLength(0);
    });

    test('hasProductProjects', async () => {
        await act(async () => {
            renderWithAppContext(<AdminSettingsPage />, {
                serverContext: {
                    ...SERVER_CONTEXT,
                    container: TEST_PROJECT_CONTAINER,
                    moduleContext: { ...TEST_LKS_STARTER_MODULE_CONTEXT, query: { hasProductProjects: true } },
                },
                appContext: APP_CONTEXT,
            });
        });
        validate(1, -1);
        expect(document.querySelector('.detail__header--name').textContent).toBe('Application Settings');
        expect(document.querySelectorAll('.detail__header--desc')).toHaveLength(0);
    });

    test('not isSampleStatusEnabled', async () => {
        await act(async () => {
            renderWithAppContext(<AdminSettingsPage />, {
                serverContext: {
                    ...SERVER_CONTEXT,
                    moduleContext: {
                        ...TEST_LKS_STARTER_MODULE_CONTEXT,
                        api: { moduleNames: ['inventory', 'assay', 'premium'] },
                    },
                },
                appContext: APP_CONTEXT,
            });
        });
        validate(0, 4);
        expect(document.querySelector('.detail__header--name').textContent).toBe('Application Settings');
        expect(document.querySelectorAll('.detail__header--desc')).toHaveLength(0);
    });
});
