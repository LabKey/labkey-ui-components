import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { List } from 'immutable';
import { Filter } from '@labkey/api';

import { QueryInfo } from '../../QueryInfo';

import { Value } from './Value';
import { FilterAction } from './actions/Filter';
import { ViewAction } from './actions/View';

const filterAction = {
    action: new FilterAction(
        'query',
        () => List(),
        () => new QueryInfo({})
    ),
    value: 'test',
    valueObject: Filter.create('A', 'test', Filter.Types.EQUAL),
};
const readOnlyAction = {
    action: new FilterAction(
        'query',
        () => List(),
        () => new QueryInfo({})
    ),
    value: 'test',
    valueObject: Filter.create('A', 'test', Filter.Types.EQUAL),
    isReadOnly: 'Filter is read only',
};
const nonRemovableAction = {
    action: new FilterAction(
        'query',
        () => List(),
        () => new QueryInfo({})
    ),
    value: 'test',
    valueObject: Filter.create('A', 'test', Filter.Types.EQUAL),
    isRemovable: false,
};
const viewAction = {
    action: new ViewAction(
        'query',
        () => List(),
        () => new QueryInfo({})
    ),
    value: 'view',
};

describe('Value', () => {
    const DEFAULT_PROPS = {
        index: 0,
        onClick: jest.fn,
        onRemove: jest.fn,
    };

    function validate(wrapper: ReactWrapper, readOnly: boolean, active: boolean, canRemove: boolean): void {
        expect(wrapper.find('.filter-status-value')).toHaveLength(1);
        expect(wrapper.find('.is-active')).toHaveLength(active ? 1 : 0);
        expect(wrapper.find('.is-disabled')).toHaveLength(0);
        expect(wrapper.find('.is-readonly')).toHaveLength(readOnly ? 1 : 0);
        expect(wrapper.find('.read-lock')).toHaveLength(readOnly ? 1 : 0);
        expect(wrapper.find('.symbol')).toHaveLength(1);
        expect(wrapper.find('.fa-close')).toHaveLength(canRemove ? 1 : 0);
    }

    test('filter action', () => {
        const onClick = jest.fn();
        const onRemove = jest.fn();
        const wrapper = mount(
            <Value {...DEFAULT_PROPS} actionValue={filterAction} onClick={onClick} onRemove={onRemove} />
        );
        validate(wrapper, false, false, false);
        expect(wrapper.find('.fa-filter')).toHaveLength(1);

        expect(onClick).toHaveBeenCalledTimes(0);
        wrapper.find('.filter-status-value').simulate('click');
        expect(onClick).toHaveBeenCalledTimes(1);

        expect(onRemove).toHaveBeenCalledTimes(0);
        wrapper.find('.symbol').simulate('click');
        expect(onRemove).toHaveBeenCalledTimes(1);

        wrapper.unmount();
    });

    test('click isReadOnly action', () => {
        const onClick = jest.fn();
        const onRemove = jest.fn();
        const wrapper = mount(
            <Value {...DEFAULT_PROPS} actionValue={readOnlyAction} onClick={onClick} onRemove={onRemove} />
        );
        validate(wrapper, true, false, false);
        expect(wrapper.find('.fa-filter')).toHaveLength(1);

        expect(onClick).toHaveBeenCalledTimes(0);
        wrapper.find('.filter-status-value').simulate('click');
        expect(onClick).toHaveBeenCalledTimes(0);

        expect(onRemove).toHaveBeenCalledTimes(0);
        wrapper.find('.symbol').simulate('click');
        expect(onRemove).toHaveBeenCalledTimes(1);

        wrapper.unmount();
    });

    test('click nonRemovableAction action', () => {
        const onClick = jest.fn();
        const onRemove = jest.fn();
        const wrapper = mount(
            <Value {...DEFAULT_PROPS} actionValue={nonRemovableAction} onClick={onClick} onRemove={onRemove} />
        );
        validate(wrapper, false, false, false);
        expect(wrapper.find('.fa-filter')).toHaveLength(1);

        expect(onClick).toHaveBeenCalledTimes(0);
        wrapper.find('.filter-status-value').simulate('click');
        expect(onClick).toHaveBeenCalledTimes(1);

        expect(onRemove).toHaveBeenCalledTimes(0);
        wrapper.find('.symbol').simulate('click');
        expect(onRemove).toHaveBeenCalledTimes(0);

        wrapper.unmount();
    });

    test('showRemoveIcon for filter action', () => {
        const wrapper = mount(<Value {...DEFAULT_PROPS} actionValue={filterAction} />);
        validate(wrapper, false, false, false);
        expect(wrapper.find('.fa-filter')).toHaveLength(1);
        wrapper.find('.filter-status-value').simulate('mouseenter');
        validate(wrapper, false, true, true);
        wrapper.unmount();
    });

    test('do not showRemoveIcon for view action', () => {
        const wrapper = mount(<Value {...DEFAULT_PROPS} actionValue={viewAction} />);
        validate(wrapper, false, false, false);
        expect(wrapper.find('.fa-table')).toHaveLength(1);
        wrapper.find('.filter-status-value').simulate('mouseenter');
        validate(wrapper, false, true, false);
        wrapper.unmount();
    });
});
