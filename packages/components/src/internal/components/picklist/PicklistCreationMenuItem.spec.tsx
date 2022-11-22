import React from 'react';
import { Button, MenuItem } from 'react-bootstrap';

import { mount } from 'enzyme';

import { TEST_USER_EDITOR, TEST_USER_READER } from '../../userFixtures';

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

    test('editor, as menu item', () => {
        const wrapper = mount(
            <PicklistCreationMenuItem
                itemText={text}
                selectionKey={selectionKey}
                selectedQuantity={selectedQuantity}
                key={key}
                user={TEST_USER_EDITOR}
                asMenuItem={true}
            />
        );
        const menuItem = wrapper.find(MenuItem);
        expect(menuItem).toHaveLength(1);
        expect(menuItem.text()).toBe(text);
        expect(wrapper.find(PicklistEditModal).exists()).toBeFalsy();

        wrapper.unmount();
    });

    test('editor, not as menu item', () => {
        const wrapper = mount(
            <PicklistCreationMenuItem
                itemText={text}
                selectionKey={selectionKey}
                selectedQuantity={selectedQuantity}
                key={key}
                user={TEST_USER_EDITOR}
            />
        );
        expect(wrapper.find(MenuItem)).toHaveLength(0);
        const button = wrapper.find(Button);
        expect(button.text()).toBe(text);
        expect(wrapper.find(PicklistEditModal).exists()).toBeFalsy();

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
                asMenuItem={true}
            />
        );
        expect(wrapper.find('MenuItem')).toHaveLength(0);
        wrapper.unmount();
    });
});
