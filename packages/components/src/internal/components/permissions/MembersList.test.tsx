import React from 'react';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';
import { TEST_USER_APP_ADMIN } from '../../userFixtures';

import { MembersList } from './MembersList';

describe('MembersList', () => {
    const SERVER_CONTEXT = { user: TEST_USER_APP_ADMIN };

    test('empty', () => {
        renderWithAppContext(<MembersList members={[]} />, { serverContext: SERVER_CONTEXT });
        expect(document.querySelectorAll('.row')).toHaveLength(0);
        expect(document.querySelectorAll('.user-link')).toHaveLength(0);
    });

    test('with user member', () => {
        renderWithAppContext(
            <MembersList members={[{ id: 1, name: 'user1', type: 'u' }]} />,
            { serverContext: SERVER_CONTEXT }
        );
        expect(document.querySelectorAll('.row')).toHaveLength(1);
        expect(document.querySelectorAll('.principal-detail-li')).toHaveLength(1);
        expect(document.querySelectorAll('.user-link')).toHaveLength(1);
        expect(document.querySelector('.row').textContent).toBe('Membersuser1');
    });

    test('with group member', () => {
        renderWithAppContext(
            <MembersList members={[{ id: 2, name: 'group1', type: 'g' }]} />,
            { serverContext: SERVER_CONTEXT }
        );
        expect(document.querySelectorAll('.row')).toHaveLength(1);
        expect(document.querySelectorAll('.principal-detail-li')).toHaveLength(1);
        expect(document.querySelectorAll('.user-link')).toHaveLength(0);
        expect(document.querySelector('.row').textContent).toBe('Membersgroup1');
    });

    test('with inactive user member only', () => {
        renderWithAppContext(
            <MembersList members={[{ id: 1, name: 'user1', type: 'u', userActive: false }]} />,
            { serverContext: SERVER_CONTEXT }
        );
        expect(document.querySelectorAll('.row')).toHaveLength(0);
        expect(document.querySelectorAll('.principal-detail-li')).toHaveLength(0);
        expect(document.querySelectorAll('.user-link')).toHaveLength(0);
    });

    test('with active and inactive user members', () => {
        renderWithAppContext(
            <MembersList
                members={[
                    { id: 1, name: 'user1', type: 'u', userActive: true },
                    { id: 2, name: 'user2', type: 'u', userActive: false },
                ]}
            />,
            { serverContext: SERVER_CONTEXT }
        );
        expect(document.querySelectorAll('.row')).toHaveLength(1);
        expect(document.querySelectorAll('.principal-detail-li')).toHaveLength(1);
        expect(document.querySelectorAll('.user-link')).toHaveLength(1);
        expect(document.querySelector('.row').textContent).toBe('Membersuser1');
    });

    test('with user and group member', () => {
        renderWithAppContext(
            <MembersList
                members={[
                    { id: 1, name: 'user1', type: 'u' },
                    { id: 2, name: 'group1', type: 'g' },
                ]}
            />,
            { serverContext: SERVER_CONTEXT }
        );
        expect(document.querySelectorAll('.row')).toHaveLength(1);
        expect(document.querySelectorAll('.principal-detail-li')).toHaveLength(2);
        expect(document.querySelectorAll('.user-link')).toHaveLength(1);
        expect(document.querySelector('.row').textContent).toBe('Membersuser1group1');
    });


});
