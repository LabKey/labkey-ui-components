import { Map } from 'immutable';
import { PermissionRoles } from '@labkey/api';

export const APPLICATION_SECURITY_ROLES = Map<string, string>([
    // [PermissionRoles.FolderAdmin, 'Power User'], removing this role until we have workspaces, group management, etc.
    [PermissionRoles.Editor, 'Editor'],
    [PermissionRoles.Reader, 'Reader'],
]);
