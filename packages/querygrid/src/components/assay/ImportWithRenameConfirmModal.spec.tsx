import * as React from 'react';
import { ImportWithRenameConfirmModal } from './ImportWithRenameConfirmModal';
import { mount } from 'enzyme';
import { ConfirmModal } from '@glass/base';

describe("<ImportWithRenameConfirmModal/>", () => {

    test("without folder type or product name", () => {

        const component = <ImportWithRenameConfirmModal
            originalName={"original.txt"}
            newName={"new.txt"}
            onCancel={jest.fn()}
            onConfirm={jest.fn()}
            />;
        const wrapper = mount(component);
        const confirmModal = wrapper.find(ConfirmModal);
        expect(confirmModal.text().indexOf("already exists in this  folder")).toBeGreaterThan(-1);
        expect(confirmModal.text().indexOf("allow it to be renamed")).toBeGreaterThan(-1);
    });

    test("with folder type", () => {
        const component = <ImportWithRenameConfirmModal
            originalName={"original.txt"}
            newName={"new.txt"}
            folderType={"Test"}
            onCancel={jest.fn()}
            onConfirm={jest.fn()}
        />;
        const wrapper = mount(component);
        const confirmModal = wrapper.find(ConfirmModal);
        expect(confirmModal.text().indexOf("already exists in this Test folder")).toBeGreaterThan(-1);
        expect(confirmModal.text().indexOf("allow it to be renamed")).toBeGreaterThan(-1);
    });

    test("with product name", () => {
        const component = <ImportWithRenameConfirmModal
            originalName={"original.txt"}
            newName={"new.txt"}
            productName={"Test Product"}
            onCancel={jest.fn()}
            onConfirm={jest.fn()}
        />;
        const wrapper = mount(component);
        const confirmModal = wrapper.find(ConfirmModal);
        expect(confirmModal.text().indexOf("already exists in this  folder")).toBeGreaterThan(-1);
        expect(confirmModal.text().indexOf("allow Test Product to rename")).toBeGreaterThan(-1);
    });

    test("with folder type and product name", () => {
        const component = <ImportWithRenameConfirmModal
            originalName={"original.txt"}
            newName={"new.txt"}
            folderType={"Test Folder"}
            productName={"Test Product"}
            onCancel={jest.fn()}
            onConfirm={jest.fn()}
        />;
        const wrapper = mount(component);
        const confirmModal = wrapper.find(ConfirmModal);
        expect(confirmModal.text().indexOf("already exists in this Test Folder folder")).toBeGreaterThan(-1);
        expect(confirmModal.text().indexOf("allow Test Product to rename")).toBeGreaterThan(-1);
    });
});