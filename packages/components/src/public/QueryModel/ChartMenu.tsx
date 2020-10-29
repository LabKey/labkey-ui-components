import React, { PureComponent, ReactNode } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';

import { DataViewInfoTypes } from '../..';
import { ChartMenuItem } from '../../internal/components/chart/ChartMenuItem';
import { DataViewInfo } from '../../internal/models';

import { ChartModal } from '../../internal/components/chart/ChartModal';
import { blurActiveElement } from '../../internal/util/utils';

import { RequiresModelAndActions } from './withQueryModels';
import { getQueryMetadata } from '../../internal/global';

interface Props extends RequiresModelAndActions {
    hideEmptyChartMenu: boolean;
    onChartClicked?: (chart: DataViewInfo) => boolean;
    onCreateReportClicked?: (type: DataViewInfoTypes) => void;
    showSampleComparisonReports: boolean;
}

export class ChartMenu extends PureComponent<Props> {
    componentDidMount(): void {
        const { model, actions, showSampleComparisonReports } = this.props;
        actions.loadCharts(model.id, showSampleComparisonReports);
    }

    onCreateClicked = (): void => {
        // We only support creating SampleComparison reports at the moment.
        const { onCreateReportClicked } = this.props;

        if (onCreateReportClicked) {
            onCreateReportClicked(DataViewInfoTypes.SampleComparison);
        }
    };

    chartClicked = (chart: DataViewInfo): void => {
        const { actions, onChartClicked, model } = this.props;

        blurActiveElement();

        // If the user supplies a click handler then we use the response from that to determine if we should render the
        // chart modal. This is needed so Biologics and redirect to Sample Comparison Reports.
        if (onChartClicked === undefined || onChartClicked(chart)) {
            actions.selectReport(model.id, chart.reportId);
        }
    };

    clearChart = (): void => {
        const { actions, model } = this.props;
        actions.selectReport(model.id, undefined);
    };

    chartMapper = (chart): ReactNode => (
        <ChartMenuItem key={chart.reportId} chart={chart} showChart={this.chartClicked} />
    );

    render(): ReactNode {
        const { hideEmptyChartMenu, model, showSampleComparisonReports } = this.props;
        const {
            charts,
            chartsError,
            hasCharts,
            id,
            isLoading,
            isLoadingCharts,
            rowsError,
            selectedReportId,
            queryInfo,
            queryInfoError,
        } = model;
        const privateCharts = hasCharts ? charts.filter(chart => !chart.shared) : [];
        const publicCharts = hasCharts ? charts.filter(chart => chart.shared) : [];
        const title = isLoadingCharts ? <span className="fa fa-spinner fa-pulse" /> : 'Charts';
        const noCharts = hasCharts && charts.length === 0 && !showSampleComparisonReports;
        const hasError = queryInfoError !== undefined || rowsError !== undefined;
        const disabled = isLoading || isLoadingCharts || noCharts || hasError;
        const selectedChart = charts?.find(chart => chart.reportId === selectedReportId);
        const showChartModal = queryInfo !== undefined && selectedChart !== undefined;
        const _hideEmptyChartMenu = getQueryMetadata().get('hideEmptyChartMenu', hideEmptyChartMenu);

        if (
            privateCharts.length === 0 &&
            publicCharts.length === 0 &&
            !showSampleComparisonReports &&
            _hideEmptyChartMenu
        ) {
            return null;
        }

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

                    {privateCharts.length > 0 && privateCharts.map(this.chartMapper)}

                    {publicCharts.length > 0 && <MenuItem header>All Saved Charts</MenuItem>}

                    {publicCharts.length > 0 && publicCharts.map(this.chartMapper)}
                </DropdownButton>

                {showChartModal && (
                    <ChartModal selectedChart={selectedChart} filters={model.filters} onHide={this.clearChart} />
                )}
            </div>
        );
    }
}
