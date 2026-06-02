/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { getByRole, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';
import { TEST_USER_EDITOR, TEST_USER_PROJECT_ADMIN, TEST_USER_READER } from '../../userFixtures';
import { makeTestActions, makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { LABKEY_VIS } from '../../constants';

import { QueryInfo } from '../../../public/QueryInfo';

import { ViewInfo } from '../../ViewInfo';

import {
    TEST_FOLDER_CONTAINER_ADMIN,
    TEST_PROJECT_CONTAINER,
    TEST_PROJECT_CONTAINER_ADMIN,
} from '../../containerFixtures';

import { ChartBuilderModal, getChartBuilderQueryConfig, getChartRenderMsg } from './ChartBuilderModal';
import { MAX_POINT_DISPLAY, MAX_ROWS_PREVIEW } from './constants';
import { ChartConfig, ChartQueryConfig, ChartTypeInfo, GenericChartModel } from './models';
import { deepCopyChartConfig } from './utils';

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
const LINE_PLOT_TYPE = {
    name: 'line_plot',
    fields: [
        { name: 'x', label: 'X Axis', required: true, numericOrDateOnly: true },
        { name: 'y', label: 'Y Axis', required: true, numericOnly: true, allowMultiple: true },
        { name: 'series', label: 'Series', nonNumericOnly: true },
        {
            name: 'trendline',
            label: 'Trendline',
            required: false,
            altSelectionOnly: true,
            altFieldType: 'LABKEY.vis.TrendlineField',
        },
    ],
    title: 'Line',
} as ChartTypeInfo;

LABKEY_VIS = {
    GenericChartHelper: {
        getRenderTypes: () => [
            BAR_CHART_TYPE,
            SCATTER_PLOT_TYPE,
            LINE_PLOT_TYPE,
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
        isNumericType: () => true,
        TRENDLINE_OPTIONS: [{ value: 'option1', label: 'Options 1', showMin: true, showMax: true }],
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

const defaultChartModel: Partial<GenericChartModel> = {
    canEdit: true,
    canShare: true,
    canDelete: true,
    inheritable: true,
    createdBy: 1000,
    description: '',
    id: 'db:100',
    name: 'SavedChart',
    ownerId: 1000,
    queryName: 'savedQuery',
    reportId: 'reportId',
    reportProps: undefined,
    schemaName: 'savedSchema',
    shared: false,
    thumbnailURL: undefined,
    type: undefined,
};
const defaultQueryConfig: Partial<GenericChartModel['visualizationConfig']['queryConfig']> = {
    columns: [],
    containerFilter: undefined,
    containerPath: undefined,
    filterArray: [],
    schemaName: 'savedSchema',
    queryName: 'savedQuery',
    viewName: 'savedView',
};

describe('ChartBuilderModal', () => {
    function validate(isNew: boolean, canShare = true, canDelete = false, allowInherit = false): void {
        expect(document.querySelectorAll('.chart-builder-modal')).toHaveLength(1);
        expect(document.querySelectorAll('.chart-settings')).toHaveLength(1);
        expect(document.querySelectorAll('.chart-builder-modal__chart-preview')).toHaveLength(1);
        expect(document.querySelector('.modal-title').textContent).toBe(isNew ? 'Create Chart' : 'Edit Chart');
        expect(document.querySelectorAll('.btn:not(.color-picker__button)')).toHaveLength(canDelete ? 3 : 2);
        expect(document.querySelectorAll('.alert')).toHaveLength(0);
        expect(document.querySelectorAll('.chart-settings__chart-type')).toHaveLength(isNew ? 1 : 0);

        expect(document.querySelectorAll('input[name="name"]')).toHaveLength(1);
        expect(document.querySelectorAll('input[name="shared"]')).toHaveLength(canShare ? 1 : 0);
        expect(document.querySelectorAll('input[name="inheritable"]')).toHaveLength(allowInherit ? 1 : 0);

        expect(document.querySelectorAll('.chart-builder-preview-msg')).toHaveLength(0);
        expect(document.querySelectorAll('.chart-builder-preview-body')).toHaveLength(isNew ? 0 : 1);

        const saveBtn = document.querySelector('.btn-success');
        expect(saveBtn.textContent).toBe(isNew ? 'Create Chart' : 'Save Chart');
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
        expect(document.querySelector('.chart-builder-type-option--value').textContent).toBe('Bar');
        expect(document.querySelector('input[name=chartType]').getAttribute('value')).toBe('bar_chart');

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
        expect(document.querySelectorAll('input')).toHaveLength(14);
    });

    test('allowInherit false, user perm', () => {
        renderWithAppContext(
            <ChartBuilderModal actions={actions} model={model} onHide={jest.fn()} savedChartModel={undefined} />,
            {
                serverContext: {
                    user: TEST_USER_EDITOR,
                    container: TEST_PROJECT_CONTAINER_ADMIN,
                    moduleContext: { query: { isProductFoldersEnabled: true } },
                },
            }
        );

        validate(true);
        expect(document.querySelectorAll('input')).toHaveLength(15);
    });

    test('allowInherit false, non-project', () => {
        renderWithAppContext(
            <ChartBuilderModal actions={actions} model={model} onHide={jest.fn()} savedChartModel={undefined} />,
            {
                serverContext: {
                    user: TEST_USER_PROJECT_ADMIN,
                    container: TEST_FOLDER_CONTAINER_ADMIN,
                    moduleContext: { query: { isProductFoldersEnabled: true } },
                },
            }
        );

        validate(true);
        expect(document.querySelectorAll('input')).toHaveLength(15);
    });

    test('allowInherit true', () => {
        renderWithAppContext(
            <ChartBuilderModal actions={actions} model={model} onHide={jest.fn()} savedChartModel={undefined} />,
            {
                serverContext: {
                    user: TEST_USER_PROJECT_ADMIN,
                    container: TEST_PROJECT_CONTAINER,
                    moduleContext: { query: { isProductFoldersEnabled: true } },
                },
            }
        );

        validate(true, true, false, true);
        expect(document.querySelectorAll('input')).toHaveLength(16);
    });

    test('field inputs displayed for selected chart type', async () => {
        renderWithAppContext(
            <ChartBuilderModal actions={actions} model={model} onHide={jest.fn()} savedChartModel={undefined} />,
            {
                serverContext: SERVER_CONTEXT,
            }
        );

        validate(true);

        // verify field inputs displayed for default / first chart type
        expect(document.querySelectorAll('input')).toHaveLength(15);
        BAR_CHART_TYPE.fields.forEach(field => {
            expect(document.querySelectorAll(`input[name="${field.name}"]`)).toHaveLength(1);
        });

        // click on Scatter chart type and verify field inputs change
        let typeDropdown = getByRole(document.querySelector('.chart-settings__chart-type'), 'combobox');
        await userEvent.click(typeDropdown);
        const scatterOption = screen.getByText('Scatter');
        await userEvent.click(scatterOption);

        expect(document.querySelectorAll('input')).toHaveLength(17);
        SCATTER_PLOT_TYPE.fields.forEach(field => {
            expect(document.querySelectorAll(`input[name="${field.name}"]`)).toHaveLength(1);
        });

        // click on Line chart type and verify field inputs change
        typeDropdown = getByRole(document.querySelector('.chart-settings__chart-type'), 'combobox');
        await userEvent.click(typeDropdown);
        const lineOption = screen.getByText('Line');
        await userEvent.click(lineOption);
        expect(document.querySelectorAll('input')).toHaveLength(19);
        LINE_PLOT_TYPE.fields.forEach(field => {
            if (field.name !== 'trendline') {
                expect(document.querySelectorAll(`input[name="${field.name}"]`)).toHaveLength(1);
            }
        });
    });

    test('init from savedChartModel', async () => {
        const savedChartModel = {
            ...defaultChartModel,
            visualizationConfig: {
                chartConfig: {
                    ...deepCopyChartConfig(undefined, 'scatter_plot'),
                    measures: { x: { fieldKey: 'field1' }, y: { fieldKey: 'field2' } },
                },
                queryConfig: defaultQueryConfig,
            },
        } as GenericChartModel;

        renderWithAppContext(
            <ChartBuilderModal actions={actions} model={model} onHide={jest.fn()} savedChartModel={savedChartModel} />,
            {
                serverContext: SERVER_CONTEXT,
            }
        );

        validate(false, true, true);
        expect(document.querySelectorAll('input')).toHaveLength(15);

        // click delete button and verify confirm text / buttons
        await userEvent.click(document.querySelector('.btn-danger'));
        const btnItems = document.querySelectorAll('.btn:not(.color-picker__button)');
        expect(btnItems).toHaveLength(2);
        expect(btnItems[0].textContent).toBe('Cancel');
        expect(btnItems[1].textContent).toBe('Delete');
        expect(document.querySelector('.form-buttons__right').textContent).toBe(
            'Are you sure you want to permanently delete this chart?CancelDelete'
        );

        // cancel delete and verify footer returns to normal
        await userEvent.click(btnItems[0]);
        validate(false, true, true);
    });

    test('init from bar chart with y axis value and default aggregate method', async () => {
        const savedChartModel = {
            ...defaultChartModel,
            visualizationConfig: {
                chartConfig: {
                    ...deepCopyChartConfig(undefined),
                    renderType: 'bar_chart',
                    measures: { x: { fieldKey: 'field1' }, y: { fieldKey: 'field2' } },
                    labels: { x: 'Field 1', y: 'Field 2' },
                },
                queryConfig: defaultQueryConfig,
            },
        } as GenericChartModel;

        renderWithAppContext(
            <ChartBuilderModal actions={actions} model={model} onHide={jest.fn()} savedChartModel={savedChartModel} />,
            {
                serverContext: SERVER_CONTEXT,
            }
        );

        validate(false, true, true);
        expect(document.querySelectorAll('input')).toHaveLength(13);
        expect(document.querySelector('input[name=y]').getAttribute('value')).toBe('field2');
        expect(document.querySelectorAll('.fa-gear')).toHaveLength(2); // gear icon for x and y axes
        await userEvent.click(document.querySelectorAll('.fa-gear')[1]);
        expect(document.querySelectorAll('input')).toHaveLength(21);
        expect(document.querySelector('input[value=automatic]').hasAttribute('checked')).toBe(true);
        expect(document.querySelector('input[value=manual]').hasAttribute('checked')).toBe(false);
        expect(document.querySelector('input[name=aggregateMethod]').getAttribute('value')).toBe('SUM');
        expect(document.querySelectorAll('input[name=error-bar-method]')).toHaveLength(3);
        expect(document.querySelector('input[value=SD]').hasAttribute('checked')).toBe(false);
        expect(document.querySelector('input[value=SEM]').hasAttribute('checked')).toBe(false);
    });

    test('init from bar chart with y axis value and aggregate method', async () => {
        const savedChartModel = {
            ...defaultChartModel,
            canShare: true,
            canDelete: true,
            name: 'SavedChart',
            reportId: 'reportId',
            shared: false,
            visualizationConfig: {
                chartConfig: {
                    ...deepCopyChartConfig(undefined, 'bar_chart'),
                    measures: {
                        x: { fieldKey: 'field1' },
                        y: { fieldKey: 'field2', aggregate: { value: 'MEAN' }, errorBars: 'SEM' },
                    },
                    labels: { x: 'Field 1', y: 'Field 2' },
                },
                queryConfig: defaultQueryConfig,
            },
        } as GenericChartModel;

        renderWithAppContext(
            <ChartBuilderModal actions={actions} model={model} onHide={jest.fn()} savedChartModel={savedChartModel} />,
            {
                serverContext: SERVER_CONTEXT,
            }
        );

        validate(false, true, true);
        expect(document.querySelectorAll('input')).toHaveLength(13);
        expect(document.querySelector('input[name=y]').getAttribute('value')).toBe('field2');
        expect(document.querySelectorAll('.fa-gear')).toHaveLength(2); // gear icon for x and y axes
        await userEvent.click(document.querySelectorAll('.fa-gear')[1]);
        expect(document.querySelectorAll('input')).toHaveLength(21);
        expect(document.querySelector('input[value=automatic]').hasAttribute('checked')).toBe(true);
        expect(document.querySelector('input[value=manual]').hasAttribute('checked')).toBe(false);
        expect(document.querySelector('input[name=aggregateMethod]').getAttribute('value')).toBe('MEAN');
        expect(document.querySelectorAll('input[name=error-bar-method]')).toHaveLength(3);
        expect(document.querySelector('input[value=SD]').hasAttribute('checked')).toBe(false);
        expect(document.querySelector('input[value=SEM]').hasAttribute('checked')).toBe(true);
        expect(document.querySelectorAll('input[name=trendlineType]')).toHaveLength(0);
    });

    test('init from line chart with trendline options', async () => {
        const savedChartModel = {
            ...defaultChartModel,
            visualizationConfig: {
                chartConfig: {
                    ...deepCopyChartConfig(undefined, 'line_plot'),
                    measures: { x: { fieldKey: 'field1' }, y: { fieldKey: 'field2' } },
                    labels: { x: 'Field 1', y: 'Field 2' },
                    geomOptions: {
                        trendlineType: 'option1',
                        trendlineAsymptoteMin: '0.1',
                        trendlineAsymptoteMax: '1.0',
                    },
                },
                queryConfig: defaultQueryConfig,
            },
        } as GenericChartModel;

        renderWithAppContext(
            <ChartBuilderModal actions={actions} model={model} onHide={jest.fn()} savedChartModel={savedChartModel} />,
            {
                serverContext: SERVER_CONTEXT,
            }
        );

        validate(false, true, true);
        expect(document.querySelectorAll('input')).toHaveLength(19);
        expect(document.querySelector('input[name=x]').getAttribute('value')).toBe('field1');
        expect(document.querySelector('input[name=y]').getAttribute('value')).toBe('field2');
        expect(document.querySelectorAll('input[name=aggregateMethod]')).toHaveLength(0);
        expect(document.querySelector('input[name=trendlineType]').getAttribute('value')).toBe('option1');
        expect(document.querySelectorAll('input[name=trendlineAsymptoteMin]')).toHaveLength(0);
        expect(document.querySelectorAll('input[name=trendlineAsymptoteMax]')).toHaveLength(0);

        await userEvent.click(document.querySelector('.trendline-option').querySelector('.fa-gear')); // trendline options icon
        expect(document.querySelector('input[name=trendlineAsymptoteMin]').getAttribute('value')).toBe('0.1');
        expect(document.querySelector('input[name=trendlineAsymptoteMax]').getAttribute('value')).toBe('1.0');
    });

    test('init from line chart with axis options', async () => {
        const savedChartModel = {
            ...defaultChartModel,
            visualizationConfig: {
                chartConfig: {
                    ...deepCopyChartConfig(undefined, 'line_plot'),
                    measures: { x: { fieldKey: 'field1' }, y: { fieldKey: 'field2' } },
                    labels: { x: 'Field 1', y: 'Field 2' },
                    scales: {
                        x: { trans: 'linear', type: 'manual', min: 0, max: 100 },
                        y: { trans: 'log', type: 'automatic' },
                    },
                },
                queryConfig: defaultQueryConfig,
            },
        } as GenericChartModel;

        renderWithAppContext(
            <ChartBuilderModal actions={actions} model={model} onHide={jest.fn()} savedChartModel={savedChartModel} />,
            {
                serverContext: SERVER_CONTEXT,
            }
        );

        validate(false, true, true);
        expect(document.querySelectorAll('input')).toHaveLength(19);
        expect(document.querySelector('input[name=x]').getAttribute('value')).toBe('field1');
        expect(document.querySelector('input[name=y]').getAttribute('value')).toBe('field2');
        expect(document.querySelectorAll('input[name=aggregateMethod]')).toHaveLength(0);
        expect(document.querySelectorAll('input[name=trendlineType]')).toHaveLength(1);
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(2); // gear icon for x and y axis

        await userEvent.click(document.querySelectorAll('.fa-gear')[0]); // x-axis options icon
        let settingsPanel = document.querySelector('.chart-field-additional-options');
        expect(settingsPanel.querySelectorAll('.radioinput-label.selected')[0].textContent).toBe('Linear');
        expect(settingsPanel.querySelectorAll('input[name=scaleTrans]')[0].hasAttribute('checked')).toBe(true); // linear
        expect(settingsPanel.querySelectorAll('input[name=scaleTrans]')[1].hasAttribute('checked')).toBe(false); // log
        expect(settingsPanel.querySelectorAll('.radioinput-label.selected')[1].textContent).toBe('Manual');
        expect(settingsPanel.querySelector('input[name=scaleMin]').getAttribute('value')).toBe('0');
        expect(settingsPanel.querySelector('input[name=scaleMax]').getAttribute('value')).toBe('100');

        await userEvent.click(document.querySelectorAll('.radioinput-label')[2]); // click 'Automatic' to verify clear min/max
        await userEvent.click(document.querySelectorAll('.radioinput-label')[3]); // click 'Manual'
        expect(settingsPanel.querySelector('input[name=scaleMin]').getAttribute('value')).toBe('');
        expect(settingsPanel.querySelector('input[name=scaleMax]').getAttribute('value')).toBe('');

        await userEvent.click(document.querySelectorAll('.fa-gear')[0]); // x-axis options icon, click to close
        await userEvent.click(document.querySelectorAll('.fa-gear')[1]); // y-axis options icon
        settingsPanel = document.querySelector('.chart-field-additional-options');
        expect(settingsPanel.querySelectorAll('.radioinput-label.selected')).toHaveLength(3); // error bar, scale, range
        expect(settingsPanel.querySelectorAll('.radioinput-label.selected')[0].textContent).toBe('None');
        expect(settingsPanel.querySelectorAll('.radioinput-label.selected')[1].textContent).toBe('Log');
        expect(settingsPanel.querySelectorAll('.radioinput-label.selected')[2].textContent).toBe('Automatic');
        expect(settingsPanel.querySelectorAll('input[name=scaleTrans]')[0].hasAttribute('checked')).toBe(false); // linear
        expect(settingsPanel.querySelectorAll('input[name=scaleTrans]')[1].hasAttribute('checked')).toBe(true); // log
    });

    test('canDelete and canShare false', () => {
        const savedChartModel = {
            ...defaultChartModel,
            canDelete: false,
            canShare: false,
            visualizationConfig: {
                chartConfig: {
                    ...deepCopyChartConfig(undefined, 'scatter_plot'),
                    measures: { x: { fieldKey: 'field1' }, y: { fieldKey: 'field2' } },
                },
                queryConfig: defaultQueryConfig,
            },
        } as GenericChartModel;

        renderWithAppContext(
            <ChartBuilderModal actions={actions} model={model} onHide={jest.fn()} savedChartModel={savedChartModel} />,
            {
                serverContext: SERVER_CONTEXT,
            }
        );

        validate(false, false, false);
        expect(document.querySelectorAll('input')).toHaveLength(14);
        expect(document.querySelector('input[name="shared"]')).toBeNull();
    });
});

describe('getChartRenderMsg', () => {
    test('isPreview and max rows', () => {
        const chartConfig = { renderType: 'bar_chart', geomOptions: {} } as ChartConfig;
        expect(getChartRenderMsg(chartConfig, MAX_ROWS_PREVIEW - 1, false)).toBe(undefined);
        expect(getChartRenderMsg(chartConfig, MAX_ROWS_PREVIEW - 1, true)).toBe(undefined);
        expect(getChartRenderMsg(chartConfig, MAX_ROWS_PREVIEW, true)).toBe(
            'The preview is being limited to 10,000 rows.'
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

describe('getChartBuilderQueryConfig', () => {
    const chartConfig = {
        ...deepCopyChartConfig(undefined),
        geomOptions: {},
        measures: {
            x: { name: 'field1', label: 'Field 1', fieldKey: 'field1' },
            y: { name: undefined },
        },
    } as ChartConfig;

    test('based on model', () => {
        const config = getChartBuilderQueryConfig(model, chartConfig, undefined);
        expect(config.maxRows).toBe(-1);
        expect(config.requiredVersion).toBe('17.1');
        expect(config.schemaName).toBe('schema');
        expect(config.queryName).toBe('query');
        expect(config.viewName).toBe('view');
        expect(config.sort).toBe('lsid');
        expect(config.columns).toStrictEqual(['field1']);
        expect(config.filterArray).toStrictEqual([]);
    });

    test('based on savedConfig', () => {
        const savedConfig = {
            filterArray: [{ name: 'savedFilter' }],
            queryName: 'savedQuery',
            schemaName: 'savedSchema',
            viewName: 'savedView',
        } as ChartQueryConfig;

        const config = getChartBuilderQueryConfig(model, chartConfig, savedConfig);
        expect(config.maxRows).toBe(-1);
        expect(config.requiredVersion).toBe('17.1');
        expect(config.schemaName).toBe('savedSchema');
        expect(config.queryName).toBe('savedQuery');
        expect(config.viewName).toBe('savedView');
        expect(config.sort).toBe('lsid');
        expect(config.columns).toStrictEqual(['field1']);
        expect(config.filterArray.length).toBe(1);
    });
});
