import { ChartConfig } from './models';
import React, { FC, useMemo, useRef } from 'react';
import { VegaEmbed } from 'react-vega';
import { DataViewInfo } from '../../DataViewInfo';
import { LABKEY_VIS } from '../../constants';

type EncodingValue = Record<string, string> | string;
type Encoding = Record<string, EncodingValue>;

function measureToEncoding(measure: Record<string, string>): Encoding {
    const type = measure.type === 'float' ? 'quantitative' : 'nominal';
    const field = `${measure.name}.value`;
    return { field, type, title: measure.label };
}

function baseVegaLiteSpec(chartConfig: ChartConfig, measureStore) {
    const spec: any = {
        $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
        width: 'container',
        data: {
            values: measureStore.records(),
        },
        layer: [],
        encoding: {
            x: measureToEncoding(chartConfig.measures.x),
            y: measureToEncoding(chartConfig.measures.y),
        },
        config: {
            legend: {
                // orient: 'top-left',
                // strokeColor: '#999999',
                fillColor: '#ffffff',
                // cornerRadius: 5,
                padding: 5,
            },
        },
    };

    if (chartConfig.measures.color) {
        spec.encoding.color = measureToEncoding(chartConfig.measures.color);
    }

    if (chartConfig.measures.shape) {
        spec.encoding.shape = measureToEncoding(chartConfig.measures.shape);
    }

    return spec;
}

function createPointLayer(chartConfig, opacity = 1) {
    const layer: any = {
        mark: {
            type: 'point',
            opacity: 1,
            filled: true,
            size: 100,
        },
    };

    if (chartConfig.measures.series) {
        // layer.encoding = { shape: measureToEncoding(chartConfig.measures.series) };
    }

    return layer;
}

function transformTrendlineData(chartConfig: ChartConfig, trendlineData: any) {
    const data = [];

    for (const series of trendlineData) {
        if (series.data === undefined) continue; // Skip any series that doesn't have enough data to render a line
        for (const row of series.data.generatedPoints) {
            data.push({
                [chartConfig.measures.series.name]: { value: series.name },
                [chartConfig.measures.x.name]: { value: row.x },
                [chartConfig.measures.y.name]: { value: row.y },
            });
        }
    }

    return data;
}

function createLineChart(chartConfig: ChartConfig, measureStore, trendlineData: any) {
    const spec: any = baseVegaLiteSpec(chartConfig, measureStore);
    const lineLayer: any = { mark: { type: 'line' } };
    if (trendlineData) lineLayer.data = { values: transformTrendlineData(chartConfig, trendlineData) };

    spec.layer.push(lineLayer);
    spec.layer.push(createPointLayer(chartConfig));

    if (chartConfig.measures.series) {
        spec.encoding.color = measureToEncoding(chartConfig.measures.series);
        spec.encoding.shape = measureToEncoding(chartConfig.measures.series);
    }

    return spec;
}

function createScatterPlot(chartConfig: ChartConfig, measureStore, trendlineData) {
    const spec: any = baseVegaLiteSpec(chartConfig, measureStore);
    spec.layer.push(createPointLayer(chartConfig, 0.8));

    return spec;
}

function createBoxPlot(chartConfig, measureStore, trendlineData) {
    const spec: any = baseVegaLiteSpec(chartConfig, measureStore);
    spec.layer.push({
        mark: {
            type: 'boxplot',
            ticks: true,
            // size: 100,
        },
    });
    spec.config = {

    };

    return spec;
}

interface Props {
    spec?: string; // TODO add type
    chart: DataViewInfo;
    chartConfig: ChartConfig;
    measureStore: any;
    trendlineData: any;
}

export const VegaLiteChart: FC<Props> = ({ spec, chartConfig, measureStore, trendlineData }) => {
    const vegaLiteSpec = useMemo(() => {
        if (spec) {
            try {
                return JSON.parse(spec);
            } catch (error) {
                return undefined;
            }
        }

        // if (!measureStore) return undefined;
        //
        // let spec_;
        //
        // if (chartConfig.renderType === 'line_plot') {
        //     spec = createLineChart(chartConfig, measureStore, trendlineData);
        // } else if (chartConfig.renderType === 'scatter_plot') {
        //     spec = createScatterPlot(chartConfig, measureStore, trendlineData);
        // } else if (chartConfig.renderType === 'box_plot') {
        //     spec = createBoxPlot(chartConfig, measureStore, trendlineData);
        // }

        // const spec_ = {
        //     "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
        //     "repeat": ["Horsepower", "Miles_per_Gallon", "Acceleration", "Displacement"],
        //     "columns": 2,
        //     "spec": {
        //         "data": {
        //             "values": [
        //                 {"Name": "Car A", "Horsepower": 130, "Miles_per_Gallon": 18, "Acceleration": 12.0, "Displacement": 307, "Origin": "USA"},
        //                 {"Name": "Car B", "Horsepower": 165, "Miles_per_Gallon": 15, "Acceleration": 11.5, "Displacement": 350, "Origin": "USA"},
        //                 {"Name": "Car C", "Horsepower": 150, "Miles_per_Gallon": 18, "Acceleration": 11.0, "Displacement": 318, "Origin": "USA"},
        //                 {"Name": "Car D", "Horsepower": 140, "Miles_per_Gallon": 16, "Acceleration": 12.0, "Displacement": 304, "Origin": "USA"},
        //                 {"Name": "Car E", "Horsepower": 198, "Miles_per_Gallon": 14, "Acceleration": 10.0, "Displacement": 429, "Origin": "USA"},
        //                 {"Name": "Car F", "Horsepower": 220, "Miles_per_Gallon": 14, "Acceleration": 9.0,  "Displacement": 454, "Origin": "USA"},
        //                 {"Name": "Car G", "Horsepower": 215, "Miles_per_Gallon": 14, "Acceleration": 8.5,  "Displacement": 440, "Origin": "USA"},
        //                 {"Name": "Car H", "Horsepower": 225, "Miles_per_Gallon": 14, "Acceleration": 10.0, "Displacement": 455, "Origin": "USA"},
        //
        //                 {"Name": "Car I", "Horsepower": 46,  "Miles_per_Gallon": 26, "Acceleration": 20.5, "Displacement": 97,  "Origin": "Europe"},
        //                 {"Name": "Car J", "Horsepower": 87,  "Miles_per_Gallon": 25, "Acceleration": 17.5, "Displacement": 110, "Origin": "Europe"},
        //                 {"Name": "Car K", "Horsepower": 90,  "Miles_per_Gallon": 24, "Acceleration": 14.5, "Displacement": 107, "Origin": "Europe"},
        //                 {"Name": "Car L", "Horsepower": 95,  "Miles_per_Gallon": 25, "Acceleration": 17.5, "Displacement": 104, "Origin": "Europe"},
        //                 {"Name": "Car M", "Horsepower": 113, "Miles_per_Gallon": 26, "Acceleration": 12.5, "Displacement": 121, "Origin": "Europe"},
        //
        //                 {"Name": "Car N", "Horsepower": 95,  "Miles_per_Gallon": 24, "Acceleration": 15.0, "Displacement": 113, "Origin": "Japan"},
        //                 {"Name": "Car O", "Horsepower": 88,  "Miles_per_Gallon": 27, "Acceleration": 14.5, "Displacement": 97,  "Origin": "Japan"},
        //                 {"Name": "Car P", "Horsepower": 60,  "Miles_per_Gallon": 30, "Acceleration": 21.0, "Displacement": 70,  "Origin": "Japan"},
        //                 {"Name": "Car Q", "Horsepower": 70,  "Miles_per_Gallon": 31, "Acceleration": 19.0, "Displacement": 71,  "Origin": "Japan"},
        //                 {"Name": "Car R", "Horsepower": 65,  "Miles_per_Gallon": 35, "Acceleration": 18.0, "Displacement": 80,  "Origin": "Japan"}
        //             ]
        //         },
        //         "mark": "bar",
        //         "encoding": {
        //             "x": {"field": {"repeat": "repeat"}, "bin": true},
        //             "y": {"aggregate": "count"},
        //             "color": {"field": "Origin"}
        //         }
        //     }
        // }
        //
        // return spec_;
        return undefined;
    }, [spec, chartConfig, trendlineData, measureStore]);

    const divWidth = 800;

    const chartOptions = useMemo(() => {
        if (!divWidth) return undefined;
        let width = chartConfig.width;
        if (width === undefined) {
            // Issue 49754: use getChartTypeBasedWidth() to determine width
            width = LABKEY_VIS.GenericChartHelper.getChartTypeBasedWidth(
                chartConfig.renderType,
                chartConfig.measures,
                measureStore,
                divWidth - 300
            );
        }
        return {
            // width: 300,
            // height: chartConfig.height ?? (width * 9) / 16,
            actions: { editor: false },
        };
    }, [chartConfig.height, chartConfig.measures, chartConfig.renderType, chartConfig.width, measureStore]);

    const canRender = vegaLiteSpec !== undefined && chartOptions !== undefined;

    return (
        <div className="vega-lite-chart">
            {canRender && <VegaEmbed options={chartOptions} spec={vegaLiteSpec} style={{ width: '100%' }} />}
        </div>
    );
};
