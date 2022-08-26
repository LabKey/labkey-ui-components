import React from 'react';
import { shallow } from 'enzyme';
import { fromJS } from 'immutable';

import { AliasInput } from './AliasInput';
import {QueryColumn} from "../../../../public/QueryColumn";
import {SelectInput} from "./SelectInput";

describe('AliasInput', () => {
    const fieldKey = 'Alias';
    const aliasColumn = QueryColumn.create({
        caption: fieldKey,
        fieldKey,
        required: false,
    });

    test('value derived from "data"', () => {
        const data = { [fieldKey.toLowerCase()]: [undefined, '', 'a', { displayValue: 'b' }, { foo: 'c' }, null] };

        // No data
        const wrapper = shallow(<AliasInput col={aliasColumn} />);
        expect(wrapper.find(SelectInput).prop('value')).toEqual(undefined);

        // Object data
        wrapper.setProps({ data });
        expect(wrapper.find(SelectInput).prop('value')).toEqual(['a', 'b']);

        // Immutable data
        wrapper.setProps({ data: fromJS(data) });
        expect(wrapper.find(SelectInput).prop('value')).toEqual(['a', 'b']);
    });

    test('resolveFormValue', () => {
        const wrapper = shallow(<AliasInput col={aliasColumn} />);
        const resolveFormValue = wrapper.find(SelectInput).prop('resolveFormValue');

        expect(resolveFormValue(undefined)).toEqual([]);
        expect(resolveFormValue([])).toEqual([]);
        expect(resolveFormValue([{ value: 'x', label: 'y' }])).toEqual(['y']);
    });
});
