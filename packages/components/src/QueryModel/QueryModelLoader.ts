import { QueryModel } from './QueryModel';
import { getQueryDetails, selectRows } from '..';
import { bindColumnRenderers } from '../renderers';

export interface QueryModelLoader {
    // TODO: properly type the Promises.

    /**
     * Loads the QueryInfo for the specified model.
     * @param model: QueryModel
     */
    loadQueryInfo: (model: QueryModel) => Promise<any>;

    /**
     * Loads the current page of rows for the specified model.
     * @param model: QueryModel
     */
    loadRows: (model: QueryModel) => Promise<any>;

    /**
     * Loads the selected RowIds (or PK values) for the specified model.
     * @param model: QueryModel
     */
    loadSelections: (model: QueryModel) => Promise<any>;
}

export const DefaultQueryModelLoader: QueryModelLoader = {
    async loadQueryInfo(model) {
        const { containerPath, schemaName, queryName } = model;
        const queryInfo = await getQueryDetails({ containerPath, schemaName, queryName });
        return queryInfo.merge({ columns: bindColumnRenderers(queryInfo.columns) });
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
            messages,
            rows: models[key],
            orderedRows: orderedModels[key].toArray(),
            rowCount: totalRows, // rename to match what the server returns
        };
    },
    async loadSelections(model) {
        throw new Error('loadSelections not yet implemented');
    },
};
