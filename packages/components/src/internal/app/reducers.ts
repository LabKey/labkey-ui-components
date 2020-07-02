/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { handleActions } from 'redux-actions';
import { fromJS } from 'immutable';
import { AppModel, LogoutReason } from "./models";
import {
    SECURITY_LOGOUT,
    SECURITY_SERVER_UNAVAILABLE,
    SECURITY_SESSION_TIMEOUT,
    SET_RELOAD_REQUIRED,
    UPDATE_USER_DISPLAY_NAME,
    USER_PERMISSIONS_REQUEST,
    USER_PERMISSIONS_SUCCESS
} from "./constants";

export const AppReducers = handleActions<AppModel, any>({

    [SET_RELOAD_REQUIRED]: (state: AppModel) => state.set('reloadRequired', true),

    [UPDATE_USER_DISPLAY_NAME]: (state: AppModel, action: any) => {
        const { displayName } = action;
        return state.merge({
            user: state.user.set('displayName', displayName)
        });
    },

    [USER_PERMISSIONS_REQUEST]: (state: AppModel) => state.set('requestPermissions', false),

    [USER_PERMISSIONS_SUCCESS]: (state: AppModel, action: any) => {
        const { response } = action;
        const { container } = response;

        return state.merge({
            user: state.user.set('permissionsList', fromJS(container.effectivePermissions))
        });
    },

    [SECURITY_LOGOUT]: (state: AppModel, action: any) => {
        return state.merge({
            reloadRequired: true,
            logoutReason: LogoutReason.SERVER_LOGOUT
        });
    },

    [SECURITY_SESSION_TIMEOUT]: (state: AppModel, action: any) => {
        return state.merge({
            reloadRequired: true,
            logoutReason: LogoutReason.SESSION_EXPIRED
        });
    },

    [SECURITY_SERVER_UNAVAILABLE]: (state: AppModel, action: any) => {
        return state.merge({
            reloadRequired: true,
            logoutReason: LogoutReason.SERVER_UNAVAILABLE
        });
    }
}, new AppModel());
