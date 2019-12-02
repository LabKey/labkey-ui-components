import { mount } from 'enzyme';
import * as React from 'react';
import { AssayRunDeleteConfirmModal } from './AssayRunDeleteConfirmModal';
import { ConfirmModal } from '../base/ConfirmModal';

describe("<AssayRunDeleteConfirmModal/>", () => {

    test("Delete one", () => {
        const component = (
            <AssayRunDeleteConfirmModal
                numToDelete={1}
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
            />
        );
        const wrapper = mount(component);
        const confirmModal = wrapper.find(ConfirmModal);
        expect(confirmModal.text().indexOf("assay run and any of its")).toBeGreaterThan(-1);
    });

    test("Delete many", () => {
        const component = (
            <AssayRunDeleteConfirmModal
                numToDelete={10}
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
            />
        );
        const wrapper = mount(component);
        const confirmModal = wrapper.find(ConfirmModal);
        expect(confirmModal.text().indexOf("assay runs and any of their")).toBeGreaterThan(-1);
    })
});
