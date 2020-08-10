import * as React from 'react';
import $ from 'jquery';

import { debounce, generateId } from '../..';

import { getBarChartPlotConfig } from './utils';

interface Props {
    title: string;
    data: any[];
    onClick: (evt: any, row: any) => any;
    chartHeight: number;
    defaultFillColor?: string;
    defaultBorderColor?: string;
    barFillColors?: { [key: string]: string };
}

interface State {
    plotId: string;
}

export class BaseBarChart extends React.Component<Props, State> {
    static defaultProps = {
        chartHeight: 350,
        defaultFillColor: '#236fa0',
        defaultBorderColor: '#236fa0',
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            plotId: generateId('base-barchart-'),
        };

        this.handleResize = debounce(this.handleResize.bind(this), 75);
    }

    componentDidMount(): void {
        $(window).on('resize', this.handleResize);

        this.renderPlot(this.props);
    }

    UNSAFE_componentWillReceiveProps(nextProps: Readonly<Props>): void {
        this.renderPlot(nextProps);
    }

    componentWillUnmount() {
        $(window).off('resize', this.handleResize);
    }

    getPlotElement() {
        return $('#' + this.state.plotId);
    }

    handleResize(e) {
        this.renderPlot(this.props);
    }

    getPlotConfig(props: Props): Record<string, any> {
        const { title, data, onClick, chartHeight, defaultFillColor, defaultBorderColor, barFillColors } = props;
        return getBarChartPlotConfig({
            renderTo: this.state.plotId,
            title,
            height: chartHeight,
            width: this.getPlotElement().width() + 50,
            defaultFillColor,
            defaultBorderColor,
            onClick,
            data,
            barFillColors,
        });
    }

    renderPlot(props: Props) {
        this.getPlotElement().html('');
        const plot = new LABKEY.vis.BarPlot(this.getPlotConfig(props));
        plot.render();
    }

    render() {
        return <div id={this.state.plotId} className="dashboard-bar-chart"></div>;
    }
}
