/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { FC, memo, ReactNode, useState, useMemo, useEffect, useCallback } from 'react';
import {
    addDateRangeFilter,
    AppURL,
    LoadingSpinner,
    naturalSort,
    SchemaQuery
} from '../../..';

// These need to be direct imports from files to avoid circular dependencies in index.ts
import { InjectedQueryModels, withQueryModels } from '../../../public/QueryModel/withQueryModels';

import { Filter } from '@labkey/api';

import { last12Months, monthSort } from './utils';
import { HeatMapDisplay } from './HeatMapDisplay';
import { Link } from "react-router";

export interface HeatMapCell {
    monthName: string,
    monthNum: number,
    yearNum: number,
    title: string,
    providerName: string,
    protocolName: string,
    monthTotal: string,
    completeTotal: string,
    inRangeTotal: string,
    url: AppURL,
}

export interface HeatMapDisplayCell {
    name: string,
    renderYCell: (cell: HeatMapDisplayCell) => ReactNode,
    completeTotal: string,
    inRangeTotal: string,
    headerUrl: AppURL,
    totalUrl: AppURL
}

export interface HeatMapProps {
    schemaQuery: SchemaQuery;
    filters?: Filter.IFilter[];
    displayNamePath?: string[]; // path within a query row to use for displaying the y axis and by which to sort the rows of data
    nounSingular: string;
    nounPlural: string;
    yAxis: string;
    xAxis: string;
    measure: string;
    yInRangeTotal?: string; // property name in 'cell' containing the in-range total amount (not the complete total)
    yTotalLabel?: string;
    getCellUrl: (row: { [key: string]: any }) => AppURL;
    getHeaderUrl: (cell: HeatMapCell) => AppURL;
    getTotalUrl: (cell: HeatMapCell) => AppURL;
    headerClickUrl: AppURL;
    emptyDisplay?: any;
    navigate?: (url: string | AppURL) => any;
    urlPrefix?: string; // prefix to use when creating urls for cells and rows and headers
    modelId?: string;
}

const getRowDisplayName = (row: any, displayNamePath: string[]): any => {
    return row[displayNamePath[0]][displayNamePath[1]];
}

const rowSort = (row1, row2, displayNamePath: string[]): number => {
    return naturalSort(getRowDisplayName(row1, displayNamePath), getRowDisplayName(row2, displayNamePath));
}

const getModelId = (schemaQuery: SchemaQuery) => {
    return `heatmap-${schemaQuery.getSchema()}-${schemaQuery.getQuery()}`;
}

const HeatMapImpl: FC<HeatMapProps & InjectedQueryModels> = memo(props => {
    const { queryModels, modelId, urlPrefix, nounPlural, navigate, headerClickUrl } = props;

    const [heatMapData, setHeatMapData] = useState<HeatMapCell[]>();

    const model = queryModels[modelId];

    useEffect(() => {
        const { getCellUrl, displayNamePath } = props;

        if (model.isLoading) {
            return;
        }

        // expected pivot column names
        const months = last12Months();
        const pivotColumns = months.reverse();

        const processedData = model.gridData
            .sort((row1, row2) => rowSort(row1, row2, displayNamePath))
            .reduce<HeatMapCell[]>((cells, row) => {
                const protocolName = getRowDisplayName(row,displayNamePath),
                    providerName = row.Provider?.value,
                    completeTotal = row.CompleteCount?.value,
                    inRangeTotal = row.InRangeCount?.value;

                const url = getCellUrl(row);

                // create cells for the last 12 months including values for which there is no data
                for (let i = 0; i < pivotColumns.length; i++) {
                    const pivotCol = pivotColumns[i];
                    const pivotColName = pivotCol.yearMonth + '::MonthCount';

                    // Get the count for the year-month.
                    // The pivot column will not be present if no <Protocol>s have run count for that month.
                    // The pivot column value will be null if this <Protocol> has no runs, but others do.
                    let monthTotal = row[pivotColName]?.value ?? 0;

                    cells.push(
                        {
                            monthName: pivotCol.monthName,
                            monthNum: pivotCol.month,
                            yearNum: pivotCol.year,
                            title: pivotCol.displayValue,
                            providerName,
                            protocolName,
                            monthTotal,
                            completeTotal,
                            inRangeTotal,
                            url,
                        }
                    );
                }

                return cells;
            }, []);

        setHeatMapData(processedData);
    }, [model]);

    const renderYCell = useCallback((cell: HeatMapDisplayCell): ReactNode => {
        const url = cell?.headerUrl;
        const name = cell?.name ?? '<Name not provided>';

        if (url) {
            return <Link to={url.toString(urlPrefix)}>{name}</Link>;
        }

        return <span>{name}</span>;
    }, [urlPrefix]);

    const yAxisColumns = useMemo((): { [key: string]: HeatMapDisplayCell } => {
        const { getHeaderUrl, getTotalUrl } = props;

        if (!heatMapData) {
            return undefined;
        }

        return heatMapData.reduce<{ [key: string]: HeatMapDisplayCell }>((cols, cell) => {
            // error check for empty cells or cells without protocols
            if (cell?.protocolName !== undefined) {
                cols[cell.protocolName] = {
                    name: cell.protocolName,
                    renderYCell: renderYCell,
                    completeTotal: cell.completeTotal,
                    inRangeTotal: cell.inRangeTotal,
                    headerUrl: getHeaderUrl(cell),
                    totalUrl: getTotalUrl(cell),
                };
            }

            return cols;
        }, {});
    }, [heatMapData]);

    const renderYTotalCell = useCallback((cell: HeatMapDisplayCell): ReactNode => {
        const inRangeTotal = cell.inRangeTotal,
            completeTotal = cell.completeTotal,
            url = cell.totalUrl;

        if (url) {
            const now = new Date();
            const dateEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            const dateBegin = new Date(dateEnd.getFullYear() - 1, dateEnd.getMonth() + 1, 1);
            const dateUrl = addDateRangeFilter(url, 'Created', dateBegin, dateEnd);

            if (inRangeTotal === completeTotal) {
                return (
                    <span title={'All ' + completeTotal + ' ' + nounPlural + ' created in last 12 months'}>
                        <Link to={dateUrl.toString(urlPrefix)}>{inRangeTotal}</Link>
                    </span>
                );
            }

            return (
                <span
                    title={
                        inRangeTotal + ' of ' + completeTotal + ' total ' + nounPlural + ' created in last 12 months'
                    }
                >
                    <Link to={dateUrl.toString(urlPrefix)}>{inRangeTotal}</Link> /{' '}
                    <Link to={url.toString(urlPrefix)}>{completeTotal}</Link>
                </span>
            );
        }

        return inRangeTotal + ' / ' + completeTotal;
    }, [urlPrefix, nounPlural]);

    const onCellClick = useCallback((cell: any) => {

        // only allow click through on cells with a monthTotal
        if (navigate && cell.monthTotal && cell.url) {
            const dateBegin = new Date([cell.monthNum, 1, cell.yearNum].join('/'));
            const dateEnd = new Date(dateBegin.getFullYear(), dateBegin.getMonth() + 1, 0);

            const dateUrl = addDateRangeFilter(cell.url, 'Created', dateBegin, dateEnd);
            navigate(dateUrl.toString(urlPrefix));
        }
    }, [navigate]);

    const onHeaderClick = useCallback((headerText: string, data: any) => {
        const anyCell = data.filter(d => d.monthName === headerText).first();

        if (navigate && anyCell) {
            const dateBegin = new Date([anyCell.monthNum, 1, anyCell.yearNum].join('/'));
            const dateEnd = new Date(dateBegin.getFullYear(), dateBegin.getMonth() + 1, 0);

            const dateUrl = addDateRangeFilter(headerClickUrl, 'Created', dateBegin, dateEnd);
            navigate(dateUrl.toString(urlPrefix));
        }
    }, [navigate, headerClickUrl]);

    if (!model || model.isLoading) {
        return <LoadingSpinner/>;
    }

    return (
        <HeatMapDisplay
            {...props}
            data={heatMapData}
            yAxisColumns={yAxisColumns}
            xSort={monthSort}
            yTotalCellRenderer={renderYTotalCell}
            onCellClick={onCellClick}
            onHeaderClick={onHeaderClick}
        />
    );

});

const HeatMapWithQueryModels = withQueryModels<HeatMapProps>(HeatMapImpl);

export const HeatMap: FC<HeatMapProps> = memo((props) => {
    const { schemaQuery, filters, urlPrefix } = props;

    const modelId = props.modelId || getModelId(schemaQuery)

    const queryConfigs = {
        [modelId]: {
            urlPrefix: urlPrefix,
            schemaQuery: schemaQuery,
            baseFilters: filters,
        }
    };

    return (
        <HeatMapWithQueryModels
            {...props}
            autoLoad={true}
            modelId={modelId}
            queryConfigs={queryConfigs}
        />
    )
});

HeatMap.defaultProps = {
    displayNamePath: ['Protocol', 'displayValue'],
};
