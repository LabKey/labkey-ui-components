import { useEffect, useState } from 'react';
import { List } from 'immutable';

import { ComponentsAPIWrapper } from '../../APIWrapper';
import { isLoading, LoadingState } from '../../../public/LoadingState';
import { useAppContext } from '../../AppContext';
import { useServerContext } from '../base/ServerContext';
import { Container } from '../base/models/Container';
import { User } from '../base/models/User';
import { resolveErrorMessage } from '../../util/messaging';

function applyPermissions(container: Container, user: User): User {
    return user.merge({
        // TODO: isAdmin, canUpdate, etc...
        permissionsList: List(container.effectivePermissions),
    }) as User;
}

export interface ContainerUser {
    container: Container;
    user: User;
}

export async function getContainerUser(
    containerIdOrPath: string,
    user: User,
    api: ComponentsAPIWrapper
): Promise<ContainerUser> {
    const containers = await api.security.fetchContainers(
        {
            containerPath: containerIdOrPath,
        },
        containerIdOrPath
    );

    const container = containers[containerIdOrPath];

    return { container, user: applyPermissions(container, user) };
}

interface UseContainerUser extends ContainerUser {
    error: string;
    isLoaded: boolean;
}

export function useContainerUser(containerIdOrPath: string): UseContainerUser {
    const [container, setContainer] = useState<Container>();
    const [error, setError] = useState<string>();
    const [contextUser, setContextUser] = useState<User>();
    const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.INITIALIZED);
    const { api } = useAppContext();
    const { user } = useServerContext();

    useEffect(() => {
        if (!containerIdOrPath) return;

        (async () => {
            setError(undefined);
            setLoadingState(LoadingState.LOADING);

            let containers: Record<string, Container> = {};

            try {
                containers = await api.security.fetchContainers(
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
    }, [api, containerIdOrPath, user]);

    return { container, error, isLoaded: !isLoading(loadingState), user: contextUser };
}
