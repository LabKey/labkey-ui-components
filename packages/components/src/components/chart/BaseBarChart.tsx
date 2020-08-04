import * as React from 'react';
import $ from 'jquery';

import { debounce, generateId } from '../..';

interface Props {
    title: string;
    data: any[];
    onClick: (evt: any, row: any) => any;
}

interface State {
    plotId: string;
}

export class BaseBarChart extends React.Component<Props, State> {
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

    componentWillReceiveProps(nextProps: Readonly<Props>) {
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

    getPlotConfig(props: Props): Object {
        const { title, data, onClick } = props;

        return {
            renderTo: this.state.plotId,
            rendererType: 'd3',
            width: this.getPlotElement().width() + 50,
            height: 350,
            labels: {
                main: { value: title, visibility: 'hidden' },
                yLeft: { value: 'Count' },
            },
            aes: {
                x: 'label',
                y: 'count',
            },
            options: {
                color: '#236fa0',
                fill: '#236fa0',
                showValues: true,
                clickFn: onClick,
                hoverFn: function (row) {
                    return row.label + '\nClick to view details';
                },
            },
            scales: {
                y: {
                    tickFormat: function (v) {
                        if (v.toString().indexOf('.') > -1) {
                            return;
                        }

                        return v;
                    },
                },
            },
            data,
        };
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
