/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'reactn'
import { DropdownButton, MenuItem, Modal } from 'react-bootstrap'
import { List } from 'immutable'
import { QueryGridModel, naturalSort, generateId } from '@glass/base'

import { DataViewInfo } from '../../model'
import { Chart } from './Chart'

const emptyList = List<React.ReactNode>();

interface Props {
    model: QueryGridModel
    charts: List<DataViewInfo>
}

interface State {
    selectedChart?: DataViewInfo
}

export class ChartMenu extends React.PureComponent<Props, State> {

    dropId: string;

    constructor(props: Props) {
        super(props);

        this.hideChart = this.hideChart.bind(this);
        this.showChart = this.showChart.bind(this);

        this.state = {
            selectedChart: undefined
        };

        this.dropId = generateId('chartselector-');
    }

    createItem(chart: DataViewInfo, key: string): React.ReactNode {
        return (
            <MenuItem
                key={key}
                onSelect={() => this.showChart(chart)}
            >
                <i className={"pullLeft " + chart.iconCls} style={{width: '25px'}}/>
                {chart.getLabel()}
            </MenuItem>
        )
    }

    createMenuItems(): List<React.ReactNode> {
        const { charts } = this.props;

        if (charts && !charts.isEmpty()) {
            const items = List<React.ReactNode>().asMutable();
            const visCharts = charts.filter((chart) => chart.isVisChartType());

            const privateCharts = visCharts.filter((chart) => !chart.isShared())
                .sortBy(chart => chart.getLabel(), naturalSort);

            if (privateCharts.size) {
                items.push(<MenuItem header key="private-header">My Saved Charts</MenuItem>);

                privateCharts.valueSeq().forEach((chart, i) => {
                    items.push(this.createItem(chart, `private-${i}`));
                })
            }

            const publicCharts = visCharts.filter((chart) => chart.isShared())
                .sortBy(chart => chart.getLabel(), naturalSort);

            if (publicCharts.size) {
                items.push(<MenuItem header key="public-header">All Saved Charts</MenuItem>);

                publicCharts.valueSeq().forEach((chart, i) => {
                    items.push(this.createItem(chart, `public-${i}`));
                })
            }

            return items.asImmutable();
        }

        return emptyList;
    }

    showChart(chart: DataViewInfo) {
        this.setState({
            selectedChart: chart
        });
    }

    hideChart() {
        this.setState({
            selectedChart: undefined
        });
    }

    renderChartModal() {
        const { model } = this.props;
        const { selectedChart } = this.state;

        return (
            <Modal
                bsSize="large"
                show={selectedChart !== undefined}
                keyboard={true}
                onHide={this.hideChart}
            >
                <Modal.Header
                    closeButton={true}
                    closeLabel={"Close"}
                >
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
        const chartsLoaded = charts && charts != null;
        return chartsLoaded || model.isError ? "Charts" : <span className="fa fa-spinner fa-spin"/>;
    }

    render() {
        const { selectedChart } = this.state;
        const chartItems = this.createMenuItems();

        return (
            <>
                <DropdownButton
                    id={this.dropId}
                    disabled={chartItems.size <= 1}
                    title={this.getChartButtonTitle()}>
                    {chartItems.toArray()}
                </DropdownButton>
                {selectedChart && this.renderChartModal()}
            </>
        )
    }
}