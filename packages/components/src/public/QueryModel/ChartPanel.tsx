import React, { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Chart } from '../../internal/components/chart/Chart';

import { GENERIC_CHART_REPORTS, LABKEY_VIS } from '../../internal/constants';
import { ChartAPIWrapper, DEFAULT_API_WRAPPER } from '../../internal/components/chart/api';
import { GenericChartModel } from '../../internal/components/chart/models';
import { ChartBuilderModal } from '../../internal/components/chart/ChartBuilderModal';
import { useNotificationsContext } from '../../internal/components/notifications/NotificationsContext';

import { isChartBuilderEnabled } from '../../internal/app/utils';
import { useServerContext } from '../../internal/components/base/ServerContext';

import { DropdownButton, MenuHeader, MenuItem } from '../../internal/dropdowns';

import { RequiresModelAndActions } from './withQueryModels';

interface Props extends RequiresModelAndActions {
    api?: ChartAPIWrapper;
    reportId: string; // Maybe pass the chart
}

export const ChartPanel: FC<Props> = memo(({ actions, api = DEFAULT_API_WRAPPER, model, reportId }) => {
    const { charts, containerPath, id } = model;
    const [savedChartModel, setSavedChartModel] = useState<GenericChartModel>(undefined);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const { moduleContext } = useServerContext();
    const divRef = useRef(undefined);

    // useNotificationsContext will not always be available depending on if the app wraps the NotificationsContext.Provider
    let _createNotification;
    try {
        // ESLint incorrectly complains that useNotificationsContext is called conditionally. It's always called, even
        // though it's in a try/catch.
        // eslint-disable-next-line react-hooks/rules-of-hooks
        _createNotification = useNotificationsContext().createNotification;
    } catch {
        // this is expected for LKS usages, so don't throw or console.error
    }

    const chart = useMemo(() => charts?.find(chart => chart.reportId === reportId), [charts, reportId]);

    useEffect(() => {
        (async () => {
            setSavedChartModel(undefined);
            // only allowing edit of generic charts in the apps at this time
            if (chart && GENERIC_CHART_REPORTS.indexOf(chart.type) > -1) {
                try {
                    const savedChartModel_ = await api.fetchGenericChart(chart.reportId);
                    setSavedChartModel(savedChartModel_);
                } catch (e) {
                    // no-op as we are only using this to determine if we can edit the chart
                }
            }
        })();
    }, [api, chart]);

    const clearChart = useCallback(() => actions.selectReport(id, reportId, false), [actions, id, reportId]);

    const onShowEditChart = useCallback(() => {
        setShowEditModal(true);
    }, []);

    const onExportChart = useCallback(
        (type: string) => {
            const svg = divRef.current.querySelector('.chart-panel svg');
            if (svg) {
                LABKEY_VIS.SVGConverter.convert(svg, type, chart.name);
            }
        },
        [chart]
    );

    const onExportChartPDF = useCallback(() => {
        onExportChart(LABKEY_VIS.SVGConverter.FORMAT_PDF);
    }, [onExportChart]);

    const onExportChartPNG = useCallback(() => {
        onExportChart(LABKEY_VIS.SVGConverter.FORMAT_PNG);
    }, [onExportChart]);

    const onHideEditChart = useCallback(
        (successMsg?: string) => {
            setShowEditModal(false);
            if (successMsg) {
                _createNotification?.({ message: successMsg, alertClass: 'success' });
            }
        },
        [_createNotification]
    );

    if (chart === undefined) return null;

    return (
        <div className="chart-panel" ref={divRef}>
            <div className="chart-panel__heading">
                <div className="chart-panel__heading-title">
                    {chart.name}

                    {savedChartModel?.canEdit && isChartBuilderEnabled(moduleContext) && (
                        <span className="margin-left">
                            <button
                                className="btn btn-default"
                                onClick={onShowEditChart}
                                title="Edit chart"
                                type="button"
                            >
                                <span className="fa fa-pencil" />
                            </button>
                        </span>
                    )}
                    <span className="margin-left">
                        <DropdownButton
                            buttonClassName="chart-panel-export-btn"
                            noCaret
                            title={<i className="fa fa-download" />}
                        >
                            <MenuHeader text="Export Chart" />
                            <MenuItem onClick={onExportChartPDF}>
                                <i className="fa fa-file-pdf-o" />
                                &nbsp; PDF
                            </MenuItem>
                            <MenuItem onClick={onExportChartPNG}>
                                <i className="fa fa-file-image-o" />
                                &nbsp; PNG
                            </MenuItem>
                        </DropdownButton>
                    </span>
                </div>

                <div className="chart-panel__hide-icon">
                    <button className="btn btn-default" onClick={clearChart} title="Hide chart" type="button">
                        <span className="fa fa-close" /> Close
                    </button>
                </div>
            </div>

            {/* Note: we use chart.modified as the key here so the chart reloads when the user edits the chart */}
            <Chart
                api={api}
                chart={chart}
                container={containerPath}
                filters={model.filters}
                key={chart.modified.toString()}
                queryParameters={model.queryParameters}
            />

            {showEditModal && (
                <ChartBuilderModal
                    actions={actions}
                    model={model}
                    onHide={onHideEditChart}
                    savedChartModel={savedChartModel}
                />
            )}
        </div>
    );
});
ChartPanel.displayName = 'ChartPanel';

export const ChartList: FC<RequiresModelAndActions> = memo(({ actions, model }) => {
    const { queryInfo, selectedReportIds } = model;

    // If we don't have a queryInfo we can't get filters off the model, so we can't render any charts
    if (queryInfo === undefined || selectedReportIds.length === 0) return null;

    return (
        <div className="chart-list">
            {model.selectedReportIds.map(reportId => (
                <ChartPanel actions={actions} key={reportId} model={model} reportId={reportId} />
            ))}
        </div>
    );
});
ChartList.displayName = 'ChartList';
