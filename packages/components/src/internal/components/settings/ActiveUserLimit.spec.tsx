import React from 'react';
import { ReactWrapper } from 'enzyme';

import { Alert } from '../base/Alert';
import { UserLimitSettings } from '../permissions/actions';
import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';
import { TEST_USER_APP_ADMIN, TEST_USER_FOLDER_ADMIN, TEST_USER_PROJECT_ADMIN } from '../../userFixtures';
import { getTestAPIWrapper } from '../../APIWrapper';

import { getSecurityTestAPIWrapper } from '../security/APIWrapper';

import { TEST_PROJECT_CONTAINER } from '../../containerFixtures';

import { ActiveUserLimit, ActiveUserLimitMessage } from './ActiveUserLimit';

describe('ActiveUserLimitMessage', () => {
    test('without message', () => {
        const wrapper = mountWithAppServerContext(
            <ActiveUserLimitMessage />,
            { api: getTestAPIWrapper(jest.fn) },
            { user: TEST_USER_APP_ADMIN }
        );
        expect(wrapper.find(Alert)).toHaveLength(0);
        wrapper.unmount();
    });

    test('with message', () => {
        const wrapper = mountWithAppServerContext(
            <ActiveUserLimitMessage settings={{ messageHtml: 'test' }} />,
            { api: getTestAPIWrapper(jest.fn) },
            { user: TEST_USER_APP_ADMIN }
        );
        expect(wrapper.find(Alert)).toHaveLength(1);
        expect(wrapper.find(Alert).text()).toBe('test');
        wrapper.unmount();
    });

    test('with html message', () => {
        const wrapper = mountWithAppServerContext(
            <ActiveUserLimitMessage settings={{ messageHtml: '<b>test</b>' }} />,
            { api: getTestAPIWrapper(jest.fn) },
            { user: TEST_USER_APP_ADMIN }
        );
        expect(wrapper.find(Alert)).toHaveLength(1);
        expect(wrapper.find(Alert).text()).toBe('test');
        wrapper.unmount();
    });
});

describe('ActiveUserLimit', () => {
    const USER_LIMIT_ENABLED: Partial<UserLimitSettings> = {
        userLimit: true,
        userLimitLevel: 10,
        remainingUsers: 1,
    };
    const USER_LIMIT_DISABLED: Partial<UserLimitSettings> = {
        userLimit: false,
        userLimitLevel: 10,
        remainingUsers: 1,
    };
    const DEFAULT_PROPS = {
        user: TEST_USER_PROJECT_ADMIN,
        container: TEST_PROJECT_CONTAINER,
    };

    function validate(wrapper: ReactWrapper, rendered = true, hasError = false): void {
        const count = rendered ? 1 : 0;
        expect(wrapper.find('.active-user-limit-panel')).toHaveLength(count);
        expect(wrapper.find(Alert)).toHaveLength(count);
        expect(wrapper.find(ActiveUserLimitMessage)).toHaveLength(!hasError ? count : 0);
        expect(wrapper.find('.active-user-limit-message')).toHaveLength(!hasError ? count : 0);
    }

    test('with user limit', async () => {
        const wrapper = mountWithAppServerContext(<ActiveUserLimit {...DEFAULT_PROPS} />, {
            api: getTestAPIWrapper(jest.fn, {
                security: getSecurityTestAPIWrapper(jest.fn, {
                    getUserLimitSettings: jest.fn().mockResolvedValue(USER_LIMIT_ENABLED),
                }),
            }),
        });
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(Alert).text()).toBe('');
        expect(wrapper.find('.active-user-limit-message').text()).toBe(
            'Active user limit is 10. You can add or reactivate 1 more user.'
        );
        wrapper.unmount();
    });

    test('error', async () => {
        const wrapper = mountWithAppServerContext(<ActiveUserLimit {...DEFAULT_PROPS} />, {
            api: getTestAPIWrapper(jest.fn, {
                security: getSecurityTestAPIWrapper(jest.fn, {
                    getUserLimitSettings: jest.fn().mockRejectedValue('test'),
                }),
            }),
        });
        await waitForLifecycle(wrapper);
        validate(wrapper, true, true);
        expect(wrapper.find(Alert).text()).toBe('Error: test');
        wrapper.unmount();
    });

    test('without add user perm', async () => {
        const wrapper = mountWithAppServerContext(
            <ActiveUserLimit {...DEFAULT_PROPS} user={TEST_USER_FOLDER_ADMIN} />,
            {
                api: getTestAPIWrapper(jest.fn, {
                    security: getSecurityTestAPIWrapper(jest.fn, {
                        getUserLimitSettings: jest.fn().mockResolvedValue(USER_LIMIT_ENABLED),
                    }),
                }),
            }
        );
        await waitForLifecycle(wrapper);
        validate(wrapper, false);
        wrapper.unmount();
    });

    test('with user limit disabled', async () => {
        const wrapper = mountWithAppServerContext(<ActiveUserLimit {...DEFAULT_PROPS} />, {
            api: getTestAPIWrapper(jest.fn, {
                security: getSecurityTestAPIWrapper(jest.fn, {
                    getUserLimitSettings: jest.fn().mockResolvedValue(USER_LIMIT_DISABLED),
                }),
            }),
        });
        await waitForLifecycle(wrapper);
        validate(wrapper, false);
        wrapper.unmount();
    });

    test('without user limit settings', async () => {
        const wrapper = mountWithAppServerContext(<ActiveUserLimit {...DEFAULT_PROPS} />, {
            api: getTestAPIWrapper(jest.fn, {
                security: getSecurityTestAPIWrapper(jest.fn, {
                    getUserLimitSettings: jest.fn().mockResolvedValue(undefined),
                }),
            }),
        });
        await waitForLifecycle(wrapper);
        validate(wrapper, false);
        wrapper.unmount();
    });
});
