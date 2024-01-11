import React, { FC, PureComponent, ReactNode, SyntheticEvent, useCallback } from 'react';
import { DropdownButton, MenuItem, SelectCallback } from 'react-bootstrap';

import { DataViewInfo } from '../../internal/DataViewInfo';
import { cancelEvent } from '../../internal/events';

import { blurActiveElement } from '../../internal/util/utils';

import { getQueryMetadata } from '../../internal/global';

import { RequiresModelAndActions } from './withQueryModels';

interface ChartMenuItemProps {
    chart: DataViewInfo;
    showChart: (chart: DataViewInfo) => void;
}

export const ChartMenuItem: FC<ChartMenuItemProps> = ({ chart, showChart }) => {
    const onSelect = useCallback(
        (_: never, event: SyntheticEvent) => {
            cancelEvent(event);
            showChart(chart);
        },
        [showChart, chart]
    ) as SelectCallback;

    return (
        <MenuItem onSelect={onSelect}>
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
                    id={`chart-menu-${id}`}
                    className="chart-menu-button"
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

                    {privateCharts.length > 0 && <MenuItem header>Your Saved Charts</MenuItem>}

                    {privateCharts.length > 0 && privateCharts.map(this.chartMapper)}

                    {privateCharts.length > 0 && publicCharts.length > 0 && <MenuItem divider />}

                    {publicCharts.length > 0 && <MenuItem header>All Saved Charts</MenuItem>}

                    {publicCharts.length > 0 && publicCharts.map(this.chartMapper)}
                </DropdownButton>
            </div>
        );
    }
}
