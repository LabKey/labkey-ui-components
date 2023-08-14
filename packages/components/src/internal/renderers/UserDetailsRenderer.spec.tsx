import React from 'react';

import { fromJS } from 'immutable';

import { mountWithAppServerContext } from '../test/enzymeTestHelpers';

import { TEST_USER_APP_ADMIN } from '../userFixtures';
import { UserLink } from '../components/user/UserLink';

import { UserDetailsRenderer } from './UserDetailsRenderer';

describe('UserDetailsRenderer', () => {
    test('no data', () => {
        let wrapper = mountWithAppServerContext(
            <UserDetailsRenderer data={undefined} />,
            {},
            { user: TEST_USER_APP_ADMIN }
        );
        expect(wrapper.find(UserLink)).toHaveLength(0);
        wrapper.unmount();

        wrapper = mountWithAppServerContext(<UserDetailsRenderer data={null} />, {}, { user: TEST_USER_APP_ADMIN });
        expect(wrapper.find(UserLink)).toHaveLength(0);
        wrapper.unmount();
    });

    test('with data', () => {
        let wrapper = mountWithAppServerContext(
            <UserDetailsRenderer data={fromJS({})} />,
            {},
            { user: TEST_USER_APP_ADMIN }
        );
        expect(wrapper.find(UserLink)).toHaveLength(1);
        wrapper.unmount();

        wrapper = mountWithAppServerContext(
            <UserDetailsRenderer data={fromJS({ value: 1, displayValue: 'test' })} />,
            {},
            {
                user: TEST_USER_APP_ADMIN,
            }
        );
        expect(wrapper.find(UserLink)).toHaveLength(1);
        wrapper.unmount();
    });
});
