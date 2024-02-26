import { PermissionRoles } from '@labkey/api';
import { Map } from 'immutable';

export const SITE_SECURITY_ROLES = Map<string, string>([
    [PermissionRoles.ApplicationAdmin, 'Application Administrator'],
]);

export const APPLICATION_SECURITY_ROLES = Map<string, string>([
    [PermissionRoles.ProjectAdmin, 'Project Administrator'],
    [PermissionRoles.FolderAdmin, 'Folder Administrator'],
    [PermissionRoles.Editor, 'Editor'],
    [PermissionRoles.EditorWithoutDelete, 'Editor without Delete'],
    [PermissionRoles.Reader, 'Reader'],
]);
