import { List, Record } from 'immutable';
import { ActionURL, PermissionTypes, UserWithPermissions } from '@labkey/api';

import { hasAllPermissions } from '../../../..';

interface IUserProps extends Partial<UserWithPermissions> {
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
    isGuest: true,
    isSignedIn: false,
    isSystemAdmin: false,

    permissionsList: List(),
};

/**
 * Model for org.labkey.api.security.User as returned by User.getUserProps()
 */
export class User extends Record(defaultUser) implements IUserProps {
    id: number;

    canDelete: boolean;
    canDeleteOwn: boolean;
    canInsert: boolean;
    canUpdate: boolean;
    canUpdateOwn: boolean;

    displayName: string;
    email: string;
    phone: string;
    avatar: string;

    isAdmin: boolean;
    isGuest: boolean;
    isSignedIn: boolean;
    isSystemAdmin: boolean;

    permissionsList: List<string>;

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
