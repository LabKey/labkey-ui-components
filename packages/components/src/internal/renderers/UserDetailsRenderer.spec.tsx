import React from 'react';

import { fromJS } from 'immutable';

import { mountWithServerContext } from '../testHelpers';

import { TEST_USER_APP_ADMIN } from '../userFixtures';
import { UserLink } from '../components/user/UserLink';

import { UserDetailsRenderer } from './UserDetailsRenderer';

describe('UserDetailsRenderer', () => {
    test('no data', () => {
        let wrapper = mountWithServerContext(<UserDetailsRenderer data={undefined} />, { user: TEST_USER_APP_ADMIN });
        expect(wrapper.find(UserLink)).toHaveLength(0);
        wrapper.unmount();

        wrapper = mountWithServerContext(<UserDetailsRenderer data={null} />, { user: TEST_USER_APP_ADMIN });
        expect(wrapper.find(UserLink)).toHaveLength(0);
        wrapper.unmount();
    });

    test('with data', () => {
        let wrapper = mountWithServerContext(<UserDetailsRenderer data={fromJS({})} />, { user: TEST_USER_APP_ADMIN });
        expect(wrapper.find(UserLink)).toHaveLength(1);
        wrapper.unmount();

        wrapper = mountWithServerContext(<UserDetailsRenderer data={fromJS({ value: 1, displayValue: 'test' })} />, {
            user: TEST_USER_APP_ADMIN,
        });
        expect(wrapper.find(UserLink)).toHaveLength(1);
        wrapper.unmount();
    });
});
