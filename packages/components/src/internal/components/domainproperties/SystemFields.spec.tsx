import React from 'react';
import { mount } from 'enzyme';

import { SAMPLE_DOMAIN_DEFAULT_SYSTEM_FIELDS } from '../samples/constants';

import { SystemFields } from './SystemFields';

describe('SystemFields', () => {
    function verifyEnableCheckbox(enableCheckboxes: any, isExpDateDisabled: boolean) {
        expect(enableCheckboxes.length).toEqual(7 * 2);
        const nameCheckbox = enableCheckboxes.at(0);
        expect(nameCheckbox.prop('checked')).toBeTruthy();
        expect(nameCheckbox.prop('disabled')).toBeTruthy();
        const statusCheckbox = enableCheckboxes.at(2);
        expect(statusCheckbox.prop('checked')).toBeTruthy();
        expect(statusCheckbox.prop('disabled')).toBeTruthy();
        const descCheckbox = enableCheckboxes.at(4);
        expect(descCheckbox.prop('checked')).toBeTruthy();
        expect(descCheckbox.prop('disabled')).toBeFalsy();
        const expCheckbox = enableCheckboxes.at(6);
        expect(expCheckbox.prop('checked')).toEqual(!isExpDateDisabled);
        expect(expCheckbox.prop('disabled')).toBeFalsy();
    }

    test('Default', () => {
        const wrapped = mount(
            <SystemFields fields={SAMPLE_DOMAIN_DEFAULT_SYSTEM_FIELDS} onSystemFieldEnable={jest.fn()} />
        );
        const rowCount = SAMPLE_DOMAIN_DEFAULT_SYSTEM_FIELDS.length;
        expect(wrapped.find('tr')).toHaveLength(rowCount + 1);
        expect(wrapped.find('th')).toHaveLength(6);

        const enableCheckboxes = wrapped.find('input[type="checkbox"]');
        expect(enableCheckboxes.length).toEqual(rowCount * 2);

        verifyEnableCheckbox(enableCheckboxes, false);
    });

    test('Toggle', () => {
        const wrapped = mount(
            <SystemFields fields={SAMPLE_DOMAIN_DEFAULT_SYSTEM_FIELDS} onSystemFieldEnable={jest.fn()} />
        );

        expect(wrapped.find('.collapse.in').exists()).toBe(true);

        const header = wrapped.find('.domain-system-fields-header__icon');
        header.simulate('click');

        expect(wrapped.find('.collapse.in').exists()).toBe(false);
    });

    test('With disabled fields', () => {
        const wrapped = mount(
            <SystemFields
                fields={SAMPLE_DOMAIN_DEFAULT_SYSTEM_FIELDS}
                onSystemFieldEnable={jest.fn()}
                disabledSystemFields={['MaterialExpDate']}
            />
        );
        const enableCheckboxes = wrapped.find('input[type="checkbox"]');
        verifyEnableCheckbox(enableCheckboxes, true);
    });

    test('With disabled fields, case insenstive', () => {
        const wrapped = mount(
            <SystemFields
                fields={SAMPLE_DOMAIN_DEFAULT_SYSTEM_FIELDS}
                onSystemFieldEnable={jest.fn()}
                disabledSystemFields={['materialexpdate']}
            />
        );
        const enableCheckboxes = wrapped.find('input[type="checkbox"]');
        verifyEnableCheckbox(enableCheckboxes, true);
    });
});
