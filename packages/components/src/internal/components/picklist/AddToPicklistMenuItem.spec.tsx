import React from 'react';

import { mount } from 'enzyme';
import { Modal } from 'react-bootstrap';

import { TEST_USER_EDITOR, TEST_USER_READER } from '../../../test/data/users';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { SelectionMenuItem } from '../menus/SelectionMenuItem';

import { AddToPicklistMenuItem } from './AddToPicklistMenuItem';

describe('AddToPicklistMenuItem', () => {
    const key = 'picklists';
    const text = 'Picklist Testing';

    let queryModel = makeTestQueryModel(SchemaQuery.create('test', 'query'));
    queryModel = queryModel.mutate({selections: new Set(['1', '2'])});

    test('with queryModel', () => {
        const wrapper = mount(
            <AddToPicklistMenuItem itemText={text} queryModel={queryModel} key={key} user={TEST_USER_EDITOR}/>
        );
        const menuItem = wrapper.find(SelectionMenuItem);
        expect(menuItem).toHaveLength(1);
        expect(menuItem.text()).toBe(text);
        const memoWrapper = wrapper.find('Memo()');
        expect(memoWrapper).toHaveLength(1);
        expect(memoWrapper.prop('selectionKey')).toBe(queryModel.id);
        expect(memoWrapper.prop('selectedQuantity')).toBe(2);
        const modal = memoWrapper.find(Modal);
        expect(modal).toHaveLength(1);
        expect(modal.prop('show')).toBe(false);
        wrapper.unmount();
    });

    test('with selectedIds', () => {
        const wrapper = mount(
            <AddToPicklistMenuItem itemText={text} sampleIds={['1']} key={key} user={TEST_USER_EDITOR}/>
        );
        const menuItem = wrapper.find('MenuItem');
        expect(menuItem).toHaveLength(1);
        expect(menuItem.text()).toBe(text);
        const memoWrapper = wrapper.find('Memo()');
        expect(memoWrapper).toHaveLength(1);
        expect(memoWrapper.prop('selectionKey')).toBe(undefined);
        expect(memoWrapper.prop('selectedQuantity')).toBe(1);
        wrapper.unmount();
    });

    test('not Editor', () => {
        const wrapper = mount(
            <AddToPicklistMenuItem itemText={text} sampleIds={['1']} key={key} user={TEST_USER_READER}/>
        );
        expect(wrapper.find('MenuItem')).toHaveLength(0);
        wrapper.unmount();
    });

    test('modal open', () => {
        const wrapper = mount(
            <AddToPicklistMenuItem
                itemText={text}
                sampleIds={['1']}
                key={key}
                queryModel={queryModel}
                user={TEST_USER_EDITOR}
            />
        );
        const menuItem = wrapper.find('MenuItem a');
        expect(menuItem).toHaveLength(1);
        menuItem.simulate('click');
        const modal = wrapper.find(Modal);
        expect(modal).toHaveLength(2);
        expect(modal.at(0).prop('show')).toBe(true);
        expect(modal.at(1).prop('show')).toBe(false);
        wrapper.unmount();
    });
});
