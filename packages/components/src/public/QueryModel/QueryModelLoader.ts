import React from 'react';
import { OrderedMap } from 'immutable';

import {
    clearSelected,
    fetchCharts,
    getSelected,
    ISelectResponse,
    replaceSelected,
    selectAll,
    setSelected,
} from '../../internal/actions';
import { VISUALIZATION_REPORTS } from '../../internal/constants';

import { DataViewInfo, IDataViewInfo } from '../../internal/DataViewInfo';

import { QueryInfo } from '../QueryInfo';
import { getQueryDetails, selectRowsDeprecated } from '../../internal/query/api';
import { naturalSortByProperty } from '../sort';
import { QueryColumn } from '../QueryColumn';
import { getQueryColumnRenderers } from '../../internal/global';
import { DefaultRenderer } from '../../internal/renderers/DefaultRenderer';

import { GridMessage, QueryModel } from './QueryModel';

export function bindColumnRenderers(columns: OrderedMap<string, QueryColumn>): OrderedMap<string, QueryColumn> {
    if (columns) {
        const columnRenderers = getQueryColumnRenderers();

        return columns.map(queryCol => {
            let node = DefaultRenderer;
            if (queryCol?.columnRenderer && columnRenderers.hasOwnProperty(queryCol.columnRenderer.toLowerCase())) {
                node = columnRenderers[queryCol.columnRenderer.toLowerCase()];
            }

            // TODO: Just generate one function per type
            return queryCol.mutate({
                cell: (data, row, col, rowIndex, columnIndex) => {
                    return React.createElement(node, { data, row, col: queryCol, rowIndex, columnIndex });
                },
            });
        }) as OrderedMap<string, QueryColumn>;
    }

    return columns;
}

export interface RowsResponse {
    messages: GridMessage[];
    orderedRows: string[];
    rowCount: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rows: { [key: string]: any };
}

export interface QueryModelLoader {
    /**
     * Clear all selected rows for a given QueryModel.
     * @param model: QueryModel
     */
    clearSelections: (model: QueryModel) => Promise<ISelectResponse>;

    /**
     * Loads the charts (DataViewInfos) for a given model.
     * @param model
     */
    loadCharts: (model: QueryModel) => Promise<DataViewInfo[]>;

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
    loadSelections: (model: QueryModel) => Promise<Set<string>>;

    /**
     * Replaces the currently selected items with the given set of selections.
     * @param model: QueryModel
     * @param checked: boolean, the checked status of the ids
     * @param selections: A list of stringified RowIds.
     */
    replaceSelections: (model: QueryModel, selections: string[]) => Promise<ISelectResponse>;

    /**
     * Select all rows for a given QueryModel.
     * @param model: QueryModel
     */
    selectAllRows: (model: QueryModel) => Promise<Set<string>>;

    /**
     * Sets the selected status for the list of selections.
     * @param model: QueryModel
     * @param checked: boolean, the checked status of the ids
     * @param selections: A list of stringified RowIds.
     */
    setSelections: (model: QueryModel, checked, selections: string[]) => Promise<ISelectResponse>;
}

export const DefaultQueryModelLoader: QueryModelLoader = {
    async loadQueryInfo(model) {
        const { containerPath, schemaName, queryName, viewName } = model;
        const queryInfo = await getQueryDetails({ containerPath, schemaName, queryName, viewName });
        return queryInfo.merge({ columns: bindColumnRenderers(queryInfo.columns) }) as QueryInfo;
    },
    async loadRows(model) {
        const result = await selectRowsDeprecated({
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
            includeTotalCount: model.includeTotalCount,
        });
        const { key, models, orderedModels, totalRows, messages } = result;

        return {
            messages: messages.toJS(),
            rows: models[key],
            orderedRows: orderedModels[key].toArray(),
            rowCount: model.includeTotalCount ? totalRows : undefined, // rename to match what the server returns
        };
    },
    // The selection related methods may seem like overly simple passthroughs, but by putting them on QueryModelLoader,
    // instead of in withQueryModels, it allows us to easily mock them or provide alternate implementations.
    clearSelections(model) {
        const { containerFilter, selectionKey, schemaQuery, filters, containerPath, queryParameters } = model;
        return clearSelected(selectionKey, schemaQuery, filters, containerPath, queryParameters, containerFilter);
    },
    async loadSelections(model) {
        const { containerFilter, selectionKey, schemaQuery, filters, containerPath, queryParameters } = model;
        const result = await getSelected(
            selectionKey,
            false,
            schemaQuery,
            filters,
            containerPath,
            queryParameters,
            containerFilter
        );
        return new Set(result.selected);
    },
    setSelections(model, checked: boolean, selections: string[]) {
        const { selectionKey, containerPath } = model;
        return setSelected(selectionKey, checked, selections, containerPath);
    },
    replaceSelections(model, selections: string[]) {
        const { selectionKey, containerPath } = model;
        return replaceSelected(selectionKey, selections, containerPath);
    },
    async selectAllRows(model) {
        const { containerFilter, selectionKey, schemaQuery, filters, containerPath, queryParameters } = model;
        await selectAll(selectionKey, schemaQuery, filters, containerPath, queryParameters, containerFilter);
        return DefaultQueryModelLoader.loadSelections(model);
    },
    async loadCharts(model) {
        const { schemaQuery, containerPath } = model;
        const sortByName = naturalSortByProperty<IDataViewInfo>('name');

        const charts = await fetchCharts(schemaQuery, containerPath);
        return charts
            .toArray()
            .sort(sortByName)
            .filter(report => VISUALIZATION_REPORTS.contains(report.type));
    },
};
