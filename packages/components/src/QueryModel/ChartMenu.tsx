import React, { PureComponent, ReactNode } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';

import { DataViewInfoTypes } from '../constants';
import { ChartMenuItem } from '../components/chart/ChartMenuItem';
import { DataViewInfo } from '../models';

import { ChartModal } from '../components/chart/ChartModal';
import { blurActiveElement } from '../util/utils';

import { RequiresModelAndActions } from './withQueryModels';

interface Props extends RequiresModelAndActions {
    onChartClicked?: (chart: DataViewInfo) => boolean;
    onCreateReportClicked?: (type: DataViewInfoTypes) => void;
    showSampleComparisonReports: boolean;
}

interface State {
    selectedChart?: DataViewInfo;
}

export class ChartMenu extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = { selectedChart: undefined };
    }
    componentDidMount(): void {
        const { model, actions, showSampleComparisonReports } = this.props;
        actions.loadCharts(model.id, showSampleComparisonReports);
    }

    onCreateClicked = (): void => {
        // We only support creating SampleComparison reports at the moment.
        this.props.onCreateReportClicked(DataViewInfoTypes.SampleComparison);
    };

    chartClicked = (chart): void => {
        const { onChartClicked } = this.props;

        blurActiveElement();

        // If the user supplies a click handler then we use the response from that to determine if we should render the
        // chart modal. This is needed so Biologics and redirect to Sample Comparison Reports.
        if (onChartClicked === undefined || onChartClicked(chart)) {
            this.setState({ selectedChart: chart });
        }
    };

    clearChart = (): void => {
        this.setState({ selectedChart: undefined });
    };

    render(): ReactNode {
        const { model, showSampleComparisonReports } = this.props;
        const { charts, chartsError, hasCharts, id, isLoading, isLoadingCharts } = model;
        const privateCharts = hasCharts ? charts.filter(chart => !chart.shared) : [];
        const publicCharts = hasCharts ? charts.filter(chart => chart.shared) : [];
        const title = isLoadingCharts ? <span className="fa fa-spinner fa-pulse" /> : 'Charts';
        const chartMapper = (chart): ReactNode => (
            <ChartMenuItem key={chart.reportId} chart={chart} showChart={this.chartClicked} />
        );
        const noCharts = hasCharts && charts.length === 0 && !showSampleComparisonReports;
        const disabled = isLoading || isLoadingCharts || noCharts;
        const { selectedChart } = this.state;
        // Have to safe guard around isLoading here because model.filters getter will throw an error if there is no
        // queryInfo.
        const filters = isLoading ? [] : model.filters;

        return (
            <div className="chart-menu">
                <DropdownButton id={`chart-menu-${id}`} disabled={disabled} title={title}>
                    {showSampleComparisonReports && (
                        <MenuItem header key="new-charts">
                            New Charts & Reports
                        </MenuItem>
                    )}

                    {showSampleComparisonReports && (
                        <MenuItem key="preview-scr" onSelect={this.onCreateClicked}>
                            <i className="chart-menu-icon fa fa-table" />
                            <span className="chart-menu-label">Preview Sample Comparison Report</span>
                        </MenuItem>
                    )}

                    {chartsError !== undefined && <MenuItem>{chartsError}</MenuItem>}

                    {privateCharts.length > 0 && <MenuItem header>My Saved Charts</MenuItem>}

                    {privateCharts.length > 0 && privateCharts.map(chartMapper)}

                    {publicCharts.length > 0 && <MenuItem header>All Saved Charts</MenuItem>}

                    {publicCharts.length > 0 && publicCharts.map(chartMapper)}
                </DropdownButton>

                {selectedChart !== undefined && (
                    <ChartModal selectedChart={selectedChart} filters={filters} onHide={this.clearChart} />
                )}
            </div>
        );
    }
}
