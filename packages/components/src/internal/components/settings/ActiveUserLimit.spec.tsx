import React from 'react';
import { ReactWrapper } from 'enzyme';

import { Alert } from '../base/Alert';
import { UserLimitSettings } from '../permissions/actions';
import { mountWithAppServerContext, waitForLifecycle } from '../../enzymeTestHelpers';
import { TEST_USER_APP_ADMIN, TEST_USER_FOLDER_ADMIN, TEST_USER_PROJECT_ADMIN } from '../../userFixtures';
import { getTestAPIWrapper } from '../../APIWrapper';

import { ActiveUserLimit, ActiveUserLimitMessage } from './ActiveUserLimit';
import {getSecurityTestAPIWrapper} from "../security/APIWrapper";

describe('ActiveUserLimitMessage', () => {
    test('without message', () => {
        const wrapper = mountWithAppServerContext(
            <ActiveUserLimitMessage settings={{} as UserLimitSettings} />,
            { api: getTestAPIWrapper(jest.fn) },
            { user: TEST_USER_APP_ADMIN }
        );
        expect(wrapper.find(Alert)).toHaveLength(0);
        wrapper.unmount();
    });

    test('with message', () => {
        const wrapper = mountWithAppServerContext(
            <ActiveUserLimitMessage settings={{ messageHtml: 'test' } as UserLimitSettings} />,
            { api: getTestAPIWrapper(jest.fn) },
            { user: TEST_USER_APP_ADMIN }
        );
        expect(wrapper.find(Alert)).toHaveLength(1);
        expect(wrapper.find(Alert).text()).toBe('test');
        wrapper.unmount();
    });

    test('with html message', () => {
        const wrapper = mountWithAppServerContext(
            <ActiveUserLimitMessage settings={{ messageHtml: '<b>test</b>' } as UserLimitSettings} />,
            { api: getTestAPIWrapper(jest.fn) },
            { user: TEST_USER_APP_ADMIN }
        );
        expect(wrapper.find(Alert)).toHaveLength(1);
        expect(wrapper.find(Alert).text()).toBe('test');
        wrapper.unmount();
    });
});

describe('ActiveUserLimit', () => {
    const USER_LIMIT_ENABLED = {
        userLimit: true,
        userLimitLevel: 10,
        remainingUsers: 1,
    } as UserLimitSettings;
    const USER_LIMIT_DISABLED = {
        userLimit: false,
        userLimitLevel: 10,
        remainingUsers: 1,
    } as UserLimitSettings;

    function validate(wrapper: ReactWrapper, rendered = true, hasError = false): void {
        const count = rendered ? 1 : 0;
        expect(wrapper.find('.active-user-limit-panel')).toHaveLength(count);
        expect(wrapper.find(Alert)).toHaveLength(count);
        expect(wrapper.find(ActiveUserLimitMessage)).toHaveLength(!hasError ? count : 0);
        expect(wrapper.find('.active-user-limit-message')).toHaveLength(!hasError ? count : 0);
    }

    test('with user limit', async () => {
        const wrapper = mountWithAppServerContext(
            <ActiveUserLimit />,
            {
                api: getTestAPIWrapper(jest.fn, {
                    security: getSecurityTestAPIWrapper(jest.fn, {
                        getUserLimitSettings: jest.fn().mockResolvedValue(USER_LIMIT_ENABLED),
                    }),
                }),
            },
            { user: TEST_USER_PROJECT_ADMIN }
        );
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(Alert).text()).toBe('');
        expect(wrapper.find('.active-user-limit-message').text()).toBe(
            'Active user limit is 10. You can add or reactivate 1 more user.'
        );
        wrapper.unmount();
    });

    test('error', async () => {
        const wrapper = mountWithAppServerContext(
            <ActiveUserLimit />,
            {
                api: getTestAPIWrapper(jest.fn, {
                    security: getSecurityTestAPIWrapper(jest.fn, {
                        getUserLimitSettings: jest.fn().mockRejectedValue('test'),
                    }),
                }),
            },
            { user: TEST_USER_PROJECT_ADMIN }
        );
        await waitForLifecycle(wrapper);
        validate(wrapper, true, true);
        expect(wrapper.find(Alert).text()).toBe('Error: test');
        wrapper.unmount();
    });

    test('without add user perm', async () => {
        const wrapper = mountWithAppServerContext(
            <ActiveUserLimit />,
            {
                api: getTestAPIWrapper(jest.fn, {
                    security: getSecurityTestAPIWrapper(jest.fn, {
                        getUserLimitSettings: jest.fn().mockResolvedValue(USER_LIMIT_ENABLED),
                    }),
                }),
            },
            { user: TEST_USER_FOLDER_ADMIN }
        );
        await waitForLifecycle(wrapper);
        validate(wrapper, false);
        wrapper.unmount();
    });

    test('with user limit disabled', async () => {
        const wrapper = mountWithAppServerContext(
            <ActiveUserLimit />,
            {
                api: getTestAPIWrapper(jest.fn, {
                    security: getSecurityTestAPIWrapper(jest.fn, {
                        getUserLimitSettings: jest.fn().mockResolvedValue(USER_LIMIT_DISABLED),
                    }),
                }),
            },
            { user: TEST_USER_PROJECT_ADMIN }
        );
        await waitForLifecycle(wrapper);
        validate(wrapper, false);
        wrapper.unmount();
    });

    test('without user limit settings', async () => {
        const wrapper = mountWithAppServerContext(
            <ActiveUserLimit />,
            {
                api: getTestAPIWrapper(jest.fn, {
                    security: getSecurityTestAPIWrapper(jest.fn, {
                        getUserLimitSettings: jest.fn().mockResolvedValue(undefined),
                    }),
                }),
            },
            { user: TEST_USER_PROJECT_ADMIN }
        );
        await waitForLifecycle(wrapper);
        validate(wrapper, false);
        wrapper.unmount();
    });
});
