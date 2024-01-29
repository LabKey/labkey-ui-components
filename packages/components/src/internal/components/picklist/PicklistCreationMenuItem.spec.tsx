import React from 'react';

import { mount } from 'enzyme';

import { TEST_USER_EDITOR, TEST_USER_READER } from '../../userFixtures';

import { PicklistCreationMenuItem } from './PicklistCreationMenuItem';
import { PicklistEditModal } from './PicklistEditModal';

beforeAll(() => {
    LABKEY.moduleContext.inventory = { productId: ['FreezerManager'] };
});

describe('PicklistCreationMenuItem', () => {
    const key = 'picklists';
    const text = 'Picklist';

    test('editor, as menu item', () => {
        const wrapper = mount(
            <PicklistCreationMenuItem itemText={text} key={key} user={TEST_USER_EDITOR} asMenuItem />
        );
        const menuItem = wrapper.find('MenuItem');
        expect(menuItem).toHaveLength(1);
        expect(menuItem.text()).toBe(text);
        expect(wrapper.find(PicklistEditModal).exists()).toBeFalsy();

        wrapper.unmount();
    });

    test('editor, not as menu item', () => {
        const wrapper = mount(<PicklistCreationMenuItem itemText={text} key={key} user={TEST_USER_EDITOR} />);
        expect(wrapper.find('MenuItem')).toHaveLength(0);
        expect(wrapper.find('button').text()).toBe(text);
        expect(wrapper.find(PicklistEditModal).exists()).toBeFalsy();

        wrapper.unmount();
    });

    test('not Editor', () => {
        const wrapper = mount(
            <PicklistCreationMenuItem itemText={text} key={key} user={TEST_USER_READER} asMenuItem />
        );
        expect(wrapper.find('MenuItem')).toHaveLength(0);
        wrapper.unmount();
    });
});
