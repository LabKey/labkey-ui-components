import React from 'react';

import { render } from '@testing-library/react';

import { StorageAmountInput } from './StorageAmountInput';
import { UnitModel } from '../../util/measurement';

const testModel = new UnitModel(0, 'uL');

describe('StorageAmountInput', () => {
    test('minimal props', () => {
        render(
            <StorageAmountInput
                model={testModel}
                preferredUnit={'mL'}
                label={undefined}
                amountChangedHandler={jest.fn()}
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
                model={new UnitModel(0, unit)}
                preferredUnit={unit}
                label={undefined}
                amountChangedHandler={jest.fn()}
                unitsChangedHandler={jest.fn}
            />
        );

        expect(document.querySelector('input.storage-amount-input')).toHaveProperty('value', "0");
        expect(document.querySelector('input.checkin-unit-input')).toHaveProperty('value', unit);
    });

    test('Metric units, preferred units same', () => {
        render(
            <StorageAmountInput
                model={testModel}
                preferredUnit={'uL'}
                label={undefined}
                amountChangedHandler={jest.fn()}
                unitsChangedHandler={jest.fn}
            />
        );

        expect(document.querySelector('input.storage-amount-input')).toHaveProperty('value', "0");
        expect(document.querySelectorAll('.checkin-unit-select')).toHaveLength(1);
        expect(document.querySelector('.checkin-unit-select').textContent).toBe('uL');
        expect(document.querySelectorAll('.storage-item-check-in-preferred-display')).toHaveLength(0);
    });

    test('Metric units, preferred units different', () => {
        render(
            <StorageAmountInput
                model={testModel}
                preferredUnit="mL"
                label={undefined}
                amountChangedHandler={jest.fn()}
                unitsChangedHandler={jest.fn}
            />
        );

        expect(document.querySelector('input.storage-amount-input')).toHaveProperty('value', "0");
        expect(document.querySelectorAll('.checkin-unit-select')).toHaveLength(1);
        expect(document.querySelector('.checkin-unit-select').textContent).toBe('uL');
        expect(document.querySelectorAll('.storage-item-check-in-preferred-display')).toHaveLength(0);
    });

    test('Metric unit with display in preferred units', () => {
        render(
            <StorageAmountInput
                model={new UnitModel(10, 'uL')}
                preferredUnit="mL"
                label={undefined}
                amountChangedHandler={jest.fn()}
                unitsChangedHandler={jest.fn}
            />
        );

        expect(document.querySelector('input.storage-amount-input')).toHaveProperty('value', "10");
        expect(document.querySelectorAll('.checkin-unit-select')).toHaveLength(1);
        expect(document.querySelector('.checkin-unit-select').textContent).toBe('uL');
        expect(document.querySelector('.storage-item-check-in-preferred-display').textContent).toBe('Displayed as 0.01 mL');
    });

    test('Label check', () => {
        const amountLabel = 'Amount label';
        const tipText = 'Some helpful text';
        render(
            <StorageAmountInput
                model={testModel}
                preferredUnit={undefined}
                label={amountLabel}
                tipText={tipText}
                amountChangedHandler={undefined}
                unitsChangedHandler={undefined}
            />
        );

        expect(document.querySelector('input.storage-amount-input')).toHaveProperty('value', "0");
        expect(document.querySelector('.checkin-amount-label').textContent).toBe(amountLabel);
        expect(document.querySelector('.label-help-target')).not.toBeNull();
    });

    test('Negative amount error', () => {
        const unit = 'uL';
        const model = new UnitModel(-1, unit);
        render(
            <StorageAmountInput
                model={model}
                preferredUnit={undefined}
                label={undefined}
                amountChangedHandler={undefined}
            />
        );

        expect(document.querySelector('input.storage-amount-input')).toHaveProperty('value', "-1");
        expect(document.querySelector('.storage-item-precision-alert').textContent).toBe(
            'Amount must be a positive value.'
        );
    });
});
