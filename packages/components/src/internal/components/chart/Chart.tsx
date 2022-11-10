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
import React, { ReactNode } from 'react';
import { List, Record } from 'immutable';
import { Filter, Query } from '@labkey/api';

import { DataViewInfo } from '../../DataViewInfo';
import { LABKEY_VIS } from '../../constants';
import { debounce, generateId } from '../../util/utils';
import { LoadingSpinner } from '../base/LoadingSpinner';

interface Props {
    chart: DataViewInfo;
    filters?: Filter.IFilter[];
}

interface State {
    config: VisualizationConfigModel;
    divId: string;
}

export class Chart extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            divId: generateId('chart-'),
            config: undefined,
        };

        this.handleResize = debounce(this.handleResize.bind(this), 250);
    }

    componentDidMount(): void {
        window.addEventListener('resize', this.handleResize);
        this.getChartConfig();
    }

    componentWillUnmount(): void {
        window.removeEventListener('resize', this.handleResize);
    }

    shouldComponentUpdate(): boolean {
        return false;
    }

    handleResize(): void {
        this.renderChart();
    }

    getPlotElement(): HTMLDivElement {
        return document.querySelector('#' + this.state.divId);
    }

    getChartConfig(): void {
        const { chart } = this.props;

        if (chart) {
            if (chart.error) {
                this.getPlotElement().innerHTML = chart.error;
            } else {
                getVisualizationConfig(chart.reportId)
                    .then(config => {
                        this.setState({ config });
                        this.renderChart();
                    })
                    .catch(response => {
                        this.renderError(response.exception);
                    });
            }
        } else {
            this.getPlotElement().innerHTML = 'No chart selected.';
        }
    }

    renderError(msg): void {
        this.getPlotElement().innerHTML = '<span class="text-danger">' + msg + '</span>';
    }

    renderChart(): void {
        const { filters } = this.props;
        const { config } = this.state;
        const processedConfig = config.toJS();

        if (config) {
            // set the size of the SVG based on the plot el width (i.e. the model width)
            processedConfig.chartConfig.width = this.getPlotElement().offsetWidth;
            processedConfig.chartConfig.height = (processedConfig.chartConfig.width * 9) / 16; // 16:9 aspect ratio

            if (filters && filters.length > 0) {
                processedConfig.queryConfig.filterArray = [...processedConfig.queryConfig.filterArray, ...filters];
            }

            this.getPlotElement().innerHTML = '';
            LABKEY_VIS.GenericChartHelper.renderChartSVG(
                this.state.divId,
                processedConfig.queryConfig,
                processedConfig.chartConfig
            );
        }
    }

    render(): ReactNode {
        return (
            <div id={this.state.divId}>
                <LoadingSpinner />
            </div>
        );
    }
}

function getVisualizationConfig(reportId: string): Promise<VisualizationConfigModel> {
    return new Promise((resolve, reject) => {
        Query.Visualization.get({
            reportId,
            name: undefined,
            schemaName: undefined,
            queryName: undefined,
            success: response => {
                resolve(VisualizationConfigModel.create(response.visualizationConfig));
            },
            failure: reject,
        });
    });
}

class VisualizationConfigModel extends Record({
    queryConfig: undefined,
    chartConfig: undefined,
}) {
    declare queryConfig: QueryConfigModel;
    declare chartConfig: ChartConfigModel;

    static create(raw: any): VisualizationConfigModel {
        return new VisualizationConfigModel(
            Object.assign({}, raw, {
                chartConfig: new ChartConfigModel(raw.chartConfig),
                queryConfig: new QueryConfigModel(raw.queryConfig),
            })
        );
    }
}

class ChartConfigModel extends Record({
    geomOptions: undefined,
    height: undefined,
    labels: undefined,
    measures: undefined,
    pointType: undefined,
    renderType: undefined,
    scales: undefined,
    width: undefined,
}) {
    declare geomOptions: any;
    declare height: number;
    declare labels: any;
    declare measures: any;
    declare pointType: string;
    declare renderType: string;
    declare scales: any;
    declare width: number;
}

class QueryConfigModel extends Record({
    columns: undefined,
    containerPath: undefined,
    // dataRegionName: undefined,
    filterArray: undefined,
    maxRows: undefined,
    method: undefined,
    parameters: undefined,
    // queryLabel: undefined,
    queryName: undefined,
    requiredVersion: undefined,
    schemaName: undefined,
    // sort: undefined,
    viewName: undefined,
}) {
    declare columns: List<string>;
    declare containerPath: string;
    // declare dataRegionName: string;
    declare filterArray: List<any>;
    declare maxRows: number;
    declare method: string;
    declare parameters: any;
    // declare queryLabel: string;
    declare queryName: string;
    declare requiredVersion: string;
    declare schemaName: string;
    // declare sort: string;
    declare viewName: string;
}
