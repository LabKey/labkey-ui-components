import React, { ChangeEvent, FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VegaEmbed } from 'react-vega';
import { PermissionTypes } from '@labkey/api';

import { generateId } from '../../util/utils';
import { LABKEY_VIS } from '../../constants';
import { Modal } from '../../Modal';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { flattenValuesFromRow, QueryModel } from '../../../public/QueryModel/QueryModel';
import { RequiresModelAndActions } from '../../../public/QueryModel/withQueryModels';

import { useServerContext } from '../base/ServerContext';
import { hasPermissions } from '../base/models/User';

import { FormButtons } from '../../FormButtons';

import { getContainerFilterForFolder } from '../../query/api';

import { isAppHomeFolder } from '../../app/utils';
import { deleteChart, saveChart, SaveReportConfig, sendChartAgentPrompt } from './actions';
import { BLUE_HEX_COLOR, HIDDEN_CHART_TYPES, MAX_POINT_DISPLAY, MAX_ROWS_PREVIEW } from './constants';

import { BaseChartModel, ChartConfig, ChartQueryConfig, ChartTypeInfo, GenericChartModel } from './models';
import { deepCopyChartConfig } from './utils';
import { VegaLiteChart } from './VegaLiteChart';

const SIMPLE_VEGA_LITE_BAR_SPEC = {
    $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
    description: 'A simple bar chart with embedded data.',
    data: {
        values: [
            { a: 'A', b: 28 },
            { a: 'B', b: 55 },
            { a: 'C', b: 43 },
            { a: 'D', b: 91 },
            { a: 'E', b: 81 },
            { a: 'F', b: 53 },
            { a: 'G', b: 19 },
            { a: 'H', b: 87 },
            { a: 'I', b: 52 },
        ],
    },
    mark: 'bar',
    encoding: {
        x: { field: 'a', type: 'nominal', axis: { labelAngle: 0 } },
        y: { field: 'b', type: 'quantitative' },
    },
};

const INIT_AGENT_PROMPT =
    'Please do not create any chart configs yet. I will prompt you when I am ready.\n' +
    'When you respond please be sure to include the spec object in a code tag (with class = "language-json") so that I can find it and parse it from the response. Only include that code block, nothing else in the successful response case.\n' +
    'I will provide the data object before I render the chart on my end. So when you generate temp data for your spec, you can fake it using the fieldKeys and types in the QueryInfo object I will provide, but make sure to use the same fieldKey names and data types in your generated spec as the ones in the QueryInfo object.\n' +
    'The chart will be created for a specific dataset with the information (provided as a LabKey QueryInfo object) provided below. Please do not query for other containers, schemas or tables in the LabKey database. \n' +
    'This request should only create charts based on the columns available in THIS dataset: ';

export const getChartRenderMsg = (chartConfig: ChartConfig, rowCount: number, isPreview: boolean): string => {
    const msg = [];
    if (isPreview && rowCount === MAX_ROWS_PREVIEW) {
        msg.push(`The preview is being limited to ${MAX_ROWS_PREVIEW.toLocaleString()} rows.`);
    }
    if (chartConfig.renderType === 'line_plot' && rowCount > (chartConfig.geomOptions.binThreshold as number)) {
        msg.push(`The number of individual points exceeds ${MAX_POINT_DISPLAY.toLocaleString()}.`);
        msg.push('Data points will not be shown on this line plot.');
    } else if (chartConfig.renderType === 'scatter_plot' && rowCount > MAX_POINT_DISPLAY) {
        msg.push(`The number of individual points exceeds ${MAX_POINT_DISPLAY.toLocaleString()}.`);
        msg.push('The data is now grouped by density.');
    }
    return msg.length === 0 ? undefined : msg.join(' ');
};

export const getChartBuilderQueryConfig = (
    model: QueryModel,
    chartConfig: ChartConfig,
    savedConfig: ChartQueryConfig
): ChartQueryConfig => {
    const { schemaQuery, containerPath } = model;
    const { schemaName, queryName, viewName } = schemaQuery;

    const columns = Object.values(chartConfig.measures)
        .map(measure => measure?.fieldKey) // Issue 52050: use fieldKey for special characters
        .filter(fk => fk !== undefined);

    if (chartConfig.geomOptions.trendlineParameters) columns.push(chartConfig.geomOptions.trendlineParameters);

    return {
        maxRows: -1, // this will be saved with the queryConfig, but we will override it for the preview in the modal
        requiredVersion: '17.1', // Issue 47898: include formattedValue in response row objects
        schemaName: savedConfig?.schemaName || schemaName,
        queryName: savedConfig?.queryName || queryName,
        viewName: savedConfig?.viewName || viewName,
        columns,
        sort: LABKEY_VIS.GenericChartHelper.getQueryConfigSortKey(chartConfig.measures),
        filterArray: savedConfig?.filterArray ?? [],
        containerPath: savedConfig?.containerPath || containerPath,
    } as ChartQueryConfig;
};

interface ChartPreviewProps {
    chartConfig: ChartConfig;
    hasRequiredValues: boolean;
    model: QueryModel;
    savedChartModel: GenericChartModel;
    selectedType: ChartTypeInfo;
    setReportConfig: (config: SaveReportConfig) => void;
}

const ChartPreview: FC<ChartPreviewProps> = memo(props => {
    const { chartConfig, hasRequiredValues, model, selectedType, savedChartModel, setReportConfig } = props;
    const divId = useMemo(() => generateId('chart-'), []);
    const ref = useRef<HTMLDivElement>(undefined);
    const containerFilter = useMemo(() => getContainerFilterForFolder(model.containerPath), [model.containerPath]);
    const [loadingData, setLoadingData] = useState<boolean>(false);
    const [previewMsg, setPreviewMsg] = useState<string>();

    useEffect(() => {
        if (ref?.current) ref.current.innerHTML = '';
        setPreviewMsg(undefined);

        if (!hasRequiredValues) return;

        const queryConfig = getChartBuilderQueryConfig(
            model,
            chartConfig,
            savedChartModel?.visualizationConfig?.queryConfig
        );

        setReportConfig({
            schemaName: queryConfig.schemaName,
            queryName: queryConfig.queryName,
            viewName: queryConfig.viewName,
            renderType: chartConfig.renderType,
            jsonData: {
                chartConfig,
                queryConfig: {
                    ...queryConfig,
                    filterArray: queryConfig.filterArray.map(f => ({
                        name: f['name'] ?? f.getColumnName(),
                        value: f['value'] ?? f.getValue(),
                        type: f['type'] ?? f.getFilterType().getURLSuffix(),
                    })),
                },
            },
        });

        // add model filters, parameters, and containerFilter plus maxRows to the queryConfig for the preview, but not to save with the chart
        const queryConfig_ = {
            ...queryConfig,
            containerFilter,
            filterArray: [...model.loadRowsFilters(true)],
            parameters: model.queryParameters,
            maxRows: MAX_ROWS_PREVIEW,
        };

        setLoadingData(true);

        LABKEY_VIS.GenericChartHelper.queryChartData(
            divId,
            queryConfig_,
            chartConfig,
            (measureStore, trendlineData) => {
                const rowCount = LABKEY_VIS.GenericChartHelper.getMeasureStoreRecords(measureStore).length;
                const _previewMsg = getChartRenderMsg(chartConfig, rowCount, true);

                if (rowCount > MAX_POINT_DISPLAY) {
                    if (chartConfig.renderType === 'box_plot') {
                        chartConfig.pointType = 'outliers';
                        chartConfig.geomOptions.boxFillColor = BLUE_HEX_COLOR;
                    } else if (chartConfig.renderType === 'line_plot') {
                        chartConfig.geomOptions.hideDataPoints = true;
                    }
                }

                const width = chartConfig.width ?? (ref?.current?.getBoundingClientRect().width - 15 || 750);
                const height = chartConfig.height ?? 500;
                const chartConfig_ = { ...chartConfig, height, width };

                if (ref.current) ref.current.innerHTML = ''; // clear again, right before render
                LABKEY_VIS.GenericChartHelper.generateChartSVG(divId, chartConfig_, measureStore, trendlineData);

                setPreviewMsg(_previewMsg);
                setLoadingData(false);
            }
        );
    }, [divId, model, hasRequiredValues, selectedType, savedChartModel, containerFilter, setReportConfig, chartConfig]);

    return (
        <div className="chart-builder-modal__chart-preview">
            <h4>Preview</h4>
            {previewMsg && <span className="chart-builder-preview-msg gray-text pull-right">{previewMsg}</span>}
            {!hasRequiredValues && <div className="gray-text">Select required fields to preview the chart.</div>}
            {hasRequiredValues && (
                <div className="chart-builder-preview-body">
                    {loadingData && (
                        <div className="chart-loading-mask">
                            <div className="chart-loading-mask__background" />
                            <LoadingSpinner msg="Loading Preview..." wrapperClassName="loading-spinner" />
                        </div>
                    )}
                    <div className="svg-chart__chart" id={divId} ref={ref} />
                </div>
            )}
        </div>
    );
});
ChartPreview.displayName = 'ChartPreview';

interface ChartBuilderFooterProps {
    afterDelete: () => void;
    disabled: boolean;
    onCancel: () => void;
    onSaveChart: () => void;
    savedChartModel: GenericChartModel;
    saving: boolean;
    setError: (error: string) => void;
}

const ChartBuilderFooter: FC<ChartBuilderFooterProps> = memo(props => {
    const { savedChartModel, onSaveChart, onCancel, setError, afterDelete, saving, disabled } = props;
    const [deleting, setDeleting] = useState<boolean>(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);

    const onCancel_ = useCallback(() => {
        onCancel();
    }, [onCancel]);

    const onDeleteChart = useCallback(() => {
        setShowConfirmDelete(true);
    }, []);

    const onCancelDelete = useCallback(() => {
        setShowConfirmDelete(false);
        setError(undefined);
    }, [setError]);

    const onConfirmDelete = useCallback(async () => {
        setDeleting(true);
        setError(undefined);
        try {
            await deleteChart(savedChartModel.id);
            setDeleting(false);
            afterDelete();
        } catch (e) {
            setError(e.exception ?? e);
            setDeleting(false);
        }
    }, [savedChartModel, setError, afterDelete]);

    if (showConfirmDelete) {
        return (
            <div className="form-buttons">
                <div className="form-buttons__left" />
                <div className="form-buttons__right">
                    Are you sure you want to permanently delete this chart?
                    <button className="btn btn-default" disabled={deleting} onClick={onCancelDelete} type="button">
                        Cancel
                    </button>
                    <button className="btn btn-danger" disabled={deleting} onClick={onConfirmDelete} type="button">
                        {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <FormButtons sticky={false}>
            <button className="btn btn-default" onClick={onCancel_} type="button">
                Cancel
            </button>
            {savedChartModel?.canDelete && (
                <button className="btn btn-danger" onClick={onDeleteChart} type="button">
                    Delete Chart
                </button>
            )}
            <button className="btn btn-success" disabled={saving || disabled} onClick={onSaveChart} type="button">
                {saving
                    ? savedChartModel
                        ? 'Saving Chart...'
                        : 'Creating Chart...'
                    : savedChartModel
                      ? 'Save Chart'
                      : 'Create Chart'}
            </button>
        </FormButtons>
    );
});
ChartBuilderFooter.displayName = 'ChartBuilderFooter';

interface ChartBuilderModalProps extends RequiresModelAndActions {
    onHide: (successMsg?: string) => void;
    savedChartModel?: GenericChartModel;
}

export const ChartBuilderModal: FC<ChartBuilderModalProps> = memo(({ actions, model, onHide, savedChartModel }) => {
    const CHART_TYPES = useMemo(() => LABKEY_VIS?.GenericChartHelper.getRenderTypes(), []);
    const { user, container, moduleContext } = useServerContext();
    const canShare = useMemo(
        () => savedChartModel?.canShare ?? hasPermissions(user, [PermissionTypes.ShareReportPermission]),
        [savedChartModel, user]
    );
    const allowInherit = useMemo(
        // only allow inheritable charts in app home folder for apps, see chartWizard.jsp for LKS behavior
        () => isAppHomeFolder(container, moduleContext) && user.isAdmin,
        [user, container, moduleContext]
    );
    const chartTypes: ChartTypeInfo[] = useMemo(
        () => CHART_TYPES.filter(type => !type.hidden && !HIDDEN_CHART_TYPES.includes(type.name)),
        [CHART_TYPES]
    );
    const [chartModel, setChartModel] = useState<BaseChartModel>(() => ({
        inheritable: savedChartModel?.inheritable ?? false,
        name: savedChartModel?.name ?? '',
        shared: savedChartModel?.shared ?? true,
    }));
    const [chartConfig, setChartConfig] = useState(() =>
        deepCopyChartConfig(savedChartModel?.visualizationConfig?.chartConfig)
    );
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string>();
    const [reportConfig, setReportConfig] = useState<SaveReportConfig>();
    const selectedType = useMemo(
        () => chartTypes.find(c => chartConfig.renderType === c.name),
        [chartConfig.renderType, chartTypes]
    );

    const hasName = useMemo(() => chartModel.name?.trim().length > 0, [chartModel.name]);
    const hasRequiredValues = useMemo(() => {
        return selectedType.fields.find(field => field.required && !chartConfig.measures[field.name]) === undefined;
    }, [selectedType.fields, chartConfig.measures]);

    const onSaveChart = useCallback(async () => {
        const _reportConfig = {
            ...reportConfig,
            reportId: savedChartModel?.reportId,
            name: chartModel.name.trim(),
            public: chartModel.shared,
            inheritable: chartModel.inheritable,
        } as SaveReportConfig;

        setSaving(true);
        setError(undefined);
        try {
            const response = await saveChart(_reportConfig);
            setSaving(false);
            onHide(`Successfully ${savedChartModel ? 'updated' : 'created'} chart: ${_reportConfig.name}.`);
            actions.loadCharts(model.id);
            actions.selectReport(model.id, response.reportId, true);
        } catch (e) {
            setError(e.exception ?? e);
            setSaving(false);
        }
    }, [actions, chartModel, model.id, onHide, reportConfig, savedChartModel]);

    const afterDelete = useCallback(async () => {
        onHide('Successfully deleted chart: ' + savedChartModel.name + '.');
        actions.selectReport(model.id, savedChartModel.reportId, false);
        actions.loadCharts(model.id);
    }, [actions, model.id, onHide, savedChartModel]);

    const onCancel = useCallback(() => {
        onHide();
    }, [onHide]);

    const footer = (
        <ChartBuilderFooter
            afterDelete={afterDelete}
            disabled={!hasName || !hasRequiredValues || !reportConfig}
            onCancel={onCancel}
            onSaveChart={onSaveChart}
            savedChartModel={savedChartModel}
            saving={saving}
            setError={setError}
        />
    );

    const containerFilter = useMemo(() => getContainerFilterForFolder(model.containerPath), [model.containerPath]);
    const [dataRecords, setDataRecords] = useState<Record<string, any>[]>([]);
    useEffect(() => {
        // add model filters, parameters, and containerFilter plus maxRows to the queryConfig for the preview, but not to save with the chart
        const queryConfig_ = {
            ...getChartBuilderQueryConfig(model, chartConfig, undefined),
            containerFilter,
            filterArray: [...model.loadRowsFilters(true)],
            parameters: model.queryParameters,
            maxRows: MAX_ROWS_PREVIEW,
        };

        LABKEY_VIS.GenericChartHelper.queryChartData(
            undefined,
            queryConfig_,
            chartConfig,
            (measureStore, trendlineData) => {
                const records = LABKEY_VIS.GenericChartHelper.getMeasureStoreRecords(measureStore);
                const cols = Object.keys(measureStore.getColumnMap());
                const records_ = records.map(r => {
                    return flattenValuesFromRow(r, cols, undefined, true);
                });
                console.log('data records', records_);
                setDataRecords(records_);
            }
        );
    }, []);

    const [vegaLiteSpec, setVegaLiteSpec] = useState<string>('');
    const onVegaSpecChange = useCallback(
        (event: ChangeEvent<HTMLTextAreaElement>) => {
            setVegaLiteSpec(event.target.value);
        },
        [setVegaLiteSpec]
    );

    const [vegaLitePrompt, setVegaLitePrompt] = useState<string>(() => {
        const trimmedQueryInfo = {
            description: model.queryInfo.description,
            schemaName: model.queryInfo.schemaName,
            queryLabel: model.queryInfo.queryLabel,
            title: model.queryInfo.title,
            name: model.queryInfo.name,
            columns: model.queryInfo['defaultView'].columns.map(c => ({
                name: c.name,
                fieldKey: c.fieldKey,
                caption: c.caption,
                type: c.type,
                description: c.description,
                jsonType: c.jsonType,
            })),
        };
        // console.log(model.queryInfo);
        return INIT_AGENT_PROMPT + model.queryInfo.name;//JSON.stringify(trimmedQueryInfo, null, 2);
    });
    const [hideTextAreas, setHideTextAreas] = useState<boolean>(true);
    const [agentResponseLoading, setAgentResponseLoading] = useState<boolean>(false);
    const [agentResponse, setAgentResponse] = useState<string>(undefined);
    const onVegaPromptChange = useCallback(
        (event: ChangeEvent<HTMLTextAreaElement>) => {
            setVegaLitePrompt(event.target.value);
        },
        [setVegaLitePrompt]
    );

    const callAgent = useCallback(async () => {
        setVegaLitePrompt('');
        setAgentResponseLoading(true);
        try {
            const prompt_ = "REMEMBER: only for the " + model.queryInfo.name + " dataset. " + vegaLitePrompt;
            const response = await sendChartAgentPrompt(prompt_);
            setAgentResponse(response);
            setTimeout(() => {
                applySpecWithData();
            }, 500);
        } catch (error) {
            setAgentResponse(error);
        } finally {
            setAgentResponseLoading(false);
        }
    }, [vegaLitePrompt]);

    const toggleAgentReponse = useCallback(() => {
        setHideTextAreas(h => !h);
    }, []);

    const applySpecWithData = useCallback(() => {
        // use document.querySelector to get the <code> block from the vegaSpecResponse div
        const codeBlock = document.querySelector('.vegaSpecResponse code.language-json');
        if (codeBlock) {
            try {
                const spec = JSON.parse(codeBlock.textContent);
                // replace the data values in the spec with the data from the query
                if (spec.data) {
                    spec.data.values = dataRecords;
                }
                console.log(spec);
                setVegaLiteSpec(JSON.stringify(spec, null, 2));
            } catch (error) {
                console.error('Error parsing Vega-Lite spec from response: ' + error);
            }
        }
    }, [dataRecords]);

    return (
        <Modal
            className="chart-builder-modal"
            footer={footer}
            onCancel={onCancel}
            title={savedChartModel ? 'Edit Chart' : 'Create Chart'}
        >
            <div>
                <textarea
                    className="form-control"
                    cols={50}
                    name="vegaSpecPrompt"
                    onChange={onVegaPromptChange}
                    placeholder="Enter chart prompt here..."
                    rows={8}
                    value={vegaLitePrompt}
                />
                <button onClick={callAgent}>Send Prompt</button>
                {/*<button onClick={applySpecWithData}>Apply Spec with Data</button>*/}
                <button onClick={toggleAgentReponse}>Show/Hide Agent Response</button>
                <div className="margin-bottom"/>
                {agentResponseLoading && (
                    <div className="vegaSpecResponse">
                        <LoadingSpinner msg="Generating Vega-Lite Spec..." wrapperClassName="loading-spinner" />
                    </div>
                )}
                {!agentResponseLoading && agentResponse && (
                    <div className="vegaSpecResponse" dangerouslySetInnerHTML={{ __html: agentResponse }} style={{ display: hideTextAreas ? 'none' : 'block' }} />
                )}
                <textarea
                    className="form-control margin-bottom"
                    cols={50}
                    name="vegaSpecInput"
                    onChange={onVegaSpecChange}
                    placeholder="Enter Vega-Lite JSON spec here"
                    rows={15}
                    value={vegaLiteSpec}
                />
            </div>
            <VegaLiteChart
                chart={undefined}
                chartConfig={chartConfig}
                measureStore={undefined}
                spec={vegaLiteSpec}
                trendlineData={undefined}
            />

            {/*<ChartSettingsPanel*/}
            {/*    allowInherit={allowInherit}*/}
            {/*    canShare={canShare}*/}
            {/*    chartConfig={chartConfig}*/}
            {/*    chartModel={chartModel}*/}
            {/*    chartType={selectedType}*/}
            {/*    error={error}*/}
            {/*    isNew={savedChartModel !== undefined}*/}
            {/*    model={model}*/}
            {/*    setChartConfig={setChartConfig}*/}
            {/*    setChartModel={setChartModel}*/}
            {/*/>*/}
            {/*<ChartPreview*/}
            {/*    chartConfig={chartConfig}*/}
            {/*    hasRequiredValues={hasRequiredValues}*/}
            {/*    model={model}*/}
            {/*    savedChartModel={savedChartModel}*/}
            {/*    selectedType={selectedType}*/}
            {/*    setReportConfig={setReportConfig}*/}
            {/*/>*/}
        </Modal>
    );
});
ChartBuilderModal.displayName = 'ChartBuilderModal';
