import React from 'react';
import { mount } from 'enzyme';

import { TEST_USER_READER } from '../../userFixtures';
import { FileInput } from '../forms/input/FileInput';
import { TextInput } from '../forms/input/TextInput';

import { getTestAPIWrapper } from '../../APIWrapper';
import { waitForLifecycle } from '../../test/enzymeTestHelpers';

import { getQueryTestAPIWrapper } from '../../query/APIWrapper';
import { makeQueryInfo } from '../../test/testHelpers';
import usersQueryInfo from '../../../test/data/users-getQueryDetails.json';

import { UserProfile } from './UserProfile';

describe('UserProfile', () => {
    test('without state, except queryInfo', async () => {
        const QUERY_INFO = makeQueryInfo(usersQueryInfo);
        const API = getTestAPIWrapper(jest.fn, {
            query: getQueryTestAPIWrapper(jest.fn, {
                getQueryDetails: jest.fn().mockResolvedValue(QUERY_INFO),
            }),
        });

        const wrapper = mount(
            <UserProfile
                api={API}
                user={TEST_USER_READER}
                userProperties={{}}
                onSuccess={jest.fn()}
                setIsDirty={jest.fn()}
            />
        );

        await waitForLifecycle(wrapper);

        expect(wrapper.find('.user-section-header')).toHaveLength(2);
        expect(wrapper.find('img')).toHaveLength(1);
        expect(wrapper.find(FileInput)).toHaveLength(1);
        expect(wrapper.find('.user-text-link')).toHaveLength(0);
        expect(wrapper.find(TextInput)).toHaveLength(5);
        expect(wrapper.find('input').findWhere(input => input.prop('disabled'))).toHaveLength(1); // email disabled
        expect(wrapper.find('button')).toHaveLength(1);

        wrapper.unmount();
    });
});
