/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Security } from '@labkey/api';
import {
    SET_RELOAD_REQUIRED,
    UPDATE_USER_DISPLAY_NAME,
    USER_PERMISSIONS_REQUEST,
    USER_PERMISSIONS_SUCCESS,
} from "./constants";

function successUserPermissions(response) {
    return {
        type: USER_PERMISSIONS_SUCCESS,
        response,
    };
}

function fetchUserPermissions() {
    return new Promise((resolve, reject) => {
        Security.getUserPermissions({
            success: (data) => {
                resolve(data);
            },
            failure: (error) => {
                reject(error);
            }
        });
    });
}

export function getUserPermissions() {
    return (dispatch) => {
        dispatch({
            type: USER_PERMISSIONS_REQUEST
        });

        return fetchUserPermissions().then( (response) => {
            dispatch(successUserPermissions(response))
        }).catch( error => {
            console.error(error);
        })
    }
}

export function updateUserDisplayName(displayName: string) {
    return {
        type: UPDATE_USER_DISPLAY_NAME,
        displayName
    }
}

export function setReloadRequired() {
    return {
        type: SET_RELOAD_REQUIRED
    }
}
