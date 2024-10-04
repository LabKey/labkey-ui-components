import React, { Component } from 'react';

import { LABKEY_VIS } from '../../constants';

import { debounce, generateId } from '../../util/utils';

import { BarChartData } from './models';
import { getBarChartPlotConfig } from './utils';

interface Props {
    barFillColors?: Record<string, string>;
    chartHeight: number;
    data: BarChartData[];
    defaultBorderColor?: string;
    defaultFillColor?: string;
    grouped?: boolean;
    onClick?: (evt: any, row: any) => void;
    title: string;
}

export class BaseBarChart extends Component<Props> {
    static defaultProps = {
        chartHeight: 350,
        defaultFillColor: '#236fa0',
        defaultBorderColor: '#236fa0',
        grouped: false,
    };

    plotId: string;

    constructor(props: Props) {
        super(props);

        this.plotId = generateId('base-barchart-');

        this.handleResize = debounce(this.handleResize, 75);
    }

    componentDidMount(): void {
        window.addEventListener('resize', this.handleResize);
        this.renderPlot();
    }

    componentDidUpdate(): void {
        this.renderPlot();
    }

    componentWillUnmount(): void {
        window.removeEventListener('resize', this.handleResize);
    }

    getPlotElement = (): HTMLElement => {
        return document.getElementById(this.plotId);
    };

    handleResize = (): void => {
        this.renderPlot();
    };

    getPlotConfig = (): Record<string, any> => {
        const { title, data, onClick, chartHeight, defaultFillColor, defaultBorderColor, barFillColors, grouped } =
            this.props;

        return getBarChartPlotConfig({
            renderTo: this.plotId,
            title,
            height: chartHeight,
            width: this.getPlotElement().getBoundingClientRect().width,
            defaultFillColor,
            defaultBorderColor,
            onClick,
            data,
            barFillColors,
            grouped,
        });
    };

    renderPlot = (): void => {
        this.getPlotElement().innerHTML = '';
        const plot = new LABKEY_VIS.BarPlot(this.getPlotConfig());
        plot.render();
    };

    render() {
        return <div className="base-bar-chart" id={this.plotId} />;
    }
}
