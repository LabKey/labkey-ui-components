import React from 'react';

import { mount } from 'enzyme';
import { Modal } from 'react-bootstrap';

import { ConfirmModal } from './ConfirmModal';

describe('<ConfirmModal/>', () => {
    test('default props', () => {
        const msg = 'Testing confirm modal message';
        const modal = mount(<ConfirmModal msg={msg} />);

        expect(modal.find(Modal)).toHaveLength(1);
        expect(modal.find('.modal-title').text()).toBe('Confirm');
        expect(modal.find('.modal-body').text()).toBe(msg);
        expect(modal.find('.close')).toHaveLength(0);
        expect(modal.find('.btn')).toHaveLength(0);
        expect(modal.find('.btn-danger')).toHaveLength(0);
        modal.unmount();
    });

    test('with callback functions', () => {
        const title = 'Callback Title';
        const msg = 'Callback confirm modal message';
        const modal = mount(<ConfirmModal title={title} msg={msg} onConfirm={jest.fn()} onCancel={jest.fn()} />);

        expect(modal.find(Modal)).toHaveLength(1);
        expect(modal.find('.modal-title').text()).toBe(title);
        expect(modal.find('.modal-body').text()).toBe(msg);
        expect(modal.find('.close')).toHaveLength(1);
        expect(modal.find('.btn')).toHaveLength(2);
        expect(modal.find('.btn-danger')).toHaveLength(1);
        expect(modal.find('.btn-danger').prop('disabled')).toBe(false);
        modal.unmount();
    });

    test('submitting', () => {
        const msg = 'Submitting confirm modal message';
        const modal = mount(<ConfirmModal msg={msg} onConfirm={jest.fn()} onCancel={jest.fn()} submitting={true} />);

        expect(modal.find(Modal)).toHaveLength(1);
        expect(modal.find('.close')).toHaveLength(1);
        expect(modal.find('.btn')).toHaveLength(2);
        expect(modal.find('.btn-danger')).toHaveLength(1);
        expect(modal.find('.btn-danger').prop('disabled')).toBe(true);
        modal.unmount();
    });
});
