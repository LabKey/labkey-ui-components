/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List, Map } from 'immutable';
import { getServerContext, PermissionTypes } from '@labkey/api';

import { AppURL } from '../url/AppURL';
import { buildURL, imageURL } from '../url/ActionURL';
import { hasAllPermissions } from '../../util/utils';
import { MenuSectionConfig } from '../components/navigation/ProductMenuSection';
import { User } from '../components/base/models/model';

import {
    ASSAYS_KEY,
    HOME_KEY,
    FREEZERS_KEY,
    NEW_ASSAY_DESIGN_HREF,
    NEW_FREEZER_DESIGN_HREF,
    NEW_SAMPLE_TYPE_HREF,
    NEW_SOURCE_TYPE_HREF,
    SAMPLES_KEY,
    SECURITY_LOGOUT,
    SECURITY_SERVER_UNAVAILABLE,
    SECURITY_SESSION_TIMEOUT,
    SOURCES_KEY,
    USER_KEY,
    WORKFLOW_HOME_HREF,
    WORKFLOW_KEY,
} from './constants';

export function initWebSocketListeners(store): void {
    // register websocket listener for the case where a user logs out in another tab
    LABKEY.WebSocket.addServerEventListener('org.labkey.api.security.AuthNotify#LoggedOut', function (evt) {
        window.setTimeout(() => store.dispatch({ type: SECURITY_LOGOUT }), 1000);
    });

    // register websocket listener for session timeout code
    LABKEY.WebSocket.addServerEventListener(1008, function (evt) {
        window.setTimeout(() => store.dispatch({ type: SECURITY_SESSION_TIMEOUT }), 1000);
    });

    // register websocket listener for server being shutdown
    LABKEY.WebSocket.addServerEventListener(1001, function (evt) {
        // Issue 39473: 1001 sent when server is shutdown normally (AND on page reload in FireFox, but that one doesn't have a reason)
        if (evt.code === 1001 && evt.reason && evt.reason !== '') {
            window.setTimeout(() => store.dispatch({ type: SECURITY_SERVER_UNAVAILABLE }), 1000);
        }
    });
}

export function userCanDesignSourceTypes(user: User): boolean {
    return hasAllPermissions(user, [PermissionTypes.DesignDataClass]);
}

export function userCanDesignLocations(user: User): boolean {
    return hasAllPermissions(user, [PermissionTypes.Admin]);
}

export function isFreezerManagementEnabled(): boolean {
    const smEnabled = isSampleManagerEnabled();
    return (
        getServerContext().moduleContext.inventory &&
        (!smEnabled || getServerContext().moduleContext.samplemanagement.hasFreezerManagementEnabled === true)
    );
}

export function isSampleManagerEnabled(): boolean {
    return getServerContext().moduleContext.samplemanagement !== undefined;
}

export function getMenuSectionConfigs(user: User, currentApp: string): List<Map<string, MenuSectionConfig>> {
    let sectionConfigs = List<Map<string, MenuSectionConfig>>();

    const smAppBase = getApplicationUrlBase('sampleManagement', currentApp);
    const fmAppBase = getApplicationUrlBase('inventory', currentApp);

    if (isSampleManagerEnabled()) {
        let sourcesMenuConfig = new MenuSectionConfig({
            emptyText: 'No source types have been defined',
            iconURL: imageURL('_images', 'source_type.svg'),
            maxColumns: 1,
            maxItemsPerColumn: 12,
            seeAllURL: smAppBase + AppURL.create(SOURCES_KEY).addParam('viewAs', 'grid').toHref(),
        });
        if (userCanDesignSourceTypes(user)) {
            sourcesMenuConfig = sourcesMenuConfig.merge({
                emptyURL: smAppBase + NEW_SOURCE_TYPE_HREF.toHref(),
                emptyURLText: 'Create a source type',
            }) as MenuSectionConfig;
        }
        sectionConfigs = sectionConfigs.push(Map<string, MenuSectionConfig>().set(SOURCES_KEY, sourcesMenuConfig));

        let samplesMenuConfig = new MenuSectionConfig({
            emptyText: 'No sample types have been defined',
            iconURL: imageURL('_images', 'samples.svg'),
            maxColumns: 1,
            maxItemsPerColumn: 12,
            seeAllURL: smAppBase + AppURL.create(SAMPLES_KEY).addParam('viewAs', 'cards').toHref(),
        });
        if (user.hasDesignSampleSetsPermission()) {
            samplesMenuConfig = samplesMenuConfig.merge({
                emptyURL: smAppBase + NEW_SAMPLE_TYPE_HREF.toHref(),
                emptyURLText: 'Create a sample type',
            }) as MenuSectionConfig;
        }
        sectionConfigs = sectionConfigs.push(Map<string, MenuSectionConfig>().set(SAMPLES_KEY, samplesMenuConfig));

        let assaysMenuConfig = new MenuSectionConfig({
            emptyText: 'No assays have been defined',
            iconURL: imageURL('_images', 'assay.svg'),
            maxColumns: 2,
            maxItemsPerColumn: 12,
            seeAllURL: smAppBase + AppURL.create(ASSAYS_KEY).addParam('viewAs', 'grid').toHref(),
        });
        if (user.hasDesignAssaysPermission()) {
            assaysMenuConfig = assaysMenuConfig.merge({
                emptyURL: smAppBase + NEW_ASSAY_DESIGN_HREF.toHref(),
                emptyURLText: 'Create an assay design',
            }) as MenuSectionConfig;
        }
        sectionConfigs = sectionConfigs.push(Map<string, MenuSectionConfig>().set(ASSAYS_KEY, assaysMenuConfig));
    }

    if (isFreezerManagementEnabled()) {
        // TODO icon, text and exact URLs to be determined
        let locationsMenuConfig = new MenuSectionConfig({
            emptyText: 'No freezers have been defined',
            iconURL: imageURL('_images', 'default.svg'),
            maxColumns: 1,
            maxItemsPerColumn: 12,
            seeAllURL: fmAppBase + AppURL.create(HOME_KEY).toHref(),
            headerURL: fmAppBase + AppURL.create(HOME_KEY).toHref(),
        });
        if (userCanDesignLocations(user)) {
            locationsMenuConfig = locationsMenuConfig.merge({
                emptyURL: fmAppBase + NEW_FREEZER_DESIGN_HREF.toHref(),
                emptyURLText: 'Create a freezer',
            }) as MenuSectionConfig;
        }
        sectionConfigs = sectionConfigs.push(Map<string, MenuSectionConfig>().set(FREEZERS_KEY, locationsMenuConfig));
    }

    if (isSampleManagerEnabled()) {
        let workflowAndUserSectionConfig = Map<string, MenuSectionConfig>();
        workflowAndUserSectionConfig = workflowAndUserSectionConfig.set(
            WORKFLOW_KEY,
            new MenuSectionConfig({
                iconURL: imageURL('_images', 'workflow.svg'),
                maxColumns: 1,
                maxItemsPerColumn: 3,
                seeAllURL: smAppBase + AppURL.create('workflow').addParam('viewAs', 'heatmap').toHref(),
                headerURL: smAppBase + WORKFLOW_HOME_HREF.toHref(),
            })
        );
        workflowAndUserSectionConfig = workflowAndUserSectionConfig.set(
            USER_KEY,
            new MenuSectionConfig({
                iconCls: 'fas fa-user-circle ',
            })
        );
        sectionConfigs = sectionConfigs.push(workflowAndUserSectionConfig);
    } else {
        const userSectionConfig = new MenuSectionConfig({
            iconCls: 'fas fa-user-circle ',
        });
        sectionConfigs = sectionConfigs.push(Map<string, MenuSectionConfig>().set(USER_KEY, userSectionConfig));
    }
    return sectionConfigs;
}

function getProductId(moduleName: string): string {
    const lcModuleName = moduleName.toLowerCase();
    const moduleContext = getServerContext().moduleContext[lcModuleName];
    return moduleContext?.productId ? moduleContext.productId.toLowerCase() : undefined;
}

function getApplicationUrlBase(moduleName: string, currentApp: string): string {
    const appName = getProductId(moduleName);
    return !appName || appName === currentApp.toLowerCase()
        ? ''
        : buildURL(appName, 'app.view', undefined, { returnURL: false });
}

export function getDateFormat(): string {
    return getServerContext().container.formats.dateFormat;
}
