import { CHART_GROUPS } from './configs';
import { ChartData } from './types';

describe('CHART_GROUPS', () => {
    test('getAppURL', () => {
        let row = { x: 'x', xSub: 'xSub' } as ChartData;
        expect(CHART_GROUPS.Assays.getAppURL(row).toHref()).toBe('#/assays/general/x/overview');
        expect(CHART_GROUPS.Samples.getAppURL(row).toHref()).toBe('#/samples/x');
        expect(CHART_GROUPS.SampleStatuses.getAppURL(row, { target: { tagName: 'title' } }).toHref()).toBe(
            '#/samples/xSub'
        );
        expect(CHART_GROUPS.SampleStatuses.getAppURL(row, { target: { tagName: 'rect' } }).toHref()).toBe(
            '#/samples/xSub?query.SampleState/Label~eq=x'
        );
        row = { x: 'No Status', xSub: 'xSub' } as ChartData;
        expect(CHART_GROUPS.SampleStatuses.getAppURL(row, { target: { tagName: 'rect' } }).toHref()).toBe(
            '#/samples/xSub?query.SampleState/Label~isblank='
        );
    });
});
