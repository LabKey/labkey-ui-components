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
                preferredUnit={undefined}
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
                preferredUnit={undefined}
                label={undefined}
                amountChangedHandler={jest.fn()}
                unitsChangedHandler={jest.fn}
            />
        );

        expect(document.querySelector('input.storage-amount-input')).toHaveProperty('value', "0");
        expect(document.querySelector('input.checkin-unit-input')).toHaveProperty('value', unit);
    });

    test('Metric units, preferred units not set', () => {
        const unit = 'uL';
        render(
            <StorageAmountInput
                model={testModel}
                preferredUnit={undefined}
                label={undefined}
                amountChangedHandler={jest.fn()}
                unitsChangedHandler={jest.fn}
            />
        );

        expect(document.querySelector('input.storage-amount-input')).toHaveProperty('value', "0");
        expect(document.querySelector('input.checkin-unit-input')).toHaveProperty('value', unit);
    });

    test('Metric units, preferred units same', () => {
        const unit = 'uL';
        render(
            <StorageAmountInput
                model={testModel}
                preferredUnit={unit}
                label={undefined}
                amountChangedHandler={jest.fn()}
                unitsChangedHandler={jest.fn}
            />
        );

        expect(document.querySelector('input.storage-amount-input')).toHaveProperty('value', "0");
        expect(document.querySelectorAll('.checkin-unit-select')).toHaveLength(1);
        expect(document.querySelector('.checkin-unit-select').textContent).toBe(unit);
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
