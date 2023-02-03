import React from 'react';

import { mountWithServerContext } from '../../testHelpers';
import { TEST_USER_APP_ADMIN } from '../../userFixtures';
import { UserLink } from '../user/UserLink';

import { MembersList } from './MembersList';

describe('MembersList', () => {
    test('empty', () => {
        const wrapper = mountWithServerContext(<MembersList members={[]} />, { user: TEST_USER_APP_ADMIN });
        expect(wrapper.find('.row')).toHaveLength(0);
        expect(wrapper.find(UserLink)).toHaveLength(0);
        wrapper.unmount();
    });

    test('with user member', () => {
        const wrapper = mountWithServerContext(<MembersList members={[{ id: 1, name: 'user1', type: 'u' }]} />, {
            user: TEST_USER_APP_ADMIN,
        });
        expect(wrapper.find('.row')).toHaveLength(1);
        expect(wrapper.find('.principal-detail-li')).toHaveLength(1);
        expect(wrapper.find(UserLink)).toHaveLength(1);
        expect(wrapper.find('.row').text()).toBe('Membersuser1');
        wrapper.unmount();
    });

    test('with group member', () => {
        const wrapper = mountWithServerContext(<MembersList members={[{ id: 2, name: 'group1', type: 'g' }]} />, {
            user: TEST_USER_APP_ADMIN,
        });
        expect(wrapper.find('.row')).toHaveLength(1);
        expect(wrapper.find('.principal-detail-li')).toHaveLength(1);
        expect(wrapper.find(UserLink)).toHaveLength(0);
        expect(wrapper.find('.row').text()).toBe('Membersgroup1');
        wrapper.unmount();
    });

    test('with user and group member', () => {
        const wrapper = mountWithServerContext(
            <MembersList
                members={[
                    { id: 1, name: 'user1', type: 'u' },
                    { id: 2, name: 'group1', type: 'g' },
                ]}
            />,
            { user: TEST_USER_APP_ADMIN }
        );
        expect(wrapper.find('.row')).toHaveLength(1);
        expect(wrapper.find('.principal-detail-li')).toHaveLength(2);
        expect(wrapper.find(UserLink)).toHaveLength(1);
        expect(wrapper.find('.row').text()).toBe('Membersuser1group1');
        wrapper.unmount();
    });
});
