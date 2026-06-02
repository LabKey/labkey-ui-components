/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { ChartFieldRangeScaleOptions } from './ChartFieldRangeScaleOptions';
import { ScaleType } from './models';

function renderComponent(scale = {} as ScaleType) {
    return render(<ChartFieldRangeScaleOptions onScaleChange={jest.fn} scale={scale} showScaleTrans />);
}

describe('ChartFieldRangeScaleOptions', () => {
    test('shows scale and range radio groups', async () => {
        renderComponent({ trans: 'linear', type: 'automatic' });
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
        expect(document.querySelectorAll('.text-danger')).toHaveLength(1);
        expect(document.querySelector('.text-danger').textContent).toBe('Invalid range (Max <= Min)');
    });

    test('does not show invalid range warning when min is undefined', async () => {
        renderComponent({ type: 'manual', min: undefined, max: 10 } as ScaleType);
        expect(document.querySelectorAll('.text-danger')).toHaveLength(0);
    });
    test('does not show invalid range warning when max is undefined', async () => {
        renderComponent({ type: 'manual', min: 5, max: undefined } as ScaleType);
        expect(document.querySelectorAll('.text-danger')).toHaveLength(0);
    });
});
