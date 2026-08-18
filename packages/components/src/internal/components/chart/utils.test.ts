/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Map } from 'immutable';

import {
    createHorizontalBarCountLegendData,
    createHorizontalBarLegendData,
    getDefaultBarChartAxisLabel,
    getFieldDataType,
    getSelectOptions,
    shouldShowAggregateOptions,
    shouldShowRangeScaleOptions,
} from './utils';
import { ChartConfig, ChartFieldInfo, ChartTypeInfo } from './models';
import { LABKEY_VIS } from '../../constants';
import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { QueryInfo } from '../../../public/QueryInfo';
import { ViewInfo } from '../../ViewInfo';

LABKEY_VIS = {
    GenericChartHelper: {
        getAllowableTypes: () => ['int', 'double'],
        isNumericType: (type: string) => type === 'int',
    },
};

describe('createHorizontalBarLegendData', () => {
    test('all different', () => {
        expect(
            createHorizontalBarLegendData([
                {
                    title: "22 'Sample Type 1' samples",
                    name: 'Sample Type 1',
                    count: 22,
                    totalCount: 82,
                    percent: 26.82926829268293,
                    backgroundColor: 'blue',
                    href: '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 1',
                    filled: true,
                },
                {
                    title: "20 'Sample Type 2' samples",
                    name: 'Sample Type 2',
                    count: 20,
                    totalCount: 82,
                    percent: 24.390243902439025,
                    backgroundColor: 'green',
                    href: '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 2',
                    filled: true,
                },
                {
                    title: "10 'Sample Type 3' samples",
                    name: 'Sample Type 3',
                    count: 10,
                    totalCount: 82,
                    percent: 12.195121951219512,
                    backgroundColor: 'red',
                    href: '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 3',
                    filled: true,
                },
                {
                    title: "30 'Sample Type 4' samples",
                    name: 'Sample Type 4',
                    count: 30,
                    totalCount: 82,
                    percent: 36.58536585365854,
                    backgroundColor: 'orange',
                    href: '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 4',
                    filled: true,
                },
            ])
        ).toStrictEqual([
            {
                circleColor: 'blue',
                backgroundColor: 'none',
                legendLabel: 'Sample Type 1',
            },
            {
                circleColor: 'green',
                backgroundColor: 'none',
                legendLabel: 'Sample Type 2',
            },
            {
                circleColor: 'red',
                backgroundColor: 'none',
                legendLabel: 'Sample Type 3',
            },
            {
                circleColor: 'orange',
                backgroundColor: 'none',
                legendLabel: 'Sample Type 4',
            },
        ]);
    });

    test('some colors the same', () => {
        expect(
            createHorizontalBarLegendData([
                {
                    title: "22 'Sample Type 1' samples",
                    name: 'Sample Type 1',
                    count: 22,
                    totalCount: 82,
                    percent: 26.82926829268293,
                    backgroundColor: 'blue',
                    href: '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 1',
                    filled: true,
                },
                {
                    title: "20 'Sample Type 2' samples",
                    name: 'Sample Type 2',
                    count: 20,
                    totalCount: 82,
                    percent: 24.390243902439025,
                    backgroundColor: 'blue',
                    href: '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 2',
                    filled: true,
                },
                {
                    title: "10 'Sample Type 3' samples",
                    name: 'Sample Type 3',
                    count: 10,
                    totalCount: 82,
                    percent: 12.195121951219512,
                    backgroundColor: 'red',
                    href: '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 3',
                    filled: true,
                },
                {
                    title: "30 'Sample Type 4' samples",
                    name: 'Sample Type 4',
                    count: 30,
                    totalCount: 82,
                    percent: 36.58536585365854,
                    backgroundColor: 'blue',
                    href: '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 4',
                    filled: true,
                },
            ])
        ).toStrictEqual([
            {
                circleColor: 'blue',
                backgroundColor: 'none',
                legendLabel: 'Sample Type 1, Sample Type 2, Sample Type 4',
            },
            {
                circleColor: 'red',
                backgroundColor: 'none',
                legendLabel: 'Sample Type 3',
            },
        ]);
    });

    test('repeated types', () => {
        const data = [
            {
                title: "22 'Sample Type 1' samples",
                name: 'Sample Type 1',
                count: 22,
                totalCount: 82,
                percent: 26.82926829268293,
                backgroundColor: 'blue',
                href: '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 1',
                filled: true,
            },
            {
                title: "20 'Sample Type 1' samples",
                name: 'Sample Type 1',
                count: 20,
                totalCount: 82,
                percent: 24.390243902439025,
                backgroundColor: 'blue',
                href: '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 1',
                filled: true,
            },
            {
                title: "10 'Sample Type 2' samples",
                name: 'Sample Type 2',
                count: 10,
                totalCount: 82,
                percent: 12.195121951219512,
                backgroundColor: 'red',
                href: '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 2',
                filled: true,
            },
            {
                title: "30 'Sample Type 3' samples",
                name: 'Sample Type 3',
                count: 30,
                totalCount: 82,
                percent: 36.58536585365854,
                backgroundColor: 'red',
                href: '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 3',
                filled: true,
            },
        ];
        expect(createHorizontalBarLegendData(data)).toStrictEqual([
            {
                circleColor: 'blue',
                backgroundColor: 'none',
                legendLabel: 'Sample Type 1',
            },
            {
                circleColor: 'red',
                backgroundColor: 'none',
                legendLabel: 'Sample Type 2, Sample Type 3',
            },
        ]);
        expect(createHorizontalBarCountLegendData(data, 'Empty Space', 'Empty Spaces')).toStrictEqual([
            {
                circleColor: 'blue',
                backgroundColor: 'none',
                data: Map.of(
                    'value',
                    '22',
                    'url',
                    '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 1'
                ),
                legendLabel: 'Sample Type 1',
                barIndex: 0,
            },
            {
                circleColor: 'blue',
                backgroundColor: 'none',
                data: Map.of(
                    'value',
                    '20',
                    'url',
                    '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 1'
                ),
                legendLabel: 'Sample Type 1',
                barIndex: 1,
            },
            {
                circleColor: 'red',
                backgroundColor: 'none',
                data: Map.of(
                    'value',
                    '10',
                    'url',
                    '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 2'
                ),
                legendLabel: 'Sample Type 2',
                barIndex: 2,
            },
            {
                circleColor: 'red',
                backgroundColor: 'none',
                data: Map.of(
                    'value',
                    '30',
                    'url',
                    '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 3'
                ),
                legendLabel: 'Sample Type 3',
                barIndex: 3,
            },
        ]);
    });

    test('only filled', () => {
        const data = [
            {
                title: "22 'Sample Type 1' samples",
                name: 'Sample Type 1',
                count: 22,
                totalCount: 82,
                percent: 26.82926829268293,
                backgroundColor: 'blue',
                href: '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 1',
                filled: true,
            },
            {
                title: '6000 spaces available',
                count: 6000,
                totalCount: 82,
                percent: 73.17073,
                backgroundColor: undefined,
                filled: false,
            },
        ];
        expect(createHorizontalBarLegendData(data)).toStrictEqual([
            {
                circleColor: 'blue',
                backgroundColor: 'none',
                legendLabel: 'Sample Type 1',
            },
        ]);
        expect(createHorizontalBarCountLegendData(data, 'space', 'spaces')).toStrictEqual([
            {
                circleColor: 'blue',
                backgroundColor: 'none',
                data: Map.of(
                    'value',
                    '22',
                    'url',
                    '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 1'
                ),
                legendLabel: 'Sample Type 1',
                barIndex: 0,
            },
            {
                circleColor: 'fff',
                backgroundColor: 'none',
                data: Map.of('value', '6,000'),
                legendLabel: 'spaces',
                barIndex: 1,
            },
        ]);
    });

    describe('sectionLabel', () => {
        const bar = (
            name: string,
            sectionLabel: string,
            count: number,
            backgroundColor: string,
            unlabeled?: boolean
        ) => ({
            title: `${count} '${sectionLabel}' samples (${name})`,
            name,
            sectionLabel,
            count,
            totalCount: 100,
            percent: count,
            backgroundColor,
            filled: true,
            unlabeled,
        });

        test('section with multiple bars gets a header', () => {
            const legend = createHorizontalBarCountLegendData(
                [bar('Red', 'Blood', 12, '#ff0000'), bar('Blue', 'Blood', 8, '#0000ff')],
                'space',
                'spaces'
            );

            expect(legend).toHaveLength(3);
            expect(legend[0]).toStrictEqual({
                circleColor: 'none',
                backgroundColor: 'none',
                legendLabel: 'Blood',
                isSectionHeader: true,
                separatorAbove: false, // nothing above the first row to separate it from
                data: Map.of('value', '20'), // the section total
            });
            // the section label is not repeated in each row
            expect(legend[1].legendLabel).toBe('Red');
            expect(legend[1].barIndex).toBe(0);
            expect(legend[2].legendLabel).toBe('Blue');
            expect(legend[2].barIndex).toBe(1);
        });

        test('section with a single unlabeled bar renders as a plain row labeled by the section', () => {
            const legend = createHorizontalBarCountLegendData(
                [bar('No Color', 'Blood', 12, '#ff0000', true)],
                'space',
                'spaces'
            );

            expect(legend).toHaveLength(1);
            expect(legend[0].isSectionHeader).toBeUndefined();
            expect(legend[0].legendLabel).toBe('Blood');
            expect(legend[0].circleColor).toBe('#ff0000');
            expect(legend[0].barIndex).toBe(0);
        });

        test('section with a single labeled bar keeps its header', () => {
            const legend = createHorizontalBarCountLegendData([bar('Red', 'Blood', 12, '#ff0000')], 'space', 'spaces');

            expect(legend).toHaveLength(2);
            expect(legend[0]).toStrictEqual({
                circleColor: 'none',
                backgroundColor: 'none',
                legendLabel: 'Blood',
                isSectionHeader: true,
                separatorAbove: false,
                data: Map.of('value', '12'),
            });
            expect(legend[1].legendLabel).toBe('Red');
            expect(legend[1].circleColor).toBe('#ff0000');
            expect(legend[1].barIndex).toBe(0);
        });

        test('mixes sections, single-bar sections and unsectioned rows', () => {
            const legend = createHorizontalBarCountLegendData(
                [
                    bar('Red', 'Blood', 12, '#ff0000'),
                    bar('Blue', 'Blood', 8, '#0000ff'),
                    bar('No Color', 'Plasma', 22, 'green', true),
                    { title: '4 spaces available', count: 4, totalCount: 100, percent: 4, filled: false },
                ],
                'space',
                'spaces'
            );

            expect(legend.map(l => l.legendLabel)).toStrictEqual(['Blood', 'Red', 'Blue', 'Plasma', 'spaces']);
            expect(legend.map(l => l.barIndex)).toStrictEqual([undefined, 0, 1, 2, 3]);
            // a rule closes off the Blood section; nothing separates the two unsectioned rows that follow
            expect(legend.map(l => !!l.separatorAbove)).toStrictEqual([false, false, false, true, false]);
        });

        test('separators fence each section off from its neighbors', () => {
            const legend = createHorizontalBarCountLegendData(
                [
                    { title: 'a', name: 'Other', count: 3, totalCount: 100, percent: 3, filled: true },
                    bar('Red', 'Blood', 12, '#ff0000'),
                    bar('Blue', 'Blood', 8, '#0000ff'),
                    bar('Red', 'Plasma', 5, '#ff0000'),
                    bar('Green', 'Plasma', 4, 'green'),
                ],
                'space',
                'spaces'
            );

            expect(legend.map(l => l.legendLabel)).toStrictEqual([
                'Other',
                'Blood',
                'Red',
                'Blue',
                'Plasma',
                'Red',
                'Green',
            ]);
            // only the two section headers carry a rule -- the leading unsectioned row does not
            expect(legend.map(l => !!l.separatorAbove)).toStrictEqual([
                false,
                true,
                false,
                false,
                true,
                false,
                false,
            ]);
        });

        test('same section label split by another section is not merged', () => {
            const legend = createHorizontalBarCountLegendData(
                [
                    bar('No Color', 'Blood', 12, '#ff0000', true),
                    bar('No Color', 'Plasma', 8, '#ff0000', true),
                    bar('No Color', 'Blood', 5, 'b', true),
                ],
                'space',
                'spaces'
            );

            expect(legend.map(l => l.legendLabel)).toStrictEqual(['Blood', 'Plasma', 'Blood']);
            expect(legend.every(l => !l.isSectionHeader)).toBe(true);
        });

        test('runs of the same section label are not merged across an intervening section', () => {
            const legend = createHorizontalBarCountLegendData(
                [bar('Red', 'Blood', 12, '#ff0000'), bar('Red', 'Plasma', 8, '#ff0000'), bar('Blue', 'Blood', 5, 'b')],
                'space',
                'spaces'
            );

            expect(legend.map(l => l.legendLabel)).toStrictEqual(['Blood', 'Red', 'Plasma', 'Red', 'Blood', 'Blue']);
            expect(legend.map(l => !!l.isSectionHeader)).toStrictEqual([true, false, true, false, true, false]);
            expect(legend.map(l => l.barIndex)).toStrictEqual([undefined, 0, undefined, 1, undefined, 2]);
        });
    });
});

describe('getFieldDataType', () => {
    test('without data', () => {
        expect(getFieldDataType(undefined)).toBe(undefined);
        expect(getFieldDataType(null)).toBe(undefined);
        expect(getFieldDataType({})).toBe(undefined);
        expect(getFieldDataType({ displayFieldJsonType: undefined, jsonType: undefined, type: undefined })).toBe(
            undefined
        );
    });

    test('with data', () => {
        expect(getFieldDataType({ displayFieldJsonType: 'string' })).toBe('string');
        expect(getFieldDataType({ jsonType: 'string' })).toBe('string');
        expect(getFieldDataType({ type: 'string' })).toBe('string');
        expect(getFieldDataType({ displayFieldJsonType: 'string', jsonType: 'int', type: 'date' })).toBe('string');
        expect(getFieldDataType({ displayFieldJsonType: undefined, jsonType: 'int', type: 'date' })).toBe('int');
        expect(getFieldDataType({ displayFieldJsonType: undefined, jsonType: undefined, type: 'date' })).toBe('date');
    });
});

const BAR_CHART_TYPE = {
    name: 'bar_chart',
} as ChartTypeInfo;
const BOX_PLOT_TYPE = {
    name: 'box_plot',
} as ChartTypeInfo;
const SCATTER_PLOT_TYPE = {
    name: 'scatter_plot',
} as ChartTypeInfo;
const LINE_PLOT_TYPE = {
    name: 'line_plot',
} as ChartTypeInfo;

const xField = { name: 'x' } as ChartFieldInfo;
const yField = { name: 'y' } as ChartFieldInfo;

describe('shouldShowRangeScaleOptions', () => {
    test('based on chart type', () => {
        expect(shouldShowRangeScaleOptions(xField, BAR_CHART_TYPE)).toBe(false);
        expect(shouldShowRangeScaleOptions(yField, BAR_CHART_TYPE)).toBe(true);
        expect(shouldShowRangeScaleOptions(xField, BOX_PLOT_TYPE)).toBe(false);
        expect(shouldShowRangeScaleOptions(yField, BOX_PLOT_TYPE)).toBe(true);
        expect(shouldShowRangeScaleOptions(xField, SCATTER_PLOT_TYPE)).toBe(true);
        expect(shouldShowRangeScaleOptions(yField, SCATTER_PLOT_TYPE)).toBe(true);
        expect(shouldShowRangeScaleOptions(xField, LINE_PLOT_TYPE)).toBe(true);
        expect(shouldShowRangeScaleOptions(yField, LINE_PLOT_TYPE)).toBe(true);
    });

    test('based on field name', () => {
        expect(shouldShowRangeScaleOptions({ name: 'series' } as ChartFieldInfo, BAR_CHART_TYPE)).toBe(false);
        expect(shouldShowRangeScaleOptions({ name: 'series' } as ChartFieldInfo, BOX_PLOT_TYPE)).toBe(false);
        expect(shouldShowRangeScaleOptions({ name: 'series' } as ChartFieldInfo, SCATTER_PLOT_TYPE)).toBe(false);
        expect(shouldShowRangeScaleOptions({ name: 'series' } as ChartFieldInfo, LINE_PLOT_TYPE)).toBe(false);
    });
});

describe('shouldShowAggregateOptions', () => {
    test('based on chart type', () => {
        expect(shouldShowAggregateOptions(xField, BAR_CHART_TYPE)).toBe(false);
        expect(shouldShowAggregateOptions(yField, BAR_CHART_TYPE)).toBe(true);
        expect(shouldShowAggregateOptions(xField, BOX_PLOT_TYPE)).toBe(false);
        expect(shouldShowAggregateOptions(yField, BOX_PLOT_TYPE)).toBe(false);
        expect(shouldShowAggregateOptions(xField, SCATTER_PLOT_TYPE)).toBe(false);
        expect(shouldShowAggregateOptions(yField, SCATTER_PLOT_TYPE)).toBe(false);
        expect(shouldShowAggregateOptions(xField, LINE_PLOT_TYPE)).toBe(false);
        expect(shouldShowAggregateOptions(yField, LINE_PLOT_TYPE)).toBe(true);
    });
});

describe('getDefaultBarChartAxisLabel', () => {
    test('no aggregate', () => {
        expect(getDefaultBarChartAxisLabel({ measures: {} } as ChartConfig)).toBe('Count');
        expect(getDefaultBarChartAxisLabel({ measures: { x: { label: 'Test' } } } as ChartConfig)).toBe('Count');
    });

    test('with aggregate', () => {
        expect(getDefaultBarChartAxisLabel({ measures: { y: { label: 'Test' } } } as ChartConfig)).toBe('Sum of Test');
        expect(getDefaultBarChartAxisLabel({ measures: { y: { label: 'Test', aggregate: undefined } } } as ChartConfig)).toBe(
            'Sum of Test'
        );
        expect(
            getDefaultBarChartAxisLabel({
                measures: { y: { label: 'Test', aggregate: 'Min' } },
            } as ChartConfig)
        ).toBe('Min of Test');
        expect(
            getDefaultBarChartAxisLabel({
                measures: { y: { label: 'Test', aggregate: 'Max' } },
            } as ChartConfig)
        ).toBe('Max of Test');
    });
});

describe('getSelectOptions', () => {
    const columns = [
        { fieldKey: 'intCol', jsonType: 'int' },
        { fieldKey: 'doubleCol', jsonType: 'double' },
        { fieldKey: 'textCol', jsonType: 'string' },
    ];

    const model = makeTestQueryModel(
        new SchemaQuery('schema', 'query', 'view'),
        QueryInfo.fromJsonForTests(
            {
                columns,
                name: 'query',
                schemaName: 'schema',
                views: [
                    { columns, name: ViewInfo.DEFAULT_NAME },
                    { columns, name: 'view' },
                ],
            },
            true
        ),
        [],
        0
    );

    test('hasMatchingType', () => {
        LABKEY_VIS.GenericChartHelper = {
            ...LABKEY_VIS.GenericChartHelper,
            isMeasureDimensionMatch: () => false,
        };
        const field = { name: 'x' } as ChartFieldInfo;
        const options = getSelectOptions(model, BAR_CHART_TYPE, field);
        expect(options.length).toBe(2);
    });

    test('isMeasureDimensionMatch', () => {
        LABKEY_VIS.GenericChartHelper = {
            ...LABKEY_VIS.GenericChartHelper,
            isMeasureDimensionMatch: () => true,
        };
        const field = { name: 'x' } as ChartFieldInfo;
        const options = getSelectOptions(model, BAR_CHART_TYPE, field);
        expect(options.length).toBe(3);
    });
});
