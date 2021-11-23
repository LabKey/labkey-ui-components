import { Security } from '@labkey/api';

import { Container } from '../base/models/Container';

export type FetchContainerOptions = Omit<Security.GetContainersOptions, 'success' | 'failure' | 'scope'>;

export interface SecurityAPI {
    fetchContainers: (options: FetchContainerOptions) => Promise<Container[]>;
}

export class SecurityAPIWrapper implements SecurityAPI {
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
    overrides: Partial<SecurityAPI> = {}
): SecurityAPI {
    return {
        fetchContainers: mockFn(),
        ...overrides,
    };
}
