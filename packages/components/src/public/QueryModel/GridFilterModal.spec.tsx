import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { Filter } from '@labkey/api';

import { SchemaQuery } from '../SchemaQuery';
import { QueryInfo } from '../QueryInfo';
import { QueryColumn } from '../QueryColumn';
import { Alert } from '../../internal/components/base/Alert';

import { QueryFilterPanel } from '../../internal/components/search/QueryFilterPanel';

import { waitForLifecycle } from '../../internal/test/enzymeTestHelpers';
import { getTestAPIWrapper } from '../../internal/APIWrapper';

import { makeTestQueryModel } from './testUtils';
import { GridFilterModal } from './GridFilterModal';

describe('GridFilterModal', () => {
    const DEFAULT_PROPS = {
        api: getTestAPIWrapper(jest.fn, {}),
        initFilters: [],
        model: makeTestQueryModel(
            new SchemaQuery('schema', 'query', 'view'),
            QueryInfo.fromJsonForTests({ name: 'Query', schema: 'schema', title: 'Query Title' })
        ),
        onApply: jest.fn,
        onCancel: jest.fn,
    };

    function validate(wrapper: ReactWrapper): void {
        expect(wrapper.find('.modal-title').text()).toBe('Filter Query Title');
        expect(wrapper.find(Alert)).toHaveLength(1);
        expect(wrapper.find(QueryFilterPanel)).toHaveLength(1);
        expect(wrapper.find('button')).toHaveLength(3); // 2 in footer + close icon
    }

    test('default props', () => {
        const wrapper = mount(<GridFilterModal {...DEFAULT_PROPS} />);
        validate(wrapper);
        wrapper.unmount();
    });

    test('QueryFilterPanel props', () => {
        const filter1 = Filter.create('a', '1');
        const filter2 = Filter.create('b', '2');
        const wrapper = mount(<GridFilterModal {...DEFAULT_PROPS} initFilters={[filter1, filter2]} />);
        validate(wrapper);
        const filtersPanel = wrapper.find(QueryFilterPanel);
        expect(filtersPanel.prop('viewName')).toBe('view');
        expect(filtersPanel.prop('filters').hasOwnProperty('query')).toBe(true);
        expect(filtersPanel.prop('filters').query).toHaveLength(2);
        wrapper.unmount();
    });

    test('validFieldFilters', async () => {
        const wrapper = mount(<GridFilterModal {...DEFAULT_PROPS} />);
        validate(wrapper);
        expect(wrapper.find('.btn-success').prop('disabled')).toBe(true);

        // add a filter
        wrapper.find(QueryFilterPanel).prop('onFilterUpdate')(
            new QueryColumn({ fieldKey: 'a' }),
            [Filter.create('a', '1')],
            0
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find('.btn-success').prop('disabled')).toBe(false);

        // remove the filter for the same field
        wrapper.find(QueryFilterPanel).prop('onFilterUpdate')(new QueryColumn({ fieldKey: 'a' }), undefined, 0);
        await waitForLifecycle(wrapper);
        expect(wrapper.find('.btn-success').prop('disabled')).toBe(true);
        wrapper.unmount();
    });
});
