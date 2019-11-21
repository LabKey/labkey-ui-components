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
import React from 'reactn';
import { DropdownButton, MenuItem, Modal } from 'react-bootstrap';
import { List } from 'immutable';
import { generateId, QueryGridModel } from '@glass/base';

import { DataViewInfo  } from '../../models';
import { Chart } from './Chart';
import { setReportId } from '../../actions';

interface ChartModalProps {
    selectedChart: DataViewInfo,
    model: QueryGridModel,
    onHide: Function,
}

class ChartModal extends React.PureComponent<ChartModalProps> {
    render() {
        const { selectedChart, model, onHide } = this.props;
        let description;

        if (selectedChart.description) {
            description = <div><br/>{selectedChart.description}</div>;
        }

        return (
            <Modal bsSize="large" show={selectedChart !== undefined} keyboard={true} onHide={onHide}>
                <Modal.Header closeButton={true} closeLabel={"Close"}>
                    <Modal.Title>{selectedChart.getLabel()}</Modal.Title>

                    {description}
                </Modal.Header>

                <Modal.Body>
                    <Chart chart={selectedChart} model={model}/>
                </Modal.Body>
            </Modal>
        );
    }
}

interface Props {
    model: QueryGridModel,
    charts: List<DataViewInfo>,
    privateCharts: List<DataViewInfo>,
    error: string,
    onChartClicked?: Function,
}

export class ChartMenu extends React.PureComponent<Props> {
    dropId: string;

    constructor(props: Props) {
        super(props);
        this.hideChart = this.hideChart.bind(this);
        this.showChart = this.showChart.bind(this);
        this.getSelectedChart = this.getSelectedChart.bind(this);
        this.dropId = generateId('chartselector-');
    }

    createItem = (chart: DataViewInfo) => {
        // TODO: add a css class instead of using inline styles
        return (
            <MenuItem key={chart.reportId} onSelect={() => this.showChart(chart)}>
                <i className={"pullLeft " + chart.iconCls} style={{width: '25px'}}/>
                {chart.getLabel()}
            </MenuItem>
        );
    };

    createMenuItems(): Array<React.ReactNode> {
        const { charts, privateCharts, error } = this.props;

        if (error) {
            return [
                <MenuItem key='error'>
                    <i className={"pullLeft"} style={{width: '25px'}}/>
                    {error}
                </MenuItem>
            ];
        }

        const items = [];

        if (privateCharts && !privateCharts.isEmpty()) {
            items.push(<MenuItem header key="private-header">My Saved Charts</MenuItem>);
            privateCharts.forEach(chart => items.push(this.createItem(chart)));
        }

        if (charts && !charts.isEmpty()) {
            items.push(<MenuItem header key="public-header">All Saved Charts</MenuItem>);
            charts.forEach(chart => items.push(this.createItem(chart)));
        }

        return items;
    }

    showChart(chart: DataViewInfo) {
        const { onChartClicked } = this.props;

        // If there is no user defined click handler then render the chart modal.
        // If the user supplies a click handler then we use the response from that to determine if we should render
        // the chart modal. This is needed so Biologics and redirect to Sample Comparison Reports.
        if (!onChartClicked || (onChartClicked && onChartClicked(chart))) {
            setReportId(this.props.model, chart.reportId);
        }
    }

    hideChart() {
        setReportId(this.props.model,undefined);
    }

    getSelectedChart() {
        let selectedChart;
        const {charts, privateCharts } = this.props;
        const reportId = this.props.model.urlParamValues.get('reportId');
        const searchFn = (dataViewInfo) => dataViewInfo.reportId === reportId;

        if (charts && reportId) {
            selectedChart = charts.find(searchFn) || privateCharts.find(searchFn);
        }

        return selectedChart;
    }

    getChartButtonTitle() {
        const { charts, error } = this.props;
        const chartsLoaded = charts !== undefined && charts !== null;
        return chartsLoaded || error ? "Charts" : <span className="fa fa-spinner fa-spin"/>;
    }

    render() {
        const { model } = this.props;
        const title = this.getChartButtonTitle();
        const selectedChart = this.getSelectedChart();
        const chartItems = this.createMenuItems();
        const disabled = chartItems.length === 0;
        let chartModal;

        if (model.hideEmptyChartSelector && chartItems.length === 0) {
            return null;
        }

        if (selectedChart) {
            chartModal = <ChartModal selectedChart={selectedChart} model={model} onHide={this.hideChart} />;
        }

        return (
            <span>
                <DropdownButton id={this.dropId} disabled={disabled} title={title}>
                    {chartItems}
                </DropdownButton>

                {chartModal}
            </span>
        );
    }
}
