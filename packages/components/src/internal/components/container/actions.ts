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
    containerUsers?: { [key: string]: ContainerUser };
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
    const [container, setContainer] = useState<Container>();
    const [containerUsers, setContainerUsers] = useState<Record<string, ContainerUser>>({});
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
                let container_, contextUser_;

                const containerUsers_: Record<string, ContainerUser> = containers.reduce((cu, ct, i) => {
                    const c = ct;
                    const u = applyPermissions(c, user);

                    if (i === 0) {
                        container_ = c;
                        contextUser_ = u;
                    }

                    cu[c.path] = { container: c, user: u };
                    return cu;
                }, {});

                setContainer(container_);
                setContextUser(contextUser_);
                setContainerUsers(containerUsers_);
            } catch (e) {
                setError(resolveErrorMessage(e));
            }

            setLoadingState(LoadingState.LOADED);
        })();
    }, [api, containerIdOrPath, user]);

    return { container, containerUsers, error, isLoaded: !isLoading(loadingState), user: contextUser };
}
