/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { User } from '../components/base/models/User';
import { ServerActivity } from '../components/notifications/model';

import { LABKEY_WEBSOCKET } from '../constants';

import {
    MENU_INVALIDATE,
    MENU_LOADING_END,
    MENU_LOADING_ERROR,
    MENU_LOADING_START,
    MENU_RELOAD,
    UPDATE_USER,
    UPDATE_USER_DISPLAY_NAME,
    SERVER_CONTEXT_RELOAD,
    SERVER_NOTIFICATIONS_LOADING_START,
    SERVER_NOTIFICATIONS_LOADING_END,
    SERVER_NOTIFICATIONS_LOADING_ERROR,
    SERVER_NOTIFICATIONS_INVALIDATE,
} from './constants';
import { getAppProductIds } from './utils';

export const updateUser = (userProps: Partial<User>) => ({ type: UPDATE_USER, userProps });

export const updateUserDisplayName = (displayName: string) => ({ type: UPDATE_USER_DISPLAY_NAME, displayName });

export function menuInit(currentProductId: string, appProductId: string) {
    return (dispatch, getState) => {
        let menu = getState().routing.menu;
        if ((!menu.isLoaded && !menu.isLoading) || menu.needsReload) {
            if (!menu.needsReload) {
                dispatch({
                    type: MENU_LOADING_START,
                    currentProductId,
                    productIds: getAppProductIds(appProductId),
                });
            }
            menu = getState().routing.menu;
            menu.getMenuSections()
                .then(sections => {
                    dispatch({
                        type: MENU_LOADING_END,
                        sections,
                    });
                })
                .catch(reason => {
                    console.error('Problem retrieving product menu data.', reason);
                    dispatch({
                        type: MENU_LOADING_ERROR,
                        message: 'Error in retrieving product menu data. Please contact your site administrator.',
                    });
                });
        }
    };
}

export const menuInvalidate = () => ({ type: MENU_INVALIDATE });

// an alternative to menuInvalidate, which doesn't erase current menu during reload
export function menuReload() {
    return (dispatch, getState) => {
        dispatch({ type: MENU_RELOAD });
        const menu = getState().routing.menu;
        menu.getMenuSections()
            .then(sections => {
                dispatch({
                    type: MENU_LOADING_END,
                    sections,
                });
            })
            .catch(reason => {
                console.error('Problem retrieving product menu data.', reason);
                dispatch({
                    type: MENU_LOADING_ERROR,
                    message: 'Error in retrieving product menu data. Please contact your site administrator.',
                });
            });
    };
}

export const serverContextReload = () => ({ type: SERVER_CONTEXT_RELOAD });

export function serverNotificationInit(serverActivitiesLoaderFn: (maxRows?: number) => Promise<ServerActivity>) {
    return (dispatch, getState) => {
        const serverNotificationModel = getState().serverNotifications;
        if (serverNotificationModel && !serverNotificationModel.isLoaded && !serverNotificationModel.isLoading) {
            dispatch({
                type: SERVER_NOTIFICATIONS_LOADING_START,
                serverActivitiesLoaderFn,
            });
            serverActivitiesLoaderFn()
                .then(serverActivity => {
                    dispatch({
                        type: SERVER_NOTIFICATIONS_LOADING_END,
                        serverActivity,
                    });
                })
                .catch(reason => {
                    console.error('Unable to retrieve notifications.', reason);
                    dispatch({
                        type: SERVER_NOTIFICATIONS_LOADING_ERROR,
                        message: 'Unable to retrieve notifications.',
                    });
                });
        }
    };
}

export const serverNotificationInvalidate = () => ({ type: SERVER_NOTIFICATIONS_INVALIDATE });

// This isn't really an action, but it needs to be here to prevent circular dependencies
export function registerWebSocketListeners(
    store,
    notificationListeners?: string[],
    menuReloadListeners?: string[]
): void {
    if (notificationListeners) {
        notificationListeners.forEach(listener => {
            LABKEY_WEBSOCKET.addServerEventListener(listener, function (evt) {
                // not checking evt.wasClean since we want this event for all user sessions
                window.setTimeout(() => store.dispatch({ type: SERVER_NOTIFICATIONS_INVALIDATE }), 1000);
            });
        });
    }

    if (menuReloadListeners) {
        menuReloadListeners.forEach(listener => {
            LABKEY_WEBSOCKET.addServerEventListener(listener, function (evt) {
                // not checking evt.wasClean since we want this event for all user sessions
                window.setTimeout(() => {
                    store.dispatch(menuReload());
                }, 1000);
            });
        });
    }
}
