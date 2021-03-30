import { List, Record } from 'immutable';
import { ActionURL, PermissionTypes, UserWithPermissions } from '@labkey/api';

interface IUserProps extends UserWithPermissions {
    permissionsList: List<string>;
}

const defaultUser: IUserProps = {
    id: 0,

    canDelete: false,
    canDeleteOwn: false,
    canInsert: false,
    canUpdate: false,
    canUpdateOwn: false,

    displayName: 'guest',
    email: 'guest',
    phone: null,
    avatar: ActionURL.getContextPath() + '/_images/defaultavatar.png',

    isAdmin: false,
    isAnalyst: false,
    isDeveloper: false,
    isGuest: true,
    isRootAdmin: false,
    isSignedIn: false,
    isSystemAdmin: false,
    isTrusted: false,

    maxAllowedPhi: undefined,
    permissionsList: List(),
};

/**
 * Model for org.labkey.api.security.User as returned by User.getUserProps()
 */
export class User extends Record(defaultUser) implements IUserProps {
    declare id: number;

    declare canDelete: boolean;
    declare canDeleteOwn: boolean;
    declare canInsert: boolean;
    declare canUpdate: boolean;
    declare canUpdateOwn: boolean;

    declare displayName: string;
    declare email: string;
    declare phone: string;
    declare avatar: string;

    declare isAdmin: boolean;
    declare isAnalyst: boolean;
    declare isDeveloper: boolean;
    declare isGuest: boolean;
    declare isRootAdmin: boolean;
    declare isSignedIn: boolean;
    declare isSystemAdmin: boolean;
    declare isTrusted: boolean;

    declare maxAllowedPhi: string;
    declare permissionsList: List<string>;

    static getDefaultUser(): User {
        return new User(defaultUser);
    }

    hasUpdatePermission(): boolean {
        return hasAllPermissions(this, [PermissionTypes.Update]);
    }

    hasInsertPermission(): boolean {
        return hasAllPermissions(this, [PermissionTypes.Insert]);
    }

    hasDeletePermission(): boolean {
        return hasAllPermissions(this, [PermissionTypes.Delete]);
    }

    hasDesignAssaysPermission(): boolean {
        return hasAllPermissions(this, [PermissionTypes.DesignAssay]);
    }

    hasDesignSampleSetsPermission(): boolean {
        return hasAllPermissions(this, [PermissionTypes.DesignSampleSet]);
    }

    hasManageUsersPermission(): boolean {
        return hasAllPermissions(this, [PermissionTypes.UserManagement], false);
    }

    isAppAdmin(): boolean {
        return hasAllPermissions(this, [PermissionTypes.ApplicationAdmin], false);
    }
}

/**
 * Determines if a user has all of the permissions given.  If the user has only some
 * of these permissions, returns false.
 * @param user the user in question
 * @param perms the list of permission strings (See models/constants)
 * @param checkIsAdmin boolean indicating if user.isAdmin should be used as a fallback check
 */
export function hasAllPermissions(user: User, perms: string[], checkIsAdmin = true): boolean {
    let allow = false;

    if (perms) {
        const allPerms = user.get('permissionsList');

        let hasAll = true;
        for (let i = 0; i < perms.length; i++) {
            if (allPerms.indexOf(perms[i]) === -1) {
                hasAll = false;
                break;
            }
        }
        allow = hasAll || (checkIsAdmin && user.isAdmin);
    }

    return allow;
}
