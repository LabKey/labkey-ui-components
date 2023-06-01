/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { PermissionTypes } from '@labkey/api';
import { mount } from 'enzyme';
import React, { FC } from 'react';

import { LoadingState } from '../../../public/LoadingState';
import { TEST_USER_EDITOR, TEST_USER_READER } from '../../userFixtures';
import { waitForLifecycle } from '../../test/enzymeTestHelpers';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { UsersLoader, useUsersWithPermissions } from './actions';

// Tested components
describe('useUsersWithPermissions', () => {
    interface TestComponentProps {
        containerPath: string;
        permissions: string | string[];
        loader: UsersLoader;
    }

    const TestComponent: FC<TestComponentProps> = ({ containerPath, permissions, loader }) => {
        const { error, loadingState, users } = useUsersWithPermissions(permissions, containerPath, loader);
        return (
            <div>
                {loadingState !== LoadingState.LOADED && <LoadingSpinner />}
                {loadingState === LoadingState.LOADED && users !== undefined && (
                    <div className="users-list">
                        {users.map(user => (
                            <div className="users-list__user" key={user.id}>
                                {user.displayName}
                            </div>
                        ))}
                    </div>
                )}
                {loadingState === LoadingState.LOADED && error !== undefined && (
                    <div className="users-error">{error}</div>
                )}
            </div>
        );
    };

    test('state', async () => {
        const error = 'There was a problem retrieving users with the given permissions';
        const containerPath = '/';
        const loader = jest.fn().mockResolvedValue([TEST_USER_EDITOR, TEST_USER_READER]);
        const wrapper = mount(
            <TestComponent containerPath={containerPath} permissions={[PermissionTypes.Read]} loader={loader} />
        );
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);
        expect(wrapper.find('.users-list__user').at(0).text()).toEqual(TEST_USER_EDITOR.displayName);
        expect(wrapper.find('.users-list__user').at(1).text()).toEqual(TEST_USER_READER.displayName);
        wrapper.setProps({
            loader: () => {
                throw error;
            },
        });
        await waitForLifecycle(wrapper);
        expect(wrapper.find('.users-error').text()).toEqual(error);
    });

    test('reload permissions', async () => {
        const containerPath = '/';
        const loader = jest.fn().mockResolvedValue([TEST_USER_EDITOR, TEST_USER_READER]);
        const wrapper = mount(
            <TestComponent containerPath={containerPath} permissions={[PermissionTypes.Read]} loader={loader} />
        );
        await waitForLifecycle(wrapper);
        expect(loader).toHaveBeenCalledWith([PermissionTypes.Read], containerPath);
        wrapper.setProps({ permissions: [PermissionTypes.Delete, PermissionTypes.Update] });
        await waitForLifecycle(wrapper);
        expect(loader).toHaveBeenCalledWith([PermissionTypes.Delete, PermissionTypes.Update], containerPath);
    });
});
