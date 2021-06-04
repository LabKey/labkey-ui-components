import { Map } from 'immutable';
import { PermissionRoles } from '@labkey/api';

export const ADD_USER_PERMISSION = 'org.labkey.api.security.permissions.AddUserPermission';
export const CAN_SEE_AUDIT_LOG_PERMISSION = 'org.labkey.api.audit.permissions.CanSeeAuditLogPermission';

export const SITE_SECURITY_ROLES = Map<string, string>([
    [PermissionRoles.ApplicationAdmin, 'Application Administrator'],
]);

export const APPLICATION_SECURITY_ROLES = Map<string, string>([
    [PermissionRoles.ProjectAdmin, 'Project Administrator'],
    [PermissionRoles.FolderAdmin, 'Folder Administrator'],
    [PermissionRoles.Editor, 'Editor'],
    [PermissionRoles.Reader, 'Reader'],
]);
