import { ISelectRowsResult, processChartData } from '../../..';
import AssayRunCountsRowsJson from '../../../test/data/AssayRunCounts-getQueryRows.json';

import { getBarChartPlotConfig } from './utils';

describe('processChartData', () => {
    const response = {
        key: '0',
        models: { 0: AssayRunCountsRowsJson },
    } as ISelectRowsResult;

    test('with data', () => {
        const data = processChartData(response, ['TotalCount', 'value']).data;
        expect(data.length).toBe(4);
        expect(data[0].label).toBe('GPAT 1');
        expect(data[0].count).toBe(6);
        expect(data[3].label).toBe('GPAT 25 with a longer name then the rest');
        expect(data[3].count).toBe(1);
    });

    test('without data', () => {
        const data = processChartData(response, ['TodayCount', 'value']).data;
        expect(data.length).toBe(0);
    });

    test('with alternate label field', () => {
        const data = processChartData(response, ['TotalCount', 'value'], ['RowId', 'value']).data;
        expect(data.length).toBe(4);
        expect(data[0].label).toBe(5051);
    });

    test('barFillColors without colorPath', () => {
        const barFillColors = processChartData(response, ['TotalCount', 'value']).barFillColors;
        expect(barFillColors).toBe(undefined);
    });

    test('barFillColors with colorPath', () => {
        const barFillColors = processChartData(response, ['TotalCount', 'value'], ['Name', 'value'], ['Color', 'value'])
            .barFillColors;
        expect(Object.keys(barFillColors).length).toBe(4);
        expect(barFillColors['GPAT 1']).toBe('#ffffff');
        expect(barFillColors['GPAT 10']).toBe('#dddddd');
    });

    test('getBarChartPlotConfig default props', () => {
        const config = getBarChartPlotConfig({
            renderTo: 'renderToTest',
            title: 'titleTest',
            width: 100,
            data: [],
        });

        expect(JSON.stringify(Object.keys(config.aes))).toBe('["x","y"]');
        expect(JSON.stringify(Object.keys(config.scales))).toBe('["y"]');
        expect(config.height).toBe(undefined);
        expect(config.width).toBe(100);
        expect(config.options.clickFn).toBe(undefined);
        expect(config.options.color).toBe(undefined);
        expect(config.options.fill).toBe(undefined);
    });

    test('getBarChartPlotConfig custom props', () => {
        const config = getBarChartPlotConfig({
            renderTo: 'renderToTest',
            title: 'titleTest',
            width: 100,
            data: [],
            height: 100,
            defaultFillColor: 'red',
            defaultBorderColor: 'blue',
            barFillColors: { test1: 'green' },
            onClick: jest.fn,
        });

        expect(JSON.stringify(Object.keys(config.aes))).toBe('["x","y","color"]');
        expect(JSON.stringify(Object.keys(config.scales))).toBe('["y","color"]');
        expect(config.height).toBe(100);
        expect(config.width).toBe(100);
        expect(config.options.clickFn).toBe(jest.fn);
        expect(config.options.color).toBe('blue');
        expect(config.options.fill).toBe('red');
        expect(config.scales.color.scale('test1')).toBe('green');
        expect(config.scales.color.scale('test2')).toBe('red');
    });
});
