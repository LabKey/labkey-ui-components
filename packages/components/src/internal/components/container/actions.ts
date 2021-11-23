import { useEffect, useState } from 'react';
import { List } from 'immutable';
import { PermissionTypes } from '@labkey/api';

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

        // Update permission bits that are explicitly defined on the user.
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

export interface UseContainerUser extends ContainerUser {
    error: string;
    isLoaded: boolean;
}

/**
 * React hook that supplies the container, user, and the container-relative permissions for the user.
 * @param containerIdOrPath The container id or container path to request.
 * Example:
 * ```tsx
 * const SeeUserPermissions: React.FC = () => {
 *    // This component takes a "containerPath" as a property.
 *    const { containerPath } = props;
 *
 *    // Given the "containerPath" fetch the `container` and `user`.
 *    const { container, error, isLoaded, user } = useContainerUser(containerPath);
 *
 *    if (!isLoaded) {
 *        return <LoadingSpinner />;
 *    }
 *
 *    // Display container information and utilize user permissions in the container to control display logic.
 *    return (
 *        <div>
 *            <Alert>{error}</Alert>
 *            {!!container && (
 *                <>
 *                    <span>Folder Name: {container.name}</span>
 *                    <span>Folder Path: {container.path}</span>
 *                    {user.hasInsertPermission() && <span>{user.displayName} can insert data into {container.path}.</span>>}
 *                    {user.hasDeletePermission() && <span>{user.displayName} can delete data in {container.path}.</span>>}
 *                    {user.hasDesignSampleSetsPermission() && <span>{user.displayName} can design sample types in {container.path}.</span>>}
 *                </>
 *            )}
 *        </div>
 *    );
 * };
 * ```
 */
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

            try {
                const containers = await api.security.fetchContainers({ containerPath: containerIdOrPath });
                const container_ = containers[0];
                setContainer(container_);
                setContextUser(applyPermissions(container_, user));
            } catch (e) {
                setError(resolveErrorMessage(e));
            }

            setLoadingState(LoadingState.LOADED);
        })();
    }, [api, containerIdOrPath, user]);

    return { container, error, isLoaded: !isLoading(loadingState), user: contextUser };
}
