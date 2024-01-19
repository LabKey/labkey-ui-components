import { CHART_GROUPS } from './configs';
import { ChartData } from './types';

describe('CHART_GROUPS', () => {
    test('getAppURL', () => {
        let row = { x: 'x', xSub: 'xSub' } as ChartData;
        expect(CHART_GROUPS.Assays.getAppURL(row).toHref()).toBe('#/assays/general/x/runs');
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

    test('getProjectExclusionFilter', () => {
        const projectExclusions = {
            AssayDesign: [5, 6],
            DashboardSampleType: [1, 2],
            SampleType: [3, 4],
        };

        expect(CHART_GROUPS.Assays.getProjectExclusionFilter(projectExclusions).getValue()).toStrictEqual([5, 6]);
        expect(CHART_GROUPS.Samples.getProjectExclusionFilter(projectExclusions).getValue()).toStrictEqual([
            3, 4, 1, 2,
        ]);
        expect(CHART_GROUPS.SampleStatuses.getProjectExclusionFilter(projectExclusions).getValue()).toStrictEqual([
            3, 4, 1, 2,
        ]);
    });
});
