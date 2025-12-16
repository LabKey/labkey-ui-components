import React from 'react';
import { render } from '@testing-library/react';
import { ChartConfig } from './models';
import { LABKEY_VIS } from '../../constants';

import { ChartColorInputs, SeriesOptionRenderer, ShapeOptionRenderer, showColorOption, LineTypeOptionRenderer } from './ChartColorInputs';
import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';

LABKEY_VIS = {
    Scale: {
        ShapeMap: { circle: jest.fn },
    },
};

describe('showColorOption', () => {
    test('boxFillColor', () => {
        expect(showColorOption({ renderType: 'bar_chart' } as ChartConfig, 'boxFillColor')).toBe(true);
        expect(showColorOption({ renderType: 'box_plot' } as ChartConfig, 'boxFillColor')).toBe(true);
        expect(showColorOption({ renderType: 'line_plot' } as ChartConfig, 'boxFillColor')).toBe(false);
        expect(showColorOption({ renderType: 'scatter_plot' } as ChartConfig, 'boxFillColor')).toBe(false);
        expect(showColorOption({ renderType: 'pie_chart' } as ChartConfig, 'boxFillColor')).toBe(false);

        expect(
            showColorOption(
                { renderType: 'bar_chart', measures: { xSub: { name: 'test' } } } as ChartConfig,
                'boxFillColor'
            )
        ).toBe(false);
    });

    test('colorPaletteScale', () => {
        expect(showColorOption({ renderType: 'bar_chart' } as ChartConfig, 'colorPaletteScale')).toBe(false);
        expect(showColorOption({ renderType: 'box_plot' } as ChartConfig, 'colorPaletteScale')).toBe(false);
        expect(showColorOption({ renderType: 'line_plot' } as ChartConfig, 'colorPaletteScale')).toBe(false);
        expect(showColorOption({ renderType: 'scatter_plot' } as ChartConfig, 'colorPaletteScale')).toBe(false);
        expect(showColorOption({ renderType: 'pie_chart' } as ChartConfig, 'colorPaletteScale')).toBe(true);

        expect(
            showColorOption(
                { renderType: 'line_plot', measures: { series: { name: 'test' } } } as ChartConfig,
                'colorPaletteScale'
            )
        ).toBe(true);
        expect(
            showColorOption(
                { renderType: 'bar_chart', measures: { xSub: { name: 'test' } } } as ChartConfig,
                'colorPaletteScale'
            )
        ).toBe(true);
        expect(
            showColorOption(
                { renderType: 'box_plot', measures: { color: { name: 'test' } } } as ChartConfig,
                'colorPaletteScale'
            )
        ).toBe(true);
        expect(
            showColorOption(
                { renderType: 'scatter_plot', measures: { color: { name: 'test' } } } as ChartConfig,
                'colorPaletteScale'
            )
        ).toBe(true);
    });

    test('lineColor', () => {
        expect(showColorOption({ renderType: 'bar_chart' } as ChartConfig, 'lineColor')).toBe(true);
        expect(showColorOption({ renderType: 'box_plot' } as ChartConfig, 'lineColor')).toBe(true);
        expect(showColorOption({ renderType: 'line_plot' } as ChartConfig, 'lineColor')).toBe(false);
        expect(showColorOption({ renderType: 'scatter_plot' } as ChartConfig, 'lineColor')).toBe(false);
        expect(showColorOption({ renderType: 'pie_chart' } as ChartConfig, 'lineColor')).toBe(false);

        expect(
            showColorOption(
                { renderType: 'bar_chart', measures: { xSub: { name: 'test' } } } as ChartConfig,
                'lineColor'
            )
        ).toBe(false);
    });

    test('pointFillColor', () => {
        expect(showColorOption({ renderType: 'bar_chart' } as ChartConfig, 'pointFillColor')).toBe(false);
        expect(showColorOption({ renderType: 'box_plot' } as ChartConfig, 'pointFillColor')).toBe(true);
        expect(showColorOption({ renderType: 'line_plot' } as ChartConfig, 'pointFillColor')).toBe(true);
        expect(showColorOption({ renderType: 'scatter_plot' } as ChartConfig, 'pointFillColor')).toBe(true);
        expect(showColorOption({ renderType: 'pie_chart' } as ChartConfig, 'pointFillColor')).toBe(false);

        expect(
            showColorOption(
                { renderType: 'line_plot', measures: { series: { name: 'test' } } } as ChartConfig,
                'pointFillColor'
            )
        ).toBe(false);
        expect(
            showColorOption(
                { renderType: 'box_plot', measures: { color: { name: 'test' } } } as ChartConfig,
                'pointFillColor'
            )
        ).toBe(false);
        expect(
            showColorOption(
                { renderType: 'scatter_plot', measures: { color: { name: 'test' } } } as ChartConfig,
                'pointFillColor'
            )
        ).toBe(false);
    });
});

describe('ShapeOptionRenderer', () => {
    test('isValueRenderer false', () => {
        render(<ShapeOptionRenderer isValueRenderer={false} name="circle" />);
        expect(document.querySelectorAll('.chart-builder-type-option')).toHaveLength(1);
        expect(document.querySelectorAll('.chart-builder-type-option--value')).toHaveLength(0);
    });

    test('isValueRenderer true', () => {
        render(<ShapeOptionRenderer isValueRenderer name="circle" />);
        expect(document.querySelectorAll('.chart-builder-type-option')).toHaveLength(1);
        expect(document.querySelectorAll('.chart-builder-type-option--value')).toHaveLength(1);
    });
});

describe('SeriesOptionRenderer', () => {
    test('isValueRenderer false', () => {
        render(<SeriesOptionRenderer isValueRenderer={false} name="series1" seriesOptionMap={{}} />);
        expect(document.querySelectorAll('.chart-builder-type-option')).toHaveLength(1);
        expect(document.querySelectorAll('.chart-builder-type-option--value')).toHaveLength(0);
    });

    test('isValueRenderer true', () => {
        render(<SeriesOptionRenderer isValueRenderer name="series1" seriesOptionMap={{}} />);
        expect(document.querySelectorAll('.chart-builder-type-option')).toHaveLength(1);
        expect(document.querySelectorAll('.chart-builder-type-option--value')).toHaveLength(1);
    });

    test('without seriesOptionMap value', () => {
        render(<SeriesOptionRenderer isValueRenderer name="series1" seriesOptionMap={{}} />);
        expect(document.querySelector('.chart-builder-type-option').textContent).toBe('A series1');
        expect(document.querySelectorAll('.color-icon__chip-small')).toHaveLength(0);
        expect(document.querySelectorAll('i')).toHaveLength(0);
        expect(document.querySelectorAll('.letter-icon')).toHaveLength(1);
    });

    test('with seriesOptionMap value', () => {
        render(<SeriesOptionRenderer isValueRenderer name="series1" seriesOptionMap={{ series1: { color: 'red' } }} />);
        expect(document.querySelector('.chart-builder-type-option').textContent).toBe(' series1');
        expect(document.querySelectorAll('.color-icon__chip-small')).toHaveLength(1);
        expect(document.querySelectorAll('i')).toHaveLength(1);
        expect(document.querySelector('i').getAttribute('style')).toBe('background-color: red;');
        expect(document.querySelectorAll('.letter-icon')).toHaveLength(0);
    });
});

describe('LineTypeOptionRenderer', () => {
    test('isValueRenderer false', () => {
        render(<LineTypeOptionRenderer isValueRenderer={false} strokeValue="" />);
        expect(document.querySelectorAll('.chart-builder-type-option')).toHaveLength(1);
        expect(document.querySelectorAll('.chart-builder-type-option--value')).toHaveLength(0);
        expect(document.querySelector('svg path').getAttribute('stroke-dasharray')).toBe('');
    });

    test('isValueRenderer true', () => {
        render(<LineTypeOptionRenderer isValueRenderer strokeValue="" />);
        expect(document.querySelectorAll('.chart-builder-type-option')).toHaveLength(1);
        expect(document.querySelectorAll('.chart-builder-type-option--value')).toHaveLength(1);
        expect(document.querySelector('svg path').getAttribute('stroke-dasharray')).toBe('');
    });

    test('dashed line type', () => {
        render(<LineTypeOptionRenderer isValueRenderer strokeValue="12, 3" />);
        expect(document.querySelector('svg path').getAttribute("stroke-dasharray")).toBe('12, 3');
    });

    test('dotted line type', () => {
        render(<LineTypeOptionRenderer isValueRenderer strokeValue="1, 1" />);
        expect(document.querySelector('svg path').getAttribute("stroke-dasharray")).toBe('1, 1');
    });
});

describe('ChartColorInputs', () => {
    const model = makeTestQueryModel(new SchemaQuery('schema', 'query'), undefined, [], 0);

    test('default bar chart', () => {
        render(
            <ChartColorInputs
                chartConfig={{ renderType: 'bar_chart', geomOptions: {} } as ChartConfig}
                model={model}
                setChartConfig={jest.fn()}
            />
        );
        expect(document.querySelectorAll('.row')).toHaveLength(1);
        expect(document.querySelectorAll('.color-picker')).toHaveLength(2);
        expect(document.querySelectorAll('.select-input')).toHaveLength(0);
    });

    test('default pie chart', () => {
        render(
            <ChartColorInputs
                chartConfig={{ renderType: 'pie_chart', geomOptions: {} } as ChartConfig}
                model={model}
                setChartConfig={jest.fn()}
            />
        );
        expect(document.querySelectorAll('.row')).toHaveLength(2);
        expect(document.querySelectorAll('.color-picker')).toHaveLength(0);
        expect(document.querySelectorAll('.select-input')).toHaveLength(1);
    });

    test('default box plot', () => {
        render(
            <ChartColorInputs
                chartConfig={{ renderType: 'box_plot', geomOptions: {} } as ChartConfig}
                model={model}
                setChartConfig={jest.fn()}
            />
        );
        expect(document.querySelectorAll('.row')).toHaveLength(1);
        expect(document.querySelectorAll('.color-picker')).toHaveLength(3);
        expect(document.querySelectorAll('.select-input')).toHaveLength(0);
    });

    test('default scatter plot', () => {
        render(
            <ChartColorInputs
                chartConfig={{ renderType: 'scatter_plot', geomOptions: {} } as ChartConfig}
                model={model}
                setChartConfig={jest.fn()}
            />
        );
        expect(document.querySelectorAll('.row')).toHaveLength(1);
        expect(document.querySelectorAll('.color-picker')).toHaveLength(1);
        expect(document.querySelectorAll('.select-input')).toHaveLength(0);
    });

    test('scatter plot with color', () => {
        render(
            <ChartColorInputs
                chartConfig={
                    {
                        renderType: 'scatter_plot',
                        geomOptions: {},
                        measures: { color: { name: 'test' } },
                    } as ChartConfig
                }
                model={model}
                setChartConfig={jest.fn()}
            />
        );
        expect(document.querySelectorAll('.row')).toHaveLength(2);
        expect(document.querySelectorAll('.color-picker')).toHaveLength(0);
        expect(document.querySelectorAll('.select-input')).toHaveLength(1);
    });

    test('default line plot', () => {
        render(
            <ChartColorInputs
                chartConfig={{ renderType: 'line_plot', geomOptions: {} } as ChartConfig}
                model={model}
                setChartConfig={jest.fn()}
            />
        );
        expect(document.querySelectorAll('.row')).toHaveLength(1);
        expect(document.querySelectorAll('.color-picker')).toHaveLength(1);
        expect(document.querySelectorAll('.select-input')).toHaveLength(0);
    });

    test('line plot with series', () => {
        render(
            <ChartColorInputs
                chartConfig={
                    {
                        renderType: 'line_plot',
                        geomOptions: {},
                        measures: { series: { name: 'test' } },
                    } as ChartConfig
                }
                model={model}
                setChartConfig={jest.fn()}
            />
        );
        expect(document.querySelectorAll('.row')).toHaveLength(2);
        expect(document.querySelectorAll('.color-picker')).toHaveLength(0);
        expect(document.querySelectorAll('.select-input')).toHaveLength(1);
    });
});
