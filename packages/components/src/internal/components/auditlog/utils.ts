/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { ReactNode } from 'react';
import { Map } from 'immutable';
import { Query } from '@labkey/api';

import { AppURL } from '../../..';
import { isBiologicsEnabled, isFreezerManagementEnabled, isSampleManagerEnabled } from '../../app/utils';
import { ASSAYS_KEY, SAMPLES_KEY, USER_KEY, WORKFLOW_KEY } from '../../app/constants';

export type AuditQuery = {
    containerFilter?: Query.ContainerFilter;
    hasDetail?: boolean;
    label: string;
    value: string;
};

export function getAuditQueries(): AuditQuery[] {
    const auditQueries = [];

    if (isBiologicsEnabled()) {
        auditQueries.push(
            { value: 'attachmentauditevent', label: 'Attachment Events' },
            { value: 'experimentauditevent', label: 'Assay Events' },
            { value: 'domainauditevent', label: 'Domain Events' },
            { value: 'domainpropertyauditevent', label: 'Domain Property Events' },
            { value: 'queryupdateauditevent', label: 'Data Update Events', hasDetail: true },
            { value: 'samplesetauditevent', label: 'Sample Type Events' },
            { value: 'sampletimelineevent', label: 'Sample Timeline Events', hasDetail: true },
            { value: 'samplesworkflowauditevent', label: 'Sample Workflow Events', hasDetail: true },
            { value: 'sourcesauditevent', label: 'Sources Events', hasDetail: true },
            { value: 'userauditevent', label: 'User Events', containerFilter: Query.ContainerFilter.allFolders },
            { value: 'listauditevent', label: 'List Events' },
            {
                value: 'groupauditevent',
                label: 'Roles and Assignment Events',
                containerFilter: Query.ContainerFilter.allFolders,
            }
        );
    } else {
        if (isSampleManagerEnabled()) {
            auditQueries.push(
                { value: 'attachmentauditevent', label: 'Attachment Events' },
                { value: 'experimentauditevent', label: 'Assay Events' },
                { value: 'domainauditevent', label: 'Domain Events' },
                { value: 'domainpropertyauditevent', label: 'Domain Property Events' },
                { value: 'queryupdateauditevent', label: 'Data Update Events', hasDetail: true }
            );
        }
        if (isFreezerManagementEnabled()) {
            auditQueries.push({ value: 'inventoryauditevent', label: 'Freezer Management Events', hasDetail: true });
        }
        if (isSampleManagerEnabled()) {
            auditQueries.push(
                { value: 'listauditevent', label: 'List Events' },
                {
                    value: 'groupauditevent',
                    label: 'Roles and Assignment Events',
                    containerFilter: Query.ContainerFilter.allFolders,
                },
                { value: 'samplesetauditevent', label: 'Sample Type Events' },
                { value: 'sampletimelineevent', label: 'Sample Timeline Events', hasDetail: true },
                { value: 'samplesworkflowauditevent', label: 'Sample Workflow Events', hasDetail: true },
                { value: 'sourcesauditevent', label: 'Sources Events', hasDetail: true },
                { value: 'userauditevent', label: 'User Events', containerFilter: Query.ContainerFilter.allFolders }
            );
        }
    }

    return auditQueries;
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
                if (d.get('url')) {
                    display = React.createElement('a', { href: d.get('url') }, display);
                } else {
                    const url = getTimelineEntityUrl(d.toJS());
                    if (url) {
                        display = React.createElement('a', { href: url.toHref() }, display);
                    }
                }
            }
        } else {
            if (d.formattedValue) {
                display = d.formattedValue;
            } else {
                display = (d.displayValue ?? d.value)?.toString() ?? null;
            }

            if (showLink) {
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
                url = AppURL.create('q', 'core', 'siteusers', value);
                break;
            case 'assayRun':
                if (Array.isArray(value) && value.length > 1) {
                    url = AppURL.create(ASSAYS_KEY, 'general', value[0], 'runs', value[1]);
                }
                break;
            case 'inventoryLocation':
                if (Array.isArray(value) && value.length > 1) {
                    url = AppURL.create('freezers', value[0], 'storageView').addParam('locationId', value[1]);
                }
                break;
            case 'inventoryBox':
                url = AppURL.create('boxes', value);
                break;
            default:
                break;
        }
    }

    return url;
}
