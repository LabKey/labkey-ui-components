import { ISelectRowsResult, processChartData } from '../..';
import AssayRunCountsRowsJson from '../../test/data/AssayRunCounts-getQueryRows.json';

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

    test('barFillColors', () => {
        let barFillColors = processChartData(response, ['TotalCount', 'value']).barFillColors;
        expect(barFillColors).toBe(undefined);

        barFillColors = processChartData(response, ['TotalCount', 'value'], ['Name', 'value'], ['Color', 'value']).barFillColors;
        expect(Object.keys(barFillColors).length).toBe(4);
        expect(barFillColors['GPAT 1']).toBe('#ffffff');
        expect(barFillColors['GPAT 10']).toBe('#dddddd');
    });
});
