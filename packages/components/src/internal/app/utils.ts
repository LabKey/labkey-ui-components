/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List, Map } from 'immutable';
import { ActionURL, LabKey, getServerContext, PermissionTypes } from '@labkey/api';

import { useMemo } from 'react';

import { LABKEY_WEBSOCKET } from '../constants';

import { hasAllPermissions, hasPermissions, User } from '../components/base/models/User';

import { MenuSectionConfig } from '../components/navigation/model';
import { imageURL } from '../url/ActionURL';
import { AppURL } from '../url/AppURL';
import { ModuleContext } from '../components/base/ServerContext';

import { Container } from '../components/base/models/Container';

import { AppProperties } from './models';
import {
    ASSAYS_KEY,
    BIOLOGICS_APP_PROPERTIES,
    EXPERIMENTAL_APP_PLATE_SUPPORT,
    EXPERIMENTAL_PRODUCT_ALL_FOLDER_LOOKUPS,
    EXPERIMENTAL_PRODUCT_PROJECT_DATA_LISTING_SCOPED,
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
    NEW_STANDARD_ASSAY_DESIGN_HREF,
    NOTEBOOKS_KEY,
    PLATES_KEY,
    PICKLIST_KEY,
    ProductFeature,
    PROJECT_DATA_TYPE_EXCLUSIONS,
    REGISTRY_KEY,
    REQUESTS_KEY,
    SAMPLE_MANAGER_APP_PROPERTIES,
    SAMPLES_KEY,
    SERVER_NOTIFICATIONS_INVALIDATE,
    SOURCES_KEY,
    USER_KEY,
    WORKFLOW_KEY,
    EXPERIMENTAL_APP_R_SUPPORT,
} from './constants';

declare var LABKEY: LabKey;

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

export function userCanReadUserDetails(user: User): boolean {
    return hasAllPermissions(user, [PermissionTypes.CanSeeUserDetails], false);
}

export function userCanReadGroupDetails(user: User): boolean {
    return hasAllPermissions(user, [PermissionTypes.CanSeeGroupDetails], false);
}

export function userCanEditSharedViews(user: User): boolean {
    return hasPermissions(user, [PermissionTypes.EditSharedView]);
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

export function setProductProjects(moduleContext: ModuleContext, hasProductProjects: boolean): ModuleContext {
    // side-effect set global moduleContext
    if (LABKEY?.moduleContext?.query) {
        LABKEY.moduleContext.query.hasProductProjects = hasProductProjects;
    }

    return Object.assign(moduleContext ?? {}, {
        query: Object.assign(moduleContext?.query ?? {}, { hasProductProjects }),
    });
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

export function isAppHomeFolder(container?: Container, moduleContext?: ModuleContext): boolean {
    // If it's a Home project, or if it's a subfolder and products are disabled.
    const currentContainer: Partial<Container> = container ?? getServerContext().container;
    const isTopFolder = currentContainer.isProject || isProjectContainer(currentContainer.path);
    const isSubFolder = currentContainer.isFolder || isSubFolderContainer(currentContainer.path);
    return isTopFolder || (isSubFolder && !isProductProjectsEnabled(moduleContext));
}

export function getAppHomeFolderPath(container: Container, moduleContext?: ModuleContext): string {
    return isAppHomeFolder(container, moduleContext) ? container.path : container.parentPath;
}

export function sampleManagerIsPrimaryApp(moduleContext?: ModuleContext): boolean {
    return getPrimaryAppProperties(moduleContext)?.productId === SAMPLE_MANAGER_APP_PROPERTIES.productId;
}

export function biologicsIsPrimaryApp(moduleContext?: ModuleContext): boolean {
    return getPrimaryAppProperties(moduleContext)?.productId === BIOLOGICS_APP_PROPERTIES.productId;
}

export function freezerManagerIsCurrentApp(): boolean {
    return getCurrentAppProperties()?.productId === FREEZER_MANAGER_APP_PROPERTIES.productId;
}

export function isSampleStatusEnabled(moduleContext?: ModuleContext): boolean {
    return hasModule('SampleManagement', moduleContext);
}

export function getCurrentAppProperties(): AppProperties {
    const lcController = ActionURL.getController().toLowerCase();
    if (!lcController) return undefined;
    if (lcController === SAMPLE_MANAGER_APP_PROPERTIES.controllerName.toLowerCase()) {
        return SAMPLE_MANAGER_APP_PROPERTIES;
    } else if (lcController === BIOLOGICS_APP_PROPERTIES.controllerName.toLowerCase()) {
        return BIOLOGICS_APP_PROPERTIES;
    } else if (lcController === FREEZER_MANAGER_APP_PROPERTIES.controllerName.toLowerCase()) {
        return FREEZER_MANAGER_APP_PROPERTIES;
    }
    return undefined;
}

export function isApp(): boolean {
    return getCurrentAppProperties() !== undefined;
}

/**
 * In LKS we use the 'primary' bootstrap class for submit buttons, but in our apps we use 'success', this helper method
 * returns the correct class for you.
 */
export function getSubmitButtonClass(): string {
    return isApp() ? 'success' : 'primary';
}

export function getPrimaryAppProperties(moduleContext?: ModuleContext): AppProperties {
    // Issue 47390: when URL is in the LKB or LKSM controller, then that should be considered the primary app
    //              it is the LKFM app case when we want to determine the primary app based on enabled modules
    const currentAppProperties = getCurrentAppProperties();
    if (
        currentAppProperties?.productId === BIOLOGICS_APP_PROPERTIES.productId ||
        currentAppProperties?.productId === SAMPLE_MANAGER_APP_PROPERTIES.productId
    ) {
        return currentAppProperties;
    }

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

export function isAllProductFoldersFilteringEnabled(moduleContext?: ModuleContext): boolean {
    return resolveModuleContext(moduleContext)?.query?.[EXPERIMENTAL_PRODUCT_ALL_FOLDER_LOOKUPS] === true;
}

export function isProductProjectsDataListingScopedToProject(moduleContext?: ModuleContext): boolean {
    return resolveModuleContext(moduleContext)?.query?.[EXPERIMENTAL_PRODUCT_PROJECT_DATA_LISTING_SCOPED] === true;
}

export function getProjectDataExclusion(moduleContext?: ModuleContext): { [key: string]: number[] } {
    return resolveModuleContext(moduleContext)?.samplemanagement?.[PROJECT_DATA_TYPE_EXCLUSIONS];
}

export function getProjectSampleTypeExclusion(moduleContext?: ModuleContext): number[] {
    return getProjectDataExclusion(moduleContext)?.['SampleType'];
}

export function getProjectDataClassExclusion(moduleContext?: ModuleContext): number[] {
    return getProjectDataExclusion(moduleContext)?.['DataClass'];
}

export function getProjectAssayDesignExclusion(moduleContext?: ModuleContext): number[] {
    return getProjectDataExclusion(moduleContext)?.['AssayDesign'];
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

export function isPlatesEnabled(moduleContext?: ModuleContext): boolean {
    return (
        biologicsIsPrimaryApp(moduleContext) &&
        resolveModuleContext(moduleContext)?.biologics?.[EXPERIMENTAL_APP_PLATE_SUPPORT] === true
    );
}

export function isRReportsEnabled(moduleContext?: ModuleContext): boolean {
    return (
        biologicsIsPrimaryApp(moduleContext) &&
        resolveModuleContext(moduleContext)?.biologics?.[EXPERIMENTAL_APP_R_SUPPORT] === true
    );
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

export function isRestrictedIssueListSupported(moduleContext?: ModuleContext): boolean {
    return resolveModuleContext(moduleContext)?.issues?.hasRestrictedIssueList === true;
}

export function isProjectContainer(containerPath?: string): boolean {
    return getContainerDepth(containerPath) === 1;
}

function isSubFolderContainer(containerPath?: string): boolean {
    return getContainerDepth(containerPath) > 1;
}

export function getContainerDepth(containerPath?: string): number {
    let path = containerPath ?? getServerContext().container.path;
    if (!path) return 0;
    if (!path.endsWith('/')) path = path + '/';
    return path.split('/').filter(p => !!p).length;
}

export function getProjectPath(containerPath?: string): string {
    const path = containerPath ?? getServerContext().container.path;
    if (!path) return undefined;
    return path.split('/').filter(p => !!p)[0] + '/';
}

// exported for testing
export function getStorageSectionConfig(user: User, currentProductId: string, moduleContext: any): MenuSectionConfig {
    if (isFreezerManagementEnabled(moduleContext)) {
        let locationsMenuConfig = new MenuSectionConfig({
            emptyText: 'No storage has been defined',
            filteredEmptyText: 'No storage available',
            iconURL: imageURL('_images', 'freezer_menu.svg'),
            headerURLPart: HOME_KEY,
        });
        if (user && userCanDesignLocations(user)) {
            locationsMenuConfig = locationsMenuConfig.merge({
                emptyAppURL: AppURL.create(FREEZERS_KEY, 'new'),
                emptyURLText: 'Create storage',
            }) as MenuSectionConfig;
        }
        return locationsMenuConfig;
    }
    return undefined;
}

// exported for testing
export function addSourcesSectionConfig(
    user: User,
    sectionConfigs: List<Map<string, MenuSectionConfig>>
): List<Map<string, MenuSectionConfig>> {
    let sourcesMenuConfig = new MenuSectionConfig({
        emptyText: 'No source types have been defined',
        filteredEmptyText: 'No source types available',
        iconURL: imageURL('_images', 'source_type.svg'),
    });
    if (user && userCanDesignSourceTypes(user)) {
        sourcesMenuConfig = sourcesMenuConfig.merge({
            emptyAppURL: NEW_SOURCE_TYPE_HREF,
            emptyURLText: 'Create a source type',
        }) as MenuSectionConfig;
    }
    return sectionConfigs.push(Map({ [SOURCES_KEY]: sourcesMenuConfig }));
}

// exported for testing
export function getSamplesSectionConfig(user: User): MenuSectionConfig {
    let samplesMenuConfig = new MenuSectionConfig({
        emptyText: 'No sample types have been defined',
        filteredEmptyText: 'No sample types available',
        iconURL: imageURL('_images', 'samples.svg'),
    });
    if (user && user.hasDesignSampleTypesPermission()) {
        samplesMenuConfig = samplesMenuConfig.merge({
            emptyAppURL: NEW_SAMPLE_TYPE_HREF,
            emptyURLText: 'Create a sample type',
        }) as MenuSectionConfig;
    }
    return samplesMenuConfig;
}

// exported for testing
export function addAssaysSectionConfig(
    user: User,
    sectionConfigs: List<Map<string, MenuSectionConfig>>,
    standardAssayOnly: boolean
): List<Map<string, MenuSectionConfig>> {
    let assaysMenuConfig = new MenuSectionConfig({
        emptyText: 'No assays have been defined',
        filteredEmptyText: 'No assays available',
        iconURL: imageURL('_images', 'assay.svg'),
    });
    if (user && user.hasDesignAssaysPermission()) {
        assaysMenuConfig = assaysMenuConfig.merge({
            emptyAppURL: standardAssayOnly ? NEW_STANDARD_ASSAY_DESIGN_HREF : NEW_ASSAY_DESIGN_HREF,
            emptyURLText: 'Create an assay design',
        }) as MenuSectionConfig;
    }
    return sectionConfigs.push(Map<string, MenuSectionConfig>().set(ASSAYS_KEY, assaysMenuConfig));
}

export function getPlatesSectionConfig(): MenuSectionConfig {
    return new MenuSectionConfig({
        iconURL: imageURL('_images', 'plates.svg'),
    });
}

function getWorkflowSectionConfig(): MenuSectionConfig {
    return new MenuSectionConfig({
        iconURL: imageURL('_images', 'workflow.svg'),
    });
}

function getPicklistsSectionConfig(): MenuSectionConfig {
    return new MenuSectionConfig({
        iconURL: imageURL('_images', 'picklist.svg'),
    });
}

function getNotebooksSectionConfig(): MenuSectionConfig {
    return new MenuSectionConfig({
        iconURL: imageURL('labbook/images', 'notebook_blue.svg'),
    });
}

function getMediaSectionConfig(): MenuSectionConfig {
    return new MenuSectionConfig({
        iconURL: imageURL('_images', 'mixtures.svg'),
    });
}

function getRegistrySectionConfig(): MenuSectionConfig {
    return new MenuSectionConfig({
        iconURL: imageURL('_images', 'molecule.svg'),
    });
}

const USER_SECTION_CONFIG = new MenuSectionConfig({
    iconCls: 'fas fa-user-circle ',
});

const REQUESTS_SECTION_CONFIG = new MenuSectionConfig({
    useOriginalURL: true,
    iconURL: imageURL('_images', 'default.svg'),
});

function getBioWorkflowNotebookMediaConfigs(): Map<string, MenuSectionConfig> {
    return Map({
        [WORKFLOW_KEY]: getWorkflowSectionConfig(),
        [MEDIA_KEY]: getMediaSectionConfig(),
        [PICKLIST_KEY]: getPicklistsSectionConfig(),
        [NOTEBOOKS_KEY]: getNotebooksSectionConfig(),
    });
}

// exported for testing
export function getMenuSectionConfigs(
    user: User,
    currentProductId: string,
    moduleContext?: ModuleContext
): List<Map<string, MenuSectionConfig>> {
    let sectionConfigs = List<Map<string, MenuSectionConfig>>();

    const currentAppProperties = getCurrentAppProperties(); // based on the controller name
    const isSMPrimary = sampleManagerIsPrimaryApp(moduleContext);
    const isBioPrimary = biologicsIsPrimaryApp(moduleContext);
    const isBioOrSM = isSMPrimary || isBioPrimary;
    const inSMApp = isSMPrimary || currentAppProperties?.productId === SAMPLE_MANAGER_APP_PROPERTIES.productId;
    if (inSMApp) {
        sectionConfigs = addSourcesSectionConfig(user, sectionConfigs);
    } else if (isBioPrimary) {
        sectionConfigs = sectionConfigs.push(Map({ [REGISTRY_KEY]: getRegistrySectionConfig() }));
    }
    if (isBioOrSM) {
        let configs = Map<string, MenuSectionConfig>({ [SAMPLES_KEY]: getSamplesSectionConfig(user) });
        if (isPlatesEnabled(moduleContext)) {
            configs = configs.set(PLATES_KEY, getPlatesSectionConfig());
        }
        sectionConfigs = sectionConfigs.push(configs);

        if (isAssayEnabled(moduleContext)) {
            sectionConfigs = addAssaysSectionConfig(user, sectionConfigs, isSMPrimary);
        }
    }

    const storageConfig = getStorageSectionConfig(user, currentProductId, moduleContext);

    if (inSMApp) {
        if (storageConfig) {
            sectionConfigs = sectionConfigs.push(Map({ [FREEZERS_KEY]: storageConfig }));
        }
        let configs = Map<string, MenuSectionConfig>({});
        if (isWorkflowEnabled(moduleContext)) {
            configs = configs.set(WORKFLOW_KEY, getWorkflowSectionConfig());
        }
        configs = configs.set(PICKLIST_KEY, getPicklistsSectionConfig());
        if (isELNEnabled(moduleContext)) {
            configs = configs.set(NOTEBOOKS_KEY, getNotebooksSectionConfig());
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
            sectionConfigs = sectionConfigs.push(requestsCol, getBioWorkflowNotebookMediaConfigs());
        } else {
            if (storageConfig) {
                sectionConfigs = sectionConfigs.push(Map({ [FREEZERS_KEY]: storageConfig }));
            }

            sectionConfigs = sectionConfigs.push(getBioWorkflowNotebookMediaConfigs());
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
    moduleContext?: ModuleContext
): List<Map<string, MenuSectionConfig>> => {
    return useMemo(
        () => getMenuSectionConfigs(user, appProperties.productId, moduleContext),
        [user, moduleContext, appProperties.productId]
    );
};

// Returns the friendly name of the product, primarily for use in help text.
export function getCurrentProductName(moduleContext?: ModuleContext): string {
    const lcController = ActionURL.getController().toLowerCase();
    if (!lcController) return LABKEY_SERVER_PRODUCT_NAME;

    if (isPremiumProductEnabled(moduleContext)) {
        return getPrimaryAppProperties(moduleContext).name;
    }
    return LABKEY_SERVER_PRODUCT_NAME;
}

export function getAppProductIds(appProductId: string): List<string> {
    let productIds = List.of(appProductId);
    if (
        appProductId === SAMPLE_MANAGER_APP_PROPERTIES.productId ||
        appProductId === BIOLOGICS_APP_PROPERTIES.productId
    ) {
        productIds = productIds.push(FREEZER_MANAGER_APP_PROPERTIES.productId);
    }
    return productIds;
}
