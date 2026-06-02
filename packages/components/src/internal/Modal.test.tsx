/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { BaseModal, Modal, ModalHeader } from './Modal';

describe('Modal components', () => {
    describe('BaseModal', () => {
        test('renders children into a portal with default classes', () => {
            render(
                <BaseModal>
                    <div className="inner-content">hello</div>
                </BaseModal>
            );

            const wrapper = document.querySelector('.modal-wrapper');
            expect(wrapper).not.toBeNull();
            expect(document.querySelector('.modal-backdrop')).not.toBeNull();

            const dialog = document.querySelector('.modal-dialog');
            expect(dialog).not.toBeNull();
            expect(dialog.classList.contains('modal-sm')).toBe(false);
            expect(dialog.classList.contains('modal-lg')).toBe(false);

            expect(document.querySelector('.modal-content .inner-content').textContent).toEqual('hello');
        });

        test('applies bsSize="sm" class', () => {
            render(<BaseModal bsSize="sm">child</BaseModal>);
            const dialog = document.querySelector('.modal-dialog');
            expect(dialog.classList.contains('modal-sm')).toBe(true);
            expect(dialog.classList.contains('modal-lg')).toBe(false);
        });

        test('applies bsSize="lg" class', () => {
            render(<BaseModal bsSize="lg">child</BaseModal>);
            const dialog = document.querySelector('.modal-dialog');
            expect(dialog.classList.contains('modal-lg')).toBe(true);
            expect(dialog.classList.contains('modal-sm')).toBe(false);
        });

        test('applies custom className', () => {
            render(<BaseModal className="custom-class">child</BaseModal>);
            const dialog = document.querySelector('.modal-dialog');
            expect(dialog.classList.contains('custom-class')).toBe(true);
        });

        test('toggles "no-scroll" on document.body while mounted', () => {
            expect(document.body.classList.contains('no-scroll')).toBe(false);
            const { unmount } = render(<BaseModal>child</BaseModal>);
            expect(document.body.classList.contains('no-scroll')).toBe(true);
            unmount();
            expect(document.body.classList.contains('no-scroll')).toBe(false);
        });
    });

    describe('ModalHeader', () => {
        test('renders title and no close button by default', () => {
            render(<ModalHeader title="My Title" />);
            const header = document.querySelector('.modal-header');
            expect(header).not.toBeNull();
            expect(header.querySelector('.modal-title').textContent).toEqual('My Title');
            expect(header.querySelector('button.close')).toBeNull();
        });

        test('renders close button when onCancel is provided and invokes it on click', async () => {
            const onCancel = jest.fn();
            render(<ModalHeader onCancel={onCancel} title="t" />);
            const closeBtn = document.querySelector('button.close');
            expect(closeBtn).not.toBeNull();
            expect(closeBtn.querySelector('.sr-only').textContent).toEqual('Close');
            await userEvent.click(closeBtn);
            expect(onCancel).toHaveBeenCalledTimes(1);
        });

        test('does not render the title element when title is falsy', () => {
            render(<ModalHeader onCancel={jest.fn()} title={null} />);
            expect(document.querySelector('.modal-title')).toBeNull();
            // Close button should still be present
            expect(document.querySelector('button.close')).not.toBeNull();
        });

        test('renders children inside the header', () => {
            render(
                <ModalHeader title="t">
                    <span className="extra-child">extra</span>
                </ModalHeader>
            );
            const header = document.querySelector('.modal-header');
            expect(header.querySelector('.extra-child').textContent).toEqual('extra');
        });
    });

    describe('Modal', () => {
        test('renders children inside modal-body', () => {
            render(
                <Modal onCancel={jest.fn()}>
                    <div className="body-child">body content</div>
                </Modal>
            );
            const body = document.querySelector('.modal-body');
            expect(body).not.toBeNull();
            expect(body.querySelector('.body-child').textContent).toEqual('body content');
        });

        test('renders default ModalHeader when title or onCancel is provided and no custom header', () => {
            render(<Modal onCancel={jest.fn()} title="Hello" />);
            const header = document.querySelector('.modal-header');
            expect(header).not.toBeNull();
            expect(header.querySelector('.modal-title').textContent).toEqual('Hello');
            expect(header.querySelector('button.close')).not.toBeNull();
        });

        test('does not render header when no title, onCancel, or custom header is given', () => {
            render(<Modal onConfirm={jest.fn()}>body</Modal>);
            expect(document.querySelector('.modal-header')).toBeNull();
        });

        test('renders custom header instead of default ModalHeader', () => {
            render(
                <Modal header={<div className="custom-header">custom</div>} onCancel={jest.fn()} title="ignored">
                    body
                </Modal>
            );
            // Default ModalHeader should not render when a custom header is supplied
            expect(document.querySelector('.modal-header')).toBeNull();
            expect(document.querySelector('.custom-header').textContent).toEqual('custom');
        });

        test('renders custom footer when provided and skips ModalButtons', () => {
            render(
                <Modal footer={<span className="custom-footer">f</span>} onCancel={jest.fn()} onConfirm={jest.fn()}>
                    body
                </Modal>
            );
            const footer = document.querySelector('.modal-footer');
            expect(footer).not.toBeNull();
            expect(footer.querySelector('.custom-footer').textContent).toEqual('f');
            // ModalButtons applies the 'modal-buttons' class — should not be present
            expect(document.querySelector('.modal-buttons')).toBeNull();
        });

        test('renders ModalButtons when no footer is provided', async () => {
            const onCancel = jest.fn();
            const onConfirm = jest.fn();
            render(
                <Modal cancelText="Nope" confirmText="Go" onCancel={onCancel} onConfirm={onConfirm}>
                    body
                </Modal>
            );

            const buttons = document.querySelector('.modal-footer.modal-buttons');
            expect(buttons).not.toBeNull();

            const buttonEls = buttons.querySelectorAll('button');
            // First button is cancel, last is confirm
            const cancelBtn = Array.from(buttonEls).find(b => b.textContent === 'Nope');
            const confirmBtn = Array.from(buttonEls).find(b => b.textContent === 'Go');
            expect(cancelBtn).toBeDefined();
            expect(confirmBtn).toBeDefined();

            await userEvent.click(cancelBtn);
            await userEvent.click(confirmBtn);
            expect(onCancel).toHaveBeenCalledTimes(1);
            expect(onConfirm).toHaveBeenCalledTimes(1);
        });

        test('renders footerContent inside default ModalButtons', () => {
            render(
                <Modal footerContent={<span className="fc">fc</span>} onCancel={jest.fn()} onConfirm={jest.fn()}>
                    body
                </Modal>
            );
            const buttons = document.querySelector('.modal-footer.modal-buttons');
            expect(buttons).not.toBeNull();
            expect(buttons.querySelector('.fc').textContent).toEqual('fc');
        });

        test('passes bsSize and className down to BaseModal', () => {
            render(
                <Modal bsSize="lg" className="my-modal" onCancel={jest.fn()}>
                    body
                </Modal>
            );
            const dialog = document.querySelector('.modal-dialog');
            expect(dialog.classList.contains('modal-lg')).toBe(true);
            expect(dialog.classList.contains('my-modal')).toBe(true);
        });
    });
});
