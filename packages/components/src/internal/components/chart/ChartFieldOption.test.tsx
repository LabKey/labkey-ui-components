/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';

import { render } from '@testing-library/react';

import { waitFor } from '@testing-library/dom';

import { userEvent } from '@testing-library/user-event';

import { LABKEY_VIS } from '../../constants';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { QueryInfo } from '../../../public/QueryInfo';
import { ViewInfo } from '../../ViewInfo';

import { ChartFieldOption } from './ChartFieldOption';
import { ChartFieldInfo, ChartTypeInfo } from './models';

LABKEY_VIS = {
    GenericChartHelper: {
        getAllowableTypes: () => ['int', 'double'],
        isMeasureDimensionMatch: () => true,
        isNumericType: (type: string) => type === 'int',
    },
};

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

describe('ChartFieldOption', () => {
    test('line chart for x, showFieldOptions for int', async () => {
        render(
            <ChartFieldOption
                chartConfig={{
                    measures: { x: { name: 'field1', jsonType: 'int' } },
                    scales: {},
                }}
                field={{ name: 'x', label: 'X Axis', required: true } as ChartFieldInfo}
                model={model}
                selectedType={LINE_PLOT_TYPE}
                setChartConfig={jest.fn()}
            />
        );

        await waitFor(() => {
            expect(document.querySelector('label').textContent).toBe('X Axis *');
        });
        expect(document.querySelectorAll('.select-input')).toHaveLength(1);
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(1);
    });

    test('line chart for x, date field', async () => {
        render(
            <ChartFieldOption
                chartConfig={{
                    measures: { x: { name: 'field1', jsonType: 'date' } },
                    scales: {},
                }}
                field={{ name: 'x', label: 'X Axis', required: true } as ChartFieldInfo}
                model={model}
                selectedType={LINE_PLOT_TYPE}
                setChartConfig={jest.fn()}
            />
        );

        await waitFor(() => {
            expect(document.querySelector('label').textContent).toBe('X Axis *');
        });
        expect(document.querySelectorAll('.select-input')).toHaveLength(1);
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(1);
    });

    test('bar chart for x', async () => {
        render(
            <ChartFieldOption
                chartConfig={{
                    measures: { x: { name: 'field1', jsonType: 'int' } },
                    scales: {},
                }}
                field={{ name: 'x', label: 'X Axis', required: true } as ChartFieldInfo}
                model={model}
                selectedType={BAR_CHART_TYPE}
                setChartConfig={jest.fn()}
            />
        );

        await waitFor(() => {
            expect(document.querySelector('label').textContent).toBe('X Axis *');
        });
        expect(document.querySelectorAll('.select-input')).toHaveLength(1);
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(1);
    });

    test('label for not required', async () => {
        render(
            <ChartFieldOption
                chartConfig={{
                    measures: { x: { name: 'field1', jsonType: 'date' } },
                    scales: {},
                }}
                field={{ name: 'x', label: 'X Axis', required: false } as ChartFieldInfo}
                model={model}
                selectedType={LINE_PLOT_TYPE}
                setChartConfig={jest.fn()}
            />
        );

        await waitFor(() => {
            expect(document.querySelector('label').textContent).toBe('X Axis');
        });
    });

    test('default values set for scale', async () => {
        render(
            <ChartFieldOption
                chartConfig={{
                    measures: { x: { name: 'field1', jsonType: 'int' } },
                    scales: {},
                }}
                field={{ name: 'x', label: 'X Axis', required: true } as ChartFieldInfo}
                model={model}
                selectedType={LINE_PLOT_TYPE}
                setChartConfig={jest.fn()}
            />
        );

        await waitFor(() => {
            expect(document.querySelector('label').textContent).toBe('X Axis *');
        });
        expect(document.querySelectorAll('.select-input')).toHaveLength(1);
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(1);

        // additional options not shown until clicking on the gear icon
        expect(document.querySelectorAll('.radioinput-label')).toHaveLength(0);
        expect(document.querySelectorAll('input')).toHaveLength(2);
        await userEvent.click(document.querySelector('.fa-gear'));
        expect(document.querySelectorAll('.radioinput-label')).toHaveLength(4);
        expect(document.querySelectorAll('input')).toHaveLength(7);

        expect(document.querySelectorAll('.radioinput-label.selected')[0].textContent).toBe('Linear');
        expect(document.querySelectorAll('.radioinput-label.selected')[1].textContent).toBe('Automatic');
        expect(document.querySelectorAll('input[name=scaleMin]')).toHaveLength(0);
        expect(document.querySelectorAll('input[name=scaleMax]')).toHaveLength(0);
    });

    test('initial values set from scaleValues', async () => {
        render(
            <ChartFieldOption
                chartConfig={{
                    measures: { x: { name: 'field1', jsonType: 'int' } },
                    scales: { x: { trans: 'log', type: 'manual', min: '3', max: '20' } },
                }}
                field={{ name: 'x', label: 'X Axis', required: true } as ChartFieldInfo}
                model={model}
                selectedType={LINE_PLOT_TYPE}
                setChartConfig={jest.fn()}
            />
        );

        await waitFor(() => {
            expect(document.querySelector('label').textContent).toBe('X Axis *');
        });
        expect(document.querySelectorAll('.select-input')).toHaveLength(1);
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(1);

        await userEvent.click(document.querySelector('.fa-gear'));
        expect(document.querySelectorAll('.radioinput-label.selected')[0].textContent).toBe('Log');
        expect(document.querySelectorAll('.radioinput-label.selected')[1].textContent).toBe('Manual');
        expect(document.querySelector('input[name=scaleMin]').getAttribute('value')).toBe('3');
        expect(document.querySelector('input[name=scaleMax]').getAttribute('value')).toBe('20');
        expect(document.querySelectorAll('.text-danger')).toHaveLength(0);

        // verify min and max are cleared when changed to automatic
        await userEvent.click(document.querySelectorAll('.radioinput-label')[2]); // Automatic
        expect(document.querySelectorAll('.radioinput-label.selected')[0].textContent).toBe('Log');
        expect(document.querySelectorAll('.radioinput-label.selected')[1].textContent).toBe('Automatic');
        expect(document.querySelectorAll('input[name=scaleMin]')).toHaveLength(0);
        expect(document.querySelectorAll('input[name=scaleMax]')).toHaveLength(0);
        await userEvent.click(document.querySelectorAll('.radioinput-label')[3]); // Manual
        expect(document.querySelector('input[name=scaleMin]').getAttribute('value')).toBe('');
        expect(document.querySelector('input[name=scaleMax]').getAttribute('value')).toBe('');
    });

    test('invalid scale range, max < min', async () => {
        render(
            <ChartFieldOption
                chartConfig={{
                    measures: { x: { name: 'field1', jsonType: 'int' } },
                    scales: { x: { trans: 'log', type: 'manual', min: '1', max: '0' } },
                }}
                field={{ name: 'x', label: 'X Axis', required: true } as ChartFieldInfo}
                model={model}
                selectedType={LINE_PLOT_TYPE}
                setChartConfig={jest.fn()}
            />
        );

        await waitFor(() => {
            expect(document.querySelector('label').textContent).toBe('X Axis *');
        });
        expect(document.querySelectorAll('.select-input')).toHaveLength(1);
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(1);

        await userEvent.click(document.querySelector('.fa-gear'));
        expect(document.querySelector('input[name=scaleMin]').getAttribute('value')).toBe('1');
        expect(document.querySelector('input[name=scaleMax]').getAttribute('value')).toBe('0');
        expect(document.querySelector('.text-danger').textContent).toBe('Invalid range (Max <= Min)');
    });
});
