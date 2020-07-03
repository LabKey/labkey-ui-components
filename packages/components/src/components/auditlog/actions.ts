/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Ajax, Utils, ActionURL } from '@labkey/api';

import { AuditDetailsModel } from './models';

export function getAuditDetail(auditRowId: number, auditEventType: string): Promise<AuditDetailsModel> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('audit', 'GetDetailedAuditChanges.api'),
            method: 'GET',
            params: { auditRowId, auditEventType },
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
