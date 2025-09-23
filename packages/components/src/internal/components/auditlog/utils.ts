/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { ReactNode } from 'react';
import { Map, OrderedMap } from 'immutable';

import { FREEZER_MANAGER_PRODUCT_ID, isSampleManagerEnabled } from '../../app/products';
import {
    isAssayEnabled,
    isChartBuilderEnabled,
    isELNEnabled,
    isProductFoldersEnabled,
    isRegistryEnabled,
    isWorkflowEnabled,
} from '../../app/utils';
import { ASSAYS_KEY, BOXES_KEY, SAMPLES_KEY, USER_KEY, WORKFLOW_KEY } from '../../app/constants';
import { naturalSortByProperty } from '../../../public/sort';
import { AppURL } from '../../url/AppURL';

import { ModuleContext } from '../base/ServerContext';

import {
    ASSAY_AUDIT_QUERY,
    AuditQuery,
    COMMON_AUDIT_QUERIES,
    DATACLASS_DATA_UPDATE_AUDIT_QUERY,
    NOTEBOOK_AUDIT_QUERY,
    NOTEBOOK_REVIEW_AUDIT_QUERY,
    CONTAINER_AUDIT_QUERY,
    REGISTRY_AUDIT_QUERY,
    SOURCE_AUDIT_QUERY,
    WORKFLOW_AUDIT_QUERY,
    REPORT_AUDIT_QUERY,
    ASSAY_RESULT_AUDIT_QUERY, AUDIT_DETAIL_FIELD_VALUE_INHERITED,
} from './constants';
import { QueryKey } from '@labkey/api';

export function getAuditQueries(ctx: ModuleContext): AuditQuery[] {
    const queries = [...COMMON_AUDIT_QUERIES];
    if (isProductFoldersEnabled(ctx)) queries.push(CONTAINER_AUDIT_QUERY);
    if (isWorkflowEnabled(ctx)) queries.push(WORKFLOW_AUDIT_QUERY);
    if (isAssayEnabled(ctx)) {
        queries.push(ASSAY_AUDIT_QUERY);
        queries.push(ASSAY_RESULT_AUDIT_QUERY);
    }
    if (isSampleManagerEnabled(ctx) && !isRegistryEnabled(ctx)) queries.push(SOURCE_AUDIT_QUERY);
    if (isRegistryEnabled(ctx)) {
        queries.push(DATACLASS_DATA_UPDATE_AUDIT_QUERY);
        queries.push(REGISTRY_AUDIT_QUERY);
    }
    if (isELNEnabled(ctx)) {
        queries.push(NOTEBOOK_AUDIT_QUERY);
        queries.push(NOTEBOOK_REVIEW_AUDIT_QUERY);
    }
    if (isChartBuilderEnabled(ctx)) queries.push(REPORT_AUDIT_QUERY);
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
                url = AppURL.create(BOXES_KEY, value).setProductId(FREEZER_MANAGER_PRODUCT_ID);
                break;
            default:
                break;
        }
    }

    return url;
}

export function getAuditDetailMap(data: Record<string, string>, inheritedFields?: string[]): OrderedMap<string, string> {
    if (inheritedFields?.length > 0) {
        // sort fields.newData so that inherited fields are at the bottom
        const inheritedFieldsLc = inheritedFields.map(f => f.toLowerCase());
        const newData = data ?? {};
        const sortedNewData = {} as any;
        const last = {};
        for (const field of Object.keys(newData)) {
            if (!newData[field] && inheritedFieldsLc.indexOf(QueryKey.encodePart(field).toLowerCase()) > -1) {
                last[field] = AUDIT_DETAIL_FIELD_VALUE_INHERITED;
            }
            else {
                sortedNewData[field] = newData[field];
            }
        }
        Object.assign(sortedNewData, last);
        return OrderedMap(sortedNewData);
    }

    return OrderedMap(data);
}
