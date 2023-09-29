/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { ReactNode } from 'react';
import { Map } from 'immutable';

import {
    biologicsIsPrimaryApp,
    isAssayEnabled,
    isBiologicsEnabled,
    isELNEnabled,
    isProductProjectsEnabled,
    isSampleManagerEnabled,
    isWorkflowEnabled,
    sampleManagerIsPrimaryApp,
} from '../../app/utils';
import { ASSAYS_KEY, BOXES_KEY, SAMPLES_KEY, USER_KEY, WORKFLOW_KEY } from '../../app/constants';
import { naturalSortByProperty } from '../../../public/sort';
import { AppURL } from '../../url/AppURL';

import { ModuleContext } from '../base/ServerContext';

import {
    AuditQuery,
    ASSAY_AUDIT_QUERY,
    COMMON_AUDIT_QUERIES,
    NOTEBOOK_AUDIT_QUERY,
    NOTEBOOK_REVIEW_AUDIT_QUERY,
    PROJECT_AUDIT_QUERY,
    REGISTRY_AUDIT_QUERY,
    SOURCE_AUDIT_QUERY,
    WORKFLOW_AUDIT_QUERY,
    DATACLASS_DATA_UPDATE_AUDIT_QUERY,
} from './constants';

export function getAuditQueries(ctx: ModuleContext): AuditQuery[] {
    const queries = [...COMMON_AUDIT_QUERIES];
    if (isProductProjectsEnabled(ctx)) queries.push(PROJECT_AUDIT_QUERY);
    if (isWorkflowEnabled(ctx)) queries.push(WORKFLOW_AUDIT_QUERY);
    if (isAssayEnabled(ctx)) queries.push(ASSAY_AUDIT_QUERY);
    if (isSampleManagerEnabled(ctx) && sampleManagerIsPrimaryApp(ctx)) queries.push(SOURCE_AUDIT_QUERY);
    if (isBiologicsEnabled(ctx) && biologicsIsPrimaryApp(ctx)) {
        queries.push(DATACLASS_DATA_UPDATE_AUDIT_QUERY);
        queries.push(REGISTRY_AUDIT_QUERY);
    }
    if (isELNEnabled(ctx)) {
        queries.push(NOTEBOOK_AUDIT_QUERY);
        queries.push(NOTEBOOK_REVIEW_AUDIT_QUERY);
    }
    return queries.sort(naturalSortByProperty('label'));
}

export function getEventDataValueDisplay(d: any, showLink = true): ReactNode {
    let display = null;
    if (d) {
        if (typeof d === 'string' || typeof d === 'number') {
            display = d;
        } else if (typeof d === 'boolean') {
            display = d ? 'true' : 'false';
        } else if (Map.isMap(d)) {
            if (d.has('formattedValue')) {
                display = d.get('formattedValue');
            } else {
                const o = d.has('displayValue') ? d.get('displayValue') : d.get('value');
                display = o?.toString() ?? null;
            }

            if (showLink) {
                if (!d.get('hideLink')) {
                    if (d.get('url')) {
                        display = React.createElement('a', { href: d.get('url') }, display);
                    } else {
                        const url = getTimelineEntityUrl(d.toJS());
                        if (url) {
                            display = React.createElement('a', { href: url.toHref() }, display);
                        }
                    }
                }
            }
        } else {
            if (d.formattedValue) {
                display = d.formattedValue;
            } else {
                display = (d.displayValue ?? d.value)?.toString() ?? null;
            }

            if (showLink && !d.hideLink) {
                const href = d.url ?? getTimelineEntityUrl(d)?.toHref();
                if (href) {
                    display = React.createElement('a', { href }, display);
                }
            }
        }
    }

    return display;
}

export function getTimelineEntityUrl(d: Record<string, any>): AppURL {
    let url: AppURL;

    if (d) {
        const { urlType, value } = d;

        switch (urlType) {
            case SAMPLES_KEY:
                url = AppURL.create('rd', SAMPLES_KEY, value);
                break;
            case WORKFLOW_KEY:
                url = AppURL.create(WORKFLOW_KEY, value);
                break;
            case ASSAYS_KEY:
                url = AppURL.create(ASSAYS_KEY, 'general', value);
                break;
            case 'workflowTemplate':
                url = AppURL.create(WORKFLOW_KEY, 'template', value);
                break;
            case USER_KEY:
                url = undefined; // handle display render via UserLink
                break;
            case 'assayRun':
                if (Array.isArray(value) && value.length > 1) {
                    url = AppURL.create(ASSAYS_KEY, 'general', value[0], 'runs', value[1]);
                }
                break;
            case 'inventoryLocation':
                if (Array.isArray(value) && value.length > 1) {
                    url = AppURL.create('rd', 'freezerLocation', value[1]);
                }
                break;
            case 'inventoryBox':
                url = AppURL.create(BOXES_KEY, value);
                break;
            default:
                break;
        }
    }

    return url;
}
