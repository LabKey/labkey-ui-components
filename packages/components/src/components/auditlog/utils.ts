/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react'
import { List } from "immutable";
import { Query } from "@labkey/api";

import {
    ASSAYS_KEY,
    isFreezerManagementEnabled,
    isSampleManagerEnabled,
    SAMPLES_KEY,
    WORKFLOW_KEY
} from "../../internal/app";
import { AppURL } from "../../url/AppURL";

export function getEventDataValueDisplay (d: any, showLink: boolean = true) {
    let display = null;
    if (d) {
        if (typeof(d) === 'string' || typeof(d) === 'number') {
            display = d;
        }
        else if (typeof(d) === 'boolean') {
            display = d ? 'true' : 'false';
        }
        else {
            if (d.has('formattedValue')) {
                display = d.get('formattedValue');
            }
            else {
                let o = d.has('displayValue') ? d.get('displayValue') : d.get('value');
                display = o !== null && o !== undefined ? o.toString() : null;
            }

            if (showLink) {
                let url : string = undefined;
                if (d.get('url')) {
                    display = React.createElement('a', {href: d.get('url')}, display);
                }
                else {
                    url = getTimelineEntityUrl(d);
                }

                if (url) {
                    display = React.createElement('a', {href: url}, display);
                }
            }
        }
    }

    return display;
}

export function getTimelineEntityUrl(d: any) : string {
    let url : AppURL = undefined;

    if (d.has('urlType')) {
        const urlType = d.get('urlType');
        const value = d.get('value');

        switch (urlType) {
            case SAMPLES_KEY:
                url = AppURL.create(SAMPLES_KEY, value);
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
            case 'user':
                url = AppURL.create('q', 'core', 'siteusers', value);
                break;
            case 'assayRun':
                if (value instanceof List) {
                    const values : List<any> = d.get('value');
                    if (values.size > 1)
                        url = AppURL.create(ASSAYS_KEY, 'general', values.get(0), 'runs', values.get(1));
                }
                break;
            default:
                break;
        }
    }

    return url !== undefined ? url.toHref() : undefined;
}

export function getAuditQueries(): Array<{ [key: string]: any }> {
    let auditQueries = [];
    if (isSampleManagerEnabled()) {
        auditQueries.push(
            {value: 'attachmentauditevent', label: 'Attachment Events'},
            {value: 'experimentauditevent', label: 'Assay Events'},
            {value: 'domainauditevent', label: 'Domain Events'},
            {value: 'domainpropertyauditevent', label: 'Domain Property Events'},
            {value: 'queryupdateauditevent', label: 'Data Update Events', hasDetail: true},
            {value: 'listauditevent', label: 'List Events'},
            {value: 'groupauditevent', label: 'Roles and Assignment Events', containerFilter: Query.ContainerFilter.allFolders},
            {value: 'samplesetauditevent', label: 'Sample Type Events'},
            {value: 'sampletimelineevent', label: 'Sample Timeline Events', hasDetail: true},
            {value: 'samplesworkflowauditevent', label: 'Sample Workflow Events', hasDetail: true},
            {value: 'sourcesauditevent', label: 'Sources Events', hasDetail: true},
            {value: 'userauditevent', label: 'User Events', containerFilter: Query.ContainerFilter.allFolders}
        );
    }
    if (isFreezerManagementEnabled()) {
        auditQueries.push({value: 'inventoryauditevent', label: 'Freezer Management Events', hasDetail: true});
    }

    return auditQueries;
}
