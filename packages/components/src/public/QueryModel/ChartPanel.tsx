import React, { FC, memo, useCallback, useMemo } from 'react';

import { Chart } from '../../internal/components/chart/Chart';

import { RequiresModelAndActions } from './withQueryModels';

export const ChartPanel: FC<RequiresModelAndActions> = memo(({ actions, model }) => {
    const { charts, containerPath, id, queryInfo, selectedReportId } = model;
    const selectedChart = useMemo(
        () => charts?.find(chart => chart.reportId === selectedReportId),
        [selectedReportId, charts]
    );
    const clearChart = useCallback(() => actions.selectReport(id, undefined), [actions, id]);
    // If we don't have a queryInfo we can't get filters off the model, so we can't render the chart
    const showChart = queryInfo !== undefined && selectedChart !== undefined;

    if (!showChart) return null;

    return (
        <div className="chart-panel">
            <div className="chart-panel__heading">
                <div className="chart-panel__heading-title">{selectedChart.name}</div>

                <div className="chart-panel__hide-icon">
                    <button type="button" title="hide chart" className="btn btn-default" onClick={clearChart}>
                        <span className="fa fa-close" /> Close
                    </button>
                </div>
            </div>

            <Chart chart={selectedChart} container={containerPath} filters={model.filters} />
        </div>
    );
});
