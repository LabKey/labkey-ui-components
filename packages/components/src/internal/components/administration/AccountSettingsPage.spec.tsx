import React from 'react';

import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';

import { TEST_USER_GUEST, TEST_USER_READER } from '../../userFixtures';
import { AdminAppContext } from '../../AppContext';
import { InsufficientPermissionsPage } from '../permissions/InsufficientPermissionsPage';
import { Page } from '../base/Page';
import { UserDetailHeader } from '../user/UserDetailHeader';
import { Notifications } from '../notifications/Notifications';

import { AccountSettingsPage } from './AccountSettingsPage';
import { TEST_PROJECT_CONTAINER } from '../../containerFixtures';

describe('AccountSettingsPage', () => {
    test('reader user', async () => {
        const wrapper = mountWithAppServerContext(
            <AccountSettingsPage />,
            { admin: {} as AdminAppContext },
            { container: TEST_PROJECT_CONTAINER, user: TEST_USER_READER }
        );
        await waitForLifecycle(wrapper);

        expect(wrapper.find(InsufficientPermissionsPage)).toHaveLength(0);
        expect(wrapper.find(Page)).toHaveLength(1);
        expect(wrapper.find(UserDetailHeader)).toHaveLength(1);
        expect(wrapper.find(Notifications)).toHaveLength(1);

        expect(wrapper.find(UserDetailHeader).prop('dateFormat')).toBe('YYYY-MM-DD');
        expect(wrapper.find(UserDetailHeader).prop('description')).toBe('Reader');

        wrapper.unmount();
    });

    test('guest user', async () => {
        const wrapper = mountWithAppServerContext(
            <AccountSettingsPage />,
            { admin: {} as AdminAppContext },
            { container: TEST_PROJECT_CONTAINER, user: TEST_USER_GUEST }
        );
        await waitForLifecycle(wrapper);

        expect(wrapper.find(InsufficientPermissionsPage)).toHaveLength(1);
        expect(wrapper.find(Page)).toHaveLength(1);
        expect(wrapper.find(UserDetailHeader)).toHaveLength(0);
        expect(wrapper.find(Notifications)).toHaveLength(1);

        wrapper.unmount();
    });
});
