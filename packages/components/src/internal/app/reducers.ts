/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Map } from 'immutable';

import { User } from '../components/base/models/User';

import { ProductMenuModel } from '../components/navigation/model';

import { ServerNotificationModel } from '../components/notifications/model';

import { AppModel, LogoutReason } from './models';
import {
    SECURITY_LOGOUT,
    SECURITY_SERVER_UNAVAILABLE,
    SECURITY_SESSION_TIMEOUT,
    UPDATE_USER,
    UPDATE_USER_DISPLAY_NAME,
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
} from './constants';

export type AppReducerState = AppModel;

export function AppReducers(state = new AppModel(), action): AppReducerState {
    switch (action.type) {
        case UPDATE_USER:
            return state.merge({ user: new User({ ...state.user, ...action.userProps }) }) as AppModel;
        case UPDATE_USER_DISPLAY_NAME:
            return state.merge({ user: new User({ ...state.user, displayName: action.displayName }) }) as AppModel;
        case SECURITY_LOGOUT:
            return state.merge({
                logoutReason: LogoutReason.SERVER_LOGOUT,
                reloadRequired: true,
            }) as AppModel;
        // TODO: the following constants appear to never be dispatched, are these handlers needed?
        case SECURITY_SESSION_TIMEOUT:
            return state.merge({
                logoutReason: LogoutReason.SESSION_EXPIRED,
                reloadRequired: true,
            }) as AppModel;
        case SECURITY_SERVER_UNAVAILABLE:
            return state.merge({
                logoutReason: LogoutReason.SERVER_UNAVAILABLE,
                reloadRequired: true,
            }) as AppModel;
        default:
            return state;
    }
}

export type RoutingTableState = Map<string, string | boolean>;

export function RoutingTableReducers(state = Map<string, string | boolean>(), action): RoutingTableState {
    switch (action.type) {
        case ADD_TABLE_ROUTE:
            return state.set(action.fromRoute, action.toRoute) as RoutingTableState;
        default:
            return state;
    }
}

export type ProductMenuState = ProductMenuModel;

export function ProductMenuReducers(state = new ProductMenuModel(), action): ProductMenuState {
    switch (action.type) {
        case MENU_INVALIDATE:
            return new ProductMenuModel();
        case MENU_RELOAD:
            return state.setNeedsReload();
        case MENU_LOADING_START:
            return state.merge({
                currentProductId: action.currentProductId,
                isLoading: true,
                productIds: action.productIds,
            }) as ProductMenuModel;
        case MENU_LOADING_ERROR:
            return state.setError(action.message);
        case MENU_LOADING_END:
            return state.setLoadedSections(action.sections);
        default:
            return state;
    }
}

export type ServerNotificationState = ServerNotificationModel;

export function ServerNotificationReducers(state = new ServerNotificationModel(), action): ServerNotificationState {
    switch (action.type) {
        case SERVER_NOTIFICATIONS_INVALIDATE:
            return new ServerNotificationModel();
        case SERVER_NOTIFICATIONS_LOADING_START:
            return state.setLoadingStart();
        case SERVER_NOTIFICATIONS_LOADING_END:
            return state.setLoadingComplete(action.serverActivity);
        case SERVER_NOTIFICATIONS_LOADING_ERROR:
            return state.setError(action.message);
        default:
            return state;
    }
}
