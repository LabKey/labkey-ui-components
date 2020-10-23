/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import {
    TEST_USER_APP_ADMIN,
    TEST_USER_ASSAY_DESIGNER,
    TEST_USER_AUTHOR,
    TEST_USER_EDITOR,
    TEST_USER_FOLDER_ADMIN,
    TEST_USER_GUEST,
    TEST_USER_READER,
} from '../../test/data/users';

import { getUserPermissions, setReloadRequired, updateUserDisplayName, menuInit, menuInvalidate } from './actions';
import {
    SECURITY_LOGOUT,
    SECURITY_SERVER_UNAVAILABLE,
    SECURITY_SESSION_TIMEOUT,
    SET_RELOAD_REQUIRED,
    USER_PERMISSIONS_REQUEST,
    USER_PERMISSIONS_SUCCESS,
    UPDATE_USER_DISPLAY_NAME,
    NEW_FREEZER_DESIGN_HREF,
    MANAGE_STORAGE_UNITS_HREF,
    WORKFLOW_HOME_HREF,
    NEW_ASSAY_DESIGN_HREF,
    NEW_SAMPLE_TYPE_HREF,
    NEW_SOURCE_TYPE_HREF,
    NEW_SAMPLES_HREF,
    USER_KEY,
    HOME_KEY,
    FREEZERS_KEY,
    BOXES_KEY,
    WORKFLOW_KEY,
    SOURCE_TYPE_KEY,
    SOURCES_KEY,
    SAMPLE_TYPE_KEY,
    SAMPLES_KEY,
    ASSAY_DESIGN_KEY,
    ASSAYS_KEY,
    FREEZER_MANAGER_PRODUCT_ID,
    SAMPLE_MANAGER_PRODUCT_ID,
    STICKY_HEADER_HEIGHT,
    NOTIFICATION_TIMEOUT,
} from './constants';
import { AppModel, LogoutReason } from './models';
import {
    AppReducers,
    AppReducerState,
    RoutingTableState,
    RoutingTableReducers,
    ProductMenuState,
    ProductMenuReducers,
} from './reducers';
import {
    initWebSocketListeners,
    userCanDesignLocations,
    userCanDesignSourceTypes,
    isSampleManagerEnabled,
    isFreezerManagementEnabled,
    getDateFormat,
    getMenuSectionConfigs,
} from './utils';

export {
    AppModel,
    AppReducerState,
    AppReducers,
    LogoutReason,
    ProductMenuState,
    ProductMenuReducers,
    RoutingTableState,
    RoutingTableReducers,
    initWebSocketListeners,
    isFreezerManagementEnabled,
    isSampleManagerEnabled,
    getDateFormat,
    getMenuSectionConfigs,
    getUserPermissions,
    menuInit,
    menuInvalidate,
    setReloadRequired,
    updateUserDisplayName,
    userCanDesignLocations,
    userCanDesignSourceTypes,
    SECURITY_LOGOUT,
    SECURITY_SERVER_UNAVAILABLE,
    SECURITY_SESSION_TIMEOUT,
    SET_RELOAD_REQUIRED,
    USER_PERMISSIONS_SUCCESS,
    USER_PERMISSIONS_REQUEST,
    UPDATE_USER_DISPLAY_NAME,
    SAMPLE_MANAGER_PRODUCT_ID,
    FREEZER_MANAGER_PRODUCT_ID,
    ASSAYS_KEY,
    ASSAY_DESIGN_KEY,
    SAMPLES_KEY,
    SAMPLE_TYPE_KEY,
    SOURCES_KEY,
    SOURCE_TYPE_KEY,
    WORKFLOW_KEY,
    FREEZERS_KEY,
    BOXES_KEY,
    HOME_KEY,
    USER_KEY,
    NEW_SAMPLES_HREF,
    NEW_SOURCE_TYPE_HREF,
    NEW_SAMPLE_TYPE_HREF,
    NEW_ASSAY_DESIGN_HREF,
    WORKFLOW_HOME_HREF,
    NEW_FREEZER_DESIGN_HREF,
    MANAGE_STORAGE_UNITS_HREF,
    NOTIFICATION_TIMEOUT,
    STICKY_HEADER_HEIGHT,
    TEST_USER_GUEST,
    TEST_USER_READER,
    TEST_USER_AUTHOR,
    TEST_USER_EDITOR,
    TEST_USER_ASSAY_DESIGNER,
    TEST_USER_FOLDER_ADMIN,
    TEST_USER_APP_ADMIN,
};
