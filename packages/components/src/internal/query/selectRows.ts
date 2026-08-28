/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Filter, Query } from '@labkey/api';

import { SchemaQuery } from '../../public/SchemaQuery';
import { QueryInfo } from '../../public/QueryInfo';
import { URLResolver } from '../url/URLResolver';

import { getContainerFilter, getQueryDetails, isSelectRowMetadataRequired } from './api';
import { RequestHandler } from '../request';

export interface SelectRowsOptions
    extends Omit<
        Query.SelectRowsOptions,
        'failure' | 'queryName' | 'requiredVersion' | 'schemaName' | 'scope' | 'success'
    > {
    requestHandler?: RequestHandler;
    schemaQuery: SchemaQuery;
}

export interface RowValue {
    displayValue?: any;
    formattedValue?: any;
    url?: string;
    value: any;
}
export type Row = Record<string, RowValue>;

export interface SelectRowsResponse {
    messages: Record<string, string>[];
    /** Only available when "includeMetadata" is set to true. */
    metaData: Query.ResponseMetadata | undefined;
    queryInfo: QueryInfo;
    rowCount: number;
    rows: Row[];
    schemaQuery: SchemaQuery;
}

export async function selectRows(options: SelectRowsOptions): Promise<SelectRowsResponse> {
    const {
        containerFilter = getContainerFilter(options.containerPath),
        columns = '*',
        includeMetadata,
        includeTotalCount = false, // default to false to improve performance
        method = 'POST',
        requestHandler,
        schemaQuery,
        ...selectRowsOptions
    } = options;
    const { queryName, schemaName } = schemaQuery;
    const viewName = options.viewName ?? schemaQuery.viewName; // favor explicit viewName param over schemaQuery.viewName

    const [queryInfo, response] = await Promise.all([
        getQueryDetails({ containerPath: options.containerPath, schemaQuery }),
        new Promise<Query.Response>((resolve, reject) => {
            const request_ = Query.selectRows({
                ...selectRowsOptions,
                columns,
                containerFilter,
                includeMetadata: isSelectRowMetadataRequired(includeMetadata, columns),
                includeTotalCount,
                method,
                queryName,
                requiredVersion: 17.1,
                schemaName,
                viewName,
                success: response_ => {
                    resolve(response_);
                },
                failure: (data, request) => {
                    if (request.status !== 0) {
                        console.error('There was a problem retrieving the data', data);
                    }
                    reject({
                        exceptionClass: data.exceptionClass,
                        message: data.exception,
                        schemaQuery,
                        status: request.status,
                    });
                },
            });
            requestHandler?.(request_);
        }),
    ]);

    const resolved = new URLResolver().resolveSelectRows(response, queryInfo);

    return {
        metaData: response.metaData,
        messages: resolved.messages,
        queryInfo,
        rows: resolved.rows,
        rowCount: resolved.rowCount,
        schemaQuery,
    };
}

interface GetSelectedRowsOptions extends SelectRowsOptions {
    keyColumn?: string;
    selections: Set<string>; // The selections object from a QueryModel
}

export function getSelectedRows(options: GetSelectedRowsOptions): Promise<SelectRowsResponse> {
    const { keyColumn = 'RowId', selections, ...rest } = options;
    const originalFilterArray = rest.filterArray ?? [];
    const filterArray = originalFilterArray.concat([Filter.create(keyColumn, Array.from(selections), Filter.Types.IN)]);
    return selectRows({ ...rest, filterArray });
}
