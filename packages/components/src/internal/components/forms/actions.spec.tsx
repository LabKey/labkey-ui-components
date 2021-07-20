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
import { fromJS, List } from 'immutable';
import React, { FC } from 'react';
import { LoadingState } from '../../../public/LoadingState';
import { TEST_USER_EDITOR, TEST_USER_READER } from '../../../test/data/users';
import { waitForLifecycle } from '../../testHelpers';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { User } from '../base/models/User';
import { parseSelectedQuery, UsersLoader, useUsersWithPermissions } from './actions';

// Tested components
import { QuerySelectModel } from './model';

describe('form actions', () => {
    const setSelectionModel = new QuerySelectModel({
        displayColumn: 'DATA',
        id: 'selection',
        isInit: true,
    });

    const searchResults2 = fromJS({
        '789': {
            DATA: {
                value: 'C-1',
            },
        },
    });

    const searchResults3 = fromJS({
        '123': {
            DATA: {
                value: 'A-1',
            },
            NAME: {
                value: 'Ron Swanson',
            },
        },

        '456': {
            DATA: {
                value: 'B-1',
            },
            NAME: {
                value: 'Swan Ronson',
            },
        },
    });

    test('Should parse a selected query', () => {
        const parsed = parseSelectedQuery(setSelectionModel, searchResults2);

        const parsedSelectionModel = new QuerySelectModel({
            displayColumn: 'NAME',
            delimiter: ';',
        });

        const parsed2 = parseSelectedQuery(parsedSelectionModel, searchResults3);

        expect(parsed).toBe('C-1');
        expect(parsed2).toBe('Ron Swanson;Swan Ronson');
    });
});

describe('useUsersWithPermissions', () => {
    interface TestComponentProps {
        permissions: string | string[];
        loader: UsersLoader;
    }

    const TestComponent: FC<TestComponentProps> = ({ permissions, loader }) => {
        const usersState = useUsersWithPermissions(permissions, loader);
        return (
            <div>
                {usersState.loadingState !== LoadingState.LOADED && <LoadingSpinner />}
                {usersState.loadingState === LoadingState.LOADED && (
                    <div className="users-list">
                        {usersState.users.map(user => (
                            <div className="users-list__user" key={user.id}>
                                {user.displayName}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    test('state', async () => {
        const loader = jest.fn(async () => List<User>([TEST_USER_EDITOR, TEST_USER_READER]));
        const wrapper = mount(<TestComponent permissions={[PermissionTypes.Read]} loader={loader} />);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);
        expect(wrapper.find('.users-list__user').at(0).text()).toEqual(TEST_USER_EDITOR.displayName);
        expect(wrapper.find('.users-list__user').at(1).text()).toEqual(TEST_USER_READER.displayName);
    });

    test('reload permissions', async () => {
        const loader = jest.fn(async () => List<User>([TEST_USER_EDITOR, TEST_USER_READER]));
        const wrapper = mount(<TestComponent permissions={[PermissionTypes.Read]} loader={loader} />);
        expect(loader).toHaveBeenCalledWith([PermissionTypes.Read]);
        wrapper.setProps({ permissions: [PermissionTypes.Delete, PermissionTypes.Update]});
        expect(loader).toHaveBeenCalledWith([PermissionTypes.Delete, PermissionTypes.Update]);
    });
});
