import {ActionURL, Ajax, Security, Utils} from '@labkey/api';
import { Map } from 'immutable';

import { Container } from '../base/models/Container';
import { fetchContainerSecurityPolicy } from '../permissions/actions';
import { Principal, SecurityPolicy } from '../permissions/models';

export type FetchContainerOptions = Omit<Security.GetContainersOptions, 'success' | 'failure' | 'scope'>;

export type UserLimitSettings = {
    activeUsers: number;
    messageHtml: string;
    remainingUsers: number;
    success: boolean;
    userLimitLevel: number;
    userLimit: boolean;
};

export interface SecurityAPIWrapper {
    getUserLimitSettings: () => Promise<UserLimitSettings>;
    fetchContainers: (options: FetchContainerOptions) => Promise<Container[]>;
    fetchPolicy: (
        containerId: string,
        principalsById: Map<number, Principal>,
        inactiveUsersById?: Map<number, Principal>
    ) => Promise<SecurityPolicy>;
}

export class ServerSecurityAPIWrapper implements SecurityAPIWrapper {
    getUserLimitSettings = (): Promise<UserLimitSettings> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: ActionURL.buildURL('user', 'getuserLimitSettings.api'),
                method: 'GET',
                scope: this,
                success: Utils.getCallbackWrapper(settings => {
                    resolve(settings as UserLimitSettings);
                }),
                failure: Utils.getCallbackWrapper(error => {
                    console.error(error);
                    reject(error);
                }),
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
    fetchPolicy = fetchContainerSecurityPolicy;
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
        getUserLimitSettings: mockFn(),
        fetchContainers: mockFn(),
        fetchPolicy: mockFn(),
        ...overrides,
    };
}
