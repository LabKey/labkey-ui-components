import moment from 'moment';
import { List, Map, OrderedMap } from 'immutable';
import { ActionURL, Ajax, PermissionTypes, Utils } from '@labkey/api';

import { caseInsensitive, hasAllPermissions } from '../../util/utils';
import { QueryGridModel, SchemaQuery, User } from '../base/models/model';
import { buildURL } from '../../url/ActionURL';

import { ChangePasswordModel } from './models';

export function getUserPermissionsDisplay(user: User): string[] {
    const permissions = [];

    if (user.isAdmin) {
        permissions.push('Administrator');
    } else {
        if (hasAllPermissions(user, [PermissionTypes.DesignDataClass])) {
            permissions.push('Data Class Designer');
        }
        if (hasAllPermissions(user, [PermissionTypes.DesignSampleSet])) {
            permissions.push('Sample Set Designer');
        }
        if (hasAllPermissions(user, [PermissionTypes.DesignAssay])) {
            permissions.push('Assay Designer');
        }
        permissions.push(user.canUpdate ? 'Editor' : user.canInsert ? 'Author' : 'Reader');
    }

    return permissions;
}

export function getUserLastLogin(userProperties: Map<string, any>, dateFormat: string): string {
    const lastLogin = caseInsensitive(userProperties.toObject(), 'lastlogin');
    return lastLogin ? moment(lastLogin).format(dateFormat) : undefined;
}

export function getUserDetailsRowData(user: User, data: OrderedMap<string, any>, avatar: File): FormData {
    const formData = new FormData();
    const row = { UserId: user.id, ...data.toJS() };

    Object.keys(row).forEach(key => {
        let value = row[key];

        // need to convert booleans to string for save
        if (value !== null && Utils.isBoolean(value)) {
            value = value.toString();
        }

        // need to remove email from the posted data since that is not an updatable value for this action
        if (key.toLowerCase() === 'email') {
            value = undefined;
        }

        if (value !== undefined) {
            formData.append(key, value);
        }
    });

    // add in the avatar file, if a new one was added (note that we do want to let through the value of "null" since
    // that is used to indicate to the server to delete the current avatar file)
    if (avatar !== undefined) {
        formData.append('Avatar', avatar);
    }

    return formData;
}

export function updateUserDetails(schemaQuery: SchemaQuery, data: FormData): Promise<any> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('user', 'updateUserDetails.api', LABKEY.container.path),
            method: 'POST',
            form: data,
            success: Utils.getCallbackWrapper(result => {
                resolve(result);
            }),
            failure: Utils.getCallbackWrapper(error => {
                reject(error);
            }),
        });
    });
}

export function changePassword(model: ChangePasswordModel): Promise<any> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('login', 'changePasswordApi.api'),
            method: 'POST',
            params: model.toJS(),
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(response => {
                reject(response);
            }),
        });
    });
}

export function getPasswordRuleInfo(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        return Ajax.request({
            url: buildURL('login', 'getPasswordRulesInfo.api'),
            method: 'GET',
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(response => {
                reject(response);
            }),
        });
    });
}

export function getSelectedUserIds(model: QueryGridModel): List<number> {
    // selectedIds will be strings, need to cast to integers
    return model.selectedIds.map(id => parseInt(id)).toList();
}

export function updateUsersActiveState(userIds: List<number>, reactivate: boolean): Promise<any> {
    return updateUsersState(userIds, false, reactivate);
}

export function deleteUsers(userIds: List<number>): Promise<any> {
    return updateUsersState(userIds, true, false);
}

function updateUsersState(userIds: List<number>, isDelete: boolean, isActivate: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('user', 'updateUsersStateApi.api'),
            method: 'POST',
            params: {
                userId: userIds.toArray(),
                delete: isDelete,
                activate: isActivate,
            },
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(response => {
                reject(response);
            }),
        });
    });
}

export function resetPassword(email: string): Promise<any> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('security', 'adminResetPassword.api'),
            method: 'POST',
            params: { email },
            success: Utils.getCallbackWrapper(response => {
                resolve({
                    resetPassword: true,
                    email,
                });
            }),
            failure: Utils.getCallbackWrapper(response => {
                reject(response);
            }),
        });
    });
}
