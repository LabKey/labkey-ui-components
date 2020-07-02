/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { AppURL } from "../..";

export const SAMPLE_MANAGER_PRODUCT_ID = "sampleManager";
export const FREEZER_MANAGER_PRODUCT_ID = "freezerManager";

export const ASSAYS_KEY = "assays";
export const ASSAY_DESIGN_KEY = "assayDesign";
export const SAMPLES_KEY = "samples";
export const SAMPLE_TYPE_KEY = "sampleSet";
export const SOURCES_KEY = "sources";
export const SOURCE_TYPE_KEY = "sourceType";
export const WORKFLOW_KEY = "workflow";
export const LOCATIONS_KEY = "locations";
export const HOME_KEY = "home";
export const USER_KEY = "user";

export const NEW_SAMPLES_HREF = AppURL.create(SAMPLES_KEY, 'new');
export const NEW_SOURCE_TYPE_HREF = AppURL.create(SOURCE_TYPE_KEY, 'new');
export const NEW_SAMPLE_TYPE_HREF = AppURL.create(SAMPLE_TYPE_KEY, 'new');
export const NEW_ASSAY_DESIGN_HREF = AppURL.create(ASSAY_DESIGN_KEY, 'new');
export const WORKFLOW_HOME_HREF = AppURL.create(WORKFLOW_KEY).addParam('mine.sort', 'DueDate').addParam('active.sort', 'DueDate');
export const NEW_FREEZER_DESIGN_HREF = AppURL.create(LOCATIONS_KEY, 'freezer', 'new');

export const USER_PERMISSIONS_REQUEST = "/app/USER_PERMISSIONS_REQUEST";
export const USER_PERMISSIONS_SUCCESS = "/app/USER_PERMISSIONS_SUCCESS";
export const UPDATE_USER_DISPLAY_NAME = "/app/UPDATE_USER_DISPLAY_NAME";
export const SET_RELOAD_REQUIRED = "/app/RELOAD_REQUIRED";
export const SECURITY_LOGOUT = '/app/SECURITY_LOGOUT';
export const SECURITY_SESSION_TIMEOUT = '/app/SECURITY_SESSION_TIMEOUT';
export const SECURITY_SERVER_UNAVAILABLE = '/app/SECURITY_SERVER_UNAVAILABLE';
export const ADD_TABLE_ROUTE = '/app/ADD_TABLE_ROUTE';
export const MENU_LOADING_START = '/app/MENU_LOADING_START';
export const MENU_LOADING_END = '/app/MENU_LOADING_END';
export const MENU_LOADING_ERROR = '/app/MENU_LOADING_ERROR';
export const MENU_INVALIDATE = '/app/MENU_INVALIDATE';

export const STICKY_HEADER_HEIGHT = 56; // Issue 38478

export const NOTIFICATION_TIMEOUT = 500;
