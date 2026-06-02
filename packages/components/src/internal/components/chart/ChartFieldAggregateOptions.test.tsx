/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ChartFieldAggregateOptions } from './ChartFieldAggregateOptions';
import { ChartConfig, ChartTypeInfo } from './models';

const field = { name: 'testField', label: 'Test Label', required: false };
const chartConfig = {
    geomOptions: {},
    gridLinesVisible: undefined,
    labels: {},
    measures: {
        y: {
            aggregate: { value: 'SUM' },
            errorBars: undefined,
        },
    },
    pointType: undefined,
    renderType: 'bar_chart',
    scales: {},
} as ChartConfig;

function renderComponent(props = {}) {
    return render(
        <ChartFieldAggregateOptions
            chartConfig={chartConfig}
            field={field}
            selectedType={{ name: 'bar_chart' } as ChartTypeInfo}
            setChartConfig={jest.fn}
            {...props}
        />
    );
}

describe('ChartFieldAggregateOptions', () => {
    test('shows aggregate method select and error bar radio group in overlay', async () => {
        renderComponent();
        await userEvent.click(document.querySelector('.fa-gear'));
        expect(document.querySelectorAll('label')[0].textContent).toContain('Aggregate Method');
        expect(document.querySelectorAll('label')[1].textContent).toContain('Error Bars');
        expect(document.querySelectorAll('.field-option-radio-group')).toHaveLength(1);
        expect(document.querySelectorAll('.select-input-container')).toHaveLength(1);
        expect(document.querySelectorAll('input[type="radio"]')).toHaveLength(3); // None, SD, SEM
        expect(
            document.querySelector('input[name="error-bar-method"][value=""]').hasAttribute('disabled')
        ).toBeTruthy();
        expect(
            document.querySelector('input[name="error-bar-method"][value="SD"]').hasAttribute('disabled')
        ).toBeTruthy();
        expect(
            document.querySelector('input[name="error-bar-method"][value="SEM"]').hasAttribute('disabled')
        ).toBeTruthy();
        expect(document.querySelectorAll('.radioinput-label.selected')[0].textContent).toBe('None');
    });

    test('error bar radios are enabled for aggregate MEAN', async () => {
        const meanChartConfig = {
            ...chartConfig,
            measures: {
                y: {
                    aggregate: { value: 'MEAN' },
                    errorBars: undefined,
                },
            },
        } as ChartConfig;
        renderComponent({ chartConfig: meanChartConfig });
        await userEvent.click(document.querySelector('.fa-gear'));
        expect(document.querySelector('input[name="error-bar-method"][value=""]').hasAttribute('disabled')).toBeFalsy();
        expect(
            document.querySelector('input[name="error-bar-method"][value="SD"]').hasAttribute('disabled')
        ).toBeFalsy();
        expect(
            document.querySelector('input[name="error-bar-method"][value="SEM"]').hasAttribute('disabled')
        ).toBeFalsy();
        expect(document.querySelectorAll('.radioinput-label.selected')[0].textContent).toBe('None');
    });

    test('error bar radio value selected when values set', async () => {
        const semChartConfig = {
            ...chartConfig,
            measures: {
                y: {
                    aggregate: { value: 'MEAN' },
                    errorBars: 'SEM',
                },
            },
        } as ChartConfig;
        renderComponent({ chartConfig: semChartConfig });
        await userEvent.click(document.querySelector('.fa-gear'));
        expect(document.querySelector('input[name="error-bar-method"][value=""]').hasAttribute('disabled')).toBeFalsy();
        expect(
            document.querySelector('input[name="error-bar-method"][value="SD"]').hasAttribute('disabled')
        ).toBeFalsy();
        expect(
            document.querySelector('input[name="error-bar-method"][value="SEM"]').hasAttribute('disabled')
        ).toBeFalsy();
        expect(document.querySelectorAll('.radioinput-label.selected')[0].textContent).toBe(
            'Standard Error of the Mean'
        );
    });

    test('renders inline inputs when asOverlay is false', () => {
        const semChartConfig = {
            ...chartConfig,
            measures: {
                y: {
                    aggregate: { value: 'MEAN' },
                    errorBars: 'SEM',
                },
            },
        } as ChartConfig;
        renderComponent({ chartConfig: semChartConfig, asOverlay: false });
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-gear')).toHaveLength(0);
        expect(document.querySelectorAll('.lk-popover')).toHaveLength(0);
        expect(document.querySelectorAll('.select-input-container')).toHaveLength(1);
        expect(document.querySelectorAll('.field-option-radio-group')).toHaveLength(1);
    });
});
