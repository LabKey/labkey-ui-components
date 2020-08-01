import { ISelectRowsResult, naturalSort } from '../..';
import { fromJS, OrderedMap } from 'immutable';

export function processChartData(response: ISelectRowsResult, countPath: string[] = ['count', 'value'], namePath: string[] = ['Name', 'value']): OrderedMap<string, any> {
    const rows = fromJS(response.models[response.key]);

    return rows
        .filter((row, key) => row.getIn(countPath) > 0)
        .map((row, key) => ({
            label: row.getIn(namePath),
            count: row.getIn(countPath)
        }))
        .sortBy(row => row.label, naturalSort);
}
