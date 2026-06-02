/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Query } from '@labkey/api';

import { Row } from './selectRows';
import { getContainerFilter, getQueryDetails } from './api';
import { SchemaQuery } from '../../public/SchemaQuery';
import { QueryInfo } from '../../public/QueryInfo';
import { URLResolver } from '../url/URLResolver';
import { RequestHandler } from '../request';

export interface ExecuteSqlOptions
    extends Omit<Query.ExecuteSqlOptions, 'failure' | 'requiredVersion' | 'scope' | 'success'> {
    requestHandler?: RequestHandler;
}

export interface ExecuteSqlResponseBase {
    messages: Record<string, string>[];
    rowCount: number;
    rows: Row[];
}

export interface ExecuteSqlResponseWithSession extends ExecuteSqlResponseBase {
    queryInfo: QueryInfo;
    schemaQuery: SchemaQuery;
}

export type ExecuteSqlResponseWithoutSession = ExecuteSqlResponseBase;

export type ExecuteSqlResponse<T extends ExecuteSqlOptions> = T['saveInSession'] extends true
    ? ExecuteSqlResponseWithSession
    : ExecuteSqlResponseWithoutSession;

export async function executeSql<T extends ExecuteSqlOptions>(options: T): Promise<ExecuteSqlResponse<T>> {
    const {
        containerFilter = getContainerFilter(options.containerPath),
        requestHandler,
        ...executeSqlOptions
    } = options;
    const saveInSession = executeSqlOptions.saveInSession === true;

    return new Promise((resolve, reject) => {
        const request_ = Query.executeSql({
            ...executeSqlOptions,
            containerFilter,
            requiredVersion: 17.1,
            success: async response => {
                let queryInfo: QueryInfo;
                let schemaQuery: SchemaQuery;

                if (saveInSession) {
                    schemaQuery = new SchemaQuery(options.schemaName, response.queryName);

                    try {
                        queryInfo = await getQueryDetails({ containerPath: options.containerPath, schemaQuery });
                    } catch (e) {
                        reject(e);
                        return;
                    }
                }

                const { messages, rows, rowCount } = new URLResolver().resolveSelectRows(response, queryInfo);

                if (saveInSession) {
                    // For saveInSession=true case
                    resolve({
                        messages,
                        queryInfo,
                        rows,
                        rowCount,
                        schemaQuery,
                    } as ExecuteSqlResponseWithSession);
                } else {
                    // For saveInSession=false case
                    resolve({
                        messages,
                        rows,
                        rowCount,
                    } as ExecuteSqlResponse<T>);
                }
            },
            failure: (data, request) => {
                console.error('There was a problem retrieving the data', data);
                reject({
                    exceptionClass: data.exceptionClass,
                    message: data.exception,
                    status: request.status,
                });
            },
        });
        requestHandler?.(request_);
    });
}
