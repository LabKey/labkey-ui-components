import React, { FC, Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';

import { PermissionTypes } from '@labkey/api';

import { generateId } from '../../util/utils';
import { LABKEY_VIS } from '../../constants';
import { Modal } from '../../Modal';

import { SelectInput, SelectInputOption } from '../forms/input/SelectInput';

import { naturalSortByProperty } from '../../../public/sort';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { deleteChart, saveChart } from '../../actions';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { RequiresModelAndActions } from '../../../public/QueryModel/withQueryModels';

import { useServerContext } from '../base/ServerContext';
import { hasPermissions } from '../base/models/User';

import { Alert } from '../base/Alert';
import { FormButtons } from '../../FormButtons';

import { getContainerFilter } from '../../query/api';

import { ChartConfig, ChartQueryConfig, GenericChartModel } from './models';

interface AggregateFieldInfo {
    name: string;
    value: string;
}

interface ChartFieldInfo {
    aggregate?: AggregateFieldInfo;
    name: string;
    label: string;
    required: boolean;
    nonNumericOnly?: boolean;
    numericOnly?: boolean;
    // allowMultiple?: boolean;
}

interface ChartTypeInfo {
    name: string;
    title: string;
    imgUrl: string;
    hidden?: boolean;
    fields: ChartFieldInfo[];
}

const CHART_TYPES = LABKEY_VIS?.GenericChartHelper.getRenderTypes();
const HIDDEN_CHART_TYPES = ['time_chart'];
const RIGHT_COL_FIELDS = ['color', 'shape', 'series'];
const MAX_ROWS_PREVIEW = 100000;
const MAX_POINT_DISPLAY = 10000;
const BLUE_HEX_COLOR = '3366FF';

interface Props extends RequiresModelAndActions {
    onHide: (successMsg?: string) => void;
    savedChartModel?: GenericChartModel;
}

export const ChartBuilderModal: FC<Props> = memo(({ actions, model, onHide, savedChartModel }) => {
    const divId = useMemo(() => generateId('chart-'), []);
    const ref = useRef<HTMLDivElement>(undefined);
    const { user } = useServerContext();
    const canShare = useMemo(
        () => savedChartModel?.canShare ?? hasPermissions(user, [PermissionTypes.ShareReportPermission]),
        [savedChartModel, user]
    );
    const chartTypes: ChartTypeInfo[] = useMemo(
        () => CHART_TYPES.filter(type => !type.hidden && !HIDDEN_CHART_TYPES.includes(type.name)),
        []
    );
    const containerFilter = useMemo(() => getContainerFilter(model.containerPath), [model.containerPath]);

    const [loadingData, setLoadingData] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [deleting, setDeleting] = useState<boolean>(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
    const [error, setError] = useState<string>();
    const [previewMsg, setPreviewMsg] = useState<string>();
    const [reportConfig, setReportConfig] = useState<Record<string, any>>();
    const [selectedType, setSelectedChartType] = useState<ChartTypeInfo>(chartTypes[0]);
    const [name, setName] = useState<string>('');
    const [shared, setShared] = useState<boolean>(canShare);
    const [fieldValues, setFieldValues] = useState<Record<string, SelectInputOption>>({});

    useEffect(
        () => {
            if (savedChartModel) {
                setSelectedChartType(
                    chartTypes.find(c => savedChartModel?.visualizationConfig.chartConfig.renderType === c.name)
                );
                setName(savedChartModel.name);
                setShared(savedChartModel.shared);

                const measures = savedChartModel.visualizationConfig?.chartConfig?.measures || {};
                const fieldValues_ = {};
                Object.keys(measures).map(key => {
                    const measure = measures[key];
                    if (measure) {
                        fieldValues_[key] = { label: measure.label, value: measure.name, data: measure };
                    }
                });
                setFieldValues(fieldValues_);
            }
        },
        [
            /* on mount only */
        ]
    );

    const hasName = useMemo(() => name?.trim().length > 0, [name]);
    const hasRequiredValues = useMemo(() => {
        return selectedType.fields.find(field => field.required && !fieldValues[field.name]) === undefined;
    }, [selectedType, fieldValues]);

    const leftColFields = useMemo(() => {
        return selectedType.fields.filter(
            field => !RIGHT_COL_FIELDS.includes(field.name) && (selectedType.name !== 'bar_chart' || field.name !== 'y')
        );
    }, [selectedType]);
    const rightColFields = useMemo(() => {
        return selectedType.fields.filter(
            field => RIGHT_COL_FIELDS.includes(field.name) || (selectedType.name === 'bar_chart' && field.name === 'y')
        );
    }, [selectedType]);

    const onChartTypeChange = useCallback(
        e => {
            // don't allow changing chart type for a saved report
            if (savedChartModel) return;

            const selectedName = e.target.getAttribute('data-name');
            setSelectedChartType(chartTypes.find(type => type.name === selectedName) || chartTypes[0]);
            setFieldValues({});
            setPreviewMsg(undefined);
        },
        [chartTypes, savedChartModel]
    );

    const onNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
    }, []);

    const onToggleShared = useCallback(_ => {
        setShared(prev => !prev);
    }, []);

    const onSelectFieldChange = useCallback((key: string, _, selectedOption: SelectInputOption) => {
        setFieldValues(prev => ({ ...prev, [key]: selectedOption }));
    }, []);

    const onSaveChart = useCallback(async () => {
        const _reportConfig = {
            ...reportConfig,
            reportId: savedChartModel?.reportId,
            name: name?.trim(),
            public: shared,
        };

        setSaving(true);
        setError(undefined);
        try {
            const response = await saveChart(_reportConfig);
            setSaving(false);
            onHide(
                (savedChartModel ? 'Successfully updated chart: ' : 'Successfully created chart: ') +
                    _reportConfig.name +
                    '.'
            );

            // clear the selected report, if we are saving/updating it, so that it will refresh in ChartPanel.tsx
            await actions.selectReport(model.id, undefined);
            await actions.loadCharts(model.id);
            actions.selectReport(model.id, response.reportId);
        } catch (e) {
            setError(e.exception ?? e);
            setSaving(false);
        }
    }, [savedChartModel, reportConfig, name, shared, actions, model.id, onHide]);

    const onDeleteChart = useCallback(() => {
        setShowConfirmDelete(true);
    }, []);

    const onCancelDelete = useCallback(() => {
        setShowConfirmDelete(false);
        setError(undefined);
    }, []);

    const onConfirmDelete = useCallback(async () => {
        setDeleting(true);
        setError(undefined);
        try {
            await deleteChart(savedChartModel.id);
            setDeleting(false);
            onHide('Successfully deleted chart: ' + savedChartModel.name + '.');

            await actions.selectReport(model.id, undefined);
            await actions.loadCharts(model.id);
        } catch (e) {
            setError(e.exception ?? e);
            setDeleting(false);
        }
    }, [savedChartModel, onHide, actions, model.id]);

    const onHide_ = useCallback(() => {
        onHide();
    }, [onHide]);

    useEffect(() => {
        if (ref?.current) ref.current.innerHTML = '';

        if (!hasRequiredValues) return;

        const width = ref?.current.getBoundingClientRect().width || 750;

        const chartConfig = getChartConfig(
            selectedType,
            fieldValues,
            savedChartModel?.visualizationConfig?.chartConfig
        );
        const queryConfig = getQueryConfig(
            model,
            fieldValues,
            chartConfig,
            savedChartModel?.visualizationConfig?.queryConfig
        );

        // add model parameters and containerFilter plus maxRows to the queryConfig for the preview, but not to save with the chart
        const queryConfig_ = {
            ...queryConfig,
            containerFilter,
            parameters: model.queryParameters,
            maxRows: MAX_ROWS_PREVIEW,
        };

        setLoadingData(true);
        setPreviewMsg(undefined);
        LABKEY_VIS.GenericChartHelper.queryChartData(divId, queryConfig_, measureStore => {
            const rowCount = LABKEY_VIS.GenericChartHelper.getMeasureStoreRecords(measureStore).length;
            let _previewMsg = getChartRenderMsg(chartConfig, rowCount, true);

            // if the grid model has any user defined filters, show a message that they will not be saved with the chart
            if (model.loadRowsFilters(true).length > 0) {
                _previewMsg =
                    (_previewMsg ? _previewMsg + ' ' : '') +
                    'Grid filters will not be saved with the chart so are not included in the preview chart.';
            }

            if (rowCount > MAX_POINT_DISPLAY) {
                if (chartConfig.renderType === 'box_plot') {
                    chartConfig.pointType = 'outliers';
                    chartConfig.geomOptions.boxFillColor = BLUE_HEX_COLOR;
                } else if (chartConfig.renderType === 'line_plot') {
                    chartConfig.geomOptions.hideDataPoints = true;
                }
            }

            // adjust height, width, and marginTop for the chart config for the preview, but not to save with the chart
            var chartConfig_ = {
                ...chartConfig,
                height: 250,
                width,
            };
            if (!savedChartModel || savedChartModel.visualizationConfig.chartConfig.geomOptions.marginTop === 20) {
                chartConfig_.geomOptions.marginTop = 10;
            }

            LABKEY_VIS.GenericChartHelper.generateChartSVG(divId, chartConfig_, measureStore);

            setPreviewMsg(_previewMsg);
            setLoadingData(false);
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
        });
    }, [divId, model, hasRequiredValues, selectedType, fieldValues, savedChartModel, containerFilter]);

    let footer;
    if (showConfirmDelete) {
        footer = (
            <div className="form-buttons">
                <div className="form-buttons__left" />
                <div className="form-buttons__right">
                    Are you sure you want to permanently delete this chart?
                    <button className="btn btn-default" onClick={onCancelDelete} type="button" disabled={deleting}>
                        Cancel
                    </button>
                    <button className="btn btn-danger" onClick={onConfirmDelete} type="button" disabled={deleting}>
                        {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        );
    } else {
        footer = (
            <FormButtons sticky={false}>
                <button className="btn btn-default" onClick={onHide_} type="button">
                    Cancel
                </button>
                {savedChartModel?.canDelete && (
                    <button className="btn btn-danger" onClick={onDeleteChart} type="button">
                        Delete Chart
                    </button>
                )}
                <button
                    className="btn btn-success"
                    onClick={onSaveChart}
                    type="button"
                    disabled={saving || !(hasName && hasRequiredValues && !loadingData)}
                >
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
    }

    return (
        <Modal
            className="chart-builder-modal"
            onCancel={onHide_}
            title={savedChartModel ? 'Edit Chart' : 'Create Chart'}
            footer={footer}
        >
            {error && <Alert>{error}</Alert>}
            <div className="row">
                <div className="col-xs-1 col-left">
                    {chartTypes.map(type => (
                        <div
                            key={type.name}
                            className={classNames('chart-builder-type', {
                                selected: selectedType.name === type.name,
                                selectable: !savedChartModel,
                            })}
                            data-name={type.name}
                            onClick={onChartTypeChange}
                        >
                            <img src={type.imgUrl} height={50} width={75} data-name={type.name} />
                            <div className="title">{type.title}</div>
                        </div>
                    ))}
                </div>
                <div className="col-xs-11 col-right">
                    <div className="chart-type-inputs">
                        <div className="row">
                            <div className="col-xs-4">
                                <label>Name *</label>
                                <input
                                    className="form-control"
                                    name="name"
                                    placeholder="Enter a name"
                                    type="text"
                                    onChange={onNameChange}
                                    value={name}
                                />
                                {canShare && (
                                    <div className="checkbox-input">
                                        <input
                                            name="shared"
                                            type="checkbox"
                                            checked={shared}
                                            onChange={onToggleShared}
                                        />{' '}
                                        <span onClick={onToggleShared}>Make this chart available to all users</span>
                                    </div>
                                )}
                            </div>
                            <div className="col-xs-4 fields-col-left">
                                {leftColFields.map(field => (
                                    <div key={field.name}>
                                        <label>
                                            {field.label}
                                            {field.required && ' *'}
                                        </label>
                                        <SelectInput
                                            showLabel={false}
                                            inputClass="col-xs-12"
                                            placeholder="Select a field"
                                            name={field.name}
                                            options={getSelectOptions(model, selectedType, field)}
                                            onChange={onSelectFieldChange}
                                            value={fieldValues[field.name]?.value}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="col-xs-4 fields-col-right">
                                {rightColFields.map(field => (
                                    <Fragment key={field.name}>
                                        <div>
                                            <label>
                                                {field.label}
                                                {field.required && ' *'}
                                            </label>
                                            <SelectInput
                                                showLabel={false}
                                                inputClass="col-xs-12"
                                                placeholder="Select a field"
                                                name={field.name}
                                                options={getSelectOptions(model, selectedType, field)}
                                                onChange={onSelectFieldChange}
                                                value={fieldValues[field.name]?.value}
                                            />
                                        </div>
                                        {/* TODO change this to a select input with predefined options*/}
                                        {selectedType.name === 'bar_chart' && fieldValues[field.name]?.value && (
                                            <div className="gray-text">
                                                Aggregate method:{' '}
                                                {savedChartModel?.visualizationConfig.chartConfig.measures['y']
                                                    ?.aggregate?.name ?? 'Sum'}
                                            </div>
                                        )}
                                    </Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="row margin-top">
                        <div className="col-xs-12">
                            <label>Preview</label>
                            {previewMsg && <span className="gray-text pull-right">{previewMsg}</span>}
                            {!hasRequiredValues && (
                                <div className="gray-text">Select required fields to preview the chart.</div>
                            )}
                            {hasRequiredValues && (
                                <div className="chart-preview-body">
                                    {loadingData && (
                                        <div className="chart-loading-mask">
                                            <div className="chart-loading-mask__background" />
                                            <LoadingSpinner
                                                wrapperClassName="loading-spinner"
                                                msg="Loading Preview..."
                                            />
                                        </div>
                                    )}
                                    <div className="svg-chart__chart" id={divId} ref={ref} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
});

export const getChartRenderMsg = (chartConfig: ChartConfig, rowCount: number, isPreview: boolean): string => {
    let msg = '';
    let sep = '';
    if (isPreview && rowCount === MAX_ROWS_PREVIEW) {
        msg = 'The preview is being limited to ' + MAX_ROWS_PREVIEW.toLocaleString() + ' rows.';
        sep = ' ';
    }

    if (chartConfig.renderType === 'line_plot' && rowCount > chartConfig.geomOptions.binThreshold) {
        msg +=
            sep +
            ('The number of individual points exceeds ' +
                MAX_POINT_DISPLAY.toLocaleString() +
                '. Data points will not be shown on this line plot.');
    } else if (chartConfig.renderType === 'scatter_plot' && rowCount > MAX_POINT_DISPLAY) {
        msg +=
            sep +
            ('The number of individual points exceeds ' +
                MAX_POINT_DISPLAY.toLocaleString() +
                '. The data is now grouped by density.');
    }

    return msg === '' ? undefined : msg;
};

const getSelectOptions = (model: QueryModel, chartType: ChartTypeInfo, field: ChartFieldInfo): SelectInputOption[] => {
    const allowableTypes = LABKEY_VIS.GenericChartHelper.getAllowableTypes(field);

    return (
        model.queryInfo
            .getDisplayColumns(model.viewName)
            .filter(col => {
                const colType = col.displayFieldJsonType || col.jsonType;
                const hasMatchingType = allowableTypes.indexOf(colType) > -1;
                const isMeasureDimensionMatch = LABKEY_VIS.GenericChartHelper.isMeasureDimensionMatch(
                    chartType.name,
                    field,
                    col.measure,
                    col.dimension
                );
                return hasMatchingType || isMeasureDimensionMatch;
            })
            .sort(naturalSortByProperty('caption'))
            .map(col => ({ label: col.caption, value: col.fieldKey, data: col })) ?? []
    );
};

const getQueryConfig = (
    model: QueryModel,
    fieldValues: Record<string, SelectInputOption>,
    chartConfig: ChartConfig,
    savedConfig: ChartQueryConfig
): ChartQueryConfig => {
    const { schemaQuery, containerPath } = model;
    const { schemaName, queryName, viewName } = schemaQuery;

    return {
        maxRows: -1, // this will be saved with the queryConfig, but we will override it for the preview in the modal
        requiredVersion: '13.2',
        schemaName: savedConfig?.schemaName || schemaName,
        queryName: savedConfig?.queryName || queryName,
        viewName: savedConfig?.viewName || viewName,
        columns: Object.values(fieldValues)
            .filter(field => field?.value)
            .map(field => field.value),
        sort: LABKEY_VIS.GenericChartHelper.getQueryConfigSortKey(chartConfig.measures),
        filterArray: savedConfig?.filterArray ?? [],
        containerPath: savedConfig?.containerPath || containerPath,
    } as ChartQueryConfig;
};

const getChartConfig = (
    chartType: ChartTypeInfo,
    fieldValues: Record<string, SelectInputOption>,
    savedConfig: ChartConfig
): ChartConfig => {
    const config = {
        renderType: chartType.name,
        measures: {},
        scales: {
            ...savedConfig?.scales,
        },
        labels: {
            main: '',
            subtitle: '',
            ...savedConfig?.labels,
        },
        pointType: savedConfig?.pointType ?? 'all',
        geomOptions: {
            binShape: 'hex',
            binSingleColor: '000000',
            binThreshold: MAX_POINT_DISPLAY,
            boxFillColor: chartType.name === 'box_plot' ? 'none' : BLUE_HEX_COLOR,
            chartLayout: 'single',
            chartSubjectSelection: 'subjects',
            colorPaletteScale: 'ColorDiscrete',
            colorRange: 'BlueWhite',
            displayIndividual: true,
            displayAggregate: false,
            errorBars: 'None',
            gradientColor: 'FFFFFF',
            gradientPercentage: 95,
            hideDataPoints: false,
            hideTrendLine: false,
            lineColor: '000000',
            lineWidth: chartType.name === 'line_plot' ? 3 : 1,
            marginBottom: null,
            marginLeft: null,
            marginRight: null,
            marginTop: 20, // this will be saved with the chartConfig, but we will override it for the preview in the modal
            opacity: chartType.name === 'bar_chart' || chartType.name === 'line_plot' ? 1.0 : 0.5,
            pieHideWhenLessThanPercentage: 5,
            pieInnerRadius: 0,
            pieOuterRadius: 80,
            piePercentagesColor: '333333',
            pointFillColor: BLUE_HEX_COLOR,
            pointSize: chartType.name === 'box_plot' ? 3 : 5,
            position: chartType.name === 'box_plot' ? 'jitter' : null,
            showOutliers: true,
            showPiePercentages: true,
            ...savedConfig?.geomOptions,
        },
    } as ChartConfig;

    chartType.fields.forEach(field => {
        if (fieldValues[field.name]?.value) {
            config.measures[field.name] = {
                fieldKey: fieldValues[field.name].data.fieldKey,
                name: fieldValues[field.name].value,
                label: fieldValues[field.name].label,
                queryName: fieldValues[field.name].data.queryName,
                schemaName: fieldValues[field.name].data.schemaName,
                type:
                    fieldValues[field.name].data.displayFieldJsonType ||
                    fieldValues[field.name].data.jsonType ||
                    fieldValues[field.name].data.type,
            };

            // for now, retain axis aggregate config if it was set via LKS
            if (savedConfig && savedConfig.measures[field.name]?.aggregate) {
                config.measures[field.name].aggregate = { ...savedConfig.measures[field.name].aggregate };
            }

            // update axis label if it is a new report or if the saved report that didn't have this measure or was using the default field label for the axis label
            if (
                !savedConfig ||
                !savedConfig.measures[field.name] ||
                savedConfig.labels[field.name] === savedConfig.measures[field.name].label
            ) {
                config.labels[field.name] = fieldValues[field.name].label;
            }
        }
    });

    if (chartType.name === 'bar_chart' && !savedConfig) {
        config.labels['y'] = fieldValues.y ? 'Sum of ' + fieldValues.y.label : 'Count';
    }

    return config;
};
