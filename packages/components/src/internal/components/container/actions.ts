import { useEffect, useState } from 'react';
import { List, Record } from 'immutable';
import { Security } from '@labkey/api';

import { User } from '../base/models/User';
import { isLoading, LoadingState } from '../../../public/LoadingState';
import { useServerContext } from '../base/ServerContext';
import { resolveErrorMessage } from '../../util/messaging';
import { Container } from '../base/models/Container';

function applyPermissions(container: Container, user: User): User {
    return user.merge({
        // TODO: isAdmin, canUpdate, etc...
        permissionsList: List(container.effectivePermissions),
    }) as User;
}

type FetchContainersResult = Promise<Record<string, Container>>;
type FetchContainerOptions = Omit<Security.GetContainersOptions, 'success' | 'failure' | 'scope'>;

const FETCH_CONTAINERS_CACHE: Record<string, FetchContainersResult> = {};

export function fetchContainers(options: FetchContainerOptions, cacheKey?: string): FetchContainersResult {
    if (cacheKey && FETCH_CONTAINERS_CACHE[cacheKey]) {
        return FETCH_CONTAINERS_CACHE[cacheKey];
    }

    const result: FetchContainersResult = new Promise((resolve, reject) => {
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
}

export interface ViewContext {
    container: Container;
    user: User;
}

export async function getViewContext(containerIdOrPath: string, user: User): Promise<ViewContext> {
    const containers = await fetchContainers(
        {
            containerPath: containerIdOrPath,
        },
        containerIdOrPath
    );

    const container = containers[containerIdOrPath];

    return { container, user: applyPermissions(container, user) };
}

interface UseViewContext extends ViewContext {
    error: string;
    isLoaded: boolean;
}

export function useViewContext(containerIdOrPath: string): UseViewContext {
    const [container, setContainer] = useState<Container>();
    const [error, setError] = useState<string>();
    const [contextUser, setContextUser] = useState<User>();
    const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.INITIALIZED);
    const { user } = useServerContext();

    useEffect(() => {
        if (!containerIdOrPath) return;

        (async () => {
            setError(undefined);
            setLoadingState(LoadingState.LOADING);

            let containers = {};

            try {
                containers = await fetchContainers(
                    {
                        containerPath: containerIdOrPath,
                    },
                    containerIdOrPath
                );
            } catch (e) {
                setError(resolveErrorMessage(e));
            }

            const container_ = containers[containerIdOrPath];
            const contextUser_ = applyPermissions(container_, user);

            setContainer(container_);
            setContextUser(contextUser_);
            setLoadingState(LoadingState.LOADED);
        })();
    }, [containerIdOrPath, user]);

    return { container, error, isLoaded: !isLoading(loadingState), user: contextUser };
}
