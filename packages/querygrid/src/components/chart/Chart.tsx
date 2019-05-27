/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import $ from 'jquery'
import { QueryGridModel, LoadingSpinner, generateId, debounce } from '@glass/base'

import { DataViewInfo, VisualizationConfigModel } from '../../models'
import { getVisualizationConfig } from '../../actions'

interface Props {
    chart: DataViewInfo
    model: QueryGridModel
}

interface State {
    divId: string
    config: VisualizationConfigModel
}

export class Chart extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            divId: generateId('chart-'),
            config: undefined
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
            }
            else {
                getVisualizationConfig(chart.reportId)
                    .then((config) => {
                        this.setState({config});
                        this.renderChart();
                    })
                    .catch(response => {
                        this.renderError(response.exception);
                    });
            }
        }
        else {
            this.getPlotElement().html('No chart selected.');
        }
    }

    renderError(msg) {
        this.getPlotElement().html('<span class="text-danger">' + msg + '</span>');
    }

    renderChart() {
        const { model } = this.props;
        let { config } = this.state;

        if (config) {
            let newConfig = config.toJS();

            // set the size of the SVG based on the plot el width (i.e. the model width)
            newConfig.chartConfig.width = this.getPlotElement().width();
            newConfig.chartConfig.height = newConfig.chartConfig.width * 9 / 16; // 16:9 aspect ratio

            // apply the baseFilters and filterArray from this model to the chart config queryConfig filterArray
            if (model.baseFilters && !model.baseFilters.isEmpty()) {
                model.baseFilters.forEach((filter) => newConfig.queryConfig.filterArray.push(filter));
            }
            if (model.filterArray && !model.filterArray.isEmpty()) {
                model.filterArray.forEach((filter) => newConfig.queryConfig.filterArray.push(filter));
            }

            this.getPlotElement().html('');
            LABKEY.vis.GenericChartHelper.renderChartSVG(this.state.divId, newConfig.queryConfig, newConfig.chartConfig);
        }
    }

    render() {
        return <div id={this.state.divId}><LoadingSpinner/></div>;
    }
}