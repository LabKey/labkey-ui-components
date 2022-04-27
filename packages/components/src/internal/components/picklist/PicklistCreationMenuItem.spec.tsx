import React from 'react';

import { mount } from 'enzyme';
import { MenuItem, Modal } from 'react-bootstrap';

import { TEST_USER_EDITOR, TEST_USER_READER } from '../../../test/data/users';

import { PicklistCreationMenuItem } from './PicklistCreationMenuItem';
import { PicklistEditModal } from './PicklistEditModal';

beforeAll(() => {
    LABKEY.moduleContext.inventory = { productId: ['FreezerManager'] };
});

describe('PicklistCreationMenuItem', () => {
    const key = 'picklists';
    const selectionKey = 'test-selection';
    const selectedQuantity = 4;
    const text = 'Picklist';

    test('modal hidden', () => {
        const wrapper = mount(
            <PicklistCreationMenuItem
                itemText={text}
                selectionKey={selectionKey}
                selectedQuantity={selectedQuantity}
                key={key}
                user={TEST_USER_EDITOR}
            />
        );
        const menuItem = wrapper.find(MenuItem);
        expect(menuItem).toHaveLength(1);
        expect(menuItem.text()).toBe(text);
        expect(wrapper.find(PicklistEditModal).exists()).toBeFalsy();

        wrapper.unmount();
    });

    test('modal shown', () => {
        const wrapper = mount(
            <PicklistCreationMenuItem
                itemText={text}
                sampleIds={['1']}
                selectedQuantity={selectedQuantity}
                key={key}
                user={TEST_USER_EDITOR}
            />
        );
        const menuItem = wrapper.find('MenuItem a');
        expect(menuItem).toHaveLength(1);
        menuItem.simulate('click');
        const modal = wrapper.find(Modal);
        expect(modal).toHaveLength(1);
        expect(modal.prop('show')).toBe(true);
        wrapper.unmount();
    });

    test('not Editor', () => {
        const wrapper = mount(
            <PicklistCreationMenuItem
                itemText={text}
                selectionKey={selectionKey}
                selectedQuantity={selectedQuantity}
                key={key}
                user={TEST_USER_READER}
            />
        );
        expect(wrapper.find('MenuItem')).toHaveLength(0);
        wrapper.unmount();
    });


    test('create empty list', () => {
        const wrapper = mount(
            <PicklistCreationMenuItem
                itemText={text}
                sampleIds={undefined}
                selectedQuantity={selectedQuantity}
                key={key}
                user={TEST_USER_EDITOR}
            />
        );
        const menuItem = wrapper.find('MenuItem a');
        expect(menuItem).toHaveLength(1);
        menuItem.simulate('click');
        const modal = wrapper.find(Modal);
        expect(modal).toHaveLength(1);
        expect(modal.prop('show')).toBe(true);
        wrapper.unmount();
    });
});
