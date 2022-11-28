import React from 'react';

import { InsufficientPermissionsPage } from '../permissions/InsufficientPermissionsPage';
import { BasePermissionsCheckPage } from '../permissions/BasePermissionsCheckPage';

import { NameIdSettings } from '../settings/NameIdSettings';
import { BarTenderSettingsForm } from '../labels/BarTenderSettingsForm';
import { ManageSampleStatusesPanel } from '../samples/ManageSampleStatusesPanel';
import { TEST_USER_APP_ADMIN } from '../../userFixtures';

import { mountWithAppServerContext, waitForLifecycle } from '../../testHelpers';
import { AdminAppContext } from '../../AppContext';
import { TEST_PROJECT } from '../../../test/data/constants';

import { TEST_LKS_STARTER_MODULE_CONTEXT } from '../../productFixtures';
import { getTestAPIWrapper } from '../../APIWrapper';
import { getLabelPrintingTestAPIWrapper } from '../labels/APIWrapper';
import { BarTenderConfiguration } from '../labels/models';

import { ActiveUserLimit } from '../settings/ActiveUserLimit';

import { BasePermissions } from './BasePermissions';
import { AdminSettingsPageImpl } from './AdminSettingsPage';

describe('AdminSettingsPageImpl', () => {
    const getAPIContext = () => {
        return getTestAPIWrapper(jest.fn, {
            labelprinting: getLabelPrintingTestAPIWrapper(jest.fn, {
                fetchBarTenderConfiguration: jest.fn().mockResolvedValue(
                    new BarTenderConfiguration({
                        defaultLabel: 'testDefaultLabel',
                        serviceURL: 'testServerURL',
                    })
                ),
            }),
        });
    };

    const getDefaultProps = () => {
        return {
            getIsDirty: jest.fn(),
            setIsDirty: jest.fn(),
        };
    };

    test('app admin user, with premium', async () => {
        const wrapper = mountWithAppServerContext(
            <AdminSettingsPageImpl {...getDefaultProps()}>
                <div className="testing-child">testing</div>
            </AdminSettingsPageImpl>,
            { admin: {} as AdminAppContext, api: getAPIContext() },
            { moduleContext: TEST_LKS_STARTER_MODULE_CONTEXT, user: TEST_USER_APP_ADMIN, project: TEST_PROJECT }
        );
        await waitForLifecycle(wrapper);

        expect(wrapper.find(InsufficientPermissionsPage)).toHaveLength(0);
        expect(wrapper.find(BasePermissions)).toHaveLength(0);
        expect(wrapper.find(BasePermissionsCheckPage)).toHaveLength(1);
        expect(wrapper.find(ActiveUserLimit)).toHaveLength(1);
        expect(wrapper.find(BarTenderSettingsForm)).toHaveLength(1);
        expect(wrapper.find(NameIdSettings)).toHaveLength(1);
        expect(wrapper.find(ManageSampleStatusesPanel)).toHaveLength(1);
        expect(wrapper.find('.testing-child')).toHaveLength(1);

        wrapper.unmount();
    });
});
