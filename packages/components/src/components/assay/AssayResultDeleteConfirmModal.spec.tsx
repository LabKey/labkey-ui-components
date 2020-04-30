import { mount } from 'enzyme';
import React from 'react';

import { ConfirmModal } from '../base/ConfirmModal';

import { AssayResultDeleteConfirmModal } from './AssayResultDeleteConfirmModal';

describe('<AssayResultDeleteConfirmModal/>', () => {
    test('Delete one', () => {
        const component = <AssayResultDeleteConfirmModal numToDelete={1} onCancel={jest.fn()} onConfirm={jest.fn()} />;
        const wrapper = mount(component);
        const confirmModal = wrapper.find(ConfirmModal);
        expect(confirmModal.text().indexOf('The  selected assay result will')).toBeGreaterThan(-1);
    });

    test('Delete many', () => {
        const component = <AssayResultDeleteConfirmModal numToDelete={10} onCancel={jest.fn()} onConfirm={jest.fn()} />;
        const wrapper = mount(component);
        const confirmModal = wrapper.find(ConfirmModal);
        expect(confirmModal.text().indexOf('10 selected assay results')).toBeGreaterThan(-1);
    });
});
