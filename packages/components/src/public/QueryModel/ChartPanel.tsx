import React, {FC, memo, useCallback, useEffect, useMemo, useState} from 'react';

import { Chart } from '../../internal/components/chart/Chart';

import { RequiresModelAndActions } from './withQueryModels';
import {GENERIC_CHART_REPORTS} from "../../internal/constants";
import {ChartAPIWrapper, DEFAULT_API_WRAPPER} from "../../internal/components/chart/api";
import {GenericChartModel} from "../../internal/components/chart/models";
import {ChartBuilderModal} from "../../internal/components/chart/ChartBuilderModal";
import {useNotificationsContext} from "../../internal/components/notifications/NotificationsContext";

interface Props extends RequiresModelAndActions {
    api?: ChartAPIWrapper;
}

export const ChartPanel: FC<Props> = memo(({ actions, model, api = DEFAULT_API_WRAPPER }) => {
    const { charts, containerPath, id, queryInfo, selectedReportId } = model;
    const [savedChartModel, setSavedChartModel] = useState<GenericChartModel>(undefined);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const { createNotification } = useNotificationsContext();

    const selectedChart = useMemo(
        () => charts?.find(chart => chart.reportId === selectedReportId),
        [selectedReportId, charts]
    );

    useEffect(() => {
        (async () => {
            setSavedChartModel(undefined);
            // only allowing edit of generic charts in the apps at this time
            if (selectedChart && GENERIC_CHART_REPORTS.indexOf(selectedChart.type)> -1) {
                try {
                    const savedChartModel_ = await api.fetchGenericChart(selectedChart.reportId);
                    setSavedChartModel(savedChartModel_);
                } catch (e) {
                    // no-op as we are only using this to determine if we can edit the chart
                }
            }
        })();
    }, [api, selectedChart]);

    const clearChart = useCallback(() => actions.selectReport(id, undefined), [actions, id]);

    const onShowEditChart = useCallback(() => {
        setShowEditModal(true);
    }, []);

    const onHideEditChart = useCallback((successMsg?: string) => {
        setShowEditModal(false);
        if (successMsg) {
            createNotification({ message: successMsg, alertClass: 'success' });
        }
    }, []);

    // If we don't have a queryInfo we can't get filters off the model, so we can't render the chart
    const showChart = queryInfo !== undefined && selectedChart !== undefined;

    if (!showChart) return null;

    return (
        <div className="chart-panel">
            <div className="chart-panel__heading">
                <div className="chart-panel__heading-title">
                    {selectedChart.name}
                    {savedChartModel?.canEdit && (
                        <span className="margin-left">
                            <button type="button" title="Edit chart" className="btn btn-default" onClick={onShowEditChart}>
                                <span className="fa fa-pencil"/>
                            </button>
                        </span>
                    )}
                </div>

                <div className="chart-panel__hide-icon">
                    <button type="button" title="Hide chart" className="btn btn-default" onClick={clearChart}>
                        <span className="fa fa-close" /> Close
                    </button>
                </div>
            </div>

            <Chart api={api} chart={selectedChart} container={containerPath} filters={model.filters} />

            {showEditModal && (
                <ChartBuilderModal actions={actions} model={model} onHide={onHideEditChart} savedChartModel={savedChartModel} />
            )}
        </div>
    );
});
