import React from 'react';

import { mount } from 'enzyme';

import { Modal } from '../../Modal';

import { ImportWithRenameConfirmModal } from './ImportWithRenameConfirmModal';

describe('<ImportWithRenameConfirmModal/>', () => {
    test('without folder type or product name', () => {
        const component = (
            <ImportWithRenameConfirmModal
                originalName="original.txt"
                newName="new.txt"
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
            />
        );
        const wrapper = mount(component);
        const modal = wrapper.find(Modal);
        expect(modal.text().indexOf('already exists in this  folder')).toBeGreaterThan(-1);
        expect(modal.text().indexOf('it will be renamed')).toBeGreaterThan(-1);
    });

    test('with folder type', () => {
        const component = (
            <ImportWithRenameConfirmModal
                originalName="original.txt"
                newName="new.txt"
                folderType="Test"
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
            />
        );
        const wrapper = mount(component);
        const modal = wrapper.find(Modal);
        expect(modal.text().indexOf('already exists in this Test folder')).toBeGreaterThan(-1);
        expect(modal.text().indexOf('it will be renamed')).toBeGreaterThan(-1);
    });
});
