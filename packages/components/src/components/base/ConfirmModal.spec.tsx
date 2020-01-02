import React from 'react';
import { ConfirmModal } from './ConfirmModal';
import { mount } from "enzyme";
import { Modal } from "react-bootstrap";


describe("<ConfirmModal/>", () => {

    test("default props", () => {
        const msg = 'Testing confirm modal message';
        const loadingModal = mount(
            <ConfirmModal msg={msg}/>
        );

        expect(loadingModal.find(Modal)).toHaveLength(1);
        expect(loadingModal.find(".modal-title").text()).toBe('Confirm');
        expect(loadingModal.find(".modal-body").text()).toBe(msg);
        expect(loadingModal.find(".close")).toHaveLength(0);
        expect(loadingModal.find(".btn")).toHaveLength(0);
        expect(loadingModal.find(".btn-danger")).toHaveLength(0);
        loadingModal.unmount()
    });

    test("with callback functions", () => {
        const title = 'Callback Title';
        const msg = 'Callback confirm modal message';
        const loadingModal = mount(
            <ConfirmModal
                title={title}
                msg={msg}
                onConfirm={jest.fn()}
                onCancel={jest.fn()}
            />
        );

        expect(loadingModal.find(Modal)).toHaveLength(1);
        expect(loadingModal.find(".modal-title").text()).toBe(title);
        expect(loadingModal.find(".modal-body").text()).toBe(msg);
        expect(loadingModal.find(".close")).toHaveLength(1);
        expect(loadingModal.find(".btn")).toHaveLength(2);
        expect(loadingModal.find(".btn-danger")).toHaveLength(1);
        loadingModal.unmount()
    });

});
