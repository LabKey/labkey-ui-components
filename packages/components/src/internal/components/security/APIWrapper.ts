import { List, Map } from 'immutable';
import { ActionURL, Filter, Query, Security, User, Utils } from '@labkey/api';

import { Container } from '../base/models/Container';
import {
    fetchContainers,
    fetchContainerSecurityPolicy,
    getUserLimitSettings,
    processGetRolesResponse,
    UserLimitSettings,
} from '../permissions/actions';
import { Principal, SecurityPolicy, SecurityRole } from '../permissions/models';
import { selectRows } from '../../query/selectRows';
import { SCHEMAS } from '../../schemas';
import { naturalSortByProperty } from '../../../public/sort';
import { caseInsensitive } from '../../util/utils';
import { request } from '../../request';
import { getUserProperties } from '../user/actions';
import { flattenValuesFromRow } from '../../../public/QueryModel/QueryModel';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { deleteRows, QueryCommandResponse } from '../../query/api';
import { GroupMembership } from '../administration/models';
import { getUsersWithPermissions } from '../forms/actions';
import { checkPermissions } from '../base/models/User';

type NonRequestCallback<T extends Utils.RequestCallbackOptions> = Omit<T, 'failure' | 'scope' | 'success'>;
export type DeleteContainerOptions = NonRequestCallback<Security.DeleteContainerOptions>;
export type FetchContainerOptions = NonRequestCallback<Security.GetContainersOptions>;
export type GetUserPermissionsOptions = NonRequestCallback<Security.GetUserPermissionsOptions>;

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
    createApiKey: (type?: string, description?: string) => Promise<string>;
    createGroup: (groupName: string, projectPath: string) => Promise<Security.CreateGroupResponse>;
    deleteApiKeys: (selections: Set<string>) => Promise<QueryCommandResponse>;
    deleteContainer: (options: DeleteContainerOptions) => Promise<Record<string, unknown>>;
    deleteGroup: (id: number, projectPath: string) => Promise<DeleteGroupResponse>;
    deletePolicy: (resourceId: string, containerPath?: string) => Promise<any>;
    fetchContainers: (options: FetchContainerOptions) => Promise<Container[]>;
    fetchGroups: (
        projectPath: string,
        permissions?: string | string[],
        checkIsAdmin?: boolean,
        permissionCheck?: 'all' | 'any'
    ) => Promise<FetchedGroup[]>;
    fetchPolicy: (
        containerId: string,
        principalsById?: Map<number, Principal>,
        inactiveUsersById?: Map<number, Principal>
    ) => Promise<SecurityPolicy>;
    fetchRoles: () => Promise<List<SecurityRole>>;
    getAuditLogDate: (filterCol: string, filterVal: number | string) => Promise<string>;
    getDeletionSummaries: (containerPath?: string) => Promise<Summary[]>;
    getGroupMemberships: () => Promise<GroupMembership[]>;
    getInheritedContainers: (container: Container) => Promise<string[]>;
    getUserLimitSettings: (containerPath?: string) => Promise<UserLimitSettings>;
    getUserPermissions: (options: GetUserPermissionsOptions) => Promise<string[]>;
    getUserProperties: (userId: number) => Promise<any>;
    getUserPropertiesForOther: (userId: number) => Promise<Record<string, any>>;
    getUsersWithPermissions: (
        permissions?: string | string[],
        containerPath?: string,
        includeInactive?: boolean
    ) => Promise<User[]>;
    removeGroupMembers: (
        groupId: number,
        principalIds: number[],
        projectPath: string
    ) => Promise<RemoveGroupMembersResponse>;
    savePolicy: (policy: any, containerPath?: string) => Promise<any>;
    updateUserDetails: (data: FormData) => Promise<any>;
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

    createApiKey = async (type = 'apikey', description?: string): Promise<string> => {
        const response = await request<{ apikey: string }>({
            url: ActionURL.buildURL('security', 'createApiKey.api'),
            method: 'POST',
            jsonData: { type, description },
            errorLogMsg: 'Problem generating the apiKey for this user.',
        });

        return response.apikey;
    };

    deleteApiKeys(selections: Set<string>): Promise<QueryCommandResponse> {
        const rows = [];
        selections.forEach(selection => {
            rows.push({ rowId: selection });
        });

        return deleteRows({
            schemaQuery: SCHEMAS.CORE_TABLES.USER_API_KEYS,
            rows,
        });
    }

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

    deleteContainer = (options: DeleteContainerOptions): Promise<Record<string, unknown>> => {
        return new Promise((resolve, reject) => {
            Security.deleteContainer({
                ...(options ?? {}),
                success: data => {
                    resolve(data);
                },
                failure: error => {
                    console.error('Failed to delete folder', error);
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

    fetchContainers = fetchContainers;

    fetchGroups = (
        projectPath: string,
        permissions?: string | string[],
        checkIsAdmin?: boolean,
        permissionCheck?: 'all' | 'any'
    ): Promise<FetchedGroup[]> => {
        return new Promise((resolve, reject) => {
            Security.getGroupPermissions({
                containerPath: projectPath,
                success: data => {
                    const groups = data?.container?.groups;
                    if (!permissions) resolve(groups);

                    const perms = typeof permissions === 'string' ? [permissions] : permissions;
                    const groupsWithPerm = groups?.filter(group => {
                        return checkPermissions(
                            group.id === -1 /* Administrators group*/,
                            group.effectivePermissions,
                            perms,
                            checkIsAdmin,
                            permissionCheck
                        );
                    });
                    resolve(groupsWithPerm);
                },
                failure: error => {
                    console.error('Failed to fetch group permissions', error);
                    reject(error);
                },
            });
        });
    };

    fetchPolicy = fetchContainerSecurityPolicy;

    fetchRoles = (): Promise<List<SecurityRole>> => {
        return new Promise((resolve, reject) => {
            Security.getRoles({
                success: rawRoles => {
                    const roles = processGetRolesResponse(rawRoles);
                    resolve(roles);
                },
                failure: e => {
                    console.error('Failed to load security roles', e);
                    reject(e);
                },
            });
        });
    };

    getAuditLogDate = async (filterCol: string, filterVal: number | string): Promise<string> => {
        const result = await selectRows({
            columns: ['Date'],
            containerFilter: Query.ContainerFilter.allFolders,
            filterArray: [Filter.create(filterCol, filterVal, Filter.Types.EQUAL)],
            maxRows: 1,
            schemaQuery: new SchemaQuery(SCHEMAS.AUDIT_TABLES.SCHEMA, 'GroupAuditEvent'),
            sort: '-Date',
        });

        if (result.rows.length === 0) {
            return '';
        }

        const dateRow = caseInsensitive(result.rows[0], 'Date');
        return dateRow.formattedValue ?? dateRow.value;
    };

    getDeletionSummaries = async (containerPath?: string): Promise<Summary[]> => {
        const { moduleSummary } = await request<{ moduleSummary: Summary[] }>({
            url: ActionURL.buildURL('core', 'getModuleSummary.api', containerPath),
            errorLogMsg: 'Failed to retrieve deletion summary.',
        });
        moduleSummary.sort(naturalSortByProperty('noun'));
        return moduleSummary;
    };

    getGroupMemberships = async (): Promise<GroupMembership[]> => {
        const result = await selectRows({
            columns: ['GroupId', 'GroupId/Name', 'UserId', 'UserId/DisplayName', 'UserId/Email', 'UserId/Active'],
            schemaQuery: new SchemaQuery('core', 'Members'),
        });

        return result.rows.reduce<GroupMembership[]>((memberships, row) => {
            memberships.push({
                groupId: caseInsensitive(row, 'GroupId').value,
                groupName: caseInsensitive(row, 'GroupId/Name').value,
                userDisplayName: caseInsensitive(row, 'UserId/DisplayName').value,
                userId: caseInsensitive(row, 'UserId').value,
                userEmail: caseInsensitive(row, 'UserId/Email').value,
                userActive: caseInsensitive(row, 'UserId/Active').value
            });
            return memberships;
        }, []);
    };

    getUserLimitSettings = getUserLimitSettings;

    getUserPermissions = (options: GetUserPermissionsOptions): Promise<string[]> => {
        return new Promise((resolve, reject) => {
            Security.getUserPermissions({
                ...(options ?? {}),
                success: response => {
                    resolve(response.container.effectivePermissions);
                },
                failure: error => {
                    console.error('Failed to fetch user permissions', error);
                    reject(error);
                },
            });
        });
    };

    getUserProperties = getUserProperties;

    getUserPropertiesForOther = async (userId: number): Promise<Record<string, any>> => {
        let response = await selectRows({
            filterArray: [Filter.create('UserId', userId)],
            schemaQuery: SCHEMAS.CORE_TABLES.USERS,
        });

        // Issue 49440: User may not be in the core.Users table (if permission was removed), so check the core.SiteUsers table as well
        if (response.rows.length === 0) {
            response = await selectRows({
                filterArray: [Filter.create('UserId', userId)],
                schemaQuery: new SchemaQuery('core', 'SiteUsers'),
            });
        }

        if (response.rows.length === 0) {
            return {};
        }

        const [row] = response.rows;
        const rowValues = flattenValuesFromRow(row, Object.keys(row));

        // special case for the Groups prop as it is an array
        rowValues.Groups = caseInsensitive(row, 'Groups');

        return rowValues;
    };

    getUsersWithPermissions = getUsersWithPermissions;

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

    updateUserDetails = (form: FormData): Promise<any> => {
        return request({
            url: ActionURL.buildURL('user', 'updateUserDetails.api'),
            method: 'POST',
            form,
            errorLogMsg: 'Failed to update user details',
        });
    };

    getInheritedContainers = async (container: Container): Promise<string[]> => {
        const containers = await request<{ inherit: boolean; text: string }[]>({
            url: ActionURL.buildURL('core', 'getExtSecurityContainerTree.api', container.path),
            params: {
                requiredPermission: Security.PermissionTypes.Admin,
                nodeId: container.id,
            },
            errorLogMsg: 'Failed to get folders',
        });

        const inherited: string[] = [];
        containers.forEach(c => {
            if (c.inherit) {
                const name = c.text.substring(0, c.text.length - 1); // remove trailing *
                inherited.push(name);
            }
        });

        return inherited;
    };

    savePolicy = (policy: any, containerPath?: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            Security.savePolicy({
                policy,
                containerPath,
                success: response => {
                    resolve(response);
                },
                failure: error => {
                    console.error('Failed to save policy', error);
                    reject(error);
                },
            });
        });
    };

    deletePolicy = (resourceId: string, containerPath?: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            Security.deletePolicy({
                resourceId,
                containerPath,
                success: response => {
                    resolve(response);
                },
                failure: error => {
                    console.error('Failed to delete policy', error);
                    reject(error);
                },
            });
        });
    };
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
        createApiKey: mockFn(),
        deleteApiKeys: mockFn(),
        createGroup: mockFn(),
        deleteContainer: mockFn(),
        deleteGroup: mockFn(),
        fetchContainers: mockFn(),
        fetchGroups: mockFn(),
        fetchPolicy: mockFn(),
        fetchRoles: mockFn(),
        getAuditLogDate: mockFn(),
        getDeletionSummaries: mockFn(),
        getGroupMemberships: mockFn(),
        getUserLimitSettings: mockFn(),
        getUserPermissions: mockFn(),
        getUserProperties: mockFn(),
        getUserPropertiesForOther: mockFn(),
        getUsersWithPermissions: mockFn(),
        removeGroupMembers: mockFn(),
        updateUserDetails: mockFn(),
        savePolicy: mockFn(),
        deletePolicy: mockFn(),
        getInheritedContainers: mockFn(),
        ...overrides,
    };
}
