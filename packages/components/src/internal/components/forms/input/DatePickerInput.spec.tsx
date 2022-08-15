import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import DatePicker from 'react-datepicker';

import { QueryColumn } from '../../../../public/QueryColumn';
import { FieldLabel } from '../FieldLabel';

import { DatePickerInputImpl } from './DatePickerInput';

beforeAll(() => {
    LABKEY.container = {
        formats: {
            dateFormat: 'yyyy-MM-dd',
            dateTimeFormat: 'yyyy-MM-dd HH:mm',
            numberFormat: null,
        },
    };
});

describe('DatePickerInput', () => {
    const DEFAULT_PROPS = {
        queryColumn: QueryColumn.create({ fieldKey: 'col', caption: 'Test Column', required: true }),
    };

    function validate(wrapper: ReactWrapper, hasFieldLabel = true): void {
        expect(wrapper.find(FieldLabel)).toHaveLength(hasFieldLabel ? 1 : 0);
        expect(wrapper.find(DatePicker)).toHaveLength(1);
    }

    test('default props', () => {
        const wrapper = mount(<DatePickerInputImpl {...DEFAULT_PROPS} />);
        validate(wrapper);
        expect(wrapper.find(DatePicker).prop('name')).toBe('col');
        expect(wrapper.find(DatePicker).prop('placeholderText')).toBe('Select test column');
        wrapper.unmount();
    });

    test('not isFormInput', () => {
        const wrapper = mount(<DatePickerInputImpl {...DEFAULT_PROPS} isFormInput={false} />);
        validate(wrapper, false);
        wrapper.unmount();
    });

    test('with name and placeholderText props', () => {
        const wrapper = mount(
            <DatePickerInputImpl {...DEFAULT_PROPS} name="name" placeholderText="placeholder text" />
        );
        validate(wrapper);
        expect(wrapper.find(DatePicker).prop('name')).toBe('name');
        expect(wrapper.find(DatePicker).prop('placeholderText')).toBe('placeholder text');
        wrapper.unmount();
    });

    test('renderFieldLabel', () => {
        const wrapper = mount(
            <DatePickerInputImpl
                {...DEFAULT_PROPS}
                labelClassName="labelClassName"
                renderFieldLabel={() => 'renderFieldLabel'}
            />
        );
        validate(wrapper, false);
        expect(wrapper.find('.labelClassName').text()).toBe('renderFieldLabel *');
        wrapper.unmount();
    });
});
