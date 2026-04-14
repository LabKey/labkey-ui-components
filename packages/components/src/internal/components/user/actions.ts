import { OrderedMap } from 'immutable';
import { Ajax, Utils } from '@labkey/api';

import { request } from '../../request';
import { buildURL } from '../../url/AppURL';
import { User } from '../base/models/User';
import { caseInsensitive } from '../../util/utils';

import { formatDate, parseDate } from '../../util/Date';

import { ChangePasswordModel } from './models';
import { hasModule } from '../../app/utils';

export function getUserProperties(userId: number): Promise<any> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL(
                'user',
                'getUserProps.api',
                { userId },
                {
                    container: '/', // always use root container for this API call
                }
            ),
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(response => {
                reject(response);
            }),
        });
    });
}

export function getUserLastLogin(userProperties: Record<string, any>, dateFormat?: string): string {
    const lastLogin = caseInsensitive(userProperties, 'lastlogin');
    if (!lastLogin) return undefined;

    const parsedDate = parseDate(lastLogin);
    return parsedDate ? formatDate(parsedDate, undefined, dateFormat) : undefined;
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
            formData.append(Utils.encodeFormName(key), value);
        }
    });

    // add in the avatar file, if a new one was added (note that we do want to let through the value of "null" since
    // that is used to indicate to the server to delete the current avatar file)
    if (avatar !== undefined) {
        formData.append('Avatar', avatar);
    }

    return formData;
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

export interface PasswordRuleInfo {
    full: string;
    shouldShowPasswordGuidance: boolean;
    summary: string;
}

export function getPasswordRuleInfo(): Promise<PasswordRuleInfo> {
    return new Promise((resolve, reject) => {
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

export function updateUsersActiveState(userIds: number[], reactivate: boolean): Promise<any> {
    return updateUsersState(userIds, false, reactivate);
}

export function deleteUsers(userIds: number[]): Promise<any> {
    return updateUsersState(userIds, true, false);
}

function updateUsersState(userIds: number[], isDelete: boolean, isActivate: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('user', 'updateUsersStateApi.api'),
            method: 'POST',
            params: {
                userId: userIds,
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

export type ResetPasswordResponse = {
    email?: string;
    resetPassword: boolean;
    userId: number;
};

export function resetPassword(userId: number): Promise<ResetPasswordResponse> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('security', 'adminResetPassword.api'),
            method: 'POST',
            params: { userId },
            success: Utils.getCallbackWrapper(() => {
                resolve({ userId, resetPassword: true });
            }),
            failure: Utils.getCallbackWrapper(error => {
                console.error('Failed to reset password.', error);
                reject(error);
            }),
        });
    });
}

export async function hasTotpSettings(userId: number): Promise<boolean> {
    if (!hasModule('mfa')) {
        return false;
    }

    const response = await request<{ hasTotpSettings: boolean }>({
        url: buildURL('totp', 'hasTotpSettings.api', { userId }),
    });
    return response.hasTotpSettings;
}

export type ResetTotpResponse = {
    email?: string;
    resetTotpSettings: boolean;
    userId: number;
};

export async function resetTotpSettings(userId: number): Promise<ResetTotpResponse> {
    const response = await request<{ success: boolean }>({
        url: buildURL('totp', 'resetTotpSettingsApi.api'),
        method: 'POST',
        params: {userId},
    });

    if (!response.success) {
        const errorLogMsg = `Unable to reset TOTP settings for user: ${userId}`;
        console.error(errorLogMsg, response);
        throw new Error(errorLogMsg);
    }

    return {userId, resetTotpSettings: true};
}
