import { useEffect, useState } from 'react';
import { List } from 'immutable';
import { PermissionTypes } from '@labkey/api';

import { ComponentsAPIWrapper } from '../../APIWrapper';
import { isLoading, LoadingState } from '../../../public/LoadingState';
import { useAppContext } from '../../AppContext';
import { useServerContext } from '../base/ServerContext';
import { Container } from '../base/models/Container';
import { User } from '../base/models/User';
import { resolveErrorMessage } from '../../util/messaging';

/**
 * Applies the permissions on the container to the user. Only permission related User fields are mutated.
 */
function applyPermissions(container: Container, user: User): User {
    return user.withMutations(u => {
        // Must set "isAdmin" and "permissionsList" prior to configuring
        // permission bits (e.g. "canDelete", "canUpdate", etc).
        const contextUser = u.merge({
            isAdmin: container.effectivePermissions.indexOf(PermissionTypes.Admin) > -1,
            permissionsList: List(container.effectivePermissions),
        }) as User;

        return contextUser.merge({
            canDelete: contextUser.hasDeletePermission(),
            canDeleteOwn: contextUser.hasDeletePermission(),
            canInsert: contextUser.hasInsertPermission(),
            canUpdate: contextUser.hasUpdatePermission(),
            canUpdateOwn: contextUser.hasUpdatePermission(),
        });
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
    const containers = await api.security.fetchContainers({ containerPath: containerIdOrPath });

    if (containers.length > 0) {
        const container = containers[0];

        return {
            container,
            user: applyPermissions(container, user),
        };
    }

    return undefined;
}

export interface UseContainerUser extends ContainerUser {
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

            let containers = [];

            try {
                containers = await api.security.fetchContainers({ containerPath: containerIdOrPath });
            } catch (e) {
                setError(resolveErrorMessage(e));
            }

            const container_ = containers[0];
            setContainer(container_);

            if (container_) {
                setContextUser(applyPermissions(container_, user));
            }

            setLoadingState(LoadingState.LOADED);
        })();
    }, [api, containerIdOrPath, user]);

    return { container, error, isLoaded: !isLoading(loadingState), user: contextUser };
}
