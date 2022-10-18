import React, { PureComponent, ReactNode } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';

import { ChartMenuItem } from '../../internal/components/chart/ChartMenuItem';
import { DataViewInfo } from '../../internal/DataViewInfo';

import { ChartModal } from '../../internal/components/chart/ChartModal';
import { blurActiveElement } from '../../internal/util/utils';

import { getQueryMetadata } from '../../internal/global';

import { RequiresModelAndActions } from './withQueryModels';

interface Props extends RequiresModelAndActions {
    hideEmptyChartMenu: boolean;
}

export class ChartMenu extends PureComponent<Props> {
    componentDidMount(): void {
        const { model, actions } = this.props;
        actions.loadCharts(model.id);
    }

    chartClicked = (chart: DataViewInfo): void => {
        const { actions, model } = this.props;
        blurActiveElement();
        actions.selectReport(model.id, chart.reportId);
    };

    clearChart = (): void => {
        const { actions, model } = this.props;
        actions.selectReport(model.id, undefined);
    };

    chartMapper = (chart): ReactNode => (
        <ChartMenuItem key={chart.reportId} chart={chart} showChart={this.chartClicked} />
    );

    render(): ReactNode {
        const { hideEmptyChartMenu, model } = this.props;
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
        const noCharts = hasCharts && charts.length === 0;
        const hasError = queryInfoError !== undefined || rowsError !== undefined;
        const disabled = isLoading || isLoadingCharts || noCharts || hasError;
        const selectedChart = charts?.find(chart => chart.reportId === selectedReportId);
        const showChartModal = queryInfo !== undefined && selectedChart !== undefined;
        const _hideEmptyChartMenu = getQueryMetadata().get('hideEmptyChartMenu', hideEmptyChartMenu);

        if (privateCharts.length === 0 && publicCharts.length === 0 && _hideEmptyChartMenu) {
            return null;
        }

        return (
            <div className="chart-menu">
                <DropdownButton
                    id={`chart-menu-${id}`}
                    className="chart-menu-button"
                    disabled={disabled}
                    pullRight
                    title={
                        isLoadingCharts ? (
                            <span className="fa fa-spinner fa-pulse" />
                        ) : (
                            <span className="fa fa-area-chart" />
                        )
                    }
                >
                    {chartsError !== undefined && <MenuItem>{chartsError}</MenuItem>}

                    {privateCharts.length > 0 && <MenuItem header>My Saved Charts</MenuItem>}

                    {privateCharts.length > 0 && privateCharts.map(this.chartMapper)}

                    {privateCharts.length > 0 && publicCharts.length > 0 && <MenuItem divider />}

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
