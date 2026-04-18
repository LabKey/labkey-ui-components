/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, useEffect, useMemo } from 'react';
import { PermissionTypes } from '@labkey/api';
import classNames from 'classnames';

import { DataViewInfo } from '../../internal/DataViewInfo';

import { DropdownButton, MenuDivider, MenuHeader, MenuItem } from '../../internal/dropdowns';

import { useServerContext } from '../../internal/components/base/ServerContext';

import { isChartBuilderEnabled } from '../../internal/app/utils';

import { ChartBuilderMenuItem } from '../../internal/components/chart/ChartBuilderMenuItem';
import { hasPermissions } from '../../internal/components/base/models/User';

import { RequiresModelAndActions } from './QueryModel';
import { DisableableMenuItem } from '../../internal/components/samples/DisableableMenuItem';

const MAX_CHARTS = 5;
const DISABLED_MESSAGE = `Only ${MAX_CHARTS} charts can be shown at once.`;

interface ChartMenuItemProps {
    chart: DataViewInfo;
    selectChart: (reportId: string, selected: boolean) => void;
    selectedReportIds: string[];
}

export const ChartMenuItem: FC<ChartMenuItemProps> = ({ chart, selectChart, selectedReportIds }) => {
    const { reportId } = chart;
    const selected = useMemo(() => selectedReportIds.includes(reportId), [reportId, selectedReportIds]);
    const onClick = useCallback(() => selectChart(reportId, !selected), [reportId, selectChart, selected]);
    const useSVG = chart.icon?.indexOf('.svg') > -1;
    const className = classNames('chart-menu-checkbox', 'fa', {
        'fa-check-square': selected,
        'fa-square-o': !selected,
    });
    const disabled = !selected && selectedReportIds.length >= MAX_CHARTS;

    return (
        <DisableableMenuItem disabled={disabled} disabledMessage={DISABLED_MESSAGE} onClick={onClick}>
            <span className={className} />
            {useSVG && <img alt={chart.icon} src={chart.icon} width={16} />}
            {!useSVG && <i className={`chart-menu-icon ${chart.iconCls ?? ''}`} />}
            <span className="chart-menu-label">{chart.name}</span>
        </DisableableMenuItem>
    );
};
ChartMenuItem.displayName = 'ChartMenuItem';

interface ChartMenuTitleProps {
    isLoading: boolean;
}
export const ChartMenuTitle: FC<ChartMenuTitleProps> = memo(({ isLoading }) => {
    if (isLoading) return <span className="fa fa-spinner fa-pulse" />;
    return (
        <span>
            <span className="fa fa-area-chart" />
            <span> Charts</span>
        </span>
    );
});
ChartMenuTitle.displayName = 'ChartMenuTitle';

export const ChartMenu: FC<RequiresModelAndActions> = memo(({ actions, model }) => {
    const { moduleContext, user } = useServerContext();
    const { charts, chartsError, hasCharts, isLoading, isLoadingCharts, rowsError, selectedReportIds, queryInfoError } =
        model;
    const viewCharts = charts?.filter(chart => chart.viewName === model.schemaQuery.viewName) ?? []; // filter chart menu based on selected view
    const privateCharts = hasCharts ? viewCharts.filter(chart => !chart.shared) : [];
    const publicCharts = hasCharts ? viewCharts.filter(chart => chart.shared) : [];
    const showCreateChart =
        isChartBuilderEnabled(moduleContext) && hasPermissions(user, [PermissionTypes.Read]) && !user.isGuest;
    const noCharts = hasCharts && viewCharts.length === 0;
    const showCreateChartDivider = showCreateChart && !noCharts;
    const hasError = queryInfoError !== undefined || rowsError !== undefined;
    const disabled = isLoading || isLoadingCharts || hasError || (noCharts && !showCreateChart);

    useEffect(() => {
        actions.loadCharts(model.id);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only desired on mount

    const selectChart = useCallback(
        (reportId: string, selected: boolean): void => {
            actions.selectReport(model.id, reportId, selected);
        },
        [actions, model]
    );

    if (noCharts && !showCreateChart) return null;

    return (
        <div className="chart-menu">
            <DropdownButton
                buttonClassName="chart-menu-button"
                disabled={disabled}
                pullRight
                title={<ChartMenuTitle isLoading={isLoadingCharts} />}
            >
                {chartsError !== undefined && <MenuItem>{chartsError}</MenuItem>}

                {showCreateChart && (
                    <ChartBuilderMenuItem
                        actions={actions}
                        disabledMessage={DISABLED_MESSAGE}
                        maxCharts={MAX_CHARTS}
                        model={model}
                        selectedReportIds={selectedReportIds}
                    />
                )}

                {showCreateChartDivider && <MenuDivider />}

                {privateCharts.length > 0 && <MenuHeader text="Your Charts" />}

                {privateCharts.length > 0 &&
                    privateCharts.map(chart => (
                        <ChartMenuItem
                            chart={chart}
                            key={chart.reportId}
                            selectChart={selectChart}
                            selectedReportIds={selectedReportIds}
                        />
                    ))}

                {privateCharts.length > 0 && publicCharts.length > 0 && <MenuDivider />}

                {publicCharts.length > 0 && <MenuHeader text="Shared Charts" />}

                {publicCharts.length > 0 &&
                    publicCharts.map(chart => (
                        <ChartMenuItem
                            chart={chart}
                            key={chart.reportId}
                            selectChart={selectChart}
                            selectedReportIds={selectedReportIds}
                        />
                    ))}
            </DropdownButton>
        </div>
    );
});
ChartMenu.displayName = 'ChartMenu';
