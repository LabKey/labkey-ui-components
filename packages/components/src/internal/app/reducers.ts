/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { User } from '../components/base/models/User';

import { ProductMenuModel } from '../components/navigation/model';

import { ServerNotificationModel } from '../components/notifications/model';

import { AppModel, newAppModel } from './models';
import {
    UPDATE_USER,
    UPDATE_USER_DISPLAY_NAME,
    MENU_INVALIDATE,
    MENU_LOADING_START,
    MENU_LOADING_ERROR,
    MENU_LOADING_END,
    MENU_RELOAD,
    SERVER_CONTEXT_RELOAD,
    SERVER_NOTIFICATIONS_INVALIDATE,
    SERVER_NOTIFICATIONS_LOADING_START,
    SERVER_NOTIFICATIONS_LOADING_ERROR,
    SERVER_NOTIFICATIONS_LOADING_END,
} from './constants';

export type AppReducerState = AppModel;

const initialAppModel = newAppModel();

export function AppReducers(state = initialAppModel, action): AppReducerState {
    switch (action.type) {
        case SERVER_CONTEXT_RELOAD:
            return newAppModel();
        case UPDATE_USER:
            return state.merge({ user: new User({ ...state.user, ...action.userProps }) }) as AppModel;
        case UPDATE_USER_DISPLAY_NAME:
            return state.merge({ user: new User({ ...state.user, displayName: action.displayName }) }) as AppModel;
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
