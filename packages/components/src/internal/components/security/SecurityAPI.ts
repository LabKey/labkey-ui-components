import { Security } from '@labkey/api';

import { Container } from '../base/models/Container';

export type FetchContainerOptions = Omit<Security.GetContainersOptions, 'success' | 'failure' | 'scope'>;

export interface SecurityAPI {
    fetchContainers: (options: FetchContainerOptions, cacheKey?: string) => Promise<Record<string, Container>>;
}

const FETCH_CONTAINERS_CACHE: Record<string, Promise<Record<string, Container>>> = {};

export class SecurityAPIWrapper implements SecurityAPI {
    fetchContainers = (options: FetchContainerOptions, cacheKey?: string): Promise<Record<string, Container>> => {
        if (cacheKey && FETCH_CONTAINERS_CACHE[cacheKey]) {
            return FETCH_CONTAINERS_CACHE[cacheKey];
        }

        const result: Promise<Record<string, Container>> = new Promise((resolve, reject) => {
            Security.getContainers({
                ...options,
                success: (hierarchy: Security.ContainerHierarchy) => {
                    const containers = [
                        new Container(hierarchy),
                        // TODO: Consider filtering filter(c => c.type === 'folder') or adding option to API to exclude hidden folders
                        ...hierarchy.children.map(c => new Container(c)),
                    ];

                    const containerMap = containers.reduce((map, c) => {
                        map[c.id] = c;
                        map[c.path] = c;
                        return map;
                    }, {});

                    resolve(containerMap);
                },
                failure: error => {
                    console.error('Failed to fetch containers', error);
                    reject(error);
                },
            });
        });

        if (cacheKey) {
            FETCH_CONTAINERS_CACHE[cacheKey] = result;
        }

        return result;
    };
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
