import React from 'react';
import { waitFor } from '@testing-library/dom';

import { TEST_USER_APP_ADMIN, TEST_USER_READER } from '../../userFixtures';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { UserLink, UserLinkList } from './UserLink';

describe('UserLink', () => {
    test('unknown', () => {
        const { container } = renderWithAppContext(<UserLink unknown />, {
            serverContext: { user: TEST_USER_APP_ADMIN },
        });
        expect(container.querySelectorAll('a')).toHaveLength(0);
        expect(container.querySelectorAll('span')).toHaveLength(1);
        expect(container.querySelectorAll('.gray-text')).toHaveLength(1);
        expect(container.querySelector('span').textContent).toBe('<unknown user>');
    });

    test('displayValue without userId', async () => {
        const { container } = renderWithAppContext(<UserLink userDisplayValue="Test display" />, {
            serverContext: { user: TEST_USER_APP_ADMIN },
        });
        await waitFor(() => {
            expect(container.querySelectorAll('span')).toHaveLength(1);
        });
        expect(container.querySelectorAll('a')).toHaveLength(0);
        expect(container.querySelectorAll('span')).toHaveLength(1);
        expect(container.querySelectorAll('.gray-text')).toHaveLength(0);
        expect(container.querySelector('span').textContent).toBe('Test display');
    });

    test('userId without displayValue', () => {
        const { container } = renderWithAppContext(<UserLink userId={1} />, {
            serverContext: { user: TEST_USER_APP_ADMIN },
        });
        expect(container.querySelectorAll('a')).toHaveLength(0);
        expect(container.querySelectorAll('span')).toHaveLength(1);
        expect(container.querySelectorAll('.gray-text')).toHaveLength(1);
        expect(container.querySelector('span').textContent).toBe('<1>');
    });

    test('userId with displayValue', async () => {
        const { container } = renderWithAppContext(<UserLink userDisplayValue="Test display" userId={1} />, {
            serverContext: { user: TEST_USER_APP_ADMIN },
        });
        await waitFor(() => {
            expect(container.querySelectorAll('button')).toHaveLength(1);
        });
        expect(container.querySelectorAll('.clickable-text')).toHaveLength(1);
        expect(container.querySelectorAll('span')).toHaveLength(0);
        expect(container.querySelectorAll('.gray-text')).toHaveLength(0);
        expect(container.querySelector('button').textContent).toBe('Test display');
    });

    test('user cannot ReadUserDetails, not self', async () => {
        const { container } = renderWithAppContext(<UserLink userDisplayValue="Test display" userId={1} />, {
            serverContext: { user: TEST_USER_READER },
        });
        await waitFor(() => {
            expect(container.querySelectorAll('span')).toHaveLength(1);
        });
        expect(container.querySelectorAll('a')).toHaveLength(0);
        expect(container.querySelectorAll('.clickable-text')).toHaveLength(0);
        expect(container.querySelectorAll('span')).toHaveLength(1);
        expect(container.querySelectorAll('.gray-text')).toHaveLength(0);
        expect(container.querySelector('span').textContent).toBe('Test display');
    });

    test('user cannot ReadUserDetails, self', async () => {
        const { container } = renderWithAppContext(
            <UserLink userDisplayValue="Test display" userId={TEST_USER_READER.id} />,
            { serverContext: { user: TEST_USER_READER } }
        );
        await waitFor(() => {
            expect(container.querySelectorAll('button')).toHaveLength(1);
        });
        expect(container.querySelectorAll('.clickable-text')).toHaveLength(1);
        expect(container.querySelectorAll('span')).toHaveLength(0);
        expect(container.querySelectorAll('.gray-text')).toHaveLength(0);
        expect(container.querySelector('button').textContent).toBe('Test display');
    });
});

describe('UserLinkList', () => {
    test('all users', async () => {
        const { container } = renderWithAppContext(
            <UserLinkList
                users={[
                    { id: 1, displayName: 'a', type: 'u' },
                    { id: 2, displayName: 'b', type: 'u' },
                ]}
            />,
            { serverContext: { user: TEST_USER_APP_ADMIN } }
        );
        await waitFor(() => {
            expect(container.querySelectorAll('.user-link')).toHaveLength(2);
        });
        expect(container.querySelectorAll('.user-link')).toHaveLength(2);
        expect(container.textContent).toBe('a, b');
    });

    test('users and groups', async () => {
        const { container } = renderWithAppContext(
            <UserLinkList
                users={[
                    { id: 1, displayName: 'a', type: 'u' },
                    { id: 2, displayName: 'b', type: 'u' },
                    { id: 3, displayName: 'c', type: 'g' },
                ]}
            />,
            { serverContext: { user: TEST_USER_APP_ADMIN } }
        );
        await waitFor(() => {
            expect(container.querySelectorAll('.user-link')).toHaveLength(2);
        });
        expect(container.querySelectorAll('.user-link')).toHaveLength(2);
        expect(container.textContent).toBe('a, b, c');
    });
});
