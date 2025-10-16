import React from 'react';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ChartFieldAggregateOptions } from './ChartFieldAggregateOptions';
import { BAR_CHART_AGGREGATE_NAME, BAR_CHART_ERROR_BAR_NAME } from "./constants";

const field = { name: 'testField', label: 'Test Label', required: false };
const fieldValues = {
    testField: { value: 'ABC' },
    [BAR_CHART_AGGREGATE_NAME]: { value: 'SUM' },
    [BAR_CHART_ERROR_BAR_NAME]: undefined,
};

function renderComponent(props = {}) {
    return render(
        <ChartFieldAggregateOptions
            field={field}
            fieldValues={fieldValues}
            includeCount={true}
            includeNone={true}
            onErrorBarChange={jest.fn}
            onSelectFieldChange={jest.fn}
            {...props}
        />
    );
}

describe('ChartFieldAggregateOptions', () => {
    test('renders gear icon and overlay', async () => {
        renderComponent();
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-gear')).toHaveLength(1);
        expect(document.querySelectorAll('.lk-popover')).toHaveLength(0);

        await userEvent.click(document.querySelector('.fa-gear'));
        expect(document.querySelectorAll('.lk-popover')).toHaveLength(1);
    });

    test('shows aggregate method select and error bar radio group in overlay', async () => {
        renderComponent();
        await userEvent.click(document.querySelector('.fa-gear'));
        expect(document.querySelectorAll('label')[0].textContent).toContain('Aggregate Method');
        expect(document.querySelectorAll('label')[1].textContent).toContain('Error Bars');
        expect(document.querySelectorAll('.field-option-radio-group')).toHaveLength(1);
        expect(document.querySelectorAll('.select-input-container')).toHaveLength(1);
        expect(document.querySelectorAll('input[type="radio"]')).toHaveLength(3); // None, SD, SEM
        expect(document.querySelector('input[name="error-bar-method"][value=""]').hasAttribute('disabled')).toBeTruthy();
        expect(document.querySelector('input[name="error-bar-method"][value="SD"]').hasAttribute('disabled')).toBeTruthy();
        expect(document.querySelector('input[name="error-bar-method"][value="SEM"]').hasAttribute('disabled')).toBeTruthy();
        expect(document.querySelectorAll('.radioinput-label.selected')[0].textContent).toBe('None');
    });

    test('error bar radios are enabled for aggregate MEAN', async () => {
        const fieldValuesMean = {
            ...fieldValues,
            [BAR_CHART_AGGREGATE_NAME]: { value: 'MEAN' },
        };
        renderComponent({ fieldValues: fieldValuesMean });
        await userEvent.click(document.querySelector('.fa-gear'));
        expect(document.querySelector('input[name="error-bar-method"][value=""]').hasAttribute('disabled')).toBeFalsy();
        expect(document.querySelector('input[name="error-bar-method"][value="SD"]').hasAttribute('disabled')).toBeFalsy();
        expect(document.querySelector('input[name="error-bar-method"][value="SEM"]').hasAttribute('disabled')).toBeFalsy();
        expect(document.querySelectorAll('.radioinput-label.selected')[0].textContent).toBe('None');
    });

    test('error bar radio value selected when fieldValues set', async () => {
        const fieldValuesSEM = {
            ...fieldValues,
            [BAR_CHART_AGGREGATE_NAME]: { value: 'MEAN' },
            [BAR_CHART_ERROR_BAR_NAME]: { value: 'SEM' },
        };
        renderComponent({ fieldValues: fieldValuesSEM });
        await userEvent.click(document.querySelector('.fa-gear'));
        expect(document.querySelector('input[name="error-bar-method"][value=""]').hasAttribute('disabled')).toBeFalsy();
        expect(document.querySelector('input[name="error-bar-method"][value="SD"]').hasAttribute('disabled')).toBeFalsy();
        expect(document.querySelector('input[name="error-bar-method"][value="SEM"]').hasAttribute('disabled')).toBeFalsy();
        expect(document.querySelectorAll('.radioinput-label.selected')[0].textContent).toBe('Standard Error of the Mean');
    });

    test('does not render if no field is selected', async () => {
        const emptyFieldValues = {
            testField: undefined,
            [BAR_CHART_AGGREGATE_NAME]: { value: 'MEAN' },
            [BAR_CHART_ERROR_BAR_NAME]: { value: 'SEM' },
        };
        renderComponent({ fieldValues: emptyFieldValues });
        await userEvent.click(document.querySelector('.fa-gear'));
        expect(document.querySelectorAll('label')).toHaveLength(0);
        expect(document.querySelectorAll('input[type="radio"]')).toHaveLength(0);
    });

    test('renders inline inputs when asOverlay is false', () => {
        const fieldValuesSEM = {
            ...fieldValues,
            [BAR_CHART_AGGREGATE_NAME]: { value: 'MEAN' },
            [BAR_CHART_ERROR_BAR_NAME]: { value: 'SEM' },
        };
        renderComponent({ fieldValues: fieldValuesSEM, asOverlay: false });
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-gear')).toHaveLength(0);
        expect(document.querySelectorAll('.lk-popover')).toHaveLength(0);
        expect(document.querySelectorAll('.select-input-container')).toHaveLength(1);
        expect(document.querySelectorAll('.field-option-radio-group')).toHaveLength(1);
    });
});
