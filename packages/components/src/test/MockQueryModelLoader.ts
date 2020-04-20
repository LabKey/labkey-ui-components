import { QueryInfo, QueryModel, QueryModelLoader } from '..';
import { RowsResponse } from '../QueryModel/QueryModelLoader';

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

    loadSelections = async (model: QueryModel) => {
        return Promise.reject('Not implemented!');
    };
}
