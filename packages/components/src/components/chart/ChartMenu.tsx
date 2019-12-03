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

import { DataViewInfo } from '../../models';
import { Chart } from './Chart';
import { setReportId } from '../../actions';
import { QueryGridModel } from '../base/models/model';
import { generateId, naturalSort } from '../../util/utils';

interface Props {
    model: QueryGridModel
    charts: List<DataViewInfo>
    style?: Object
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

    createItem(chart: DataViewInfo): React.ReactNode {
        return (
            <MenuItem key={chart.reportId} onSelect={() => this.showChart(chart)}>
                <i className={"pullLeft " + chart.iconCls} style={{width: '25px'}}/>
                {chart.getLabel()}
            </MenuItem>
        );
    }

    createMenuItems(): Array<React.ReactNode> {
        const { charts } = this.props;
        const items = [];

        if (charts && !charts.isEmpty()) {
            const visCharts = charts.filter((chart) => chart.isVisChartType());
            const comparator = chart => chart.getLabel();
            const privateCharts = visCharts.filter((chart) => !chart.isShared())
                .sortBy(comparator, naturalSort);
            const publicCharts = visCharts.filter((chart) => chart.isShared())
                .sortBy(comparator, naturalSort);

            if (privateCharts.size) {
                items.push(<MenuItem header key="private-header">My Saved Charts</MenuItem>);
                privateCharts.valueSeq().forEach(chart => items.push(this.createItem(chart)));
            }

            if (publicCharts.size) {
                items.push(<MenuItem header key="public-header">All Saved Charts</MenuItem>);
                publicCharts.valueSeq().forEach(chart => items.push(this.createItem(chart)));
            }
        }

        return items;
    }

    showChart(chart: DataViewInfo) {
        setReportId(this.props.model, chart.reportId);
    }

    hideChart() {
        setReportId(this.props.model,undefined);
    }

    getSelectedChart() {
        let selectedChart;
        const charts = this.props.charts;
        const reportId = this.props.model.urlParamValues.get('reportId');

        if (charts && reportId) {
            selectedChart = charts.find((dataViewInfo) => dataViewInfo.reportId === reportId);
        }

        return selectedChart;
    }

    renderChartModal() {
        const { model } = this.props;
        const selectedChart = this.getSelectedChart();

        return (
            <Modal bsSize="large" show={selectedChart !== undefined} keyboard={true} onHide={this.hideChart}>
                <Modal.Header closeButton={true} closeLabel={"Close"}>
                    <Modal.Title>{selectedChart.getLabel()}</Modal.Title>
                    {selectedChart.description
                        ? <div><br/>{selectedChart.description}</div>
                        : null
                    }
                </Modal.Header>
                <Modal.Body>
                    <Chart chart={selectedChart} model={model}/>
                </Modal.Body>
            </Modal>
        )
    }

    getChartButtonTitle() {
        const { charts, model } = this.props;
        const chartsLoaded = charts !== undefined && charts !== null;
        return chartsLoaded || model.isError ? "Charts" : <span className="fa fa-spinner fa-spin"/>;
    }

    render() {
        const { model, style } = this.props;
        const selectedChart = this.getSelectedChart();
        const chartItems = this.createMenuItems();

        if (model.hideEmptyChartSelector && chartItems.length === 0) {
            return null;
        }

        return (
            <span style={style}>
                <DropdownButton
                    id={this.dropId}
                    disabled={chartItems.length === 0}
                    title={this.getChartButtonTitle()}
                >
                    {chartItems}
                </DropdownButton>

                {selectedChart && this.renderChartModal()}
            </span>
        )
    }
}
