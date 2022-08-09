import { Security } from '@labkey/api';
import { Map } from 'immutable';

import { Container } from '../base/models/Container';
import { fetchContainerSecurityPolicy, UserLimitSettings, getUserLimitSettings } from '../permissions/actions';
import { Principal, SecurityPolicy } from '../permissions/models';

export type FetchContainerOptions = Omit<Security.GetContainersOptions, 'success' | 'failure' | 'scope'>;

export interface SecurityAPIWrapper {
    fetchContainers: (options: FetchContainerOptions) => Promise<Container[]>;
    fetchPolicy: (
        containerId: string,
        principalsById: Map<number, Principal>,
        inactiveUsersById?: Map<number, Principal>
    ) => Promise<SecurityPolicy>;
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
        getUserLimitSettings: mockFn(),
        ...overrides,
    };
}
