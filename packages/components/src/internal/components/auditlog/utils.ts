/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { ReactNode } from 'react';
import { Map } from 'immutable';
import { Query } from '@labkey/api';

import { AppURL } from '../../..';
import { isBiologicsEnabled, isSampleManagerEnabled, isSampleManagerProfessionalEnabled } from '../../app/utils';
import { ASSAYS_KEY, BOXES_KEY, SAMPLES_KEY, USER_KEY, WORKFLOW_KEY } from '../../app/constants';
import {
    STARTER_AUDIT_QUERIES,
    SAMPLE_MANAGER_PROFESSIONAL_AUDIT_QUERIES,
    COMMON_PROFESSIONAL_AUDIT_QUERIES
} from '../samples/constants';

export type AuditQuery = {
    containerFilter?: Query.ContainerFilter;
    hasDetail?: boolean;
    label: string;
    value: string;
};

export function getAuditQueries(): AuditQuery[] {
    if (isBiologicsEnabled())
        return COMMON_PROFESSIONAL_AUDIT_QUERIES;
    if (isSampleManagerProfessionalEnabled())
        return SAMPLE_MANAGER_PROFESSIONAL_AUDIT_QUERIES;
    if (isSampleManagerEnabled())
        return STARTER_AUDIT_QUERIES;
    return [];
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
                url = AppURL.create('q', 'core', 'siteusers', value);
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
