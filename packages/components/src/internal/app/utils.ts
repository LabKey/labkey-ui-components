/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List, Map } from 'immutable';
import { ActionURL, getServerContext, PermissionTypes } from '@labkey/api';


import { LABKEY_WEBSOCKET } from '../constants';

import {
    ASSAYS_KEY,
    BIOLOGICS_APP_PROPERTIES,
    EXPERIMENTAL_REQUESTS_MENU,
    FREEZER_MANAGER_APP_PROPERTIES,
    FREEZERS_KEY,
    HOME_KEY,
    LABKEY_SERVER_PRODUCT_NAME,
    MEDIA_KEY,
    MENU_RELOAD,
    NEW_ASSAY_DESIGN_HREF,
    NEW_FREEZER_DESIGN_HREF,
    NEW_SAMPLE_TYPE_HREF,
    NEW_SOURCE_TYPE_HREF,
    NOTEBOOKS_KEY,
    REGISTRY_KEY,
    REQUESTS_KEY,
    SAMPLE_MANAGER_APP_PROPERTIES,
    SAMPLES_KEY,
    SERVER_NOTIFICATIONS_INVALIDATE,
    SET_RESET_QUERY_GRID_STATE,
    SOURCES_KEY,
    USER_KEY,
    WORKFLOW_HOME_HREF,
    WORKFLOW_KEY,
} from './constants';
import { AppProperties } from './models';
import { hasAllPermissions, User } from '../components/base/models/User';
import { MenuSectionConfig } from '../components/navigation/ProductMenuSection';
import { imageURL } from '../url/ActionURL';
import { AppURL, buildURL } from '../url/AppURL';

// Type definition not provided for event codes so here we provide our own
// Source: https://www.iana.org/assignments/websocket/websocket.xml#close-code-number
export enum CloseEventCode {
    NORMAL_CLOSURE = 1000,
    GOING_AWAY = 1001,
    PROTOCOL_ERROR = 1002,
    UNSUPPORTED_DATA = 1003,
    RESERVED = 1004,
    NO_STATUS_RCVD = 1005,
    ABNORMAL_CLOSURE = 1006,
    INVALID_FRAME_PAYLOAD_DATA = 1007,
    POLICY_VIOLATION = 1008,
    MESSAGE_TOO_BIG = 1009,
    MISSING_EXT = 1010,
    INTERNAL_ERROR = 1011,
    SERVICE_RESTART = 1012,
    TRY_AGAIN_LATER = 1013,
    BAD_GATEWAY = 1014,
    TLS_HANDSHAKE = 1015,
}

export function registerWebSocketListeners(
    store,
    notificationListeners?: string[],
    menuReloadListeners?: string[],
    resetQueryGridListeners?: string[]
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
                window.setTimeout(() => store.dispatch({ type: MENU_RELOAD }), 1000);
            });
        });
    }

    if (resetQueryGridListeners) {
        resetQueryGridListeners.forEach(listener => {
            LABKEY_WEBSOCKET.addServerEventListener(listener, function (evt) {
                window.setTimeout(() => store.dispatch({ type: SET_RESET_QUERY_GRID_STATE }), 1000);
            });
        });
    }
}

export function userCanManagePicklists(user: User): boolean {
    return hasAllPermissions(user, [PermissionTypes.ManagePicklists]);
}

export function userCanDeletePublicPicklists(user: User): boolean {
    return user.isAdmin;
}

export function userCanDesignSourceTypes(user: User): boolean {
    return hasAllPermissions(user, [PermissionTypes.DesignDataClass]);
}

export function userCanDesignLocations(user: User): boolean {
    return hasAllPermissions(user, [PermissionTypes.Admin]);
}

export function isFreezerManagementEnabled(moduleContext?: any): boolean {
    return (
        (moduleContext ?? getServerContext().moduleContext)?.inventory !== undefined &&
        (!isBiologicsEnabled(moduleContext) || isFreezerManagerEnabledInBiologics(moduleContext))
    );
}

export function isProductNavigationEnabled(productId: string): boolean {
    if (productId === SAMPLE_MANAGER_APP_PROPERTIES.productId) {
        return isSampleManagerEnabled() && (!isBiologicsEnabled() || isSampleManagerNavigationEnabled());
    }
    else if (productId === BIOLOGICS_APP_PROPERTIES.productId) {
        return isBiologicsEnabled();
    }

    return false;
}

export function isSampleManagerNavigationEnabled(): boolean {
    return getServerContext().moduleContext?.biologics?.isBiologicsSampleManagerNavEnabled === true;
}

export function isSampleManagerEnabled(moduleContext?: any): boolean {
    return (moduleContext ?? getServerContext().moduleContext)?.samplemanagement !== undefined;
}

export function isBiologicsEnabled(moduleContext?: any): boolean {
    return(moduleContext ?? getServerContext().moduleContext)?.biologics !== undefined;
}

export function isPremiumProductEnabled(moduleContext?: any): boolean {
    return isSampleManagerEnabled(moduleContext) || isBiologicsEnabled(moduleContext);
}

export function sampleManagerIsPrimaryApp(moduleContext?: any): boolean {
    return getPrimaryAppProperties(moduleContext).productId === SAMPLE_MANAGER_APP_PROPERTIES.productId;
}

export function biologcisIsPrimaryApp(moduleContext?: any): boolean {
    return getPrimaryAppProperties(moduleContext).productId === BIOLOGICS_APP_PROPERTIES.productId;
}

export function getCurrentAppProperties(): AppProperties {
    const lcController = ActionURL.getController().toLowerCase();
    if (!lcController) return undefined;
    if (lcController === SAMPLE_MANAGER_APP_PROPERTIES.controllerName.toLowerCase())
        return SAMPLE_MANAGER_APP_PROPERTIES;
    if (lcController === BIOLOGICS_APP_PROPERTIES.controllerName.toLowerCase())
        return BIOLOGICS_APP_PROPERTIES;
    if (lcController === FREEZER_MANAGER_APP_PROPERTIES.controllerName.toLowerCase())
        return FREEZER_MANAGER_APP_PROPERTIES;
    return undefined;
}

export function getPrimaryAppProperties(moduleContext?: any): AppProperties {
    if (isBiologicsEnabled(moduleContext)) {
        return BIOLOGICS_APP_PROPERTIES;
    } else if (isSampleManagerEnabled(moduleContext)) {
        return SAMPLE_MANAGER_APP_PROPERTIES;
    } else if (isFreezerManagementEnabled(moduleContext)) {
        return FREEZER_MANAGER_APP_PROPERTIES;
    } else {
        return undefined;
    }
}

function isFreezerManagerEnabledInBiologics(moduleContext?: any): boolean {
    return (moduleContext ?? getServerContext().moduleContext)?.biologics?.isFreezerManagerEnabled === true;
}

export function isRequestsEnabled(moduleContext?: any): boolean {
    return (moduleContext ?? getServerContext().moduleContext)?.biologics?.[EXPERIMENTAL_REQUESTS_MENU] === true;
}

export function isSamplePicklistEnabled(): boolean {
    return !isBiologicsEnabled();
}

export function hasModule(moduleName: string) {
    const { moduleContext } = getServerContext();
    return moduleContext.api?.moduleNames?.indexOf(moduleName.toLowerCase()) >= 0;
}

export function hasPremiumModule(): boolean {
    return hasModule('Premium');
}

export function isCommunityDistribution(): boolean {
    return !hasModule('SampleManagement') && !hasPremiumModule();
}

function getStorageSectionConfig(user: User, currentApp: string, moduleContext: any, maxItemsPerColumn: number):  MenuSectionConfig {

    if (isFreezerManagementEnabled()) {
        const fmAppBase = getApplicationUrlBase('inventory', currentApp, moduleContext);
        let locationsMenuConfig = new MenuSectionConfig({
            emptyText: 'No freezers have been defined',
            iconURL: imageURL('_images', 'freezer_menu.svg'),
            maxColumns: 1,
            maxItemsPerColumn,
            seeAllURL: fmAppBase + AppURL.create(HOME_KEY).toHref(),
            headerURL: fmAppBase + AppURL.create(HOME_KEY).toHref(),
        });
        if (userCanDesignLocations(user)) {
            locationsMenuConfig = locationsMenuConfig.merge({
                emptyURL: fmAppBase + NEW_FREEZER_DESIGN_HREF.toHref(),
                emptyURLText: 'Create a freezer',
            }) as MenuSectionConfig;
        }
        return locationsMenuConfig;
    }
    return undefined;
}

function addSamplesSectionConfig(user: User, currentApp: string, appBase: string, sectionConfigs: List<Map<string, MenuSectionConfig>>): List<Map<string, MenuSectionConfig>> {
    let samplesMenuConfig = new MenuSectionConfig({
        emptyText: 'No sample types have been defined',
        iconURL: imageURL('_images', 'samples.svg'),
        maxColumns: 1,
        maxItemsPerColumn: 12,
        seeAllURL: appBase + AppURL.create(SAMPLES_KEY).addParam('viewAs', 'cards').toHref(),
    });
    if (user.hasDesignSampleSetsPermission()) {
        samplesMenuConfig = samplesMenuConfig.merge({
            emptyURL: appBase + NEW_SAMPLE_TYPE_HREF.toHref(),
            emptyURLText: 'Create a sample type',
        }) as MenuSectionConfig;
    }
    return sectionConfigs.push(Map<string, MenuSectionConfig>().set(SAMPLES_KEY, samplesMenuConfig));
}

function addAssaysSectionConfig(user: User, currnetApp: string, appBase: string, sectionConfigs: List<Map<string, MenuSectionConfig>>): List<Map<string, MenuSectionConfig>> {
    let assaysMenuConfig = new MenuSectionConfig({
        emptyText: 'No assays have been defined',
        iconURL: imageURL('_images', 'assay.svg'),
        maxColumns: 2,
        maxItemsPerColumn: 12,
        seeAllURL: appBase + AppURL.create(ASSAYS_KEY).addParam('viewAs', 'grid').toHref(),
    });
    if (user.hasDesignAssaysPermission()) {
        assaysMenuConfig = assaysMenuConfig.merge({
            emptyURL: appBase + NEW_ASSAY_DESIGN_HREF.toHref(),
            emptyURLText: 'Create an assay design',
        }) as MenuSectionConfig;
    }
    return sectionConfigs.push(Map<string, MenuSectionConfig>().set(ASSAYS_KEY, assaysMenuConfig));
}

function createWorkflowSectionConfig(appBase: string): MenuSectionConfig {
    return new MenuSectionConfig({
        headerURL: appBase + WORKFLOW_HOME_HREF.toHref(),
        iconURL: imageURL('_images', 'workflow.svg'),
        seeAllURL: appBase + AppURL.create(WORKFLOW_KEY).toHref(),
    })
}

export function getMenuSectionConfigs(user: User, currentApp: string, moduleContext?: any): List<Map<string, MenuSectionConfig>> {
    let sectionConfigs = List<Map<string, MenuSectionConfig>>();

    const appBase =  getApplicationUrlBase(getPrimaryAppProperties(moduleContext).moduleName, currentApp, moduleContext);
    const currentAppProperties = getCurrentAppProperties(); // based on the controller name
    const isSMPrimary = sampleManagerIsPrimaryApp(moduleContext);
    const isBioPrimary = biologcisIsPrimaryApp(moduleContext);
    const isBioOrSM = isSMPrimary || isBioPrimary;
    if (isSMPrimary || currentAppProperties.productId === SAMPLE_MANAGER_APP_PROPERTIES.productId) {
        let sourcesMenuConfig = new MenuSectionConfig({
            emptyText: 'No source types have been defined',
            iconURL: imageURL('_images', 'source_type.svg'),
            maxColumns: 1,
            maxItemsPerColumn: 12,
            seeAllURL: appBase + AppURL.create(SOURCES_KEY).addParam('viewAs', 'grid').toHref(),
        });
        if (userCanDesignSourceTypes(user)) {
            sourcesMenuConfig = sourcesMenuConfig.merge({
                emptyURL: appBase + NEW_SOURCE_TYPE_HREF.toHref(),
                emptyURLText: 'Create a source type',
            }) as MenuSectionConfig;
        }
        sectionConfigs = sectionConfigs.push(Map({ [SOURCES_KEY]: sourcesMenuConfig }));
    }
    else if (isBioPrimary ) {
        sectionConfigs = sectionConfigs.push(  Map({ [REGISTRY_KEY]: new MenuSectionConfig({
                iconURL: imageURL('_images', 'molecule.svg'),
                seeAllURL: AppURL.create(REGISTRY_KEY),
            })})
        );
    }
    if (isBioOrSM) {
        sectionConfigs = addSamplesSectionConfig(user, currentApp, appBase, sectionConfigs);
        sectionConfigs = addAssaysSectionConfig(user, currentApp, appBase, sectionConfigs);
    }

    const storageConfig = getStorageSectionConfig(user, currentApp, moduleContext, isBioPrimary && isRequestsEnabled(moduleContext) ? 7 : 12);

    if (isSMPrimary || currentAppProperties.productId === SAMPLE_MANAGER_APP_PROPERTIES.productId) {
        if (storageConfig) {
            sectionConfigs = sectionConfigs.push(Map({[FREEZERS_KEY]: storageConfig}));
        }
        sectionConfigs = sectionConfigs.push(
            Map({
                [WORKFLOW_KEY]: createWorkflowSectionConfig(appBase),
                [USER_KEY]: new MenuSectionConfig({
                    iconCls: 'fas fa-user-circle ',
                }),
            })
        );
    } else if (isBioPrimary) {

        const mediaMenuConfig = new MenuSectionConfig({
            headerURL: AppURL.create(MEDIA_KEY),
            iconURL: imageURL('_images', 'mixtures.svg'),
            seeAllURL: AppURL.create(MEDIA_KEY),
        });
        // TODO: This can generate URLs that differ between app.view and appDev.view
        const notebooksMenuConfig = new MenuSectionConfig({
            iconURL: imageURL('biologics/images', 'notebook_blue.svg'),
            seeAllURL: AppURL.create(NOTEBOOKS_KEY),
        });
        if (isRequestsEnabled(moduleContext)) {
            const requestsMenuConfig = new MenuSectionConfig({
                headerURL: buildURL('query', 'executeQuery', {
                    schemaName: 'issues',
                    'query.queryName': 'IssueListDef',
                }),
                iconURL: imageURL('_images', 'default.svg'),
            });
            // When "Requests" are enabled render as two columns
            let requestsCol = Map({
                [REQUESTS_KEY]: requestsMenuConfig,
            });
            // ... and put the storage in this same column
            if (storageConfig) {
                requestsCol = requestsCol.set(FREEZERS_KEY, storageConfig);
            }
            sectionConfigs = sectionConfigs.push(
                requestsCol,
                Map({
                    [WORKFLOW_KEY]: createWorkflowSectionConfig(appBase),
                    [MEDIA_KEY]: mediaMenuConfig,
                    [NOTEBOOKS_KEY]: notebooksMenuConfig,
                })
            );
        } else {
            if (storageConfig) {
                sectionConfigs = sectionConfigs.push(
                    Map({[FREEZERS_KEY]: storageConfig})
                );
            }
            sectionConfigs = sectionConfigs.push(
                Map({
                    [WORKFLOW_KEY]: createWorkflowSectionConfig(appBase),
                    [MEDIA_KEY]: mediaMenuConfig,
                    [NOTEBOOKS_KEY]: notebooksMenuConfig,
                })
            );
        }
    } else {
        const userSectionConfig = new MenuSectionConfig({
            iconCls: 'fas fa-user-circle ',
        });
        sectionConfigs = sectionConfigs.push(Map ({[USER_KEY]: userSectionConfig}));
    }
    return sectionConfigs;
}

function getProductId(moduleName: string, moduleContext: any): string {
    const lcModuleName = moduleName.toLowerCase();
    const context = (moduleContext ?? getServerContext().moduleContext)?.[lcModuleName];
    return context?.productId ? context.productId.toLowerCase() : undefined;
}

function getApplicationUrlBase(moduleName: string, currentApp: string, moduleContext: any): string {
    const appName = getProductId(moduleName, moduleContext);
    return !appName || appName === currentApp.toLowerCase()
        ? ''
        : buildURL(appName, 'app.view', undefined, { returnUrl: false });
}

export function getDateFormat(): string {
    return getServerContext().container.formats.dateFormat;
}

// Returns the friendly name of the product, primarly for use in help text.
export function getCurrentProductName() {
    const lcController = ActionURL.getController().toLowerCase();
    if (!lcController) return LABKEY_SERVER_PRODUCT_NAME;

    if (isPremiumProductEnabled()) {
        return getPrimaryAppProperties().name;
    }
    return LABKEY_SERVER_PRODUCT_NAME;
}

