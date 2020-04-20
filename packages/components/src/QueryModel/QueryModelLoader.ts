import { getQueryDetails, QueryInfo, selectRows } from '..';
import { bindColumnRenderers } from '../renderers';

import { QueryModel, GridMessage } from './QueryModel';

export interface RowsResponse {
    messages: GridMessage[];
    rows: { [key: string]: any };
    orderedRows: string[];
    rowCount: number;
}

export interface QueryModelLoader {
    /**
     * Loads the QueryInfo for the specified model.
     * @param model: QueryModel
     */
    loadQueryInfo: (model: QueryModel) => Promise<QueryInfo>;

    /**
     * Loads the current page of rows for the specified model.
     * @param model: QueryModel
     */
    loadRows: (model: QueryModel) => Promise<RowsResponse>;

    /**
     * Loads the selected RowIds (or PK values) for the specified model.
     * @param model: QueryModel
     */
    loadSelections: (model: QueryModel) => Promise<string[]>;
}

export const DefaultQueryModelLoader: QueryModelLoader = {
    async loadQueryInfo(model) {
        const { containerPath, schemaName, queryName } = model;
        const queryInfo = await getQueryDetails({ containerPath, schemaName, queryName });
        return queryInfo.merge({ columns: bindColumnRenderers(queryInfo.columns) }) as QueryInfo;
    },
    async loadRows(model) {
        const result = await selectRows({
            schemaName: model.schemaName,
            queryName: model.queryName,
            viewName: model.viewName,
            containerPath: model.containerPath,
            containerFilter: model.containerFilter,
            filterArray: model.filters,
            sort: model.sortString,
            columns: model.columnString,
            maxRows: model.maxRows,
            offset: model.offset,
            queryParameters: model.queryParameters,
            includeDetailsColumn: model.includeDetailsColumn,
            includeUpdateColumn: model.includeUpdateColumn,
        });
        const { key, models, orderedModels, totalRows, messages } = result;

        return {
            messages: messages.toJS(),
            rows: models[key],
            orderedRows: orderedModels[key].toArray(),
            rowCount: totalRows, // rename to match what the server returns
        };
    },
    async loadSelections(model) {
        throw new Error('loadSelections not yet implemented');
    },
};
