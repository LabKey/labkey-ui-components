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
import { DropdownButton, MenuItem, Modal } from 'react-bootstrap';
import { List } from 'immutable';

import { generateId } from '../../util/utils';
import { QueryGridModel } from '../base/models/model';
import { DataViewInfo } from '../../models';
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

interface ChartMenuItemProps {
    chart: DataViewInfo,
    showChart: Function,
}

class ChartMenuItem extends React.PureComponent<ChartMenuItemProps> {
    render() {
        const { chart, showChart } = this.props;

        return (
            <MenuItem onSelect={() => showChart(chart)}>
                <i className={`chart-menu-icon ${chart.iconCls}`} />
                <span className="chart-menu-label">{chart.getLabel()}</span>
            </MenuItem>
        );
    }
}

interface Props {
    model: QueryGridModel,
    charts: List<DataViewInfo>,
    privateCharts: List<DataViewInfo>,
    error: string,
    onPreviewSCRClicked?: Function,
    onChartClicked?: Function,
    showSampleComparisonReports?: boolean,
}

export class ChartMenu extends React.PureComponent<Props> {
    dropId: string;

    constructor(props: Props) {
        super(props);
        this.dropId = generateId('chartselector-');
    }

    createMenuItems(): Array<React.ReactNode> {
        const { charts, privateCharts, error, showSampleComparisonReports, onPreviewSCRClicked } = this.props;

        if (error) {
            return [
                <MenuItem key='error'>
                    {error}
                </MenuItem>
            ];
        }

        const items = [];

        if (showSampleComparisonReports) {
            items.push(<MenuItem header key="new-charts">New Charts & Reports</MenuItem>);
            // TODO: Should we pass the QueryGridModel to onPreviewSCRClicked? We might need to so consumers of QGP
            //  have the most up to date model when it's clicked (for sample selections).
            items.push((
                <MenuItem key="preview-scr" onSelect={() => onPreviewSCRClicked()}>
                    <i className={"chart-menu-icon fa fa-table"}/>
                    <span className="chart-menu-label">Preview Sample Comparison Report</span>
                </MenuItem>
            ));
        }

        if (privateCharts && !privateCharts.isEmpty()) {
            items.push(<MenuItem header key="private-header">My Saved Charts</MenuItem>);
            privateCharts.forEach(chart => {
                items.push(<ChartMenuItem key={chart.reportId} chart={chart} showChart={this.showChart} />);
            });
        }

        if (charts && !charts.isEmpty()) {
            items.push(<MenuItem header key="public-header">All Saved Charts</MenuItem>);
            charts.forEach(chart => {
                items.push(<ChartMenuItem key={chart.reportId} chart={chart} showChart={this.showChart} />);
            });
        }

        return items;
    }

    showChart = (chart: DataViewInfo) => {
        const { onChartClicked } = this.props;

        // If there is no user defined click handler then render the chart modal.
        // If the user supplies a click handler then we use the response from that to determine if we should render
        // the chart modal. This is needed so Biologics and redirect to Sample Comparison Reports.
        if (!onChartClicked || (onChartClicked && onChartClicked(chart))) {
            setReportId(this.props.model, chart.reportId);
        }
    };

    hideChart = () => {
        setReportId(this.props.model,undefined);
    };

    getSelectedChart = () => {
        let selectedChart;
        const {charts, privateCharts } = this.props;
        const reportId = this.props.model.urlParamValues.get('reportId');
        const searchFn = (dataViewInfo) => dataViewInfo.reportId === reportId;

        if (charts && reportId) {
            selectedChart = charts.find(searchFn) || privateCharts.find(searchFn);
        }

        return selectedChart;
    };

    getChartButtonTitle = () => {
        const { charts, error } = this.props;
        const chartsLoaded = charts !== undefined && charts !== null;
        return chartsLoaded || error ? "Charts" : <span className="fa fa-spinner fa-pulse"/>;
    };

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
