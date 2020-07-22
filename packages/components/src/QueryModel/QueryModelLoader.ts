import { List } from 'immutable';

import {
    DataViewInfoTypes,
    getQueryDetails,
    getSelected,
    IDataViewInfo,
    loadReports,
    naturalSortByProperty,
    QueryInfo,
    selectRows,
    setSelected,
} from '..';
import { bindColumnRenderers } from '../renderers';
import { clearSelected, fetchCharts, ISelectResponse, selectAll } from '../actions';
import { VISUALIZATION_REPORTS } from '../constants';

import { DataViewInfo } from '../models';

import { GridMessage, QueryModel } from './QueryModel';

export interface RowsResponse {
    messages: GridMessage[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
     * Clear all selected rows for a given QueryModel.
     * @param model: QueryModel
     */
    clearSelections: (model: QueryModel) => Promise<ISelectResponse>;

    /**
     * Loads the selected RowIds (or PK values) for the specified model.
     * @param model: QueryModel
     */
    loadSelections: (model: QueryModel) => Promise<Set<string>>;

    /**
     * Sets the selected status for the list of selections.
     * @param model: QueryModel
     * @param checked: boolean, the checked status of the ids
     * @param selections: A list of stringified RowIds.
     */
    setSelections: (model: QueryModel, checked, selections: string[]) => Promise<ISelectResponse>;

    /**
     * Select all rows for a given QueryModel.
     * @param model: QueryModel
     */
    selectAllRows: (model: QueryModel) => Promise<Set<string>>;

    /**
     * Loads the charts (DataViewInfos) for a given model.
     * @param model
     * @param includeSampleComparison: boolean, loads DataViewInfos via browseDataTree.api and includes SampleComparison
     * reports in the results. If false loads DataViewInfos via getReportInfos and does not include SampleComparison
     * reports.
     */
    loadCharts: (model: QueryModel, includeSampleComparison: boolean) => Promise<IDataViewInfo[]>;
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
            parameters: model.queryParameters,
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
    // The selection related methods may seem like overly simple passthroughs, but by putting them on QueryModelLoader,
    // instead of in withQueryModels, it allows us to easily mock them or provide alternate implementations.
    clearSelections(model) {
        const { id, schemaName, queryName, filters, containerPath } = model;
        return clearSelected(id, schemaName, queryName, List(filters), containerPath);
    },
    async loadSelections(model) {
        const { id, schemaName, queryName, filters, containerPath, queryParameters } = model;
        const result = await getSelected(id, schemaName, queryName, List(filters), containerPath, queryParameters);
        return new Set(result.selected);
    },
    setSelections(model, checked: boolean, selections: string[]) {
        const { id, containerPath } = model;
        return setSelected(id, checked, selections, containerPath);
    },
    async selectAllRows(model) {
        const { id, schemaName, queryName, filters, containerPath, queryParameters } = model;
        await selectAll(id, schemaName, queryName, List(filters), containerPath, queryParameters);
        return DefaultQueryModelLoader.loadSelections(model);
    },
    async loadCharts(model, includeSampleComparison) {
        const { schemaQuery, containerPath } = model;
        const sortByName = naturalSortByProperty<IDataViewInfo>('name');

        if (includeSampleComparison) {
            const { schemaName, queryName } = schemaQuery;
            const charts = await loadReports();
            return charts
                .filter((report): boolean => {
                    const { type } = report;
                    const matchingSq = report.schemaName === schemaName && report.queryName === queryName;
                    const isVisualization = VISUALIZATION_REPORTS.contains(type);
                    const isSampleComparison = type === DataViewInfoTypes.SampleComparison;
                    return matchingSq && (isVisualization || isSampleComparison);
                })
                .sort(sortByName);
        } else {
            const charts = await fetchCharts(schemaQuery, containerPath);
            return charts.toArray().sort(sortByName);
        }
    },
};
