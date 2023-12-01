import { QueryModelLoader, RowsResponse } from '../public/QueryModel/QueryModelLoader';
import { QueryInfo } from '../public/QueryInfo';
import { QueryModel } from '../public/QueryModel/QueryModel';
import { SelectResponse } from '../internal/actions';

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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    loadSelections = (model: QueryModel): Promise<never> => {
        return Promise.reject('Not implemented!');
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setSelections = (model: QueryModel, checked: boolean, selections: string[]): Promise<SelectResponse> => {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ count: selections.length });
            }, 0);
        });
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    replaceSelections = (model: QueryModel, selections): Promise<never> => {
        return Promise.reject('Not implemented!');
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    selectAllRows = (model: QueryModel): Promise<never> => {
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    loadCharts = (model: QueryModel): Promise<never> => {
        return Promise.reject('Not Implemented!');
    };
}
