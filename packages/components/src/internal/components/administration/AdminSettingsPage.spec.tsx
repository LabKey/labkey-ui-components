import React from 'react';
import { ReactWrapper } from 'enzyme';

import { InsufficientPermissionsPage } from '../permissions/InsufficientPermissionsPage';
import { BasePermissionsCheckPage } from '../permissions/BasePermissionsCheckPage';

import { NameIdSettings } from '../settings/NameIdSettings';
import { BarTenderSettingsForm } from '../labels/BarTenderSettingsForm';
import { ManageSampleStatusesPanel } from '../samples/ManageSampleStatusesPanel';
import { TEST_USER_APP_ADMIN, TEST_USER_PROJECT_ADMIN } from '../../userFixtures';

import { mountWithAppServerContext } from '../../testHelpers';
import { AdminAppContext } from '../../AppContext';
import { TEST_PROJECT_CONTAINER } from '../../../test/data/constants';
import { createMockWithRouterProps } from '../../mockUtils';
import { InjectedRouteLeaveProps } from '../../util/RouteLeave';

import { AdminSettingsPageImpl } from './AdminSettingsPage';
import { BasePermissions } from './BasePermissions';

declare const LABKEY: import('@labkey/api').LabKey;

beforeAll(() => {
    LABKEY.moduleContext = { api: { moduleNames: ['samplemanagement'] } };
});

describe('AdminSettingsPageImpl', () => {
    function getDefaultProps(): InjectedRouteLeaveProps {
        return {
            // ...createMockWithRouterProps(jest.fn),
            // routes: [],
            getIsDirty: jest.fn(),
            setIsDirty: jest.fn(),
        };
    }

    function validate(wrapper: ReactWrapper, hasPermission = true, showPremium = false): void {
        expect(wrapper.find(InsufficientPermissionsPage)).toHaveLength(!hasPermission ? 1 : 0);
        expect(wrapper.find(BasePermissionsCheckPage)).toHaveLength(hasPermission && showPremium ? 1 : 0);
        expect(wrapper.find(BasePermissions)).toHaveLength(hasPermission && !showPremium ? 1 : 0);
        expect(wrapper.find(BarTenderSettingsForm)).toHaveLength(hasPermission ? 1 : 0);
        expect(wrapper.find(NameIdSettings)).toHaveLength(hasPermission ? 1 : 0);
        expect(wrapper.find(ManageSampleStatusesPanel)).toHaveLength(hasPermission ? 1 : 0);
    }

    test('non-app admin user', () => {
        const wrapper = mountWithAppServerContext(
            <AdminSettingsPageImpl {...getDefaultProps()} />,
            { admin: {} as AdminAppContext },
            { user: TEST_USER_PROJECT_ADMIN, project: { ...TEST_PROJECT_CONTAINER, rootId: TEST_PROJECT_CONTAINER.id } }
        );
        validate(wrapper);
        wrapper.unmount();
    });

    test('app admin user, without premium', () => {
        const wrapper = mountWithAppServerContext(
            <AdminSettingsPageImpl {...getDefaultProps()} />,
            { admin: {} as AdminAppContext },
            { user: TEST_USER_APP_ADMIN, project: { ...TEST_PROJECT_CONTAINER, rootId: TEST_PROJECT_CONTAINER.id } }
        );
        validate(wrapper);
        wrapper.unmount();
    });

    test('app admin user, with premium', () => {
        LABKEY.moduleContext = {
            ...LABKEY.moduleContext,
            api: { moduleNames: ['premium', 'samplemanagement'] },
        };
        const wrapper = mountWithAppServerContext(
            <AdminSettingsPageImpl {...getDefaultProps()} />,
            { admin: {} as AdminAppContext },
            { user: TEST_USER_APP_ADMIN, project: { ...TEST_PROJECT_CONTAINER, rootId: TEST_PROJECT_CONTAINER.id } }
        );
        validate(wrapper, true, true);
        wrapper.unmount();
    });
});
