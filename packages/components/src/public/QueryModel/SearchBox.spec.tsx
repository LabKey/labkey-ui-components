import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { Filter } from '@labkey/api';

import { SearchAction } from './grid/actions/Search';

import { SearchBox } from './SearchBox';

describe('SearchBox', () => {
    const ON_SEARCH = jest.fn();
    const DEFAULT_PROPS = {
        actionValues: [],
        onSearch: ON_SEARCH,
    };

    const searchAction = {
        action: new SearchAction('query'),
        value: 'foo',
        valueObject: Filter.create('*', 'foo', Filter.Types.Q),
    };

    function validate(wrapper: ReactWrapper, hasAppliedSearchTerm: boolean): void {
        expect(wrapper.find('.grid-panel__search-form')).toHaveLength(1);
        expect(wrapper.find('.fa-search')).toHaveLength(1);
        expect(wrapper.find('.grid-panel__search-input')).toHaveLength(1);
        expect(wrapper.find('.fa-remove')).toHaveLength(hasAppliedSearchTerm ? 1 : 0);
    }

    test('no applied search term', () => {
        const wrapper = mount(<SearchBox {...DEFAULT_PROPS} />);
        validate(wrapper, false);
        expect(wrapper.find('.grid-panel__search-input').prop('value')).toBe('');
        expect(ON_SEARCH).toHaveBeenCalledTimes(0);
        wrapper.find('.grid-panel__search-input').simulate('change', { target: { value: 'test' } });
        expect(ON_SEARCH).toHaveBeenCalledTimes(0);
        validate(wrapper, false);
        expect(wrapper.find('.grid-panel__search-input').prop('value')).toBe('test');
        wrapper.unmount();
    });

    test('with applied search term', () => {
        const wrapper = mount(<SearchBox {...DEFAULT_PROPS} actionValues={[searchAction]} />);
        validate(wrapper, true);
        expect(ON_SEARCH).toHaveBeenCalledTimes(0);
        expect(wrapper.find('.grid-panel__search-input').prop('value')).toBe(searchAction.value);
        wrapper.find('.grid-panel__search-input').simulate('change', { target: { value: 'test' } });
        expect(ON_SEARCH).toHaveBeenCalledTimes(0);
        validate(wrapper, true);
        expect(wrapper.find('.grid-panel__search-input').prop('value')).toBe('test');
        wrapper.unmount();
    });

    test('remove applied search term', () => {
        const wrapper = mount(<SearchBox {...DEFAULT_PROPS} actionValues={[searchAction]} />);
        validate(wrapper, true);
        expect(ON_SEARCH).toHaveBeenCalledTimes(0);
        expect(wrapper.find('.grid-panel__search-input').prop('value')).toBe(searchAction.value);
        wrapper.find('.fa-remove').simulate('click');
        expect(ON_SEARCH).toHaveBeenCalledTimes(1);
        expect(wrapper.find('.grid-panel__search-input').prop('value')).toBe('');
        wrapper.unmount();
    });
});
