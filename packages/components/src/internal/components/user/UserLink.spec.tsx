import React from 'react';

import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';
import { TEST_USER_APP_ADMIN, TEST_USER_READER } from '../../userFixtures';

import { UserLink, UserLinkList } from './UserLink';

describe('UserLink', () => {
    test('unknown', () => {
        const wrapper = mountWithAppServerContext(<UserLink unknown />, {}, { user: TEST_USER_APP_ADMIN });
        expect(wrapper.find('a')).toHaveLength(0);
        expect(wrapper.find('span')).toHaveLength(1);
        expect(wrapper.find('.gray-text')).toHaveLength(1);
        expect(wrapper.find('span').text()).toBe('<unknown user>');
        wrapper.unmount();
    });

    test('displayValue without userId', () => {
        const wrapper = mountWithAppServerContext(
            <UserLink userDisplayValue="Test display" />,
            {},
            {
                user: TEST_USER_APP_ADMIN,
            }
        );
        expect(wrapper.find('a')).toHaveLength(0);
        expect(wrapper.find('span')).toHaveLength(1);
        expect(wrapper.find('.gray-text')).toHaveLength(0);
        expect(wrapper.find('span').text()).toBe('Test display');
        wrapper.unmount();
    });

    test('userId without displayValue', () => {
        const wrapper = mountWithAppServerContext(<UserLink userId={1} />, {}, { user: TEST_USER_APP_ADMIN });
        expect(wrapper.find('a')).toHaveLength(0);
        expect(wrapper.find('span')).toHaveLength(1);
        expect(wrapper.find('.gray-text')).toHaveLength(1);
        expect(wrapper.find('span').text()).toBe('<1>');
        wrapper.unmount();
    });

    test('userId with displayValue', async () => {
        const wrapper = mountWithAppServerContext(
            <UserLink userId={1} userDisplayValue="Test display" />,
            {},
            {
                user: TEST_USER_APP_ADMIN,
            }
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find('a')).toHaveLength(1);
        expect(wrapper.find('.clickable')).toHaveLength(1);
        expect(wrapper.find('span')).toHaveLength(0);
        expect(wrapper.find('.gray-text')).toHaveLength(0);
        expect(wrapper.find('a').text()).toBe('Test display');
        wrapper.unmount();
    });

    test('user cannot ReadUserDetails, not self', async () => {
        const wrapper = mountWithAppServerContext(
            <UserLink userId={1} userDisplayValue="Test display" />,
            {},
            {
                user: TEST_USER_READER,
            }
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find('a')).toHaveLength(0);
        expect(wrapper.find('.clickable')).toHaveLength(0);
        expect(wrapper.find('span')).toHaveLength(1);
        expect(wrapper.find('.gray-text')).toHaveLength(0);
        expect(wrapper.find('span').text()).toBe('Test display');
        wrapper.unmount();
    });

    test('user cannot ReadUserDetails, self', async () => {
        const wrapper = mountWithAppServerContext(
            <UserLink userId={TEST_USER_READER.id} userDisplayValue="Test display" />,
            {},
            { user: TEST_USER_READER }
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find('a')).toHaveLength(1);
        expect(wrapper.find('.clickable')).toHaveLength(1);
        expect(wrapper.find('span')).toHaveLength(0);
        expect(wrapper.find('.gray-text')).toHaveLength(0);
        expect(wrapper.find('a').text()).toBe('Test display');
        wrapper.unmount();
    });
});

describe('UserLinkList', () => {
    test('all users', () => {
        const wrapper = mountWithAppServerContext(
            <UserLinkList
                users={[
                    { id: 1, displayName: 'a', type: 'u' },
                    { id: 2, displayName: 'b', type: 'u' },
                ]}
            />,
            {},
            { user: TEST_USER_APP_ADMIN }
        );
        expect(wrapper.find(UserLink)).toHaveLength(2);
        expect(wrapper.text()).toBe('a, b');
        wrapper.unmount();
    });

    test('users and groups', () => {
        const wrapper = mountWithAppServerContext(
            <UserLinkList
                users={[
                    { id: 1, displayName: 'a', type: 'u' },
                    { id: 2, displayName: 'b', type: 'u' },
                    { id: 3, displayName: 'c', type: 'g' },
                ]}
            />,
            {},
            { user: TEST_USER_APP_ADMIN }
        );
        expect(wrapper.find(UserLink)).toHaveLength(2);
        expect(wrapper.text()).toBe('a, b, c');
        wrapper.unmount();
    });
});
