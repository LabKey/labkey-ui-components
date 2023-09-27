/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Ajax, Utils, ActionURL, Query } from '@labkey/api';

import { getContainerFilter } from '../../query/api';

import { AuditDetailsModel } from './models';

export function getAuditDetail(
    auditRowId: number,
    auditEventType: string,
    containerFilter?: Query.ContainerFilter
): Promise<AuditDetailsModel> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('audit', 'getDetailedAuditChanges.api'),
            params: { auditRowId, auditEventType, containerFilter: containerFilter ?? getContainerFilter() },
            success: Utils.getCallbackWrapper(response => {
                resolve(AuditDetailsModel.create(response));
            }),
            failure: Utils.getCallbackWrapper(error => {
                console.error('Problem retrieving the audit details', error);
                reject('There was a problem retrieving the audit details.');
            }),
        });
    });
}
