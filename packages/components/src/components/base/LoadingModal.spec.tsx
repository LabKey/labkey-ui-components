import React from 'react';
import { Modal } from 'react-bootstrap';
import { mount } from 'enzyme';

import { LoadingModal } from './LoadingModal';
import { LoadingSpinner } from './LoadingSpinner';

describe('<LoadingModal />', () => {
    test('without custom title', () => {
        const loadingModal = mount(<LoadingModal />);

        expect(loadingModal.find(Modal)).toHaveLength(1);
        expect(loadingModal.find(LoadingSpinner)).toHaveLength(1);
        expect(loadingModal.find('.modal-title').text()).toBe('Loading...');

        loadingModal.unmount();
    });

    test('with custom title', () => {
        const title = 'Waiting for data to be loaded';
        const loadingModal = mount(<LoadingModal title={title} />);

        expect(loadingModal.find(Modal)).toHaveLength(1);
        expect(loadingModal.find(LoadingSpinner)).toHaveLength(1);
        expect(loadingModal.find('.modal-title').text()).toBe(title);

        loadingModal.unmount();
    });

    test('onCancel', () => {
        const onCancelFn = jest.fn();
        const loadingModal = mount(<LoadingModal onCancel={onCancelFn} />);

        const cancelBtn = loadingModal.findWhere(n => n.type() === 'button');
        expect(onCancelFn).toHaveBeenCalledTimes(0);

        cancelBtn.simulate('click');
        expect(onCancelFn).toHaveBeenCalledTimes(1);

        loadingModal.unmount();
    });
});
