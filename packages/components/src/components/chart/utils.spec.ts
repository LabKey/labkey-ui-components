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
});
