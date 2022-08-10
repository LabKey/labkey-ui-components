import { Security } from '@labkey/api';
import { Map } from 'immutable';

import { Container } from '../base/models/Container';
import {
    fetchContainerSecurityPolicy,
    UserLimitSettings,
    getUserLimitSettings,
    fetchGroupPermissions,
    getUsers,
    createGroup,
    deleteGroup,
} from '../permissions/actions';
import { Principal, SecurityPolicy } from '../permissions/models';
import { naturalSortByProperty } from '../../..';

export type FetchContainerOptions = Omit<Security.GetContainersOptions, 'success' | 'failure' | 'scope'>;

export interface SecurityAPIWrapper {
    fetchContainers: (options: FetchContainerOptions) => Promise<Container[]>;
    fetchPolicy: (
        containerId: string,
        principalsById: Map<number, Principal>,
        inactiveUsersById?: Map<number, Principal>
    ) => Promise<SecurityPolicy>;
    fetchGroups: () => Promise<any>;
    getUsers: (groupId: number) => Promise<any>;
    createGroup: (groupName: string, projectPath: string) => Promise<any>;
    deleteGroup: (id: number, projectPath: string) => Promise<any>;
    getUserLimitSettings: () => Promise<UserLimitSettings>;
}

export class ServerSecurityAPIWrapper implements SecurityAPIWrapper {
    fetchContainers = (options: FetchContainerOptions): Promise<Container[]> => {
        return new Promise((resolve, reject) => {
            Security.getContainers({
                ...options,
                success: (data: Security.ContainerHierarchy) => {
                    resolve(recurseContainerHierarchy(data, new Container(data)));
                },
                failure: error => {
                    console.error('Failed to fetch containers', error);
                    reject(error);
                },
            });
        });
    };
    fetchPolicy = fetchContainerSecurityPolicy;
    fetchGroups = fetchGroupPermissions;
    getUsers = getUsers;
    createGroup = createGroup;
    deleteGroup = deleteGroup;
    getUserLimitSettings = getUserLimitSettings;
}

function recurseContainerHierarchy(data: Security.ContainerHierarchy, container: Container): Container[] {
    return (
        data.children
            .reduce((containers, c) => containers.concat(recurseContainerHierarchy(c, new Container(c))), [container])
            // Issue 45805: sort folders by title as server-side sorting is insufficient
            .sort(naturalSortByProperty('title'))
    );
}

/**
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export function getSecurityTestAPIWrapper(
    mockFn = (): any => () => {},
    overrides: Partial<SecurityAPIWrapper> = {}
): SecurityAPIWrapper {
    return {
        fetchContainers: mockFn(),
        fetchPolicy: mockFn(),
        fetchGroups: mockFn(),
        getUsers: mockFn(),
        createGroup: mockFn(),
        deleteGroup: mockFn(),
        getUserLimitSettings: mockFn(),
        ...overrides,
    };
}
