import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { List } from 'immutable';
import { Filter } from '@labkey/api';

import { QueryInfo } from '../QueryInfo';

import { Value } from './grid/Value';
import { SearchAction } from './grid/actions/Search';
import { ViewAction } from './grid/actions/View';
import { FilterAction } from './grid/actions/Filter';

import { FilterStatus } from './FilterStatus';

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
        action: new FilterAction(
            'query',
            () => List(),
            () => new QueryInfo({})
        ),
        value: 'test1',
        valueObject: Filter.create('A', 'test1', Filter.Types.EQUAL),
    };
    const filterAction2 = {
        action: new FilterAction(
            'query',
            () => List(),
            () => new QueryInfo({})
        ),
        value: 'test2',
        valueObject: Filter.create('A', undefined, Filter.Types.NONBLANK),
    };
    const searchAction = {
        action: new SearchAction('query'),
        value: 'foo',
        valueObject: Filter.create('*', 'foo', Filter.Types.Q),
    };
    const viewAction = {
        action: new ViewAction(
            'query',
            () => List(),
            () => new QueryInfo({})
        ),
        value: 'view',
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

    test('no filter or view actionValues', () => {
        const wrapper = mount(<FilterStatus {...DEFAULT_PROPS} actionValues={[searchAction]} />);
        validate(wrapper, 0, 0);
        wrapper.unmount();
    });

    test('view and one filter actionValue', () => {
        const wrapper = mount(
            <FilterStatus {...DEFAULT_PROPS} actionValues={[viewAction, searchAction, filterAction1]} />
        );
        validate(wrapper, 2, 1);
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
