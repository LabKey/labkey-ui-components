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
    addGroupMembers,
} from '../permissions/actions';
import { Principal, SecurityPolicy } from '../permissions/models';

export type FetchContainerOptions = Omit<Security.GetContainersOptions, 'success' | 'failure' | 'scope'>;

export interface SecurityAPIWrapper {
    addGroupMembers: (groupId: number, principalIds: any[], projectPath: string) => Promise<any>;
    createGroup: (groupName: string, projectPath: string) => Promise<any>;
    deleteGroup: (id: number, projectPath: string) => Promise<any>;
    fetchContainers: (options: FetchContainerOptions) => Promise<Container[]>;
    fetchGroups: () => Promise<any>;
    fetchPolicy: (
        containerId: string,
        principalsById: Map<number, Principal>,
        inactiveUsersById?: Map<number, Principal>
    ) => Promise<SecurityPolicy>;
    getUserLimitSettings: () => Promise<UserLimitSettings>;
    getUsers: (groupId: number) => Promise<any>;
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
    addGroupMembers = addGroupMembers;
    getUserLimitSettings = getUserLimitSettings;
}

function recurseContainerHierarchy(data: Security.ContainerHierarchy, container: Container): Container[] {
    return data.children.reduce(
        (containers, c) => containers.concat(recurseContainerHierarchy(c, new Container(c))),
        [container]
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
        addGroupMembers: mockFn(),
        getUserLimitSettings: mockFn(),
        ...overrides,
    };
}
