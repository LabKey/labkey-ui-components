import React from 'react';

import { ReactWrapper } from 'enzyme';

import { makeTestQueryModel } from '../public/QueryModel/testUtils';
import { SchemaQuery } from '../public/SchemaQuery';
import { SelectionMenuItem } from '../internal/components/menus/SelectionMenuItem';

import { EntityDeleteConfirmModal } from '../internal/components/entities/EntityDeleteConfirmModal';

import { mountWithAppServerContext } from '../internal/testHelpers';

import { SampleDeleteMenuItem } from './SampleDeleteMenuItem';

describe('SampleDeleteMenuItem', () => {
    function validate(wrapper: ReactWrapper, deleteModalCount = 0) {
        const menuItem = wrapper.find(SelectionMenuItem);

        expect(menuItem).toHaveLength(1);
        expect(menuItem.text()).toBe('Delete');

        const menuItemComp = wrapper.find('MenuItem a');
        menuItemComp.simulate('click');

        const modal = wrapper.find(EntityDeleteConfirmModal);
        expect(modal).toHaveLength(deleteModalCount);
    }

    test('click menu item with no queryModel', () => {
        const queryModel = null;
        const wrapper = mountWithAppServerContext(<SampleDeleteMenuItem queryModel={queryModel} />);
        validate(wrapper);
        wrapper.unmount();
    });

    test('click menu item with no selection', () => {
        const queryModel = makeTestQueryModel(new SchemaQuery('test', 'query'));
        const wrapper = mountWithAppServerContext(<SampleDeleteMenuItem queryModel={queryModel} />);
        validate(wrapper);
        wrapper.unmount();
    });

    test('click menu item', () => {
        let queryModel = makeTestQueryModel(new SchemaQuery('test', 'query'));
        queryModel = queryModel.mutate({ rowCount: 2, selections: new Set(['1', '2']) });
        const wrapper = mountWithAppServerContext(<SampleDeleteMenuItem queryModel={queryModel} />);
        validate(wrapper, 1);
        wrapper.unmount();
    });
});
