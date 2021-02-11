/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { fromJS, Map } from 'immutable';
import { handleActions } from 'redux-actions';

import { ServerNotificationModel, ProductMenuModel } from '../..';

import { resetQueryGridState } from '../global';

import { AppModel, LogoutReason } from './models';
import {
    SECURITY_LOGOUT,
    SECURITY_SERVER_UNAVAILABLE,
    SECURITY_SESSION_TIMEOUT,
    SET_RELOAD_REQUIRED,
    UPDATE_USER_DISPLAY_NAME,
    USER_PERMISSIONS_REQUEST,
    USER_PERMISSIONS_SUCCESS,
    ADD_TABLE_ROUTE,
    MENU_INVALIDATE,
    MENU_LOADING_START,
    MENU_LOADING_ERROR,
    MENU_LOADING_END,
    MENU_RELOAD,
    SERVER_NOTIFICATIONS_INVALIDATE,
    SERVER_NOTIFICATIONS_LOADING_START,
    SERVER_NOTIFICATIONS_LOADING_ERROR,
    SERVER_NOTIFICATIONS_LOADING_END,
    SET_RESET_QUERY_GRID_STATE,
    RESET_QUERY_GRID_STATE,
} from './constants';

export type AppReducerState = AppModel;

export const AppReducers = handleActions<AppReducerState, any>(
    {
        [SET_RELOAD_REQUIRED]: (state: AppReducerState) => state.set('reloadRequired', true),

        [UPDATE_USER_DISPLAY_NAME]: (state: AppReducerState, action: any) => {
            return state.merge({
                user: state.user.set('displayName', action.displayName),
            });
        },

        [USER_PERMISSIONS_REQUEST]: (state: AppReducerState) => state.set('requestPermissions', false),

        [USER_PERMISSIONS_SUCCESS]: (state: AppReducerState, action: any) => {
            const { response } = action;
            const { container } = response;

            return state.merge({
                user: state.user.set('permissionsList', fromJS(container.effectivePermissions)),
            });
        },

        [SECURITY_LOGOUT]: (state: AppReducerState) => {
            return state.merge({
                reloadRequired: true,
                logoutReason: LogoutReason.SERVER_LOGOUT,
            });
        },

        [SECURITY_SESSION_TIMEOUT]: (state: AppReducerState) => {
            return state.merge({
                reloadRequired: true,
                logoutReason: LogoutReason.SESSION_EXPIRED,
            });
        },

        [SECURITY_SERVER_UNAVAILABLE]: (state: AppReducerState) => {
            return state.merge({
                reloadRequired: true,
                logoutReason: LogoutReason.SERVER_UNAVAILABLE,
            });
        },

        [SET_RESET_QUERY_GRID_STATE]: (state: AppReducerState) => {
            return state.merge({
                needsInvalidateQueryGrid: true,
            });
        },

        [RESET_QUERY_GRID_STATE]: (state: AppReducerState) => {
            resetQueryGridState();
            return state.merge({
                needsInvalidateQueryGrid: false,
            });
        },
    },
    new AppModel()
);

export type RoutingTableState = Map<string, string | boolean>;

export const RoutingTableReducers = handleActions<RoutingTableState, any>(
    {
        [ADD_TABLE_ROUTE]: (state: any, action: any) => {
            const { fromRoute, toRoute } = action;

            return state.set(fromRoute, toRoute) as RoutingTableState;
        },
    },
    Map<string, string | boolean>()
);

export type ProductMenuState = ProductMenuModel;

export const ProductMenuReducers = handleActions<ProductMenuState, any>(
    {
        [MENU_INVALIDATE]: () => new ProductMenuModel(),

        [MENU_RELOAD]: (state: ProductMenuState) => state.setNeedsReload(),

        [MENU_LOADING_START]: (state: ProductMenuState, action: any) => {
            const { currentProductId, userMenuProductId, productIds } = action;

            return state.merge({
                currentProductId,
                userMenuProductId,
                productIds,
                isLoading: true,
            });
        },

        [MENU_LOADING_ERROR]: (state: ProductMenuState, action: any) => {
            return state.setError(action.message);
        },

        [MENU_LOADING_END]: (state: ProductMenuState, action: any) => {
            return state.setLoadedSections(action.sections);
        },
    },
    new ProductMenuModel()
);

export type ServerNotificationState = ServerNotificationModel;

export const ServerNotificationReducers = handleActions<ServerNotificationState, any>(
    {
        [SERVER_NOTIFICATIONS_INVALIDATE]: () => new ServerNotificationModel(),

        [SERVER_NOTIFICATIONS_LOADING_START]: (state: ServerNotificationState) => {
            return state.setLoadingStart();
        },

        [SERVER_NOTIFICATIONS_LOADING_END]: (state: ServerNotificationState, action: any) => {
            return state.setLoadingComplete(action.serverActivity);
        },

        [SERVER_NOTIFICATIONS_LOADING_ERROR]: (state: ServerNotificationState, action: any) => {
            return state.setError(action.message);
        },
    },
    new ServerNotificationModel()
);
