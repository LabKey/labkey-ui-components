/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { Utils } from '@labkey/api';
import { ChartConfig, ChartConfigSetter, MeasureOption } from './models';
import { ColorPickerInput } from '../forms/input/ColorPickerInput';
import { COLOR_OPTIONS_PER_TYPE, COLOR_PALETTE_OPTIONS, LINE_TYPE_OPTIONS, SHAPE_OPTIONS } from './constants';
import { SelectInput } from '../forms/input/SelectInput';
import { selectDistinctRows } from '../../query/api';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { ColorIcon } from '../base/ColorIcon';
import { LABKEY_VIS } from '../../constants';
import { RemoveEntityButton } from '../buttons/RemoveEntityButton';
import { stringToHtmlId } from '../../util/utils';

enum COLOR_OPTIONS {
    BOX_FILL_COLOR = 'boxFillColor',
    COLOR_PALETTE_SCALE = 'colorPaletteScale',
    LINE_COLOR = 'lineColor',
    POINT_FILL_COLOR = 'pointFillColor',
}

// export for jest testing
export const showColorOption = function (chartConfig: ChartConfig, optionName: COLOR_OPTIONS): boolean {
    const chartType = chartConfig.renderType;
    const isBarChart = chartType === 'bar_chart';
    const isBoxPlot = chartType === 'box_plot';
    const isLinePlot = chartType === 'line_plot';
    const isScatterPlot = chartType === 'scatter_plot';
    const hasSeries = chartConfig.measures?.series !== undefined;
    const hasXSub = chartConfig.measures?.xSub !== undefined;
    const hasColor = chartConfig.measures?.color !== undefined;

    switch (optionName) {
        case COLOR_OPTIONS.BOX_FILL_COLOR:
            return COLOR_OPTIONS_PER_TYPE.boxFillColor.indexOf(chartType) > -1 && (!isBarChart || !hasXSub); // bar chart if config has groupBy measure
        case COLOR_OPTIONS.COLOR_PALETTE_SCALE:
            return (
                COLOR_OPTIONS_PER_TYPE.colorPaletteScale.indexOf(chartType) > -1 &&
                (!isLinePlot || hasSeries) && // line plot if config has series measure
                (!isBarChart || hasXSub) && // bar chart if config has groupBy measure
                (!isBoxPlot || hasColor) && // box plot if config has color measure
                (!isScatterPlot || hasColor) // scatter plot if config has color measure
            );
        case COLOR_OPTIONS.LINE_COLOR:
            return COLOR_OPTIONS_PER_TYPE.lineColor.indexOf(chartType) > -1 && (!isBarChart || !hasXSub); // bar chart if config has groupBy measure
        case COLOR_OPTIONS.POINT_FILL_COLOR:
            return (
                COLOR_OPTIONS_PER_TYPE.pointFillColor.indexOf(chartType) > -1 &&
                (!isLinePlot || !hasSeries) && // line plot if config has series measure
                (!isBoxPlot || !hasColor) && // box plot if config has color measure
                (!isScatterPlot || !hasColor) // scatter plot if config has color measure
            );
        default:
            return false;
    }
};

interface ShapeOptionRendererProps {
    isValueRenderer: boolean;
    name: string;
}

// export for jest testing
export const ShapeOptionRenderer: FC<ShapeOptionRendererProps> = memo(({ name, isValueRenderer }) => {
    const size = 10;
    const iconSize = name === 'diamond' ? size / 2.5 : size / 2;
    const icon = LABKEY_VIS.Scale.ShapeMap[name](iconSize);
    const className = classNames('chart-builder-type-option', { 'chart-builder-type-option--value': isValueRenderer });
    return (
        <span className={className} data-series-shape={name}>
            <svg height={size} width={size}>
                <path d={icon} transform={'translate(' + size / 2 + ',' + size / 2 + ')'} />
            </svg>
        </span>
    );
});
ShapeOptionRenderer.displayName = 'ShapeOptionRenderer';

function shapeOptionRenderer(option) {
    return <ShapeOptionRenderer isValueRenderer={false} name={option.data.value} />;
}

function shapeValueRenderer(option) {
    return <ShapeOptionRenderer isValueRenderer name={option.data.value} />;
}

interface LineTypeOptionRendererProps {
    isValueRenderer: boolean;
    label: string;
    value: string;
}

// export for jest testing
export const LineTypeOptionRenderer: FC<LineTypeOptionRendererProps> = memo(({ label, value, isValueRenderer }) => {
    const className = classNames('chart-builder-type-option', { 'chart-builder-type-option--value': isValueRenderer });
    const strokeValue = value === 'dashed' ? '6,6' : value === 'dotted' ? '0.1,6' : undefined;
    const strokeLineCap = value === 'dotted' ? 'round' : undefined;
    return (
        <span className={className} data-series-linetype={label}>
            <svg height="10" width="25">
                <path
                    d="M 5 5 H 25"
                    fill="none"
                    stroke="#000000"
                    strokeDasharray={strokeValue}
                    strokeLinecap={strokeLineCap}
                    strokeWidth="3"
                />
            </svg>
        </span>
    );
});
LineTypeOptionRenderer.displayName = 'LineTypeOptionRenderer';

function lineTypeOptionRenderer(option) {
    return <LineTypeOptionRenderer isValueRenderer={false} label={option.data.label} value={option.data.value} />;
}

function lineTypeValueRenderer(option) {
    return <LineTypeOptionRenderer isValueRenderer label={option.data.label} value={option.data.value} />;
}

interface SeriesOptionRendererProps {
    isValueRenderer: boolean;
    name: string;
    seriesOptionMap: Record<string, Record<string, string>>;
}

// export for jest testing
export const SeriesOptionRenderer: FC<SeriesOptionRendererProps> = memo(
    ({ name, seriesOptionMap, isValueRenderer }) => {
        const value = seriesOptionMap?.[name]?.color;
        const className = classNames('chart-builder-type-option', {
            'chart-builder-type-option--value': isValueRenderer,
        });
        return (
            <span className={className} data-series-option={name}>
                {value && (
                    <>
                        <ColorIcon asSquare cls="color-icon__chip-small" value={value} /> {name}
                    </>
                )}
                {!value && (
                    <>
                        <LetterIcon letter="A" /> {name}
                    </>
                )}
            </span>
        );
    }
);
SeriesOptionRenderer.displayName = 'SeriesOptionRenderer';

function seriesOptionRenderer(option, seriesOptionMap) {
    return (
        <SeriesOptionRenderer
            isValueRenderer={option.type !== 'option'}
            name={option.data.value}
            seriesOptionMap={seriesOptionMap}
        />
    );
}

interface ChartColorInputsProps {
    chartConfig: ChartConfig;
    model: QueryModel;
    setChartConfig: ChartConfigSetter;
}

export const ChartColorInputs: FC<ChartColorInputsProps> = memo(({ chartConfig, model, setChartConfig }) => {
    const isBoxPlot = chartConfig.renderType === 'box_plot';
    const isLinePlot = chartConfig.renderType === 'line_plot';

    const boxFillColor =
        chartConfig.geomOptions.boxFillColor === 'none' ? undefined : (chartConfig.geomOptions.boxFillColor as string);
    const showBoxFillColor = useMemo(() => showColorOption(chartConfig, COLOR_OPTIONS.BOX_FILL_COLOR), [chartConfig]);
    const lineColor = chartConfig.geomOptions.lineColor as string;
    const showLineColor = useMemo(() => showColorOption(chartConfig, COLOR_OPTIONS.LINE_COLOR), [chartConfig]);
    const pointFillColor = chartConfig.geomOptions.pointFillColor as string;
    const showPointFillColor = useMemo(
        () => showColorOption(chartConfig, COLOR_OPTIONS.POINT_FILL_COLOR),
        [chartConfig]
    );
    const colorPaletteScale = chartConfig.geomOptions.colorPaletteScale;
    const showColorPaletteScale = useMemo(
        () => showColorOption(chartConfig, COLOR_OPTIONS.COLOR_PALETTE_SCALE),
        [chartConfig]
    );
    const showSeriesLineStyle = isLinePlot && chartConfig.measures?.series !== undefined;
    const showAnyColorOptions = showBoxFillColor || showLineColor || showPointFillColor;

    const setGeomOptions = useCallback(
        options => {
            setChartConfig(current => ({
                ...current,
                geomOptions: { ...current.geomOptions, ...options },
            }));
        },
        [setChartConfig]
    );

    const onColorPaletteChange = useCallback(
        (_: never, value: string) => {
            setGeomOptions({ colorPaletteScale: value });
        },
        [setGeomOptions]
    );

    const onColorChange = useCallback(
        (name: string, value: string) => {
            // value comes in as #FFFFFF from ColorPickerInput, but we want it without the #
            if (value?.startsWith('#')) {
                value = value.substring(1);
            }
            setGeomOptions({ [name]: value });
        },
        [setGeomOptions]
    );
    const onBoxFillColorChange = useCallback(
        (_: never, value: string) => {
            onColorChange(COLOR_OPTIONS.BOX_FILL_COLOR, value ?? 'none');
        },
        [onColorChange]
    );
    const onLineColorChange = useCallback(
        (_: never, value: string) => {
            onColorChange(COLOR_OPTIONS.LINE_COLOR, value);
        },
        [onColorChange]
    );
    const onPointFillColorChange = useCallback(
        (_: never, value: string) => {
            onColorChange(COLOR_OPTIONS.POINT_FILL_COLOR, value);
        },
        [onColorChange]
    );

    return (
        <>
            {showAnyColorOptions && (
                <div className="form-group row">
                    {showBoxFillColor && (
                        <div className="col-xs-4">
                            <label>Fill Color</label>
                            <ColorPickerInput
                                allowRemove={isBoxPlot}
                                name={COLOR_OPTIONS.BOX_FILL_COLOR}
                                onChange={onBoxFillColorChange}
                                value={boxFillColor}
                            />
                        </div>
                    )}
                    {showLineColor && (
                        <div className="col-xs-4">
                            <label>Line Color</label>
                            <ColorPickerInput name="lineColor" onChange={onLineColorChange} value={lineColor} />
                        </div>
                    )}
                    {showPointFillColor && (
                        <div className="col-xs-4">
                            <label>{isLinePlot ? '' : 'Point '}Color</label>
                            <ColorPickerInput
                                name={COLOR_OPTIONS.POINT_FILL_COLOR}
                                onChange={onPointFillColorChange}
                                value={pointFillColor}
                            />
                        </div>
                    )}
                </div>
            )}
            {showColorPaletteScale && (
                <div className="form-group row">
                    <div className="col-xs-12">
                        <label htmlFor="color-palette">Color Palette</label>
                        <SelectInput
                            clearable={false}
                            containerClass="row"
                            inputClass="col-xs-12"
                            inputId="color-palette"
                            name={COLOR_OPTIONS.COLOR_PALETTE_SCALE}
                            onChange={onColorPaletteChange}
                            options={COLOR_PALETTE_OPTIONS}
                            showLabel={false}
                            value={colorPaletteScale}
                        />
                    </div>
                </div>
            )}
            {showSeriesLineStyle && (
                <SeriesLineStyleInput
                    chartConfig={chartConfig}
                    key={chartConfig.measures.series.fieldKey} // reset component state when series field changes
                    model={model}
                    setChartConfig={setChartConfig}
                />
            )}
        </>
    );
});
ChartColorInputs.displayName = 'ChartColorInputs';

interface SeriesLineStyleInputProps {
    chartConfig: ChartConfig;
    model: QueryModel;
    setChartConfig: ChartConfigSetter;
}
const SeriesLineStyleInput: FC<SeriesLineStyleInputProps> = memo(({ chartConfig, model, setChartConfig }) => {
    const [distinctSeriesOptions, setDistinctSeriesOptions] = useState<{ label: string; value: string }[]>();
    const [selectedSeries, setSelectedSeries] = useState<string>();
    const [seriesOptionMap, setSeriesOptionMap] = useState<Record<string, MeasureOption>>(
        chartConfig.measuresOptions?.series ?? {}
    );

    useEffect(() => {
        const fetchDistinctSeries = async () => {
            setDistinctSeriesOptions(undefined);
            setSelectedSeries(undefined);

            if (chartConfig.measures?.series) {
                try {
                    const seriesColumn = model.getColumn(chartConfig.measures?.series.fieldKey);
                    const response = await selectDistinctRows({
                        schemaName: model.schemaQuery.schemaName,
                        queryName: model.schemaQuery.queryName,
                        viewName: model.schemaQuery.viewName,
                        // if the series measure is a lookup, we need to get distinct values from the display column
                        column:
                            chartConfig.measures?.series.fieldKey +
                            (seriesColumn?.isLookup() ? '/' + seriesColumn.lookup.displayColumnFieldKey : ''),
                    });

                    // map response.values to SelectOption format
                    const options = response.values.map(value => ({
                        label: value === null ? 'n/a' : value.toString(),
                        value: value === null ? 'n/a' : value.toString(),
                    }));
                    setDistinctSeriesOptions(options);
                } catch (error) {
                    console.error(error);
                }
            }
        };

        fetchDistinctSeries();
    }, [model.schemaQuery, chartConfig.measures?.series]);

    // call setChartConfig whenever seriesOptionMap changes
    useEffect(() => {
        setChartConfig(current => ({
            ...current,
            measuresOptions: {
                ...current.measuresOptions,
                series: seriesOptionMap,
            },
        }));
    }, [seriesOptionMap, setChartConfig]);

    const onSeriesSelectChange = useCallback((_: never, value: string) => {
        setSelectedSeries(value);
    }, []);

    const onSeriesOptionChange = useCallback((series: string, optionName: string, value: any) => {
        setSeriesOptionMap(prev => {
            const seriesOptions = prev[series] || {};
            const updatedSeriesOptions = { ...seriesOptions };
            // if the value is undefined, remove the option from the seriesOptionMap
            if (value === undefined) {
                delete updatedSeriesOptions[optionName];
            } else {
                updatedSeriesOptions[optionName] = value;
            }
            // if the updatedSeriesOptions is empty, remove the series from the seriesOptionMap
            if (Utils.isEmptyObj(updatedSeriesOptions)) {
                const { [series]: _, ...rest } = prev;
                return rest;
            }
            return {
                ...prev,
                [series]: updatedSeriesOptions,
            };
        });
    }, []);

    const onSeriesColorChange = useCallback(
        (_: never, value: string) => {
            onSeriesOptionChange(selectedSeries, 'color', value);
        },
        [onSeriesOptionChange, selectedSeries]
    );

    const onSeriesLineTypeChange = useCallback(
        (_: never, value: string) => {
            onSeriesOptionChange(selectedSeries, 'lineType', value);
        },
        [onSeriesOptionChange, selectedSeries]
    );

    const onSeriesLineTypeRemove = useCallback(() => {
        onSeriesOptionChange(selectedSeries, 'lineType', undefined);
    }, [onSeriesOptionChange, selectedSeries]);

    const onSeriesShapeChange = useCallback(
        (_: never, value: string) => {
            onSeriesOptionChange(selectedSeries, 'shape', value);
        },
        [onSeriesOptionChange, selectedSeries]
    );

    const onSeriesShapeRemove = useCallback(() => {
        onSeriesOptionChange(selectedSeries, 'shape', undefined);
    }, [onSeriesOptionChange, selectedSeries]);

    const seriesValueRenderer = useCallback(option => seriesOptionRenderer(option, seriesOptionMap), [seriesOptionMap]);

    if (!distinctSeriesOptions) {
        return null;
    }

    const suffix = stringToHtmlId(chartConfig.measures.series?.name) ?? 'unknown';
    return (
        <>
            <div className="form-group row">
                <div className="col-xs-12">
                    <label htmlFor={'line-color-and-style-' + suffix}>Line Color and Style</label>
                    <SelectInput
                        containerClass="row"
                        inputClass="col-xs-12"
                        inputId={'line-color-and-style-' + suffix}
                        menuPlacement="top"
                        name={'lineColorAndStyle-' + suffix}
                        onChange={onSeriesSelectChange}
                        optionRenderer={seriesValueRenderer}
                        options={distinctSeriesOptions}
                        placeholder="Select a series to set options..."
                        showLabel={false}
                        value={selectedSeries}
                        valueRenderer={seriesValueRenderer}
                    />
                </div>
            </div>
            {selectedSeries && (
                <div className="chart-color-inputs">
                    <div className="chart-color-input">
                        <label className="label-weight-normal">Color</label>
                        <ColorPickerInput
                            allowRemove
                            name="seriesColor"
                            onChange={onSeriesColorChange}
                            placeholder="Auto"
                            value={seriesOptionMap[selectedSeries]?.color}
                        />
                    </div>
                    {!chartConfig.geomOptions?.hideDataPoints && (
                        <div className="chart-color-input">
                            <label className="label-weight-normal" htmlFor={'shape-' + suffix}>
                                Shape
                            </label>
                            <SelectInput
                                clearable={false}
                                containerClass="inline-block"
                                inputClass=""
                                inputId={'shape-' + suffix}
                                menuPlacement="top"
                                name="shape"
                                onChange={onSeriesShapeChange}
                                optionRenderer={shapeOptionRenderer}
                                options={SHAPE_OPTIONS}
                                placeholder="Auto"
                                value={seriesOptionMap[selectedSeries]?.shape}
                                valueRenderer={shapeValueRenderer}
                            />
                            {seriesOptionMap[selectedSeries]?.shape && (
                                <RemoveEntityButton labelClass="color-picker__remove" onClick={onSeriesShapeRemove} />
                            )}
                        </div>
                    )}
                    <div className="chart-color-input">
                        <label className="label-weight-normal" htmlFor={'line-type-' + suffix}>Line Type</label>
                        <SelectInput
                            clearable={false}
                            containerClass="inline-block"
                            inputClass=""
                            inputId={'line-type-' + suffix}
                            menuPlacement="top"
                            name="lineType"
                            onChange={onSeriesLineTypeChange}
                            optionRenderer={lineTypeOptionRenderer}
                            options={LINE_TYPE_OPTIONS}
                            placeholder="Auto"
                            value={seriesOptionMap[selectedSeries]?.lineType}
                            valueRenderer={lineTypeValueRenderer}
                        />
                        {seriesOptionMap[selectedSeries]?.lineType !== undefined && (
                            <RemoveEntityButton labelClass="color-picker__remove" onClick={onSeriesLineTypeRemove} />
                        )}
                    </div>
                </div>
            )}
        </>
    );
});
SeriesLineStyleInput.displayName = 'SeriesLineStyleInput';

const LetterIcon: FC<{ letter: string }> = ({ letter }) => {
    return <div className="letter-icon">{letter}</div>;
};
LetterIcon.displayName = 'LetterIcon';
