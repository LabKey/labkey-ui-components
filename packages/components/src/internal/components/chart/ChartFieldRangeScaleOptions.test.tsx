import React from 'react';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ChartFieldRangeScaleOptions } from './ChartFieldRangeScaleOptions';

const field = { name: 'testField', label: 'Test Label', required: false };

function renderComponent(scale = {}) {
    return render(
        <ChartFieldRangeScaleOptions field={field} onScaleChange={jest.fn} scale={scale} setScale={jest.fn}>
            <div className="child-content">Children Content</div>
        </ChartFieldRangeScaleOptions>
    );
}

describe('ChartFieldRangeScaleOptions', () => {
    test('renders gear icon and children in overlay', async () => {
        renderComponent();
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-gear')).toHaveLength(1);
        expect(document.querySelectorAll('.lk-popover')).toHaveLength(0);
        expect(document.querySelectorAll('.child-content')).toHaveLength(0);

        // Simulate click to show overlay
        await userEvent.click(document.querySelector('.fa-gear'));
        expect(document.querySelectorAll('.lk-popover')).toHaveLength(1);
        expect(document.querySelectorAll('.child-content')).toHaveLength(1);
    });

    test('shows scale and range radio groups', async () => {
        renderComponent({ trans: 'linear', type: 'automatic' });
        await userEvent.click(document.querySelector('.fa-gear'));
        expect(document.querySelectorAll('label')[0].textContent).toBe('Scale');
        expect(document.querySelectorAll('label')[1].textContent).toBe('Range');
        expect(document.querySelectorAll('.select-input-container')).toHaveLength(0);
        expect(document.querySelectorAll('input[type="radio"]')).toHaveLength(4); // 2 for scale, 2 for range
        expect(document.querySelectorAll('input[name="scaleTrans"]')).toHaveLength(2);
        expect(document.querySelectorAll('input[name="scaleType"]')).toHaveLength(2);
        expect(document.querySelectorAll('.radioinput-label.selected')[0].textContent).toBe('Linear');
        expect(document.querySelectorAll('.radioinput-label.selected')[1].textContent).toBe('Automatic');
        expect(document.querySelectorAll('input[type="number"]')).toHaveLength(0); // manual range inputs hidden by default
    });

    test('shows manual range inputs when scale.type is manual', async () => {
        renderComponent({ trans: 'log', type: 'manual', min: '1', max: '2' });
        await userEvent.click(document.querySelector('.fa-gear'));
        expect(document.querySelectorAll('.select-input-container')).toHaveLength(0);
        expect(document.querySelectorAll('input[type="radio"]')).toHaveLength(4); // 2 for scale, 2 for range
        expect(document.querySelectorAll('.radioinput-label.selected')[0].textContent).toBe('Log');
        expect(document.querySelectorAll('.radioinput-label.selected')[1].textContent).toBe('Manual');
        expect(document.querySelectorAll('input[type="number"]')).toHaveLength(2);
        expect(document.querySelector('input[name="scaleMin"]').getAttribute('value')).toBe('1');
        expect(document.querySelector('input[name="scaleMax"]').getAttribute('value')).toBe('2');
        expect(document.querySelectorAll('.text-danger')).toHaveLength(0);
    });

    test('shows invalid range warning when max <= min', async () => {
        renderComponent({ trans: 'linear', type: 'manual', min: 10, max: 5 });
        await userEvent.click(document.querySelector('.fa-gear'));
        expect(document.querySelectorAll('.text-danger')).toHaveLength(1);
        expect(document.querySelector('.text-danger').textContent).toBe('Invalid range (Max <= Min)');
    });

    test('does not show invalid range warning when min is undefined', async () => {
        renderComponent({ type: 'manual', min: undefined, max: 10 });
        await userEvent.click(document.querySelector('.fa-gear'));
        expect(document.querySelectorAll('.text-danger')).toHaveLength(0);
    });
    test('does not show invalid range warning when max is undefined', async () => {
        renderComponent({ type: 'manual', min: 5, max: undefined });
        await userEvent.click(document.querySelector('.fa-gear'));
        expect(document.querySelectorAll('.text-danger')).toHaveLength(0);
    });
});
