import React from 'react';

import { mount, ReactWrapper } from 'enzyme';
import { Modal } from 'react-bootstrap';

import { TEST_USER_EDITOR, TEST_USER_READER } from '../../../test/data/users';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { SelectionMenuItem } from '../menus/SelectionMenuItem';

import { SAMPLE_STATE_TYPE_COLUMN_NAME } from '../samples/constants';

import { AddToPicklistMenuItem } from './AddToPicklistMenuItem';
import { PicklistEditModal } from './PicklistEditModal';

describe('AddToPicklistMenuItem', () => {
    const key = 'picklists';
    const text = 'Picklist Testing';

    const queryModelWithoutSelections = makeTestQueryModel(SchemaQuery.create('test', 'query'));
    let queryModelWithSelections = makeTestQueryModel(SchemaQuery.create('test', 'query'));
    queryModelWithSelections = queryModelWithSelections.mutate({ selections: new Set(['1', '2']) });

    test('with queryModel', () => {
        const wrapper = mount(
            <AddToPicklistMenuItem
                itemText={text}
                queryModel={queryModelWithSelections}
                key={key}
                user={TEST_USER_EDITOR}
            />
        );
        const menuItem = wrapper.find(SelectionMenuItem);
        expect(menuItem).toHaveLength(1);
        expect(menuItem.text()).toBe(text);
        const picklistModal = wrapper.find(PicklistEditModal);
        expect(picklistModal).toHaveLength(1);
        expect(picklistModal.prop('selectionKey')).toBe(queryModelWithSelections.id);
        expect(picklistModal.prop('selectedQuantity')).toBe(2);
        expect(picklistModal.prop('show')).toBe(false);
        wrapper.unmount();
    });

    test('with selectedIds', () => {
        const wrapper = mount(
            <AddToPicklistMenuItem
                itemText={text}
                queryModel={queryModelWithoutSelections}
                sampleIds={['1']}
                key={key}
                user={TEST_USER_EDITOR}
            />
        );
        const menuItem = wrapper.find('MenuItem');
        expect(menuItem).toHaveLength(1);
        expect(menuItem.text()).toBe(text);

        const picklistModal = wrapper.find(PicklistEditModal);
        expect(picklistModal).toHaveLength(1);
        expect(picklistModal.prop('selectionKey')).toBe(undefined);
        expect(picklistModal.prop('selectedQuantity')).toBe(1);
        wrapper.unmount();
    });

    test('not Editor', () => {
        const wrapper = mount(
            <AddToPicklistMenuItem itemText={text} sampleIds={['1']} key={key} user={TEST_USER_READER} />
        );
        expect(wrapper.find('MenuItem')).toHaveLength(0);
        wrapper.unmount();
    });

    function validateMenuItemClick(wrapper: ReactWrapper, shouldOpen: boolean): void {
        const menuItem = wrapper.find('MenuItem a');
        expect(menuItem).toHaveLength(1);
        menuItem.simulate('click');

        const modal = wrapper.find(Modal);
        expect(modal).toHaveLength(shouldOpen ? 2 : 1);
        if (shouldOpen) {
            expect(modal.at(0).prop('show')).toBe(true);
            expect(modal.at(1).prop('show')).toBe(false);
        }
    }

    test('modal open on click, queryModel selections', () => {
        const wrapper = mount(
            <AddToPicklistMenuItem
                itemText={text}
                key={key}
                queryModel={queryModelWithoutSelections}
                user={TEST_USER_EDITOR}
            />
        );
        validateMenuItemClick(wrapper, false);

        wrapper.setProps({ queryModel: makeTestQueryModel(SchemaQuery.create('test', 'query')) });
        validateMenuItemClick(wrapper, false);

        wrapper.setProps({ queryModel: queryModelWithSelections });
        validateMenuItemClick(wrapper, true);

        wrapper.unmount();
    });

    test('modal open on click, sampleIds', () => {
        const wrapper = mount(
            <AddToPicklistMenuItem
                itemText={text}
                queryModel={queryModelWithoutSelections}
                sampleIds={['1']}
                key={key}
                user={TEST_USER_EDITOR}
            />
        );
        validateMenuItemClick(wrapper, true);
        wrapper.unmount();
    });

    test('sample with status', () => {
        let model = makeTestQueryModel(SchemaQuery.create('test', 'query'));
        model = model.mutate({
            rows: {
                '1': {
                    RowId: { value: 1 },
                    [SAMPLE_STATE_TYPE_COLUMN_NAME]: { value: 'Locked' },
                },
            },
            orderedRows: ['1'],
        });
        const wrapper = mount(
            <AddToPicklistMenuItem
                itemText={text}
                queryModel={model}
                sampleIds={['1']}
                key={key}
                user={TEST_USER_EDITOR}
            />
        );
        validateMenuItemClick(wrapper, true);
    });
});
