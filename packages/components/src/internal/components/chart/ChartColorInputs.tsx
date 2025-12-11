import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { Utils } from '@labkey/api';
import { ChartConfig, ChartConfigSetter, MeasureOption } from './models';
import { ColorPickerInput } from '../forms/input/ColorPickerInput';
import {COLOR_OPTIONS_PER_TYPE, COLOR_PALETTE_OPTIONS, LINE_TYPE_OPTIONS, SHAPE_OPTIONS} from './constants';
import { SelectInput } from '../forms/input/SelectInput';
import { selectDistinctRows } from '../../query/api';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { ColorIcon } from '../base/ColorIcon';
import { LABKEY_VIS } from '../../constants';
import { RemoveEntityButton } from '../buttons/RemoveEntityButton';

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
            <span className={className} data-series-shape={name}>
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
                        <label>Color Palette</label>
                        <SelectInput
                            clearable={false}
                            containerClass="row"
                            inputClass="col-xs-12"
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
                    const response = await selectDistinctRows({
                        schemaName: model.schemaQuery.schemaName,
                        queryName: model.schemaQuery.queryName,
                        viewName: model.schemaQuery.viewName,
                        column: chartConfig.measures?.series.fieldKey,
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

    return (
        <>
            <div className="form-group row">
                <div className="col-xs-12">
                    <label>Line Color and Style</label>
                    <SelectInput
                        containerClass="row"
                        inputClass="col-xs-12"
                        menuPlacement="top"
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
                <>
                    <div className="row">
                        <div className="col-xs-4">
                            <div>Color</div>
                            <ColorPickerInput
                                allowRemove
                                name="seriesColor"
                                onChange={onSeriesColorChange}
                                placeholder="Auto"
                                value={seriesOptionMap[selectedSeries]?.color}
                            />
                        </div>
                        <div className="col-xs-8">
                            <div>Shape</div>
                            <SelectInput
                                clearable={false}
                                containerClass="inline-block"
                                inputClass=""
                                menuPlacement="top"
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
                    </div>
                    <div className="row">
                        <div className="col-xs-12">
                            <div>Line Type</div>
                            <SelectInput
                                clearable={false}
                                containerClass="inline-block"
                                inputClass=""
                                menuPlacement="top"
                                onChange={onSeriesLineTypeChange}
                                options={LINE_TYPE_OPTIONS}
                                placeholder="Auto"
                                value={seriesOptionMap[selectedSeries]?.lineType}
                                // optionRenderer={lineTypeOptionRenderer}
                                // valueRenderer={lineTypeValueRenderer}
                            />
                            {seriesOptionMap[selectedSeries]?.lineType && (
                                <RemoveEntityButton labelClass="color-picker__remove" onClick={onSeriesLineTypeRemove} />
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    );
});
SeriesLineStyleInput.displayName = 'SeriesLineStyleInput';

const LetterIcon: FC<{ letter: string }> = ({ letter }) => {
    return <div className="letter-icon">{letter}</div>;
};
LetterIcon.displayName = 'LetterIcon';
