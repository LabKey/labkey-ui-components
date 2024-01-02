import React from 'react';

import { mount } from 'enzyme';
import { Modal } from 'react-bootstrap';

import { ConfirmModal } from './ConfirmModal';

describe('ConfirmModal', () => {
    test('default props', () => {
        const msg = 'Testing confirm modal message';
        const modal = mount(<ConfirmModal>{msg}</ConfirmModal>);

        expect(modal.find(Modal)).toHaveLength(1);
        expect(modal.find('.modal-title').text()).toBe('Confirm');
        expect(modal.find('.modal-body').text()).toBe(msg);
        expect(modal.find('.close')).toHaveLength(0);
        expect(modal.find('.btn')).toHaveLength(0);
        expect(modal.find('.btn-danger')).toHaveLength(0);
    });

    test('with callback functions', () => {
        const title = 'Callback Title';
        const msg = 'Callback confirm modal message';
        const modal = mount(
            <ConfirmModal title={title} onConfirm={jest.fn()} onCancel={jest.fn()}>
                {msg}
            </ConfirmModal>
        );

        expect(modal.find(Modal)).toHaveLength(1);
        expect(modal.find('.modal-title').text()).toBe(title);
        expect(modal.find('.modal-body').text()).toBe(msg);
        expect(modal.find('.close')).toHaveLength(1);
        expect(modal.find('.btn')).toHaveLength(2);
        expect(modal.find('.btn-danger')).toHaveLength(1);
        expect(modal.find('.btn-danger').prop('disabled')).toBeFalsy();
    });

    test('submitting', () => {
        const msg = 'Submitting confirm modal message';
        const modal = mount(
            <ConfirmModal onConfirm={jest.fn()} onCancel={jest.fn()} submitting={true}>
                {msg}
            </ConfirmModal>
        );

        expect(modal.find(Modal)).toHaveLength(1);
        expect(modal.find('.close')).toHaveLength(1);
        expect(modal.find('.btn')).toHaveLength(2);
        expect(modal.find('.btn-danger')).toHaveLength(1);
        expect(modal.find('.btn-danger').prop('disabled')).toBe(true);
    });

    test('canConfirm', () => {
        const msg = 'testing of canConfirm prop set to false';
        const modal = mount(
            <ConfirmModal onConfirm={jest.fn()} onCancel={jest.fn()} canConfirm={false}>
                {msg}
            </ConfirmModal>
        );

        expect(modal.find(Modal)).toHaveLength(1);
        expect(modal.find('.close')).toHaveLength(1);
        expect(modal.find('.btn')).toHaveLength(2);
        expect(modal.find('.btn-danger')).toHaveLength(1);
        expect(modal.find('.btn-danger').prop('disabled')).toBe(true);
    });
});
