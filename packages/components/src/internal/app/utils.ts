/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List, Map } from 'immutable';
import { ActionURL, getServerContext, PermissionTypes } from '@labkey/api';

import { useMemo } from 'react';

import { LABKEY_WEBSOCKET } from '../constants';

import { hasAllPermissions, User } from '../components/base/models/User';

import { MenuSectionConfig } from '../components/navigation/ProductMenuSection';
import { imageURL } from '../url/ActionURL';
import { AppURL, buildURL } from '../url/AppURL';
import { ModuleContext } from '../components/base/ServerContext';

import { AppProperties } from './models';
import {
    ASSAYS_KEY,
    BIOLOGICS_APP_PROPERTIES,
    EXPERIMENTAL_REQUESTS_MENU,
    EXPERIMENTAL_SAMPLE_ALIQUOT_SELECTOR,
    FREEZER_MANAGER_APP_PROPERTIES,
    FREEZERS_KEY,
    HOME_KEY,
    LABKEY_SERVER_PRODUCT_NAME,
    MEDIA_KEY,
    MENU_RELOAD,
    NEW_ASSAY_DESIGN_HREF,
    NEW_SAMPLE_TYPE_HREF,
    NEW_SOURCE_TYPE_HREF,
    NOTEBOOKS_KEY,
    PICKLIST_HOME_HREF,
    PICKLIST_KEY,
    ProductFeature,
    REGISTRY_KEY,
    REQUESTS_KEY,
    SAMPLE_MANAGER_APP_PROPERTIES,
    SAMPLES_KEY,
    SERVER_NOTIFICATIONS_INVALIDATE,
    SOURCES_KEY,
    USER_KEY,
    WORKFLOW_HOME_HREF,
    WORKFLOW_KEY,
} from './constants';
import {Container} from "../components/base/models/Container";

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
                window.setTimeout(() => store.dispatch({ type: MENU_RELOAD }), 1000);
            });
        });
    }
}

export function resolveModuleContext(moduleContext?: ModuleContext): ModuleContext {
    return moduleContext ?? getServerContext().moduleContext;
}

export function userCanReadAssays(user: User): boolean {
    return hasAllPermissions(user, [PermissionTypes.ReadAssay]);
}

export function userCanReadSources(user: User): boolean {
    return userCanReadDataClasses(user);
}

export function userCanReadRegistry(user: User): boolean {
    return userCanReadDataClasses(user);
}

export function userCanReadDataClasses(user: User): boolean {
    return hasAllPermissions(user, [PermissionTypes.ReadDataClass]);
}

export function userCanReadMedia(user: User): boolean {
    return hasAllPermissions(user, [PermissionTypes.ReadMedia]);
}

export function userCanReadNotebooks(user: User): boolean {
    return hasAllPermissions(user, [PermissionTypes.ReadNotebooks]);
}

export function userCanManagePicklists(user: User): boolean {
    return hasAllPermissions(user, [PermissionTypes.ManagePicklists]);
}

export function userCanDeletePublicPicklists(user: User): boolean {
    return user.isAdmin;
}

export function userCanManageSampleWorkflow(user: User): boolean {
    return hasAllPermissions(user, [PermissionTypes.ManageSampleWorkflows], false);
}

export function userCanDesignSourceTypes(user: User): boolean {
    return hasAllPermissions(user, [PermissionTypes.DesignDataClass]);
}

export function userCanDesignLocations(user: User): boolean {
    return hasAllPermissions(user, [PermissionTypes.DesignStorage], false);
}

export function userCanEditStorageData(user: User): boolean {
    return hasAllPermissions(user, [PermissionTypes.EditStorageData], false);
}

export function isFreezerManagementEnabled(moduleContext?: ModuleContext): boolean {
    return resolveModuleContext(moduleContext)?.inventory !== undefined;
}

export function isOntologyEnabled(moduleContext?: ModuleContext): boolean {
    return hasModule('Ontology', moduleContext);
}

export function isProductNavigationEnabled(productId: string, moduleContext?: ModuleContext): boolean {
    if (productId === SAMPLE_MANAGER_APP_PROPERTIES.productId) {
        return isSampleManagerEnabled(moduleContext) && !isBiologicsEnabled(moduleContext);
    } else if (productId === BIOLOGICS_APP_PROPERTIES.productId) {
        return isBiologicsEnabled(moduleContext);
    }

    return false;
}

export function isProductProjectsEnabled(moduleContext?: ModuleContext): boolean {
    return resolveModuleContext(moduleContext)?.query?.isProductProjectsEnabled === true;
}

export function hasProductProjects(moduleContext?: ModuleContext): boolean {
    return resolveModuleContext(moduleContext)?.query?.hasProductProjects === true;
}

export function isSampleManagerEnabled(moduleContext?: ModuleContext): boolean {
    return resolveModuleContext(moduleContext)?.samplemanagement !== undefined;
}

export function isBiologicsEnabled(moduleContext?: ModuleContext): boolean {
    return resolveModuleContext(moduleContext)?.biologics !== undefined;
}

export function isPremiumProductEnabled(moduleContext?: ModuleContext): boolean {
    return isSampleManagerEnabled(moduleContext) || isBiologicsEnabled(moduleContext);
}

export function isAppHomeFolder(container?: Container): boolean {
    const folderType = container?.folderType ?? getServerContext()?.container?.folderType;
    return folderType === SAMPLE_MANAGER_APP_PROPERTIES.name || folderType === BIOLOGICS_APP_PROPERTIES.name;
}

export function sampleManagerIsPrimaryApp(moduleContext?: ModuleContext): boolean {
    return getPrimaryAppProperties(moduleContext)?.productId === SAMPLE_MANAGER_APP_PROPERTIES.productId;
}

export function biologicsIsPrimaryApp(moduleContext?: ModuleContext): boolean {
    return getPrimaryAppProperties(moduleContext)?.productId === BIOLOGICS_APP_PROPERTIES.productId;
}

export function isSampleStatusEnabled(moduleContext?: ModuleContext): boolean {
    return hasModule('SampleManagement', moduleContext);
}

export function getCurrentAppProperties(): AppProperties {
    const lcController = ActionURL.getController().toLowerCase();
    if (!lcController) return undefined;
    if (lcController === SAMPLE_MANAGER_APP_PROPERTIES.controllerName.toLowerCase())
        return SAMPLE_MANAGER_APP_PROPERTIES;
    if (lcController === BIOLOGICS_APP_PROPERTIES.controllerName.toLowerCase()) return BIOLOGICS_APP_PROPERTIES;
    if (lcController === FREEZER_MANAGER_APP_PROPERTIES.controllerName.toLowerCase())
        return FREEZER_MANAGER_APP_PROPERTIES;
    return undefined;
}

export function getPrimaryAppProperties(moduleContext?: ModuleContext): AppProperties {
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

export function isAssayEnabled(moduleContext?: ModuleContext): boolean {
    return (
        hasModule('assay', moduleContext) &&
        (isCommunityDistribution(moduleContext) || isFeatureEnabled(ProductFeature.Assay, moduleContext))
    );
}

export function isAssayQCEnabled(moduleContext?: ModuleContext): boolean {
    // NK: The product tiers which include Assay QC are not fully defined.
    // For now (v22.11+), we're going to continue offering Assay QC features until
    // we can fully define all desired product tiers. Once that is done we can respect
    // the associated feature flag instead.
    // isFeatureEnabled(ProductFeature.AssayQC, moduleContext)
    return isAssayEnabled(moduleContext) && hasPremiumModule(moduleContext);
}

export function isAssayRequestsEnabled(moduleContext?: ModuleContext): boolean {
    return (
        hasModule('assayRequest', moduleContext) &&
        resolveModuleContext(moduleContext)?.biologics?.[EXPERIMENTAL_REQUESTS_MENU] === true
    );
}

// Don't enable assay design export unless there is an import capability (which we don't have for LKSM products)
export function isAssayDesignExportEnabled(moduleContext?: ModuleContext): boolean {
    return hasPremiumModule(moduleContext);
}

export function isELNEnabled(moduleContext?: ModuleContext): boolean {
    return hasModule('LabBook', moduleContext) && isFeatureEnabled(ProductFeature.ELN, moduleContext);
}

export function isProtectedDataEnabled(moduleContext?: ModuleContext): boolean {
    return hasModule('compliance', moduleContext) && hasModule('complianceActivities', moduleContext);
}

export function isMediaEnabled(moduleContext?: ModuleContext): boolean {
    return isFeatureEnabled(ProductFeature.Media, moduleContext);
}

export function isWorkflowEnabled(moduleContext?: ModuleContext): boolean {
    return (
        hasModule(SAMPLE_MANAGER_APP_PROPERTIES.moduleName, moduleContext) &&
        isFeatureEnabled(ProductFeature.Workflow, moduleContext)
    );
}

export function isFeatureEnabled(flag: ProductFeature, moduleContext?: ModuleContext): boolean {
    return resolveModuleContext(moduleContext)?.core?.productFeatures?.indexOf(flag) >= 0;
}

export function isSampleAliquotSelectorEnabled(moduleContext?: ModuleContext): boolean {
    return resolveModuleContext(moduleContext)?.samplemanagement?.[EXPERIMENTAL_SAMPLE_ALIQUOT_SELECTOR] === true;
}

export function hasModule(moduleName: string, moduleContext?: ModuleContext): boolean {
    return resolveModuleContext(moduleContext).api?.moduleNames?.indexOf(moduleName.toLowerCase()) >= 0;
}

export function hasPremiumModule(moduleContext?: ModuleContext): boolean {
    return hasModule('Premium', moduleContext);
}

export function isCommunityDistribution(moduleContext?: ModuleContext): boolean {
    return !hasModule('SampleManagement', moduleContext) && !hasPremiumModule(moduleContext);
}

export function isProjectContainer(containerPath?: string): boolean {
    let path = containerPath ?? getServerContext().container.path;
    if (!path) return false;
    if (!path.endsWith('/')) path = path + '/';
    return path.split('/').filter(p => !!p).length === 1;
}

export function getProjectPath(containerPath?: string): string {
    const path = containerPath ?? getServerContext().container.path;
    if (!path) return undefined;
    return path.split('/').filter(p => !!p)[0] + '/';
}

// exported for testing
export function getStorageSectionConfig(
    user: User,
    currentProductId: string,
    moduleContext: any,
    maxItemsPerColumn: number
): MenuSectionConfig {
    if (isFreezerManagementEnabled(moduleContext)) {
        const fmAppBase = getApplicationUrlBase(
            FREEZER_MANAGER_APP_PROPERTIES.moduleName,
            currentProductId,
            moduleContext
        );
        let locationsMenuConfig = new MenuSectionConfig({
            emptyText: 'No freezers have been defined',
            iconURL: imageURL('_images', 'freezer_menu.svg'),
            maxColumns: 1,
            maxItemsPerColumn,
            seeAllURL: fmAppBase + AppURL.create(HOME_KEY).toHref(),
            headerURL: fmAppBase + AppURL.create(HOME_KEY).toHref(),
        });
        // freezer creation not supported in sub folders
        if (userCanDesignLocations(user) && isProjectContainer()) {
            locationsMenuConfig = locationsMenuConfig.merge({
                emptyURL: fmAppBase + AppURL.create(FREEZERS_KEY, 'new').toHref(),
                emptyURLText: 'Create a freezer',
            }) as MenuSectionConfig;
        }
        return locationsMenuConfig;
    }
    return undefined;
}

// exported for testing
export function addSourcesSectionConfig(
    user: User,
    appBase: string,
    sectionConfigs: List<Map<string, MenuSectionConfig>>
): List<Map<string, MenuSectionConfig>> {
    if (!userCanReadSources(user)) return sectionConfigs;

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
    return sectionConfigs.push(Map({ [SOURCES_KEY]: sourcesMenuConfig }));
}

// exported for testing
export function addSamplesSectionConfig(
    user: User,
    appBase: string,
    sectionConfigs: List<Map<string, MenuSectionConfig>>
): List<Map<string, MenuSectionConfig>> {
    let samplesMenuConfig = new MenuSectionConfig({
        emptyText: 'No sample types have been defined',
        iconURL: imageURL('_images', 'samples.svg'),
        maxColumns: 1,
        maxItemsPerColumn: 12,
        seeAllURL: appBase + AppURL.create(SAMPLES_KEY).addParam('viewAs', 'cards').toHref(),
    });
    if (user.hasDesignSampleTypesPermission()) {
        samplesMenuConfig = samplesMenuConfig.merge({
            emptyURL: appBase + NEW_SAMPLE_TYPE_HREF.toHref(),
            emptyURLText: 'Create a sample type',
        }) as MenuSectionConfig;
    }
    return sectionConfigs.push(Map<string, MenuSectionConfig>().set(SAMPLES_KEY, samplesMenuConfig));
}

// exported for testing
export function addAssaysSectionConfig(
    user: User,
    appBase: string,
    sectionConfigs: List<Map<string, MenuSectionConfig>>
): List<Map<string, MenuSectionConfig>> {
    if (!userCanReadAssays(user)) return sectionConfigs;

    let assaysMenuConfig = new MenuSectionConfig({
        emptyText: 'No assays have been defined',
        iconURL: imageURL('_images', 'assay.svg'),
        maxColumns: 1,
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

function getWorkflowSectionConfig(appBase: string): MenuSectionConfig {
    return new MenuSectionConfig({
        headerURL: appBase + WORKFLOW_HOME_HREF.toHref(),
        iconURL: imageURL('_images', 'workflow.svg'),
        seeAllURL: appBase + AppURL.create(WORKFLOW_KEY).toHref(),
    });
}

function getPicklistsSectionConfig(appBase: string): MenuSectionConfig {
    return new MenuSectionConfig({
        headerURL: appBase + PICKLIST_HOME_HREF.toHref(),
        iconURL: imageURL('_images', 'picklist.svg'),
    });
}

function getNotebooksSectionConfig(appBase: string): MenuSectionConfig {
    return new MenuSectionConfig({
        iconURL: imageURL('labbook/images', 'notebook_blue.svg'),
        headerURL: appBase + AppURL.create(NOTEBOOKS_KEY).toHref(),
    });
}

function getMediaSectionConfig(appBase: string): MenuSectionConfig {
    return new MenuSectionConfig({
        headerURL: appBase + AppURL.create(MEDIA_KEY).toHref(),
        iconURL: imageURL('_images', 'mixtures.svg'),
        seeAllURL: appBase + AppURL.create(MEDIA_KEY).toHref(),
    });
}

function getRegistrySectionConfig(appBase: string): MenuSectionConfig {
    return new MenuSectionConfig({
        iconURL: imageURL('_images', 'molecule.svg'),
        seeAllURL: appBase + AppURL.create(REGISTRY_KEY).toHref(),
    });
}

const USER_SECTION_CONFIG = new MenuSectionConfig({
    iconCls: 'fas fa-user-circle ',
});

const REQUESTS_SECTION_CONFIG = new MenuSectionConfig({
    headerURL: buildURL('query', 'executeQuery', {
        schemaName: 'issues',
        'query.queryName': 'IssueListDef',
    }),
    iconURL: imageURL('_images', 'default.svg'),
});

function getBioWorkflowNotebookMediaConfigs(appBase: string, user: User): Map<string, MenuSectionConfig> {
    let configs = Map({
        [WORKFLOW_KEY]: getWorkflowSectionConfig(appBase),
    });
    if (userCanReadMedia(user)) {
        configs = configs.set(MEDIA_KEY, getMediaSectionConfig(appBase));
    }
    configs = configs.set(PICKLIST_KEY, getPicklistsSectionConfig(appBase));
    if (userCanReadNotebooks(user)) {
        configs = configs.set(NOTEBOOKS_KEY, getNotebooksSectionConfig(appBase));
    }
    return configs;
}

// exported for testing
export function getMenuSectionConfigs(
    user: User,
    currentProductId: string,
    moduleContext?: ModuleContext
): List<Map<string, MenuSectionConfig>> {
    let sectionConfigs = List<Map<string, MenuSectionConfig>>();

    const appBase = getApplicationUrlBase(
        getPrimaryAppProperties(moduleContext).moduleName,
        currentProductId,
        moduleContext
    );
    const currentAppProperties = getCurrentAppProperties(); // based on the controller name
    const isSMPrimary = sampleManagerIsPrimaryApp(moduleContext);
    const isBioPrimary = biologicsIsPrimaryApp(moduleContext);
    const isBioOrSM = isSMPrimary || isBioPrimary;
    const inSMApp = isSMPrimary || currentAppProperties?.productId === SAMPLE_MANAGER_APP_PROPERTIES.productId;
    if (inSMApp) {
        sectionConfigs = addSourcesSectionConfig(user, appBase, sectionConfigs);
    } else if (isBioPrimary) {
        if (userCanReadDataClasses(user)) {
            sectionConfigs = sectionConfigs.push(Map({ [REGISTRY_KEY]: getRegistrySectionConfig(appBase) }));
        }
    }
    if (isBioOrSM) {
        sectionConfigs = addSamplesSectionConfig(user, appBase, sectionConfigs);
        if (isAssayEnabled(moduleContext)) {
            sectionConfigs = addAssaysSectionConfig(user, appBase, sectionConfigs);
        }
    }

    const storageConfig = getStorageSectionConfig(
        user,
        currentProductId,
        moduleContext,
        isBioPrimary && isAssayRequestsEnabled(moduleContext) ? 7 : 12
    );

    if (inSMApp) {
        if (storageConfig) {
            sectionConfigs = sectionConfigs.push(Map({ [FREEZERS_KEY]: storageConfig }));
        }
        let configs = Map<string, MenuSectionConfig>({});
        if (isWorkflowEnabled(moduleContext)) {
            configs = configs.set(WORKFLOW_KEY, getWorkflowSectionConfig(appBase));
        }
        configs = configs.set(PICKLIST_KEY, getPicklistsSectionConfig(appBase));

        if (userCanReadNotebooks(user) && isELNEnabled(moduleContext)) {
            configs = configs.set(NOTEBOOKS_KEY, getNotebooksSectionConfig(appBase));
        }
        sectionConfigs = sectionConfigs.push(configs);
    } else if (isBioPrimary) {
        if (isAssayRequestsEnabled(moduleContext)) {
            // When "Requests" are enabled render as two columns
            let requestsCol = Map({
                [REQUESTS_KEY]: REQUESTS_SECTION_CONFIG,
            });
            // ... and put the storage in this same column
            if (storageConfig) {
                requestsCol = requestsCol.set(FREEZERS_KEY, storageConfig);
            }
            sectionConfigs = sectionConfigs.push(requestsCol, getBioWorkflowNotebookMediaConfigs(appBase, user));
        } else {
            if (storageConfig) {
                sectionConfigs = sectionConfigs.push(Map({ [FREEZERS_KEY]: storageConfig }));
            }

            sectionConfigs = sectionConfigs.push(getBioWorkflowNotebookMediaConfigs(appBase, user));
        }
    } else {
        if (storageConfig) {
            sectionConfigs = sectionConfigs.push(Map({ [FREEZERS_KEY]: storageConfig }));
        }
        sectionConfigs = sectionConfigs.push(Map({ [USER_KEY]: USER_SECTION_CONFIG }));
    }
    return sectionConfigs;
}

export const useMenuSectionConfigs = (
    user: User,
    appProperties: AppProperties,
    moduleContext: any
): List<Map<string, MenuSectionConfig>> => {
    return useMemo(() => {
        return getMenuSectionConfigs(user, appProperties.productId, moduleContext);
    }, [user, moduleContext, appProperties.productId]);
};

function getProductId(moduleName: string, moduleContext: any): string {
    const lcModuleName = moduleName.toLowerCase();
    const context = resolveModuleContext(moduleContext)?.[lcModuleName];
    return context?.productId?.toLowerCase();
}

function getApplicationUrlBase(moduleName: string, currentProductId: string, moduleContext: any): string {
    const lcProductId = getProductId(moduleName, moduleContext);
    return !lcProductId || lcProductId === currentProductId.toLowerCase()
        ? ''
        : buildURL(lcProductId, 'app.view', undefined, { returnUrl: false });
}

export function getDateFormat(): string {
    return getServerContext().container.formats.dateFormat;
}

export function getDateTimeFormat(): string {
    return getServerContext().container.formats.dateTimeFormat;
}
// Returns the friendly name of the product, primarily for use in help text.
export function getCurrentProductName(): string {
    const lcController = ActionURL.getController().toLowerCase();
    if (!lcController) return LABKEY_SERVER_PRODUCT_NAME;

    if (isPremiumProductEnabled()) {
        return getPrimaryAppProperties().name;
    }
    return LABKEY_SERVER_PRODUCT_NAME;
}

// TODO when isFreezerManagerEnabled goes away, we can put this data in the AppProperties constants instead
export function getAppProductIds(appProductId: string): List<string> {
    let productIds = List.of(appProductId);
    if (
        appProductId === SAMPLE_MANAGER_APP_PROPERTIES.productId ||
        appProductId == BIOLOGICS_APP_PROPERTIES.productId
    ) {
        productIds = productIds.push(FREEZER_MANAGER_APP_PROPERTIES.productId);
    }
    return productIds;
}
