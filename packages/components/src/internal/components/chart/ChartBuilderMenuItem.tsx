import React, { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';

import { generateId } from '../../util/utils';
import { LABKEY_VIS } from '../../constants';
import { MenuItem } from '../../dropdowns';
import { Modal } from '../../Modal';

import { SelectInput, SelectInputOption } from '../forms/input/SelectInput';

import { naturalSortByProperty } from '../../../public/sort';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { saveChart } from '../../actions';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { RequiresModelAndActions } from '../../../public/QueryModel/withQueryModels';

interface ChartFieldInfo {
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

export const ChartBuilderMenuItem: FC<RequiresModelAndActions> = memo(({ actions, model }) => {
    const divId = useMemo(() => generateId('chart-'), []);
    const ref = useRef<HTMLDivElement>(undefined);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [loadingData, setLoadingData] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [previewMsg, setPreviewMsg] = useState<string>();
    const [reportConfig, setReportConfig] = useState<Record<string, any>>();
    const chartTypes: ChartTypeInfo[] = useMemo(
        () => CHART_TYPES.filter(type => !type.hidden && !HIDDEN_CHART_TYPES.includes(type.name)),
        []
    );
    const [selectedType, setSelectedChartType] = useState<ChartTypeInfo>(chartTypes[0]);
    const [name, setName] = useState<string>('');
    const [shared, setShared] = useState<boolean>(true);
    const [fieldValues, setFieldValues] = useState<Record<string, SelectInputOption>>({});

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

    const resetState = useCallback(
        (all: boolean) => {
            setFieldValues({});
            setPreviewMsg(undefined);
            if (all) {
                setSelectedChartType(chartTypes[0]);
                setName('');
                setShared(true);
                setReportConfig(undefined);
            }
        },
        [chartTypes]
    );

    const onShowModal = useCallback(() => {
        setShowModal(true);
    }, []);

    const onHideModal = useCallback(() => {
        setShowModal(false);
        resetState(true);
    }, [resetState]);

    const onChartTypeChange = useCallback(
        e => {
            const selectedName = e.target.getAttribute('data-name');
            setSelectedChartType(chartTypes.find(type => type.name === selectedName) || chartTypes[0]);
            resetState(false);
        },
        [chartTypes, resetState]
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
            name,
            public: shared,
        };
        //     reportId    : this.savedReportInfo ? this.savedReportInfo.reportId : undefined,
        // if (data.isSaveAs)
        //     reportConfig.reportId = null;

        setSaving(true);
        // TODO try/catch with error message
        const response = await saveChart(_reportConfig);

        setSaving(false);
        onHideModal();

        await actions.loadCharts(model.id);
        actions.selectReport(model.id, response.reportId);
    }, [reportConfig, name, shared, actions, model.id, onHideModal]);

    useEffect(() => {
        if (ref?.current) ref.current.innerHTML = '';

        if (!showModal || !hasRequiredValues) return;

        const width = ref?.current.getBoundingClientRect().width || 750;

        const chartConfig = getChartConfig(selectedType, fieldValues);
        const queryConfig = getQueryConfig(model, fieldValues, chartConfig);

        // add maxRows to the queryConfig for the preview, but not to save with the chart
        const _queryConfig = { ...queryConfig, maxRows: MAX_ROWS_PREVIEW };

        setLoadingData(true);
        setPreviewMsg(undefined);
        LABKEY_VIS.GenericChartHelper.queryChartData(divId, _queryConfig, measureStore => {
            const rowCount = LABKEY_VIS.GenericChartHelper.getMeasureStoreRecords(measureStore).length;
            const _previewMsg = getChartPreviewMsg(chartConfig.renderType, rowCount);

            if (rowCount > MAX_POINT_DISPLAY) {
                if (chartConfig.renderType === 'box_plot') {
                    chartConfig.pointType = 'outliers';
                    chartConfig.geomOptions.boxFillColor = BLUE_HEX_COLOR;
                } else if (chartConfig.renderType === 'line_plot') {
                    chartConfig.geomOptions.hideDataPoints = true;
                }
            }

            // add height and width to the chart config for rendering, but not to save with the chart
            var _chartConfig = { ...chartConfig, height: 250, width };

            LABKEY_VIS.GenericChartHelper.generateChartSVG(divId, _chartConfig, measureStore);

            setPreviewMsg(_previewMsg);
            setLoadingData(false);
            setReportConfig({
                schemaName: queryConfig.schemaName,
                queryName: queryConfig.queryName,
                viewName: queryConfig.viewName,
                renderType: chartConfig.renderType,
                jsonData: {
                    queryConfig,
                    chartConfig,
                },
            });
        });
    }, [divId, model, showModal, hasRequiredValues, selectedType, fieldValues]);

    return (
        <>
            <MenuItem onClick={onShowModal}>
                <i className="fa fa-plus-circle" />
                <span className="chart-menu-label">Create Chart</span>
            </MenuItem>
            {showModal && (
                <Modal
                    canConfirm={hasName && hasRequiredValues && !loadingData}
                    className="chart-builder-modal"
                    confirmText="Create Chart"
                    confirmingText="Creating Chart..."
                    isConfirming={saving}
                    onCancel={onHideModal}
                    onConfirm={onSaveChart}
                    title="Create Chart"
                >
                    <div className="row">
                        <div className="col-xs-1 col-left">
                            {chartTypes.map(type => (
                                <div
                                    key={type.name}
                                    className={classNames('chart-builder-type', {
                                        selected: selectedType.name === type.name,
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
                                        <div className="checkbox-input" onClick={onToggleShared}>
                                            <input
                                                name="shared"
                                                type="checkbox"
                                                checked={shared}
                                                onChange={onToggleShared}
                                            />{' '}
                                            Make this chart available to all users
                                        </div>
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
            )}
        </>
    );
});

const getChartPreviewMsg = (renderType: string, rowCount: number): string => {
    let msg = '';
    let sep = '';
    if (rowCount === MAX_ROWS_PREVIEW) {
        msg = 'The preview is being limited to ' + MAX_ROWS_PREVIEW.toLocaleString() + ' rows.';
        sep = ' ';
    }

    if (rowCount > MAX_POINT_DISPLAY) {
        if (renderType === 'line_plot') {
            msg +=
                sep +
                ('The number of individual points exceeds ' +
                    MAX_POINT_DISPLAY.toLocaleString() +
                    '. Data points will not be shown on this line plot.');
        } else if (renderType === 'scatter_plot') {
            msg +=
                sep +
                ('The number of individual points exceeds ' +
                    MAX_POINT_DISPLAY.toLocaleString() +
                    '. The data is now grouped by density.');
        }
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
    chartConfig: Record<string, any>
) => {
    const { schemaQuery, containerPath, containerFilter } = model;
    const { schemaName, queryName, viewName } = schemaQuery;

    return {
        maxRows: -1, // this will be saved with the queryConfig for chart rendering, we will override it for the preview in the modal
        requiredVersion: 13.2,
        schemaName,
        queryName,
        viewName,
        columns: Object.values(fieldValues)
            .filter(field => field?.value)
            .map(field => field.value)
            .join(','),
        sort: LABKEY_VIS.GenericChartHelper.getQueryConfigSortKey(chartConfig.measures),
        filterArray: model.filters,
        parameters: model.queryParameters,
        containerFilter,
        containerPath,
    };
};

const getChartConfig = (chartType: ChartTypeInfo, fieldValues: Record<string, SelectInputOption>) => {
    const config = {
        renderType: chartType.name,
        measures: {},
        scales: {},
        labels: {},
        pointType: 'all',
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
            marginTop: 10,
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
        },
    };

    chartType.fields.forEach(field => {
        if (fieldValues[field.name]?.value) {
            config.measures[field.name] = {
                fieldKey: fieldValues[field.name].data.fieldKey,
                name: fieldValues[field.name].value,
                label: fieldValues[field.name].label,
                queryName: fieldValues[field.name].data.queryName,
                schemaName: fieldValues[field.name].data.schemaName,
                type: fieldValues[field.name].data.displayFieldJsonType || fieldValues[field.name].data.jsonType,
            };
            config.labels[field.name] = fieldValues[field.name].label;
        }
    });

    if (chartType.name === 'bar_chart') {
        config.labels = {
            ...config.labels,
            y: fieldValues.y ? 'Sum of ' + fieldValues.y.label : 'Count',
        };
    }

    return config;
};
