/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Ajax, Utils } from '@labkey/api'
import { SchemaQuery, buildURL } from '@glass/base'

import { DomainDesign } from './models'

export function fetchDomain(schemaQuery: SchemaQuery): Promise<DomainDesign> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('property', 'getDomain.api', {
                schemaName: schemaQuery.getSchema(),
                queryName: schemaQuery.getQuery()
            }),
            success: Utils.getCallbackWrapper((data) => {
                resolve(new DomainDesign(data));
            }),
            failure: Utils.getCallbackWrapper((error) => {
                reject(error.exception);
            })
        })
    });
}