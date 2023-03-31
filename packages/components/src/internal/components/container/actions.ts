import { useEffect, useState } from 'react';
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
    // Must set "isAdmin" and "permissionsList" prior to configuring
    // permission bits (e.g. "canDelete", "canUpdate", etc).
    const contextUser = new User({
        ...user,
        isAdmin: container.effectivePermissions.indexOf(PermissionTypes.Admin) > -1,
        permissionsList: container.effectivePermissions,
    }) as User;

    return new User({
        ...contextUser,
        canDelete: contextUser.hasDeletePermission(),
        canDeleteOwn: contextUser.hasDeletePermission(),
        canInsert: contextUser.hasInsertPermission(),
        canUpdate: contextUser.hasUpdatePermission(),
        canUpdateOwn: contextUser.hasUpdatePermission(),
    });
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
 *                    {user.hasDesignSampleTypesPermission() && <span>{user.displayName} can design sample types in {container.path}.</span>>}
 *                </>
 *            )}
 *        </div>
 *    );
 * };
 * ```
 */
export function useContainerUser(containerIdOrPath: string): UseContainerUser {
    const [containerUser, setContainerUser] = useState<ContainerUser>();
    const [error, setError] = useState<string>();
    const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.INITIALIZED);
    const { api } = useAppContext();
    const { user } = useServerContext();

    useEffect(() => {
        if (!containerIdOrPath) return;

        (async () => {
            setError(undefined);
            setLoadingState(LoadingState.LOADING);

            try {
                const containers = await api.security.fetchContainers({
                    containerPath: containerIdOrPath,
                    includeSubfolders: false,
                });

                if (containers.length === 0) {
                    setError(`Failed to resolve container for path: "${containerIdOrPath}"`);
                } else {
                    const [container] = containers;
                    setContainerUser({ container, user: applyPermissions(container, user) });
                }
            } catch (e) {
                setError(resolveErrorMessage(e));
            }

            setLoadingState(LoadingState.LOADED);
        })();
    }, [api, containerIdOrPath, user]);

    return {
        container: containerUser?.container,
        error,
        isLoaded: !isLoading(loadingState),
        user: containerUser?.user,
    };
}
