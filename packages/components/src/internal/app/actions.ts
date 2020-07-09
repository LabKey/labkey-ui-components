/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List } from 'immutable';
import { Security } from '@labkey/api';

import {
    MENU_INVALIDATE,
    MENU_LOADING_END,
    MENU_LOADING_ERROR,
    MENU_LOADING_START,
    SET_RELOAD_REQUIRED,
    UPDATE_USER_DISPLAY_NAME,
    USER_PERMISSIONS_REQUEST,
    USER_PERMISSIONS_SUCCESS,
} from './constants';

function successUserPermissions(response) {
    return {
        type: USER_PERMISSIONS_SUCCESS,
        response,
    };
}

function fetchUserPermissions() {
    return new Promise((resolve, reject) => {
        Security.getUserPermissions({
            success: data => {
                resolve(data);
            },
            failure: error => {
                reject(error);
            },
        });
    });
}

export function getUserPermissions() {
    return dispatch => {
        dispatch({
            type: USER_PERMISSIONS_REQUEST,
        });

        return fetchUserPermissions()
            .then(response => {
                dispatch(successUserPermissions(response));
            })
            .catch(error => {
                console.error(error);
            });
    };
}

export function updateUserDisplayName(displayName: string) {
    return {
        type: UPDATE_USER_DISPLAY_NAME,
        displayName,
    };
}

export function setReloadRequired() {
    return {
        type: SET_RELOAD_REQUIRED,
    };
}

export function menuInit(currentProductId: string, userMenuProductId: string, productIds?: List<string>) {
    return (dispatch, getState) => {
        let menu = getState().routing.menu;
        if (!menu.isLoaded && !menu.isLoading) {
            dispatch({
                type: MENU_LOADING_START,
                currentProductId,
                userMenuProductId,
                productIds, // when undefined, this returns all menu sections for modules in this container
            });
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

export function menuInvalidate() {
    return (dispatch, getState) => {
        dispatch({ type: MENU_INVALIDATE });
    };
}
