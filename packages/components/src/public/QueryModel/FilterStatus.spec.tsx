import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { Filter } from '@labkey/api';

import { Value } from './grid/Value';
import { SearchAction } from './grid/actions/Search';
import { ViewAction } from './grid/actions/View';
import { FilterAction } from './grid/actions/Filter';

import { FilterStatus } from './FilterStatus';
import { SortAction } from './grid/actions/Sort';

describe('FilterStatus', () => {
    const ON_CLICK = jest.fn();
    const ON_REMOVE = jest.fn();
    const ON_REMOVE_ALL = jest.fn();
    const DEFAULT_PROPS = {
        actionValues: [],
        onClick: ON_CLICK,
        onRemove: ON_REMOVE,
        onRemoveAll: ON_REMOVE_ALL,
    };

    const filterAction1 = {
        action: new FilterAction(() => 'display'),
        value: 'test1',
        valueObject: Filter.create('A', 'test1', Filter.Types.EQUAL),
    };
    const filterAction2 = {
        action: new FilterAction(() => 'display'),
        value: 'test2',
        valueObject: Filter.create('A', undefined, Filter.Types.NONBLANK),
    };
    const searchAction = {
        action: new SearchAction(),
        value: 'foo',
        valueObject: Filter.create('*', 'foo', Filter.Types.Q),
    };
    const viewAction = {
        action: new ViewAction(),
        value: 'view',
    };
    const sortAction = {
        action: new SortAction(),
    };

    function validate(wrapper: ReactWrapper, valueCount: number, filterCount: number): void {
        expect(wrapper.find('.grid-panel__filter-status')).toHaveLength(1);
        expect(wrapper.find(Value)).toHaveLength(valueCount);
        expect(wrapper.find('.remove-all-filters')).toHaveLength(filterCount > 1 ? 1 : 0);
    }

    test('no actionValues', () => {
        const wrapper = mount(<FilterStatus {...DEFAULT_PROPS} />);
        validate(wrapper, 0, 0);
        wrapper.unmount();
    });

    test('search actionValue', () => {
        const wrapper = mount(<FilterStatus {...DEFAULT_PROPS} actionValues={[searchAction]} />);
        validate(wrapper, 1, 1);
        wrapper.unmount();
    });

    test('only sortAction', () => {
        const wrapper = mount(<FilterStatus {...DEFAULT_PROPS} actionValues={[sortAction]} />);
        validate(wrapper, 0, 0);
        wrapper.unmount();
    });

    test('view, search and one filter actionValue', () => {
        const wrapper = mount(
            <FilterStatus {...DEFAULT_PROPS} actionValues={[viewAction, searchAction, filterAction1]} />
        );
        validate(wrapper, 3, 1);
        expect(wrapper.find(Value).first().prop('index')).toBe(0);
        expect(wrapper.find(Value).first().prop('actionValue')).toBe(viewAction);
        expect(wrapper.find(Value).first().prop('onClick')).toBeUndefined();
        expect(wrapper.find(Value).first().prop('onRemove')).toBeUndefined();
        expect(wrapper.find(Value).last().prop('index')).toBe(2);
        expect(wrapper.find(Value).last().prop('actionValue')).toBe(filterAction1);
        expect(wrapper.find(Value).last().prop('onClick')).toBeDefined();
        expect(wrapper.find(Value).last().prop('onRemove')).toBeDefined();
        wrapper.unmount();
    });

    test('multiple filter actionValue', () => {
        const wrapper = mount(<FilterStatus {...DEFAULT_PROPS} actionValues={[filterAction1, filterAction2]} />);
        validate(wrapper, 2, 2);
        expect(wrapper.find(Value).first().prop('index')).toBe(0);
        expect(wrapper.find(Value).first().prop('actionValue')).toBe(filterAction1);
        expect(wrapper.find(Value).last().prop('index')).toBe(1);
        expect(wrapper.find(Value).last().prop('actionValue')).toBe(filterAction2);
        expect(ON_REMOVE_ALL).toHaveBeenCalledTimes(0);
        wrapper.find('.remove-all-filters').simulate('click');
        expect(ON_REMOVE_ALL).toHaveBeenCalledTimes(1);
        wrapper.unmount();
    });
});
