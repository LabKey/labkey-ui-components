import { Map } from 'immutable';

import {
    createHorizontalBarCountLegendData,
    createHorizontalBarLegendData,
    getFieldDataType, getSelectOptions,
    shouldShowAggregateOptions,
    shouldShowRangeScaleOptions,
} from './utils';
import { ChartFieldInfo, ChartTypeInfo } from './models';
import { LABKEY_VIS } from "../../constants";
import {makeTestQueryModel} from "../../../public/QueryModel/testUtils";
import {SchemaQuery} from "../../../public/SchemaQuery";
import {QueryInfo} from "../../../public/QueryInfo";
import {ViewInfo} from "../../ViewInfo";

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
            },
            {
                circleColor: 'fff',
                backgroundColor: 'none',
                data: Map.of('value', '6,000'),
                legendLabel: 'spaces',
            },
        ]);
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
