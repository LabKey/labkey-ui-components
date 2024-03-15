import React, { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';

import { generateId } from '../../internal/util/utils';
import { LABKEY_VIS } from '../../internal/constants';
import { MenuItem } from '../../internal/dropdowns';
import { Modal } from '../../internal/Modal';

import { SelectInput, SelectInputOption } from '../../internal/components/forms/input/SelectInput';

import { naturalSortByProperty } from '../sort';

import { QueryModel } from './QueryModel';

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

const CHART_TYPES = LABKEY_VIS.GenericChartHelper.getRenderTypes();
const HIDDEN_CHART_TYPES = ['time_chart'];
const RIGHT_COL_FIELDS = ['color', 'shape', 'series'];
const MAX_ROWS_PREVIEW = 100000; // TODO set value to ...? detect when max reached

interface Props {
    model: QueryModel;
}

export const ChartBuilderMenuItem: FC<Props> = memo(({ model }) => {
    const divId = useMemo(() => generateId('chart-'), []);
    const ref = useRef<HTMLDivElement>(undefined);
    const [showModal, setShowModal] = useState<boolean>(false);
    const chartTypes: ChartTypeInfo[] = useMemo(
        () => CHART_TYPES.filter(type => !type.hidden && !HIDDEN_CHART_TYPES.includes(type.name)),
        []
    );
    const [selectedType, setSelectedChartType] = useState<ChartTypeInfo>(chartTypes[0]);
    const [name, setName] = useState<string>('');
    const [shared, setShared] = useState<boolean>(true);
    const [fieldValues, setFieldValues] = useState<Record<string, SelectInputOption>>({});

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

    const onShowModal = useCallback(() => {
        setShowModal(true);
    }, []);

    const onHideModal = useCallback(() => {
        setShowModal(false);
    }, []);

    const onChartTypeChange = useCallback(
        e => {
            const selectedName = e.target.getAttribute('data-name');
            setSelectedChartType(chartTypes.find(type => type.name === selectedName) || chartTypes[0]);
            setFieldValues({}); // reset any selected field values
        },
        [chartTypes]
    );

    const onNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
    }, []);

    const onSharedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setShared(e.target.checked);
    }, []);

    const onSelectFieldChange = useCallback((key: string, _, selectedOption: SelectInputOption) => {
        setFieldValues(prev => ({ ...prev, [key]: selectedOption }));
    }, []);

    useEffect(() => {
        if (ref?.current) ref.current.innerHTML = ''; // '<span class="fa fa-spinner" /> Loading...'; // TODO where to put this?

        if (!hasRequiredValues) return;

        const width = ref?.current.getBoundingClientRect().width || 750;
        const chartConfig = getChartConfig(selectedType, fieldValues, width);
        const queryConfig = getQueryConfig(model, fieldValues, chartConfig);
        LABKEY_VIS.GenericChartHelper.renderChartSVG(divId, queryConfig, chartConfig);
    }, [divId, model, hasRequiredValues, selectedType, fieldValues]);

    return (
        <>
            <MenuItem onClick={onShowModal}>
                <i className="fa fa-plus-circle" />
                <span className="chart-menu-label">Create Chart</span>
            </MenuItem>
            {showModal && (
                <Modal
                    cancelText="Cancel"
                    canConfirm={false}
                    className="chart-builder-modal"
                    confirmText="Create Chart"
                    onCancel={onHideModal}
                    onConfirm={onHideModal}
                    title="Create Chart"
                    bsSize="lg"
                >
                    <div className="row">
                        <div className="col-xs-1 col-left">
                            {chartTypes.map(type => (
                                <div
                                    key={type.name}
                                    className={classNames('chart-builder-type', {
                                        selected: selectedType.name === type.name,
                                    })}
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
                                        <div className="checkbox-input">
                                            <input
                                                name="shared"
                                                type="checkbox"
                                                checked={shared}
                                                onChange={onSharedChange}
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
                                    {!hasRequiredValues && (
                                        <div className="gray-text">Select required fields to preview the chart.</div>
                                    )}
                                    {hasRequiredValues && <div className="svg-chart__chart" id={divId} ref={ref} />}
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
});

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

const getQueryConfig = (model: QueryModel, fieldValues: Record<string, SelectInputOption>, chartConfig: Record<string, any>) => {
    const { schemaQuery, containerPath, containerFilter } = model;
    const { schemaName, queryName, viewName } = schemaQuery;

    return {
        maxRows: MAX_ROWS_PREVIEW,
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

const getChartConfig = (chartType: ChartTypeInfo, fieldValues: Record<string, SelectInputOption>, width: number) => {
    const height = 250;

    const config = {
        renderType: chartType.name,
        measures: {},
        scales: {},
        labels: {},
        geomOptions: {
            binShape: 'hex',
            binSingleColor: '000000',
            binThreshold: 10000,
            boxFillColor: chartType.name === 'box_plot' ? 'none' : '3366FF',
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
            pointFillColor: '3366FF',
            pointSize: chartType.name === 'box_plot' ? 3 : 5,
            pointType: 'all',
            position: chartType.name === 'box_plot' ? 'jitter' : null,
            showOutliers: false,
            showPiePercentages: true,
        },
        pointType: 'all',
        width,
        height,
    };

    chartType.fields.forEach(field => {
        if (fieldValues[field.name]?.value) {
            config.measures[field.name] = {
                name: fieldValues[field.name].value,
                label: fieldValues[field.name].label,
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
