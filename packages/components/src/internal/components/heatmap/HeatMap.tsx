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
import React from 'react';
import { Link } from 'react-router';
import { fromJS, List, Map } from 'immutable';

import { gridInit } from '../../actions';
import { getStateQueryGridModel } from '../../models';
import { getQueryGridModel } from '../../global';
import { LoadingSpinner } from '../../..';
import { AppURL } from '../../..';
import { QueryGridModel, SchemaQuery } from '../../..';
import { naturalSort } from '../../..';

import { addDateRangeFilter, last12Months, monthSort } from './utils';
import { HeatMapDisplay } from './HeatMapDisplay';

export interface HeatMapProps {
    schemaQuery: SchemaQuery;
    displayNamePath?: string[]; // path within a query row to use for displaying the y axis and by which to sort the rows of data
    nounSingular: string;
    nounPlural: string;
    yAxis: string;
    xAxis: string;
    measure: string;
    yInRangeTotal?: string; // property name in 'cell' containing the in-range total amount (not the complete total)
    yTotalLabel?: string;
    getCellUrl: (row: Map<string, any>) => AppURL;
    getHeaderUrl: (cell: any) => AppURL;
    getTotalUrl: (cell: any) => AppURL;
    headerClickUrl: AppURL;
    emptyDisplay?: any;
    navigate?: (url: string | AppURL) => any;
    urlPrefix?: string; // prefix to use when creating urls for cells and rows and headers
}

export class HeatMap extends React.Component<HeatMapProps, any> {
    static defaultProps = {
        displayNamePath: ['Protocol', 'displayValue'],
    };

    componentDidMount() {
        this.initModel();
    }

    UNSAFE_componentWillReceiveProps(nextProps: HeatMapProps): void {
        this.initModel();
    }

    initModel() {
        const model = this.getQueryGridModel();
        gridInit(model, true, this);
    }

    getQueryGridModel(): QueryGridModel {
        const model = getStateQueryGridModel('heatmap', this.props.schemaQuery, { allowSelection: false });
        return getQueryGridModel(model.getId()) || model;
    }

    _prepareHeatMapData(data): List<Map<string, any>> {
        const { getCellUrl, displayNamePath } = this.props;

        // expected pivot column names
        const months = last12Months();
        const pivotColumns = months.reverse();

        return data
            .sortBy(row => row.getIn(displayNamePath), naturalSort)
            .map((row: Map<string, any>) => {
                const protocolName = row.getIn(displayNamePath),
                    providerName = row.getIn(['Provider', 'value']),
                    completeTotal = row.getIn(['CompleteCount', 'value']),
                    inRangeTotal = row.getIn(['InRangeCount', 'value']);

                const url = getCellUrl(row);

                // create cells for the last 12 months including values for which there is no data
                const cells = [];
                for (let i = 0; i < pivotColumns.length; i++) {
                    const pivotCol = pivotColumns[i];
                    const pivotColName = pivotCol.yearMonth + '::MonthCount';

                    // Get the count for the year-month.
                    // The pivot column will not be present if no <Protocol>s have run count for that month.
                    // The pivot column value will be null if this <Protocol> has no runs, but others do.
                    let monthTotal = 0;
                    if (row.hasIn([pivotColName, 'value'])) monthTotal = row.getIn([pivotColName, 'value']) || 0;

                    cells.push(
                        Map({
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
                        })
                    );
                }

                return List(cells);
            })
            .flatten(true);
    }

    _prepareYAxisColumns(heatMapData) {
        const { getHeaderUrl, getTotalUrl } = this.props;
        const yAxisColumnsMap = Map<string, any>().asMutable();

        heatMapData.map((cell: any) => {
            // error check for empty cells or cells without protocols
            if (cell && cell.has('protocolName')) {
                const cellData = fromJS({
                    name: cell.get('protocolName'),
                    renderYCell: this.renderYCell,
                    completeTotal: cell.get('completeTotal'),
                    inRangeTotal: cell.get('inRangeTotal'),
                    headerUrl: getHeaderUrl(cell),
                    totalUrl: getTotalUrl(cell),
                });

                yAxisColumnsMap.set(cell.get('protocolName'), cellData);
            }
        });

        return yAxisColumnsMap.asImmutable();
    }

    renderYCell = cell => {
        const { urlPrefix } = this.props;
        const url = cell.get('headerUrl');
        const name = cell.get('name') ? cell.get('name') : '<Name not provided>';

        if (url) {
            return <Link to={url.toString(urlPrefix)}>{name}</Link>;
        }

        return <span>{name}</span>;
    };

    renderYTotalCell = (cell: Map<string, any>) => {
        const { nounPlural, urlPrefix } = this.props;
        const inRangeTotal = cell.get('inRangeTotal'),
            completeTotal = cell.get('completeTotal'),
            url = cell.get('totalUrl');

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
    };

    onCellClick = (cell: Map<string, any>) => {
        const { navigate, urlPrefix } = this.props;

        // only allow click through on cells with a monthTotal
        if (navigate && cell.get('monthTotal') && cell.get('url')) {
            const dateBegin = new Date([cell.get('monthNum'), 1, cell.get('yearNum')].join('/'));
            const dateEnd = new Date(dateBegin.getFullYear(), dateBegin.getMonth() + 1, 0);

            const dateUrl = addDateRangeFilter(cell.get('url'), 'Created', dateBegin, dateEnd);
            navigate(dateUrl.toString(urlPrefix));
        }
    };

    onHeaderClick = (headerText: string, data: List<Map<string, any>>) => {
        const { navigate, headerClickUrl, urlPrefix } = this.props;
        const anyCell = data.filter(d => d.get('monthName') === headerText).first();

        if (navigate && anyCell) {
            const dateBegin = new Date([anyCell.get('monthNum'), 1, anyCell.get('yearNum')].join('/'));
            const dateEnd = new Date(dateBegin.getFullYear(), dateBegin.getMonth() + 1, 0);

            const dateUrl = addDateRangeFilter(headerClickUrl, 'Created', dateBegin, dateEnd);
            navigate(dateUrl.toString(urlPrefix));
        }
    };

    render() {
        const model = this.getQueryGridModel();

        if (!model || !model.isLoaded) {
            return <LoadingSpinner />;
        }

        const heatMapData = this._prepareHeatMapData(model.getData());

        return (
            <HeatMapDisplay
                {...this.props}
                data={heatMapData}
                yAxisColumns={this._prepareYAxisColumns(heatMapData)}
                xSort={monthSort.bind(this)}
                yTotalCellRenderer={this.renderYTotalCell}
                onCellClick={this.onCellClick}
                onHeaderClick={this.onHeaderClick}
            />
        );
    }
}
