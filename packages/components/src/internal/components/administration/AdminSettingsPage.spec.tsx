import React from 'react';
import { ReactWrapper } from 'enzyme';

import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';
import { TEST_USER_EDITOR, TEST_USER_FOLDER_ADMIN } from '../../userFixtures';
import { TEST_FOLDER_CONTAINER, TEST_PROJECT, TEST_PROJECT_CONTAINER } from '../../containerFixtures';
import { ProjectSettings } from '../project/ProjectSettings';
import { ProjectDataTypeSelections } from '../project/ProjectDataTypeSelections';

import { ActiveUserLimit } from '../settings/ActiveUserLimit';
import { BarTenderSettingsForm } from '../labels/BarTenderSettingsForm';
import { NameIdSettings } from '../settings/NameIdSettings';
import { ManageSampleStatusesPanel } from '../samples/ManageSampleStatusesPanel';
import { BasePermissionsCheckPage } from '../permissions/BasePermissionsCheckPage';
import { TEST_LKS_STARTER_MODULE_CONTEXT, TEST_LKSM_STARTER_MODULE_CONTEXT } from '../../productFixtures';
import { getTestAPIWrapper } from '../../APIWrapper';
import { getSecurityTestAPIWrapper } from '../security/APIWrapper';

import policyJSON from '../../../test/data/security-getPolicy.json';
import { SecurityPolicy } from '../permissions/models';
import { initBrowserHistoryState } from '../../util/global';

import { InsufficientPermissionsPage } from '../permissions/InsufficientPermissionsPage';

import { InjectedRouteLeaveProps } from '../../util/RouteLeave';

import { createMockWithRouteLeave } from '../../mockUtils';

import { AdminAppContext, AppContext } from '../../AppContext';

import { ServerContext } from '../base/ServerContext';

import { BasePermissions } from './BasePermissions';
import { AdminSettingsPageImpl } from './AdminSettingsPage';

const TEST_POLICY = SecurityPolicy.create(policyJSON);

beforeAll(() => {
    initBrowserHistoryState();
});

describe('AdminSettingsPageImpl', () => {
    const APP_CONTEXT: Partial<AppContext> = {
        admin: {} as AdminAppContext,
        api: getTestAPIWrapper(jest.fn, {
            security: getSecurityTestAPIWrapper(jest.fn, {
                fetchPolicy: jest.fn().mockResolvedValue(TEST_POLICY),
            }),
        }),
    };

    const SERVER_CONTEXT: Partial<ServerContext> = {
        user: TEST_USER_FOLDER_ADMIN,
        project: TEST_PROJECT,
        container: TEST_FOLDER_CONTAINER,
        moduleContext: TEST_LKS_STARTER_MODULE_CONTEXT,
    };

    function validatePremium(
        wrapper: ReactWrapper,
        manageSampleStatusCount = 1,
    ): void {
        expect(wrapper.find(InsufficientPermissionsPage)).toHaveLength(0);
        expect(wrapper.find(BasePermissionsCheckPage)).toHaveLength(1);
        expect(wrapper.find(ActiveUserLimit)).toHaveLength(1);
        expect(wrapper.find(BarTenderSettingsForm)).toHaveLength(1);
        expect(wrapper.find(NameIdSettings)).toHaveLength(1);
        expect(wrapper.find(ManageSampleStatusesPanel)).toHaveLength(manageSampleStatusCount);
    }

    function validateNonPremium(wrapper: ReactWrapper): void {
        expect(wrapper.find(InsufficientPermissionsPage)).toHaveLength(0);
        expect(wrapper.find(BasePermissionsCheckPage)).toHaveLength(1);
        expect(wrapper.find(ActiveUserLimit)).toHaveLength(1);
        expect(wrapper.find(BarTenderSettingsForm)).toHaveLength(1);
        expect(wrapper.find(NameIdSettings)).toHaveLength(1);
        expect(wrapper.find(ManageSampleStatusesPanel)).toHaveLength(1);
    }

    function defaultProps(): InjectedRouteLeaveProps {
        return createMockWithRouteLeave(jest.fn);
    }

    test('showPremiumFeatures, isAppHomeFolder subfolder', async () => {
        const wrapper = mountWithAppServerContext(
            <AdminSettingsPageImpl {...defaultProps()} />,
            APP_CONTEXT,
            SERVER_CONTEXT
        );
        await waitForLifecycle(wrapper, 50);
        validatePremium(wrapper);
        expect(wrapper.find(BasePermissionsCheckPage).prop('title')).toBe('Application Settings');
        expect(wrapper.find(BasePermissionsCheckPage).prop('description')).toBeUndefined();
        wrapper.unmount();
    });

    test('showPremiumFeatures, isAppHomeFolder LK project', async () => {
        const wrapper = mountWithAppServerContext(<AdminSettingsPageImpl {...defaultProps()} />, APP_CONTEXT, {
            ...SERVER_CONTEXT,
            container: TEST_PROJECT_CONTAINER,
        });
        await waitForLifecycle(wrapper, 50);
        validatePremium(wrapper);
        expect(wrapper.find(BasePermissionsCheckPage).prop('title')).toBe('Application Settings');
        expect(wrapper.find(BasePermissionsCheckPage).prop('description')).toBeUndefined();
        wrapper.unmount();
    });

    test('not showPremiumFeatures, isAppHomeFolder subfolder', async () => {
        const wrapper = mountWithAppServerContext(<AdminSettingsPageImpl {...defaultProps()} />, APP_CONTEXT, {
            ...SERVER_CONTEXT,
            moduleContext: TEST_LKSM_STARTER_MODULE_CONTEXT,
        });
        await waitForLifecycle(wrapper, 50);
        validateNonPremium(wrapper);
        expect(wrapper.find(BasePermissionsCheckPage).prop('title')).toBe('Application Settings');
        expect(wrapper.find(BasePermissionsCheckPage).prop('description')).toBeUndefined();
        wrapper.unmount();
    });

    test('isProductProjectsEnabled, LK project', async () => {
        const wrapper = mountWithAppServerContext(<AdminSettingsPageImpl {...defaultProps()} />, APP_CONTEXT, {
            ...SERVER_CONTEXT,
            container: TEST_PROJECT_CONTAINER,
            moduleContext: { ...TEST_LKS_STARTER_MODULE_CONTEXT, query: { isProductProjectsEnabled: true } },
        });
        await waitForLifecycle(wrapper, 50);
        validatePremium(wrapper);
        expect(wrapper.find(BasePermissionsCheckPage).prop('title')).toBe('Application Settings');
        expect(wrapper.find(BasePermissionsCheckPage).prop('description')).toBeUndefined();
        wrapper.unmount();
    });

    test('isProductProjectsEnabled, subfolder', async () => {
        const wrapper = mountWithAppServerContext(<AdminSettingsPageImpl {...defaultProps()} />, APP_CONTEXT, {
            ...SERVER_CONTEXT,
            moduleContext: { ...TEST_LKS_STARTER_MODULE_CONTEXT, query: { isProductProjectsEnabled: true } },
        });
        await waitForLifecycle(wrapper, 50);
        validatePremium(wrapper, 1,);
        expect(wrapper.find(BasePermissionsCheckPage).prop('title')).toBe('Project Settings');
        expect(wrapper.find(BasePermissionsCheckPage).prop('description')).toBe(
            '/TestProjectContainer/TestFolderContainer'
        );
        wrapper.unmount();
    });

    test('not isSampleStatusEnabled', async () => {
        const wrapper = mountWithAppServerContext(<AdminSettingsPageImpl {...defaultProps()} />, APP_CONTEXT, {
            ...SERVER_CONTEXT,
            moduleContext: {
                ...TEST_LKS_STARTER_MODULE_CONTEXT,
                api: { moduleNames: ['inventory', 'assay', 'premium'] },
            },
        });
        await waitForLifecycle(wrapper, 50);
        validatePremium(wrapper, 0);
        wrapper.unmount();
    });

    test('non admin', async () => {
        const wrapper = mountWithAppServerContext(<AdminSettingsPageImpl {...defaultProps()} />, APP_CONTEXT, {
            ...SERVER_CONTEXT,
            user: TEST_USER_EDITOR,
        });
        await waitForLifecycle(wrapper, 50);
        expect(wrapper.find(InsufficientPermissionsPage)).toHaveLength(1);
        expect(wrapper.find(BasePermissions)).toHaveLength(0);
        expect(wrapper.find(BasePermissionsCheckPage)).toHaveLength(0);
        wrapper.unmount();
    });
});
