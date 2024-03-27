import React from 'react';
import { render, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';
import { TEST_USER_EDITOR, TEST_USER_READER } from '../../userFixtures';
import { makeTestActions, makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { LABKEY_VIS } from '../../constants';

import { QueryInfo } from '../../../public/QueryInfo';

import { ViewInfo } from '../../ViewInfo';

import {
    ChartBuilderModal,
    ChartFieldInfo,
    ChartTypeInfo,
    getChartBuilderChartConfig,
    getChartBuilderQueryConfig,
    getChartRenderMsg,
    getSelectOptions,
    MAX_POINT_DISPLAY,
    MAX_ROWS_PREVIEW,
} from './ChartBuilderModal';
import { ChartConfig, ChartQueryConfig, GenericChartModel } from './models';

const BAR_CHART_TYPE = {
    name: 'bar_chart',
    fields: [
        { name: 'x', label: 'X Axis', required: true },
        { name: 'y', label: 'Y Axis', required: false },
    ],
    title: 'Bar',
} as ChartTypeInfo;
const SCATTER_PLOT_TYPE = {
    name: 'scatter_plot',
    fields: [
        { name: 'x', label: 'X Axis', required: true },
        { name: 'y', label: 'Y Axis', required: true },
        { name: 'color', label: 'Color', required: false },
    ],
    title: 'Scatter',
} as ChartTypeInfo;

LABKEY_VIS = {
    GenericChartHelper: {
        getRenderTypes: () => [
            BAR_CHART_TYPE,
            SCATTER_PLOT_TYPE,
            {
                name: 'hidden_chart',
                fields: [],
                hidden: true,
                title: 'Hidden',
            } as ChartTypeInfo,
            {
                name: 'time_chart',
                fields: [],
                title: 'Time',
            } as ChartTypeInfo,
        ],
        getQueryConfigSortKey: () => 'lsid',
        queryChartData: () => Promise.resolve({}),
        getAllowableTypes: () => ['int', 'double'],
        isMeasureDimensionMatch: () => true,
    },
};

const actions = makeTestActions();
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
const SERVER_CONTEXT = {
    user: TEST_USER_EDITOR,
};

describe('ChartBuilderModal', () => {
    function validate(isNew: boolean, canShare = true, canDelete = false) {
        expect(document.querySelectorAll('.chart-builder-modal')).toHaveLength(1);
        expect(document.querySelector('.modal-title').textContent).toBe(isNew ? 'Create Chart' : 'Edit Chart');
        expect(document.querySelectorAll('.btn')).toHaveLength(canDelete ? 3 : 2);

        expect(document.querySelectorAll('.alert')).toHaveLength(0);
        expect(document.querySelectorAll('.col-left')).toHaveLength(1);
        expect(document.querySelectorAll('.col-right')).toHaveLength(1);

        // hidden chart types are filtered out
        const chartTypeItems = document.querySelectorAll('.chart-builder-type');
        expect(chartTypeItems).toHaveLength(2);
        expect(chartTypeItems[0].textContent).toBe('Bar');
        expect(chartTypeItems[1].textContent).toBe('Scatter');

        expect(document.querySelector('input[name="name"]')).not.toBeNull();

        expect(document.querySelectorAll('.chart-preview-msg')).toHaveLength(0);
        expect(document.querySelectorAll('.chart-preview-body')).toHaveLength(isNew ? 0 : 1);

        const saveBtn = document.querySelector('.btn-success');
        expect(saveBtn.textContent).toBe(isNew ? 'Create Chart' : 'Save Chart');
        expect(saveBtn.getAttribute('disabled')).toBe('');
    }

    test('default props without savedChartModel', () => {
        renderWithAppContext(
            <ChartBuilderModal actions={actions} model={model} onHide={jest.fn()} savedChartModel={undefined} />,
            {
                serverContext: SERVER_CONTEXT,
            }
        );

        validate(true);

        // default to selecting the first chart type
        expect(document.querySelector('.selected').textContent).toBe('Bar');
        expect(document.querySelector('.selectable').textContent).toBe('Scatter');
        // selected should use blue icon and selectable should use gray icon
        expect(document.querySelector('.selected').querySelector('img').getAttribute('alt')).toBe('bar_chart-icon');
        expect(document.querySelector('.selectable').querySelector('img').getAttribute('alt')).toBe(
            'xy_scatter_gray-icon'
        );

        // default to shared
        expect(document.querySelector('input[name="shared"]').getAttribute('checked')).toBe('');
    });

    test('canShare false', () => {
        renderWithAppContext(
            <ChartBuilderModal actions={actions} model={model} onHide={jest.fn()} savedChartModel={undefined} />,
            {
                serverContext: {
                    user: TEST_USER_READER,
                },
            }
        );

        validate(true, false);
        expect(document.querySelectorAll('input')).toHaveLength(5);
        expect(document.querySelectorAll('input[name="shared"]')).toHaveLength(0);
    });

    test('field inputs displayed for selected chart type', () => {
        renderWithAppContext(
            <ChartBuilderModal actions={actions} model={model} onHide={jest.fn()} savedChartModel={undefined} />,
            {
                serverContext: SERVER_CONTEXT,
            }
        );

        validate(true);

        // verify field inputs displayed for default / first chart type
        expect(document.querySelectorAll('input')).toHaveLength(6);
        BAR_CHART_TYPE.fields.forEach(field => {
            expect(document.querySelector(`input[name="${field.name}"]`)).not.toBeNull();
        });

        // click on another chart type and verify field inputs change
        userEvent.click(document.querySelector('.selectable'));
        expect(document.querySelector('.selected').textContent).toBe('Scatter');
        expect(document.querySelector('.selectable').textContent).toBe('Bar');
        expect(document.querySelectorAll('input')).toHaveLength(8);
        SCATTER_PLOT_TYPE.fields.forEach(field => {
            expect(document.querySelector(`input[name="${field.name}"]`)).not.toBeNull();
        });
    });

    test('init from savedChartModel', () => {
        const savedChartModel = {
            canShare: true,
            canDelete: true,
            name: 'SavedChart',
            reportId: 'reportId',
            shared: false,
            visualizationConfig: {
                chartConfig: {
                    renderType: 'scatter_plot',
                    measures: { x: 'field1', y: 'field2' },
                },
                queryConfig: {
                    schemaName: 'savedSchema',
                    queryName: 'savedQuery',
                    viewName: 'savedView',
                },
            },
        } as GenericChartModel;

        renderWithAppContext(
            <ChartBuilderModal actions={actions} model={model} onHide={jest.fn()} savedChartModel={savedChartModel} />,
            {
                serverContext: SERVER_CONTEXT,
            }
        );

        validate(false, true, true);
        expect(document.querySelectorAll('input')).toHaveLength(8);

        // default to selecting the chart type based on saved config
        expect(document.querySelector('.selected').textContent).toBe('Scatter');
        expect(document.querySelectorAll('.selectable')).toHaveLength(0);
        // selected should use blue icon
        expect(document.querySelector('.selected').querySelector('img').getAttribute('alt')).toBe('xy_scatter-icon');

        // click delete button and verify confirm text / buttons
        userEvent.click(document.querySelector('.btn-danger'));
        const btnItems = document.querySelectorAll('.btn');
        expect(btnItems).toHaveLength(2);
        expect(btnItems[0].textContent).toBe('Cancel');
        expect(btnItems[1].textContent).toBe('Delete');
        expect(document.querySelector('.form-buttons__right').textContent).toBe(
            'Are you sure you want to permanently delete this chart?CancelDelete'
        );

        // cancel delete and verify footer returns to normal
        userEvent.click(btnItems[0]);
        validate(false, true, true);
    });

    test('canDelete and canShare false', () => {
        const savedChartModel = {
            canShare: false,
            canDelete: false,
            name: 'SavedChart',
            reportId: 'reportId',
            shared: false,
            visualizationConfig: {
                chartConfig: {
                    renderType: 'scatter_plot',
                    measures: { x: 'field1', y: 'field2' },
                },
                queryConfig: {
                    schemaName: 'savedSchema',
                    queryName: 'savedQuery',
                    viewName: 'savedView',
                },
            },
        } as GenericChartModel;

        renderWithAppContext(
            <ChartBuilderModal actions={actions} model={model} onHide={jest.fn()} savedChartModel={savedChartModel} />,
            {
                serverContext: SERVER_CONTEXT,
            }
        );

        validate(false, false, false);
        expect(document.querySelectorAll('input')).toHaveLength(7);
        expect(document.querySelector('input[name="shared"]')).toBeNull();
    });
});

describe('getChartRenderMsg', () => {
    test('isPreview and max rows', () => {
        const chartConfig = { renderType: 'bar_chart', geomOptions: {} } as ChartConfig;
        expect(getChartRenderMsg(chartConfig, MAX_ROWS_PREVIEW - 1, false)).toBe(undefined);
        expect(getChartRenderMsg(chartConfig, MAX_ROWS_PREVIEW - 1, true)).toBe(undefined);
        expect(getChartRenderMsg(chartConfig, MAX_ROWS_PREVIEW, true)).toBe(
            'The preview is being limited to 100,000 rows.'
        );
    });

    test('line plot bin threshold', () => {
        const chartConfig = { renderType: 'line_plot', geomOptions: { binThreshold: 10 } } as ChartConfig;
        expect(getChartRenderMsg(chartConfig, 9, false)).toBe(undefined);
        expect(getChartRenderMsg(chartConfig, 9, true)).toBe(undefined);
        expect(getChartRenderMsg(chartConfig, 11, false)).toBe(
            'The number of individual points exceeds 10,000. Data points will not be shown on this line plot.'
        );
        expect(getChartRenderMsg(chartConfig, 11, true)).toBe(
            'The number of individual points exceeds 10,000. Data points will not be shown on this line plot.'
        );
    });

    test('scatter plot max point display', () => {
        const chartConfig = { renderType: 'scatter_plot' } as ChartConfig;
        expect(getChartRenderMsg(chartConfig, MAX_POINT_DISPLAY - 1, false)).toBe(undefined);
        expect(getChartRenderMsg(chartConfig, MAX_POINT_DISPLAY - 1, true)).toBe(undefined);
        expect(getChartRenderMsg(chartConfig, MAX_POINT_DISPLAY + 1, false)).toBe(
            'The number of individual points exceeds 10,000. The data is now grouped by density.'
        );
        expect(getChartRenderMsg(chartConfig, MAX_POINT_DISPLAY + 1, true)).toBe(
            'The number of individual points exceeds 10,000. The data is now grouped by density.'
        );
    });
});

describe('getSelectOptions', () => {
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

describe('getChartBuilderQueryConfig', () => {
    const chartConfig = { measures: {} } as ChartConfig;
    const fieldValues = {
        x: { value: 'field1', label: 'Field 1', data: { fieldKey: 'field1' } },
        y: { value: undefined },
    };

    test('based on model', () => {
        const config = getChartBuilderQueryConfig(model, fieldValues, chartConfig, undefined);
        expect(config.maxRows).toBe(-1);
        expect(config.requiredVersion).toBe('13.2');
        expect(config.schemaName).toBe('schema');
        expect(config.queryName).toBe('query');
        expect(config.viewName).toBe('view');
        expect(config.sort).toBe('lsid');
        expect(config.columns).toStrictEqual(['field1']);
        expect(config.filterArray).toStrictEqual([]);
    });

    test('based on savedConfig', () => {
        const savedConfig = {
            schemaName: 'savedSchema',
            queryName: 'savedQuery',
            viewName: 'savedView',
            filterArray: [{ name: 'savedFilter' }],
        } as ChartQueryConfig;

        const config = getChartBuilderQueryConfig(model, fieldValues, chartConfig, savedConfig);
        expect(config.maxRows).toBe(-1);
        expect(config.requiredVersion).toBe('13.2');
        expect(config.schemaName).toBe('savedSchema');
        expect(config.queryName).toBe('savedQuery');
        expect(config.viewName).toBe('savedView');
        expect(config.sort).toBe('lsid');
        expect(config.columns).toStrictEqual(['field1']);
        expect(config.filterArray.length).toBe(1);
    });
});

describe('getChartBuilderChartConfig', () => {
    const fieldValues = {
        x: { value: 'field1', label: 'Field 1', data: { fieldKey: 'field1' } },
        y: { value: 'field2', label: 'Field 2', data: { fieldKey: 'field2' } },
    };

    test('based on fieldValues', () => {
        const config = getChartBuilderChartConfig(BAR_CHART_TYPE, fieldValues, undefined);
        expect(config.scales).toStrictEqual({});
        expect(Object.keys(config.labels)).toStrictEqual(['main', 'subtitle', 'x', 'y']);
        expect(config.labels.main).toBe('');
        expect(config.labels.subtitle).toBe('');
        expect(config.pointType).toBe('all');
        expect(config.measures.x.name).toBe('field1');
        expect(config.measures.y.name).toBe('field2');
        expect(config.labels.x).toBe('Field 1');
        expect(config.labels.y).toBe('Sum of Field 2');
    });

    test('based on savedConfig', () => {
        const savedConfig = {
            pointType: 'outliers',
            scales: { x: 'linear', y: 'log' },
            labels: { main: 'Main', subtitle: 'Subtitle', color: 'Something', x: 'X Label' },
            measures: { x: { name: 'saved1' }, y: { name: 'saved2' } },
            height: 1,
            width: 2,
        } as ChartConfig;

        const config = getChartBuilderChartConfig(BAR_CHART_TYPE, fieldValues, savedConfig);
        expect(config.scales).toStrictEqual(savedConfig.scales);
        expect(Object.keys(config.labels)).toStrictEqual(['main', 'subtitle', 'color', 'x', 'y']);
        expect(config.labels.main).toBe('Main');
        expect(config.labels.subtitle).toBe('Subtitle');
        expect(config.pointType).toBe('outliers');
        expect(config.measures.x.name).toBe('field1');
        expect(config.measures.y.name).toBe('field2');
        expect(config.labels.x).toBe('X Label');
        expect(config.labels.y).toBe('Field 2');
    });

    test('box plot specifics', () => {
        const boxType = {
            name: 'box_plot',
            fields: [{ name: 'x' }, { name: 'y' }],
        } as ChartTypeInfo;

        const config = getChartBuilderChartConfig(boxType, fieldValues, undefined);
        expect(config.geomOptions.boxFillColor).toBe('none');
        expect(config.geomOptions.lineWidth).toBe(1);
        expect(config.geomOptions.opacity).toBe(0.5);
        expect(config.geomOptions.pointSize).toBe(3);
        expect(config.geomOptions.position).toBe('jitter');
    });

    test('line plot specifics', () => {
        const boxType = {
            name: 'line_plot',
            fields: [{ name: 'x' }, { name: 'y' }],
        } as ChartTypeInfo;

        const config = getChartBuilderChartConfig(boxType, fieldValues, undefined);
        expect(config.geomOptions.boxFillColor).not.toBe('none');
        expect(config.geomOptions.lineWidth).toBe(3);
        expect(config.geomOptions.opacity).toBe(1.0);
        expect(config.geomOptions.pointSize).toBe(5);
        expect(config.geomOptions.position).toBe(null);
    });

    test('bar chart specifics', () => {
        const boxType = {
            name: 'bar_chart',
            fields: [{ name: 'x' }, { name: 'y' }],
        } as ChartTypeInfo;

        const config = getChartBuilderChartConfig(boxType, fieldValues, undefined);
        expect(config.geomOptions.boxFillColor).not.toBe('none');
        expect(config.geomOptions.lineWidth).toBe(1);
        expect(config.geomOptions.opacity).toBe(1.0);
        expect(config.geomOptions.pointSize).toBe(5);
        expect(config.geomOptions.position).toBe(null);
    });
});
