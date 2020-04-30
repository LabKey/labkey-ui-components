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
import $ from 'jquery';

import { DataViewInfo, VisualizationConfigModel } from '../../models';
import { getVisualizationConfig } from '../../actions';
import { QueryGridModel } from '../base/models/model';
import { debounce, generateId } from '../../util/utils';
import { LoadingSpinner } from '../base/LoadingSpinner';

interface Props {
    chart: DataViewInfo;
    model?: QueryGridModel;
}

interface State {
    divId: string;
    config: VisualizationConfigModel;
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

    componentDidMount() {
        $(window).on('resize', this.handleResize);
        this.getChartConfig();
    }

    componentWillUnmount() {
        $(window).off('resize', this.handleResize);
    }

    shouldComponentUpdate() {
        return false;
    }

    handleResize(e) {
        this.renderChart();
    }

    getPlotElement() {
        return $('#' + this.state.divId);
    }

    getChartConfig() {
        const { chart } = this.props;

        if (chart) {
            if (chart.error) {
                this.getPlotElement().html(chart.error);
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
            this.getPlotElement().html('No chart selected.');
        }
    }

    renderError(msg) {
        this.getPlotElement().html('<span class="text-danger">' + msg + '</span>');
    }

    renderChart() {
        const { model } = this.props;
        const { config } = this.state;
        const processedConfig = config.toJS();

        if (config) {
            // set the size of the SVG based on the plot el width (i.e. the model width)
            processedConfig.chartConfig.width = this.getPlotElement().width();
            processedConfig.chartConfig.height = (processedConfig.chartConfig.width * 9) / 16; // 16:9 aspect ratio

            // apply the baseFilters and filterArray from this model to the chart config queryConfig filterArray
            if (model && model.baseFilters && !model.baseFilters.isEmpty()) {
                model.baseFilters.forEach(filter => processedConfig.queryConfig.filterArray.push(filter));
            }

            if (model && model.filterArray && !model.filterArray.isEmpty()) {
                model.filterArray.forEach(filter => processedConfig.queryConfig.filterArray.push(filter));
            }

            this.getPlotElement().html('');
            LABKEY.vis.GenericChartHelper.renderChartSVG(
                this.state.divId,
                processedConfig.queryConfig,
                processedConfig.chartConfig
            );
        }
    }

    render() {
        return (
            <div id={this.state.divId}>
                <LoadingSpinner />
            </div>
        );
    }
}
