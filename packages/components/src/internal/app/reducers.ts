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
    USER_PERMISSIONS_SUCCESS,
} from "./constants";

export type AppReducerState = AppModel;

export const AppReducers = handleActions<AppReducerState, any>({

    [SET_RELOAD_REQUIRED]: (state: AppReducerState) => state.set('reloadRequired', true),

    [UPDATE_USER_DISPLAY_NAME]: (state: AppReducerState, action: any) => {
        const { displayName } = action;
        return state.merge({
            user: state.user.set('displayName', displayName)
        });
    },

    [USER_PERMISSIONS_REQUEST]: (state: AppReducerState) => state.set('requestPermissions', false),

    [USER_PERMISSIONS_SUCCESS]: (state: AppReducerState, action: any) => {
        const { response } = action;
        const { container } = response;

        return state.merge({
            user: state.user.set('permissionsList', fromJS(container.effectivePermissions))
        });
    },

    [SECURITY_LOGOUT]: (state: AppReducerState, action: any) => {
        return state.merge({
            reloadRequired: true,
            logoutReason: LogoutReason.SERVER_LOGOUT
        });
    },

    [SECURITY_SESSION_TIMEOUT]: (state: AppReducerState, action: any) => {
        return state.merge({
            reloadRequired: true,
            logoutReason: LogoutReason.SESSION_EXPIRED
        });
    },

    [SECURITY_SERVER_UNAVAILABLE]: (state: AppReducerState, action: any) => {
        return state.merge({
            reloadRequired: true,
            logoutReason: LogoutReason.SERVER_UNAVAILABLE
        });
    }
}, new AppModel());
