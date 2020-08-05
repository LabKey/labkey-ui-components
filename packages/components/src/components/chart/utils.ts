import { fromJS } from 'immutable';

import { ISelectRowsResult, naturalSort } from '../..';

interface ChartDataProps {
    data: any[],
    barFillColors: { [key: string]: string },
}

export function processChartData(
    response: ISelectRowsResult,
    countPath: string[] = ['count', 'value'],
    namePath: string[] = ['Name', 'value'],
    colorPath?: string[]
): ChartDataProps {
    const rows = fromJS(response.models[response.key]);

    const data = rows
        .filter((row) => row.getIn(countPath) > 0)
        .map((row) => ({
            label: row.getIn(namePath),
            count: row.getIn(countPath),
        }))
        .sortBy(row => row.label, naturalSort)
        .toArray();

    let barFillColors;
    if (colorPath) {
        barFillColors = {};
        rows.map((row) => {
            barFillColors[row.getIn(namePath)] = row.getIn(colorPath);
        });
    }

    return { data, barFillColors } as ChartDataProps;
}
