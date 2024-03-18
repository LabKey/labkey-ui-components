import React, { FC, useCallback, useEffect } from 'react';

import { DataViewInfo } from '../../internal/DataViewInfo';

import { blurActiveElement } from '../../internal/util/utils';

import { DropdownButton, MenuDivider, MenuHeader, MenuItem } from '../../internal/dropdowns';

import { useServerContext } from '../../internal/components/base/ServerContext';

import { isChartBuilderEnabled } from '../../internal/app/utils';

import { RequiresModelAndActions } from './withQueryModels';
import { ChartBuilderMenuItem } from '../../internal/components/chart/ChartBuilderMenuItem';

interface ChartMenuItemProps {
    chart: DataViewInfo;
    showChart: (chart: DataViewInfo) => void;
}

export const ChartMenuItem: FC<ChartMenuItemProps> = ({ chart, showChart }) => {
    const onClick = useCallback(() => showChart(chart), [showChart, chart]);
    const useSVG = chart.icon?.indexOf('_icon.svg') > -1;

    return (
        <MenuItem onClick={onClick}>
            {useSVG && <img src={chart.icon} width={16} alt={chart.icon} />}
            {!useSVG && <i className={`chart-menu-icon ${chart.iconCls ?? ''}`} />}
            <span className="chart-menu-label">{chart.name}</span>
        </MenuItem>
    );
};

export const ChartMenu: FC<RequiresModelAndActions> = props => {
    const { model, actions } = props;
    const { moduleContext } = useServerContext();
    const { charts, chartsError, hasCharts, id, isLoading, isLoadingCharts, rowsError, queryInfoError } = model;
    const privateCharts = hasCharts ? charts.filter(chart => !chart.shared) : [];
    const publicCharts = hasCharts ? charts.filter(chart => chart.shared) : [];
    const showCreateChart = isChartBuilderEnabled(moduleContext);
    const noCharts = hasCharts && charts.length === 0;
    const showCreateChartDivider = showCreateChart && !noCharts;
    const hasError = queryInfoError !== undefined || rowsError !== undefined;
    const disabled = isLoading || isLoadingCharts || hasError || (noCharts && !showCreateChart);

    useEffect(
        () => {
            actions.loadCharts(model.id);
        },
        [
            /* on mount */
        ]
    );

    const chartClicked = useCallback(
        (chart: DataViewInfo): void => {
            blurActiveElement();
            actions.selectReport(model.id, chart.reportId);
        },
        [actions, model]
    );

    if (noCharts && !showCreateChart) {
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

                {showCreateChart && <ChartBuilderMenuItem actions={actions} model={model} />}

                {showCreateChartDivider && <MenuDivider />}

                {privateCharts.length > 0 && <MenuHeader text="Your Charts" />}

                {privateCharts.length > 0 &&
                    privateCharts.map(chart => (
                        <ChartMenuItem key={chart.reportId} chart={chart} showChart={chartClicked} />
                    ))}

                {privateCharts.length > 0 && publicCharts.length > 0 && <MenuDivider />}

                {publicCharts.length > 0 && <MenuHeader text="Shared Charts" />}

                {publicCharts.length > 0 &&
                    publicCharts.map(chart => (
                        <ChartMenuItem key={chart.reportId} chart={chart} showChart={chartClicked} />
                    ))}
            </DropdownButton>
        </div>
    );
};
