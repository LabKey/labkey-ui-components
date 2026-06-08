/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { QueryModelLoader, RowsResponse } from '../public/QueryModel/QueryModelLoader';
import { QueryInfo } from '../public/QueryInfo';
import { QueryModel } from '../public/QueryModel/QueryModel';
import { SelectResponse } from '../internal/actions';
import { RequestHandler } from '../internal/request';

export class MockQueryModelLoader implements QueryModelLoader {
    queryInfo: QueryInfo;
    queryInfoException: any;
    rowsException: any;
    rowsResponse: RowsResponse;

    constructor(queryInfo, rowsResponse, queryInfoException = undefined, rowsException = undefined) {
        this.queryInfo = queryInfo;
        this.rowsResponse = rowsResponse;
        this.queryInfoException = queryInfoException;
        this.rowsException = rowsException;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    loadQueryInfo = (model: QueryModel): Promise<QueryInfo> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (this.queryInfoException) {
                    reject(this.queryInfoException);
                }

                resolve(this.queryInfo);
            }, 0);
        });
    };

    loadRows = (model: QueryModel): Promise<RowsResponse> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const { rowsResponse, rowsException } = this;

                if (rowsException) {
                    reject(rowsException);
                }

                const { offset, maxRows } = model;
                resolve({
                    ...rowsResponse,
                    orderedRows: rowsResponse.orderedRows.slice(offset, offset + maxRows),
                });
            }, 0);
        });
    };

    // Promise<any> so we can override the value without type errors (see useQueryModels.test.ts)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    loadSelections = (model: QueryModel): Promise<any> => {
        return Promise.reject('Not implemented!');
    };

    loadTotalCount = async (model: QueryModel, requestHandler: RequestHandler) => {
        return this.rowsResponse.orderedRows.length;
    };

    setSelections = (model: QueryModel, checked: boolean, selections: string[]): Promise<SelectResponse> => {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ count: selections.length });
            }, 0);
        });
    };

    // Promise<any> so we can override the value without type errors (see useQueryModels.test.ts)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    replaceSelections = (model: QueryModel, selections): Promise<any> => {
        return Promise.reject('Not implemented!');
    };

    // Promise<any> so we can override the value without type errors (see useQueryModels.test.ts)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    selectAllRows = (model: QueryModel): Promise<any> => {
        return Promise.reject('Not implemented!');
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    clearSelections = (model: QueryModel): Promise<SelectResponse> => {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ count: 0 });
            }, 0);
        });
    };

    // Promise<any> so we can override the value without type errors (see useQueryModels.test.ts)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    loadCharts = (model: QueryModel): Promise<any> => {
        return Promise.reject('Not Implemented!');
    };
}
