import React from 'react';

import { mount } from 'enzyme';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { SelectionMenuItem } from '../menus/SelectionMenuItem';

import { EntityDeleteConfirmModal } from '../entities/EntityDeleteConfirmModal';

import { SampleDeleteMenuItem } from './SampleDeleteMenuItem';

describe('SampleDeleteMenuItem', () => {
    test('click menu item', () => {
        let queryModel = makeTestQueryModel(SchemaQuery.create('test', 'query'));
        queryModel = queryModel.mutate({ selections: new Set(['1', '2']) });
        const wrapper = mount(<SampleDeleteMenuItem queryModel={queryModel} />);
        const menuItem = wrapper.find(SelectionMenuItem);
        expect(menuItem).toHaveLength(1);
        expect(menuItem.text()).toBe('Delete Samples');

        const menuItemComp = wrapper.find('MenuItem a');
        menuItemComp.simulate('click');

        const modal = wrapper.find(EntityDeleteConfirmModal);
        expect(modal).toHaveLength(1);
        wrapper.unmount();
    });
});
