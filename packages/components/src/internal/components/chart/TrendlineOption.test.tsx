import React from 'react';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { waitFor } from '@testing-library/dom';

import { LABKEY_VIS } from '../../constants';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { TrendlineOption } from './TrendlineOption';
import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { QueryInfo } from '../../../public/QueryInfo';
import { ViewInfo } from '../../ViewInfo';
import { ChartConfig, ChartTypeInfo } from './models';

LABKEY_VIS = {
    GenericChartHelper: {
        getAllowableTypes: () => ['text'],
        isMeasureDimensionMatch: () => true,
        TRENDLINE_OPTIONS: [
            { value: 'option1', label: 'Option 1', schemaPrefix: undefined, showMin: false, showMax: false },
            { value: 'option2', label: 'Option 2', schemaPrefix: null, showMin: false, showMax: false },
            { value: 'option3', label: 'Option 3', schemaPrefix: 'other', showMin: true, showMax: true },
            { value: 'option4', label: 'Option 4', schemaPrefix: 'assay', showMin: true, showMax: false },
        ],
    },
};

const baseChartConfig = {
    geomOptions: {},
    gridLinesVisible: undefined,
    labels: {},
    measures: {},
    pointType: undefined,
    renderType: 'line_plot',
    scales: {},
} as ChartConfig;

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

describe('TrendlineOption', () => {
    test('hidden without x-axis value selected', async () => {
        render(
            <TrendlineOption
                chartConfig={baseChartConfig}
                model={model}
                selectedType={LINE_PLOT_TYPE}
                setChartConfig={jest.fn()}
            />
        );
        await waitFor(() => {
            expect(document.querySelectorAll('.trendline-option')).toHaveLength(0);
        });
        expect(document.querySelectorAll('.select-input')).toHaveLength(0);
        expect(document.querySelectorAll('option')).toHaveLength(0);
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(0);
        expect(document.querySelectorAll('input[name="trendlineAsymptoteMin"]')).toHaveLength(0);
        expect(document.querySelectorAll('input[name="trendlineAsymptoteMax"]')).toHaveLength(0);
        expect(document.querySelectorAll('input[name="trendlineParameters"]')).toHaveLength(0);
    });

    test('shown with x-axis value selected, options filtered by schemaPrefix', async () => {
        const chartConfig = {
            ...baseChartConfig,
            geomOptions: {
                trendlineAsymptoteMin: undefined,
                trendlineAsymptoteMax: undefined,
                trendlineParameters: undefined,
            },
            measures: {
                x: { fieldKey: 'field1', jsonType: 'int' },
            },
        } as ChartConfig;
        const assayModel = makeTestQueryModel(
            new SchemaQuery('assay', 'query'),
            QueryInfo.fromJsonForTests({ columns, name: 'query', schemaName: 'assay' }),
            [],
            0
        );
        render(
            <TrendlineOption
                chartConfig={chartConfig}
                model={assayModel}
                selectedType={LINE_PLOT_TYPE}
                setChartConfig={jest.fn()}
            />
        );
        await waitFor(() => {
            expect(document.querySelectorAll('.trendline-option')).toHaveLength(1);
        });

        expect(document.querySelector('label').textContent).toBe('Trendline  ');
        expect(document.querySelectorAll('.select-input')).toHaveLength(1);
        expect(document.querySelectorAll('.select-input__option')).toHaveLength(0); // none until click below
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(0);

        await userEvent.click(document.querySelector('.select-input__indicator'));
        const options = document.querySelectorAll('.select-input__option');
        expect(options).toHaveLength(3); // options filtered for schemaPrefix
        expect(options[0].textContent).toBe('Option 1');
        expect(options[1].textContent).toBe('Option 2');
        expect(options[2].textContent).toBe('Option 4');
    });

    test('hidden with x-axis value selected, date', async () => {
        const chartConfig = {
            ...baseChartConfig,
            geomOptions: {
                trendlineAsymptoteMin: undefined,
                trendlineAsymptoteMax: undefined,
                trendlineParameters: undefined,
            },
            measures: {
                x: { name: 'field1', jsonType: 'date' },
            },
        } as ChartConfig;
        render(
            <TrendlineOption
                chartConfig={chartConfig}
                model={model}
                selectedType={LINE_PLOT_TYPE}
                setChartConfig={jest.fn()}
            />
        );
        await waitFor(() => {
            expect(document.querySelectorAll('.trendline-option')).toHaveLength(0);
        });

        expect(document.querySelectorAll('.select-input')).toHaveLength(0);
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(0);
    });

    test('hidden with x-axis value selected, time', async () => {
        const chartConfig = {
            ...baseChartConfig,
            geomOptions: {
                trendlineAsymptoteMin: undefined,
                trendlineAsymptoteMax: undefined,
                trendlineParameters: undefined,
            },
            measures: {
                x: { name: 'field1', jsonType: 'time' },
            },
        } as ChartConfig;
        render(
            <TrendlineOption
                chartConfig={chartConfig}
                model={model}
                selectedType={LINE_PLOT_TYPE}
                setChartConfig={jest.fn()}
            />
        );
        await waitFor(() => {
            expect(document.querySelectorAll('.trendline-option')).toHaveLength(0);
        });

        expect(document.querySelectorAll('.select-input')).toHaveLength(0);
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(0);
    });

    test('show asymptote min and max', async () => {
        const chartConfig = {
            ...baseChartConfig,
            geomOptions: {
                trendlineType: 'option3',
                trendlineAsymptoteMin: 0.1,
                trendlineAsymptoteMax: 1.0,
                trendlineParameters: undefined,
            },
            measures: {
                x: { name: 'field1', jsonType: 'int' },
            },
        } as ChartConfig;
        render(
            <TrendlineOption
                chartConfig={chartConfig}
                model={model}
                selectedType={LINE_PLOT_TYPE}
                setChartConfig={jest.fn()}
            />
        );
        await waitFor(() => {
            expect(document.querySelectorAll('.trendline-option')).toHaveLength(1);
        });

        expect(document.querySelectorAll('.select-input')).toHaveLength(1);
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(1);

        await userEvent.click(document.querySelector('.fa-gear'));
        expect(document.querySelectorAll('input[type="radio"]')).toHaveLength(2);

        await userEvent.click(document.querySelector('input[value="manual"]'));
        expect(document.querySelectorAll('input[type="number"]')).toHaveLength(2);
        expect(document.querySelector('input[name="trendlineAsymptoteMin"]').getAttribute('value')).toBe('0.1');
        expect(document.querySelector('input[name="trendlineAsymptoteMax"]').getAttribute('value')).toBe('1');

        // clicking automatic should hide the inputs and clear values
        await userEvent.click(document.querySelector('input[value="automatic"]'));
        expect(document.querySelectorAll('input[type="number"]')).toHaveLength(0);
        await userEvent.click(document.querySelector('input[value="manual"]'));
        expect(document.querySelectorAll('input[type="number"]')).toHaveLength(2);
        expect(document.querySelector('input[name="trendlineAsymptoteMin"]').getAttribute('value')).toBe('');
        expect(document.querySelector('input[name="trendlineAsymptoteMax"]').getAttribute('value')).toBe('');
    });

    test('show asymptote min but not max', async () => {
        const chartConfig = {
            ...baseChartConfig,
            geomOptions: {
                trendlineType: 'option4',
                trendlineAsymptoteMin: 0.1,
                trendlineAsymptoteMax: undefined,
                trendlineParameters: undefined,
            },
            measures: {
                x: { name: 'field1', jsonType: 'int' },
            },
        } as ChartConfig;
        render(
            <TrendlineOption
                chartConfig={chartConfig}
                model={model}
                selectedType={LINE_PLOT_TYPE}
                setChartConfig={jest.fn()}
            />
        );
        await waitFor(() => {
            expect(document.querySelectorAll('.trendline-option')).toHaveLength(1);
        });

        expect(document.querySelectorAll('.select-input')).toHaveLength(1);
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(1);

        await userEvent.click(document.querySelector('.fa-gear'));
        expect(document.querySelectorAll('input[type="radio"]')).toHaveLength(2);

        await userEvent.click(document.querySelector('input[value="manual"]'));
        expect(document.querySelectorAll('input[type="number"]')).toHaveLength(1);
        expect(document.querySelectorAll('input[name="trendlineAsymptoteMax"]')).toHaveLength(0);
        expect(document.querySelector('input[name="trendlineAsymptoteMin"]').getAttribute('value')).toBe('0.1');

        // clicking automatic should hide the inputs and clear values
        await userEvent.click(document.querySelector('input[value="automatic"]'));
        expect(document.querySelectorAll('input[type="number"]')).toHaveLength(0);
        await userEvent.click(document.querySelector('input[value="manual"]'));
        expect(document.querySelectorAll('input[type="number"]')).toHaveLength(1);
        expect(document.querySelectorAll('input[name="trendlineAsymptoteMax"]')).toHaveLength(0);
        expect(document.querySelector('input[name="trendlineAsymptoteMin"]').getAttribute('value')).toBe('');
    });

    test('show provided parameters in trendline gear tooltip', async () => {
        const chartConfig = {
            ...baseChartConfig,
            geomOptions: {
                trendlineType: 'option1',
                trendlineAsymptoteMin: undefined,
                trendlineAsymptoteMax: undefined,
                trendlineParameters: 'field1',
            },
            measures: {
                x: { name: 'field1', jsonType: 'int' },
            },
        };
        render(
            <TrendlineOption
                chartConfig={chartConfig}
                model={model}
                selectedType={LINE_PLOT_TYPE}
                setChartConfig={jest.fn()}
            />
        );
        await waitFor(() => {
            expect(document.querySelectorAll('.trendline-option')).toHaveLength(1);
        });

        expect(document.querySelectorAll('.select-input')).toHaveLength(1); // trendline type
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(1);

        await userEvent.click(document.querySelector('.fa-gear'));
        expect(document.querySelectorAll('.select-input')).toHaveLength(2); // trendline type and now provided parameters
        expect(document.querySelectorAll('input[name="trendlineParameters"]')).toHaveLength(1);
        expect(document.querySelector('input[name="trendlineParameters"]').getAttribute('value')).toBe('field1');
    });
});
