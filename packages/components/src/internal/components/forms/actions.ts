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
import { PermissionTypes, Security, User } from '@labkey/api';
import { useCallback, useEffect, useState } from 'react';

import { updateRows } from '../../query/api';

import { naturalSortByProperty } from '../../../public/sort';

import { LoadingState } from '../../../public/LoadingState';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

// "target" is not typed as an Element in base TypeScript library due to non-DOM events
// Not exactly correct typings but suffices for the usages below
// https://stackoverflow.com/q/28900077
interface ITargetElementEvent {
    keyCode: number;
    preventDefault(): void;
    target: HTMLInputElement;
}

export function handleInputTab(evt: ITargetElementEvent): void {
    if (evt.keyCode === 9) {
        // tab
        const element = evt.target;
        evt.preventDefault();
        const s = element.selectionStart;
        element.value = element.value.substring(0, s) + '\t' + element.value.substring(element.selectionEnd);
        element.selectionEnd = s + 1;
    }
}

export function handleTabKeyOnTextArea(evt: ITargetElementEvent): void {
    if (evt && evt.target && evt.target.type === 'textarea') {
        handleInputTab(evt);
    }
}

/**
 * Retrieve users in current container with a given set of permissions.  If no permission is specified, defaults to Read
 * permission
 * @param permissions the PermissionType or array of PermissionType values that all users must have.
 * @param containerPath the path of the container to request user permissions from. If not specified, then it defaults
 * to the page context's container.
 * @param includeInactive flag to optionally return inactive users
 */
export function getUsersWithPermissions(
    permissions?: string | string[],
    containerPath?: string,
    includeInactive?: boolean
): Promise<User[]> {
    return new Promise((resolve, reject) => {
        return Security.getUsersWithPermissions({
            containerPath,
            permissions: permissions ?? PermissionTypes.Read,
            includeInactive,
            requiredVersion: 23.11,
            success: ({ users }) => {
                users.sort(naturalSortByProperty('displayName'));
                resolve(users);
            },
            failure: response => {
                console.error('There was a problem retrieving users with permissions ', permissions, response);
                reject('There was a problem retrieving users with the given permissions');
            },
        });
    });
}

export type UsersLoader = (permissions: string | string[], containerPath?: string) => Promise<User[]>;

interface UsersState {
    error: string;
    loadingState: LoadingState;
    users: User[];
}

export function useUsersWithPermissions(
    permissions: string | string[] = PermissionTypes.Read,
    containerPath?: string,
    loader: UsersLoader = getUsersWithPermissions
): UsersState {
    const [users, setUsers_] = useState<User[]>();
    const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [error, setError] = useState<string>();
    const load = useCallback(async () => {
        setLoadingState(LoadingState.LOADING);

        try {
            const users_ = await loader(permissions, containerPath);
            setUsers_(users_);
        } catch (e) {
            setError(e);
        } finally {
            setLoadingState(LoadingState.LOADED);
        }
    }, [containerPath, loader, permissions]);

    useEffect(() => {
        load();
    }, [load]);

    return { error, loadingState, users };
}

export function updateRowFieldValue(model: QueryModel, name: string, value: any): Promise<any> {
    return updateRows({
        schemaQuery: model.schemaQuery,
        rows: [
            {
                rowId: model.getRowValue('rowId'),
                [name]: value,
            },
        ],
        containerPath: model.containerPath,
    });
}
