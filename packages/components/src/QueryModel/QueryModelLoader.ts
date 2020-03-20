import { QueryModel } from './QueryModel';
import { getQueryDetails, selectRows } from '..';
import { bindColumnRenderers } from '../renderers';

export interface QueryModelLoader {
    // TODO: properly type the Promises.
    loadQueryInfo: (model: QueryModel) => Promise<any>;
    loadRows: (model: QueryModel) => Promise<any>;
    loadSelections: (model: QueryModel) => Promise<any>;
}

export const DefaultQueryModelLoader: QueryModelLoader = {
    async loadQueryInfo(model) {
        const { containerPath, schemaQuery } = model;
        const { schemaName, queryName } = schemaQuery;
        const queryInfo = await getQueryDetails({ containerPath, schemaName, queryName });
        return queryInfo.merge({ columns: bindColumnRenderers(queryInfo.columns) });
    },
    async loadRows(model) {
        const { schemaName, queryName, viewName } = model.schemaQuery;
        const result = await selectRows({
            schemaName,
            queryName,
            viewName,
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
    async loadSelections() {
        throw new Error('loadSelections not yet implemented');
    },
};
