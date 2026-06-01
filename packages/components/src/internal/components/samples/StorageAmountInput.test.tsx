/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';

import { render } from '@testing-library/react';

import { StorageAmountInput } from './StorageAmountInput';
import { UnitModel } from '../../util/measurement';

const testModel = new UnitModel(0, 'uL');

describe('StorageAmountInput', () => {
    test('minimal props', () => {
        render(
            <StorageAmountInput
                amountChangedHandler={jest.fn()}
                label={undefined}
                model={testModel}
                preferredUnit={'mL'}
            />
        );

        expect(document.querySelector('input.storage-amount-input')).toHaveProperty('value', '0');
        expect(document.querySelector('.storage-item-unit-text').textContent).toBe('uL');
        expect(document.querySelector('.label-help-target')).toBeNull();
    });

    test('Unknown units', () => {
        const unit = 'abcd';
        render(
            <StorageAmountInput
                amountChangedHandler={jest.fn()}
                label={undefined}
                model={new UnitModel(0, unit)}
                preferredUnit={unit}
                unitsChangedHandler={jest.fn}
            />
        );

        expect(document.querySelector('input.storage-amount-input')).toHaveProperty('value', '0');
        expect(document.querySelector('input.checkin-unit-input')).toHaveProperty('value', unit);
    });

    test('Metric units, preferred units same', () => {
        render(
            <StorageAmountInput
                amountChangedHandler={jest.fn()}
                label={undefined}
                model={testModel}
                preferredUnit={'uL'}
                unitsChangedHandler={jest.fn}
            />
        );

        expect(document.querySelector('input.storage-amount-input')).toHaveProperty('value', '0');
        expect(document.querySelectorAll('.checkin-unit-select')).toHaveLength(1);
        expect(document.querySelector('.checkin-unit-select').textContent).toBe('uL');
        expect(document.querySelectorAll('.storage-item-check-in-preferred-display')).toHaveLength(0);
    });

    test('Metric units, preferred units different', () => {
        render(
            <StorageAmountInput
                amountChangedHandler={jest.fn()}
                label={undefined}
                model={testModel}
                preferredUnit="mL"
                unitsChangedHandler={jest.fn}
            />
        );

        expect(document.querySelector('input.storage-amount-input')).toHaveProperty('value', '0');
        expect(document.querySelectorAll('.checkin-unit-select')).toHaveLength(1);
        expect(document.querySelector('.checkin-unit-select').textContent).toBe('uL');
        expect(document.querySelectorAll('.storage-item-check-in-preferred-display')).toHaveLength(0);
    });

    test('Metric unit with display in preferred units', () => {
        render(
            <StorageAmountInput
                amountChangedHandler={jest.fn()}
                label={undefined}
                model={new UnitModel(10, 'uL')}
                preferredUnit="mL"
                unitsChangedHandler={jest.fn}
            />
        );

        expect(document.querySelector('input.storage-amount-input')).toHaveProperty('value', '10');
        expect(document.querySelectorAll('.checkin-unit-select')).toHaveLength(1);
        expect(document.querySelector('.checkin-unit-select').textContent).toBe('uL');
        expect(document.querySelector('.storage-item-check-in-preferred-display').textContent).toBe(
            'Displayed as 0.01 mL'
        );
    });

    test('Label check', () => {
        const amountLabel = 'Amount label';
        const tipText = 'Some helpful text';
        render(
            <StorageAmountInput
                amountChangedHandler={undefined}
                label={amountLabel}
                model={testModel}
                preferredUnit={undefined}
                tipText={tipText}
                unitsChangedHandler={undefined}
            />
        );

        expect(document.querySelector('input.storage-amount-input')).toHaveProperty('value', '0');
        expect(document.querySelector('.checkin-amount-label').textContent).toBe(amountLabel);
        expect(document.querySelector('.label-help-target')).not.toBeNull();
    });

    test('Negative amount error', () => {
        const unit = 'uL';
        const model = new UnitModel(-1, unit);
        render(
            <StorageAmountInput
                amountChangedHandler={undefined}
                label={undefined}
                model={model}
                preferredUnit={undefined}
            />
        );

        expect(document.querySelector('input.storage-amount-input')).toHaveProperty('value', '-1');
        expect(document.querySelector('.storage-item-precision-alert').textContent).toBe(
            'Amount must be a non-negative value.'
        );
    });

    test('Large amount error', () => {
        const unit = 'uL';
        const model = new UnitModel(1e310, unit);
        render(
            <StorageAmountInput
                amountChangedHandler={undefined}
                label={undefined}
                model={model}
                preferredUnit={undefined}
            />
        );

        expect(document.querySelector('input.storage-amount-input')).toHaveProperty('value', 'Infinity');
        expect(document.querySelector('.storage-item-precision-alert').textContent).toBe(
            'Infinite or extremely large values are not allowed for amount.'
        );
    });
});
