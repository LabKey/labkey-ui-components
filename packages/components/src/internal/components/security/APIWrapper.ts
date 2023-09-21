import { List, Map } from 'immutable';
import { ActionURL, Ajax, Filter, Query, Security, Utils } from '@labkey/api';

import { Container } from '../base/models/Container';
import {
    fetchContainerSecurityPolicy,
    UserLimitSettings,
    getUserLimitSettings,
    processGetRolesResponse,
    fetchContainers,
} from '../permissions/actions';
import { Principal, SecurityPolicy, SecurityRole } from '../permissions/models';
import { Row, selectRows } from '../../query/selectRows';
import { SCHEMAS } from '../../schemas';
import { buildURL } from '../../url/AppURL';
import { naturalSortByProperty } from '../../../public/sort';
import { caseInsensitive, handleRequestFailure } from '../../util/utils';
import { getUserProperties } from '../user/actions';
import { flattenValuesFromRow } from '../../../public/QueryModel/QueryModel';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { processRequest } from '../../query/api';

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
    deletePolicy: (resourceId: string, containerPath?: string) => Promise<any>;
    fetchContainers: (options: FetchContainerOptions) => Promise<Container[]>;
    fetchGroups: (projectPath: string) => Promise<FetchedGroup[]>;
    fetchPolicy: (
        containerId: string,
        principalsById?: Map<number, Principal>,
        inactiveUsersById?: Map<number, Principal>
    ) => Promise<SecurityPolicy>;
    fetchRoles: () => Promise<List<SecurityRole>>;
    getAuditLogData: (columns: string, filterCol: string, filterVal: string | number) => Promise<string>;
    getDeletionSummaries: () => Promise<Summary[]>;
    getGroupMemberships: () => Promise<Row[]>;
    getInheritedProjects: (container: Container) => Promise<string[]>;
    getUserLimitSettings: (containerPath?: string) => Promise<UserLimitSettings>;
    getUserPermissions: (options: Security.GetUserPermissionsOptions) => Promise<string[]>;
    getUserProperties: (userId: number) => Promise<any>;
    getUserPropertiesForOther: (userId: number) => Promise<{ [key: string]: any }>;
    removeGroupMembers: (
        groupId: number,
        principalIds: number[],
        projectPath: string
    ) => Promise<RemoveGroupMembersResponse>;
    savePolicy: (policy: any, containerPath?: string) => Promise<any>;
    updateUserDetails: (schemaQuery: SchemaQuery, data: FormData) => Promise<any>;
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
                containerPath: options.containerPath,
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

    fetchContainers = fetchContainers;

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

    getUserPermissions = (options: Security.GetUserPermissionsOptions): Promise<string[]> => {
        return new Promise((resolve, reject) => {
            Security.getUserPermissions({
                containerPath: options.containerPath,
                success: response => {
                    const { container } = response;
                    resolve(container.effectivePermissions);
                },
                failure: error => {
                    console.error('Failed to fetch user permissions', error);
                    reject(error);
                },
            });
        });
    };

    getUserProperties = getUserProperties;

    getUserPropertiesForOther = (userId: number): Promise<{ [key: string]: any }> => {
        return new Promise((resolve, reject) => {
            selectRows({
                filterArray: [Filter.create('UserId', userId)],
                schemaQuery: SCHEMAS.CORE_TABLES.USERS,
            })
                .then(response => {
                    if (response.rows.length > 0) {
                        const row = response.rows[0];
                        const rowValues = flattenValuesFromRow(row, Object.keys(row));

                        // special case for the Groups prop as it is an array
                        rowValues.Groups = caseInsensitive(row, 'Groups');

                        resolve(rowValues);
                    } else {
                        resolve({});
                    }
                })
                .catch(error => {
                    console.error(error);
                    reject(error);
                });
        });
    };

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

    updateUserDetails = (schemaQuery: SchemaQuery, data: FormData): Promise<any> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: buildURL('user', 'updateUserDetails.api'),
                method: 'POST',
                form: data,
                success: Utils.getCallbackWrapper((response, request) => {
                    if (processRequest(response, request, reject)) return;
                    resolve(response);
                }),
                failure: handleRequestFailure(reject, 'Failed to update user details'),
            });
        });
    };

    getInheritedProjects = (container: Container): Promise<string[]> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: ActionURL.buildURL('core', 'getExtSecurityContainerTree.api', container.path),
                method: 'GET',
                params: {
                    requiredPermission: Security.PermissionTypes.Admin,
                    nodeId: container.id,
                },
                success: Utils.getCallbackWrapper(projects => {
                    const inherited = [];
                    projects.forEach(proj => {
                        if (proj.inherit) {
                            const name = proj.text.substring(0, proj.text.length - 1); // remove trailing *
                            inherited.push(name);
                        }
                    });

                    resolve(inherited);
                }),
                failure: handleRequestFailure(reject, 'Failed to get projects'),
            });
        });
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
        createGroup: mockFn(),
        deleteContainer: mockFn(),
        deleteGroup: mockFn(),
        fetchContainers: mockFn(),
        fetchGroups: mockFn(),
        fetchPolicy: mockFn(),
        fetchRoles: mockFn(),
        getAuditLogData: mockFn(),
        getDeletionSummaries: mockFn(),
        getGroupMemberships: mockFn(),
        getUserLimitSettings: mockFn(),
        getUserPermissions: mockFn(),
        getUserProperties: mockFn(),
        getUserPropertiesForOther: mockFn(),
        removeGroupMembers: mockFn(),
        updateUserDetails: mockFn(),
        savePolicy: mockFn(),
        deletePolicy: mockFn(),
        getInheritedProjects: mockFn(),
        ...overrides,
    };
}
