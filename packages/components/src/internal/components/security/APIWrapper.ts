import { Map } from 'immutable';
import { Ajax, Filter, Query, Security, Utils } from '@labkey/api';

import { Container } from '../base/models/Container';
import { fetchContainerSecurityPolicy, UserLimitSettings, getUserLimitSettings } from '../permissions/actions';
import { Principal, SecurityPolicy } from '../permissions/models';
import { Row } from '../../query/selectRows';
import { SCHEMAS } from '../../schemas';
import { buildURL } from '../../url/AppURL';
import { naturalSortByProperty } from '../../../public/sort';
import { handleRequestFailure } from '../../util/utils';

export type FetchContainerOptions = Omit<Security.GetContainersOptions, 'success' | 'failure' | 'scope'>;

export interface Summary {
    count: number;
    noun: string;
}

export interface FetchedGroup {
    id: number;
    isProjectGroup: boolean;
    name: string;
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
    createGroup: (groupName: string, projectPath: string) => Promise<Security.CreateGroupResponse>;
    deleteContainer: (options: Security.DeleteContainerOptions) => Promise<Record<string, unknown>>;
    deleteGroup: (id: number, projectPath: string) => Promise<DeleteGroupResponse>;
    fetchContainers: (options: FetchContainerOptions) => Promise<Container[]>;
    fetchGroups: (projectPath: string) => Promise<FetchedGroup[]>;
    fetchPolicy: (
        containerId: string,
        principalsById?: Map<number, Principal>,
        inactiveUsersById?: Map<number, Principal>
    ) => Promise<SecurityPolicy>;
    getAuditLogData: (columns: string, filterCol: string, filterVal: string | number) => Promise<string>;
    getDeletionSummaries: () => Promise<Summary[]>;
    getGroupMemberships: () => Promise<Row[]>;
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

    createGroup = (groupName: string, projectPath: string): Promise<Security.CreateGroupResponse> => {
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

    deleteContainer = (options: Security.DeleteContainerOptions): Promise<Record<string, unknown>> => {
        return new Promise((resolve, reject) => {
            Security.deleteContainer({
                comment: options.comment,
                success: data => {
                    resolve(data);
                },
                failure: error => {
                    console.error('Failed to delete project', error);
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

    fetchPolicy = fetchContainerSecurityPolicy;

    getAuditLogData = (columns: string, filterCol: string, filterVal: string | number): Promise<string> => {
        return new Promise((resolve, reject) => {
            Query.selectRows({
                method: 'POST',
                schemaName: SCHEMAS.AUDIT_TABLES.SCHEMA,
                queryName: 'GroupAuditEvent',
                columns,
                filterArray: [Filter.create(filterCol, filterVal, Filter.Types.EQUAL)],
                containerFilter: Query.ContainerFilter.allFolders,
                sort: '-Date',
                maxRows: 1,
                success: response => {
                    resolve(response.rows.length ? response.rows[0].Date : '');
                },
                failure: error => {
                    console.error('Failed to fetch group memberships', error);
                    reject(error);
                },
            });
        });
    };

    getDeletionSummaries = (): Promise<Summary[]> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: buildURL('core', 'getModuleSummary.api'),
                success: Utils.getCallbackWrapper(response => {
                    const { moduleSummary } = response;
                    moduleSummary.sort(naturalSortByProperty('noun'));
                    resolve(moduleSummary);
                }),
                failure: handleRequestFailure(reject, 'Failed to retrieve deletion summary.'),
            });
        });
    };

    getGroupMemberships = (): Promise<Row[]> => {
        return new Promise((resolve, reject) => {
            Query.selectRows({
                method: 'POST',
                schemaName: 'core',
                queryName: 'Members',
                columns: 'UserId,GroupId,GroupId/Name,UserId/DisplayName,UserId/Email',
                success: response => {
                    resolve(response.rows);
                },
                failure: error => {
                    console.error('Failed to fetch group memberships', error);
                    reject(error);
                },
            });
        });
    };

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
        addGroupMembers: mockFn(),
        createGroup: mockFn(),
        deleteContainer: mockFn(),
        deleteGroup: mockFn(),
        fetchContainers: mockFn(),
        fetchGroups: mockFn(),
        fetchPolicy: mockFn(),
        getAuditLogData: mockFn(),
        getDeletionSummaries: mockFn(),
        getGroupMemberships: mockFn(),
        getUserLimitSettings: mockFn(),
        removeGroupMembers: mockFn(),
        ...overrides,
    };
}
