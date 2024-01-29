import React, { FC, PureComponent, ReactNode, useCallback } from 'react';

import { DataViewInfo } from '../../internal/DataViewInfo';

import { blurActiveElement } from '../../internal/util/utils';

import { getQueryMetadata } from '../../internal/global';

import { RequiresModelAndActions } from './withQueryModels';
import { DropdownButton, MenuDivider, MenuHeader, MenuItem } from '../../internal/dropdowns';

interface ChartMenuItemProps {
    chart: DataViewInfo;
    showChart: (chart: DataViewInfo) => void;
}

export const ChartMenuItem: FC<ChartMenuItemProps> = ({ chart, showChart }) => {
    const onClick = useCallback(() => showChart(chart), [showChart, chart]);

    return (
        <MenuItem onClick={onClick}>
            <i className={`chart-menu-icon ${chart.iconCls ?? ''}`} />
            <span className="chart-menu-label">{chart.name}</span>
        </MenuItem>
    );
};

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

    chartMapper = (chart): ReactNode => (
        <ChartMenuItem key={chart.reportId} chart={chart} showChart={this.chartClicked} />
    );

    render(): ReactNode {
        const { hideEmptyChartMenu, model } = this.props;
        const { charts, chartsError, hasCharts, id, isLoading, isLoadingCharts, rowsError, queryInfoError } = model;
        const privateCharts = hasCharts ? charts.filter(chart => !chart.shared) : [];
        const publicCharts = hasCharts ? charts.filter(chart => chart.shared) : [];
        const noCharts = hasCharts && charts.length === 0;
        const hasError = queryInfoError !== undefined || rowsError !== undefined;
        const disabled = isLoading || isLoadingCharts || noCharts || hasError;
        const _hideEmptyChartMenu = getQueryMetadata().get('hideEmptyChartMenu', hideEmptyChartMenu);

        if (privateCharts.length === 0 && publicCharts.length === 0 && _hideEmptyChartMenu) {
            return null;
        }

        return (
            <div className="chart-menu">
                <DropdownButton
                    buttonClassName="chart-menu-button"
                    disabled={disabled}
                    pullRight
                    title={
                        isLoadingCharts ? (
                            <span className="fa fa-spinner fa-pulse" />
                        ) : (
                            <span>
                                <span className="fa fa-area-chart" />
                                <span> Charts</span>
                            </span>
                        )
                    }
                >
                    {chartsError !== undefined && <MenuItem>{chartsError}</MenuItem>}

                    {privateCharts.length > 0 && <MenuHeader text="Your Saved Charts" />}

                    {privateCharts.length > 0 && privateCharts.map(this.chartMapper)}

                    {privateCharts.length > 0 && publicCharts.length > 0 && <MenuDivider />}

                    {publicCharts.length > 0 && <MenuHeader text="All Saved Charts" />}

                    {publicCharts.length > 0 && publicCharts.map(this.chartMapper)}
                </DropdownButton>
            </div>
        );
    }
}
