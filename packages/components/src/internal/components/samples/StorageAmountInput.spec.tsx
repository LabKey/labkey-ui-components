import React from 'react';
import { mount } from 'enzyme';
import { StorageAmountInput } from './StorageAmountInput';
import { LabelHelpTip } from '../base/LabelHelpTip';
import { Alert } from '../base/Alert';
import { UnitModel } from '../../util/measurement';

const testModel = new UnitModel(0, 'uL');

describe("<StorageAmountInput />", () => {
    test("minimal props", () =>{

        const wrapper = mount(
            <StorageAmountInput model={testModel} preferredUnit={undefined} label={undefined} amountChangedHandler={jest.fn()} />
        );

        expect(wrapper.find("input.storage-amount-input").props()).toHaveProperty('value', 0);
        expect(wrapper.find(".storage-item-unit-text").text()).toBe('uL');
        expect(wrapper.find(LabelHelpTip)).toHaveLength(0);

        wrapper.unmount();
    });

    test("Unknown units", () => {
        const unit = 'abcd';
        const wrapper = mount(
            <StorageAmountInput model={new UnitModel(0, unit)} preferredUnit={undefined} label={undefined} amountChangedHandler={jest.fn()} unitsChangedHandler={jest.fn} />
        );

        expect(wrapper.find("input.storage-amount-input").props()).toHaveProperty('value', 0);
        expect(wrapper.find("input.checkin-unit-input").props()).toHaveProperty('value', unit);

        wrapper.unmount();
    });

    test("Metric units, preferred units not set", () => {
        const unit = 'uL';
        const wrapper = mount(
            <StorageAmountInput model={testModel} preferredUnit={undefined} label={undefined} amountChangedHandler={jest.fn()} unitsChangedHandler={jest.fn} />
        );

        expect(wrapper.find("input.storage-amount-input").props()).toHaveProperty('value', 0);
        expect(wrapper.find("input.checkin-unit-input").props()).toHaveProperty('value', unit);

        wrapper.unmount();
    });

    test("Metric units, preferred units same", () => {
        const unit = 'uL';
        const wrapper = mount(
            <StorageAmountInput model={testModel} preferredUnit={unit} label={undefined} amountChangedHandler={jest.fn()} unitsChangedHandler={jest.fn} />
        );

        expect(wrapper.find("input.storage-amount-input").props()).toHaveProperty('value', 0);
        expect(wrapper.find(".checkin-unit-select")).toHaveLength(1);
        expect(wrapper.find(".checkin-unit-select").text()).toBe(unit);

        wrapper.unmount();
    });

    test("Label check", () => {
        const amountLabel = 'Amount label';
        const tipText = 'Some helpful text';
        const wrapper = mount(
            <StorageAmountInput model={testModel} preferredUnit={undefined} label={amountLabel} tipText={tipText} amountChangedHandler={undefined} unitsChangedHandler={undefined} />
        );

        expect(wrapper.find("input.storage-amount-input").props()).toHaveProperty('value', 0);
        expect(wrapper.find(".checkin-amount-label")).toHaveLength(1);
        expect(wrapper.find(".checkin-amount-label").text()).toBe(amountLabel);
        expect(wrapper.find(LabelHelpTip)).toHaveLength(1);

        wrapper.unmount();
    });

    test("Negative amount error", () => {
        const unit = 'uL';
        const model = new UnitModel(-1, unit);
        const wrapper = mount(
            <StorageAmountInput model={model} preferredUnit={undefined} label={undefined} amountChangedHandler={undefined} />
        );

        expect(wrapper.find("input.storage-amount-input").props()).toHaveProperty('value', -1);
        expect(wrapper.find(Alert)).toHaveLength(1);
        expect(wrapper.find(Alert).text()).toBe("Amount must be a positive value.");

        wrapper.unmount();
    });
});
