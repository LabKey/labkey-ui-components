import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { Filter } from "@labkey/api";

import { FilterValueDisplay } from './FilterValueDisplay';
import { formatDate } from "../../util/Date";

describe('FilterValueDisplay', () => {

    function validate(wrapper: ReactWrapper, filterLabel?: string, value?: string, isExclusion?: boolean)
    {
        const display = wrapper.find('.filter-display__filter-value');
        expect(display.prop('className').indexOf('field-display__filter-value-negate') === -1).toBe(!isExclusion);

        if (filterLabel)
            expect(display.text()).toContain(filterLabel);

        if (value)
            expect(display.text()).toContain(value);
    }

    test('no filter value', () => {
        const wrapper = mount(
            <FilterValueDisplay
                filter={Filter.create('StringField', null, Filter.Types.HAS_ANY_VALUE)}
            />
        );
        validate(wrapper, 'Any Value');

        wrapper.unmount();
    });

    test('no filter title', () => {
        const wrapper = mount(
            <FilterValueDisplay
                filter={Filter.create('StringField', 'ABC', Filter.Types.Equals)}
            />
        );
        validate(wrapper, null, 'ABC');

        wrapper.unmount();
    });

    test('is exclusion filter', () => {
        const wrapper = mount(
            <FilterValueDisplay
                filter={Filter.create('StringField', 'ABC', Filter.Types.NEQ_OR_NULL)}
            />
        );
        validate(wrapper, null, 'ABC', true);

        wrapper.unmount();
    });

    test('show operator and value', () => {
        const wrapper = mount(
            <FilterValueDisplay
                filter={Filter.create('IntField', 1, Filter.Types.GT)}
            />
        );
        validate(wrapper, '>', '1');

        wrapper.unmount();
    });

    test('value list, less than 5', () => {
        const wrapper = mount(
            <FilterValueDisplay
                filter={Filter.create('StringField', "value1;value2;value3", Filter.Types.IN)}
            />
        );
        validate(wrapper, null, 'value1value2value3');

        wrapper.unmount();
    });

    test('value list, longer than 5', () => {
        const wrapper = mount(
            <FilterValueDisplay
                filter={Filter.create('StringField', "value1;value2;value3;value4;value5;value6;value7", Filter.Types.IN)}
            />
        );
        validate(wrapper, null, 'value1value2value3value4value5and 2 more');

        wrapper.unmount();
    });

    test('value list, longer than 5', () => {
        const wrapper = mount(
            <FilterValueDisplay
                filter={Filter.create('StringField', "value1;value2;value3;value4;value5;value6;value7", Filter.Types.NOT_IN)}
            />
        );
        validate(wrapper, null, 'value1value2value3value4value5and 2 more', true);

        wrapper.unmount();
    });

    test('between', () => {
        const wrapper = mount(
            <FilterValueDisplay
                filter={Filter.create('IntField', "1,100", Filter.Types.BETWEEN)}
            />
        );
        validate(wrapper, null, '1 - 100');

        wrapper.unmount();
    });

    test('not between', () => {
        const wrapper = mount(
            <FilterValueDisplay
                filter={Filter.create('IntField', "1,100", Filter.Types.NOT_BETWEEN)}
            />
        );
        validate(wrapper, 'Not Between', '1 - 100', false/*not between uses explicit title to indicate exclusion*/);

        wrapper.unmount();
    });

    test('boolean filter', () => {
        const wrapper = mount(
            <FilterValueDisplay
                filter={Filter.create('BooleanField', 'true', Filter.Types.Equals)}
            />
        );
        validate(wrapper, null, 'true');

        wrapper.unmount();
    });

    test('date filter', () => {
        const datePOSIX = 1596750283812; // Aug 6, 2020 14:44 America/PST
        const testDate = new Date(datePOSIX);

        const wrapper = mount(
            <FilterValueDisplay
                filter={Filter.create('DateField', formatDate(testDate, 'America/PST', 'YYYY-MM-dd'), Filter.Types.Equals)}
            />
        );
        validate(wrapper, null, '2020-08-06');

        wrapper.unmount();
    });
});
