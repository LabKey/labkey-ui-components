import { Security } from '@labkey/api';
import { Map } from 'immutable';

import { CreateGroupResponse } from '@labkey/api/dist/labkey/security/Group';

import { Container } from '../base/models/Container';
import { fetchContainerSecurityPolicy, UserLimitSettings, getUserLimitSettings } from '../permissions/actions';
import { Principal, SecurityPolicy } from '../permissions/models';

export type FetchContainerOptions = Omit<Security.GetContainersOptions, 'success' | 'failure' | 'scope'>;
export interface FetchedGroup {
    id: number;
    isProjectGroup: boolean;
    isSystemGroup: boolean;
    name: string;
    type: string;
}
export interface DeleteGroupResponse {
    deleted: number;
}
export interface AddGroupMembersResponse {
    added: number[];
}
export interface RemoveGroupMembersResponse {
    removed: number[];
}

export interface SecurityAPIWrapper {
    addGroupMembers: (groupId: number, principalIds: number[], projectPath: string) => Promise<AddGroupMembersResponse>;
    createGroup: (groupName: string, projectPath: string) => Promise<CreateGroupResponse>;
    deleteGroup: (id: number, projectPath: string) => Promise<DeleteGroupResponse>;
    fetchContainers: (options: FetchContainerOptions) => Promise<Container[]>;
    fetchGroups: (projectPath: string) => Promise<FetchedGroup[]>;
    fetchPolicy: (
        containerId: string,
        principalsById: Map<number, Principal>,
        inactiveUsersById?: Map<number, Principal>
    ) => Promise<SecurityPolicy>;
    getUserLimitSettings: () => Promise<UserLimitSettings>;
    removeGroupMembers: (
        groupId: number,
        principalIds: number[],
        projectPath: string
    ) => Promise<RemoveGroupMembersResponse>;
}

export class ServerSecurityAPIWrapper implements SecurityAPIWrapper {
    addGroupMembers = (
        groupId: number,
        principalIds: number[],
        projectPath: string
    ): Promise<AddGroupMembersResponse> => {
        return new Promise((resolve, reject) => {
            Security.addGroupMembers({
                groupId,
                principalIds,
                containerPath: projectPath,
                success: data => {
                    resolve(data);
                },
                failure: error => {
                    console.error('Failed to add group member(s)', error);
                    reject(error);
                },
            });
        });
    };

    createGroup = (groupName: string, projectPath: string): Promise<CreateGroupResponse> => {
        return new Promise((resolve, reject) => {
            Security.createGroup({
                groupName,
                containerPath: projectPath,
                success: data => {
                    resolve(data);
                },
                failure: error => {
                    console.error('Failed to create group', error);
                    reject(error);
                },
            });
        });
    };

    deleteGroup = (groupId: number, projectPath: string): Promise<DeleteGroupResponse> => {
        return new Promise((resolve, reject) => {
            Security.deleteGroup({
                groupId,
                containerPath: projectPath,
                success: data => {
                    resolve(data);
                },
                failure: error => {
                    console.error('Failed to delete group', error);
                    reject(error);
                },
            });
        });
    };

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

    fetchGroups = (projectPath: string): Promise<FetchedGroup[]> => {
        return new Promise((resolve, reject) => {
            Security.getGroupPermissions({
                containerPath: projectPath,
                success: data => {
                    resolve(data?.container?.groups);
                },
                failure: error => {
                    console.error('Failed to fetch group permissions', error);
                    reject(error);
                },
            });
        });
    };

    // Used in labbook module
    fetchPolicy = fetchContainerSecurityPolicy;

    // Used in platform/core
    getUserLimitSettings = getUserLimitSettings;

    removeGroupMembers = (
        groupId: number,
        principalIds: number[],
        projectPath: string
    ): Promise<RemoveGroupMembersResponse> => {
        return new Promise((resolve, reject) => {
            Security.removeGroupMembers({
                groupId,
                principalIds,
                containerPath: projectPath,
                success: data => {
                    resolve(data);
                },
                failure: error => {
                    console.error('Failed to remove group member(s)', error);
                    reject(error);
                },
            });
        });
    };
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
        createGroup: mockFn(),
        deleteGroup: mockFn(),
        addGroupMembers: mockFn(),
        removeGroupMembers: mockFn(),
        getUserLimitSettings: mockFn(),
        ...overrides,
    };
}
