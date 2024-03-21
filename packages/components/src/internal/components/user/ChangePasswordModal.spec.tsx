import React from 'react';
import { mount } from 'enzyme';

import { TEST_USER_READER } from '../../userFixtures';

import { Alert } from '../base/Alert';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { ChangePasswordModel } from './models';
import { ChangePasswordModal } from './ChangePasswordModal';

describe('ChangePasswordModal', () => {
    test('without state', () => {
        const wrapper = mount(<ChangePasswordModal user={TEST_USER_READER} onSuccess={jest.fn()} onHide={jest.fn()} />);

        const modal = wrapper.find('.modal-dialog');
        expect(modal.find(Alert)).toHaveLength(0);
        expect(modal.find('input')).toHaveLength(3);
        expect(modal.find(LabelHelpTip)).toHaveLength(0);
        expect(modal.find('.btn')).toHaveLength(2);
        expect(modal.find('.btn').findWhere(btn => btn.prop('disabled'))).toHaveLength(0);

        wrapper.unmount();
    });

    test('with state', () => {
        const wrapper = mount(<ChangePasswordModal user={TEST_USER_READER} onSuccess={jest.fn()} onHide={jest.fn()} />);

        wrapper.setState({
            model: new ChangePasswordModel({ oldPassword: 'old', password: 'new', password2: 'new2' }),
            passwordRule: { full: 'Testing password rule description' },
            submitting: true,
            error: 'Test Error',
        });

        const modal = wrapper.find('.modal-dialog');
        expect(modal.find(Alert)).toHaveLength(1);
        expect(modal.find('input')).toHaveLength(3);
        expect(modal.find('#strengthGuidance')).toHaveLength(0);
        expect(modal.find(LabelHelpTip)).toHaveLength(1);
        expect(modal.find('.btn')).toHaveLength(2);
        expect(wrapper.find('.alert').text()).toEqual('Test Error');
        expect(
            modal
                .find('.btn')
                .findWhere(btn => btn.prop('disabled'))
                .hostNodes()
        ).toHaveLength(1);

        wrapper.unmount();
    });

    test('shouldShowPasswordGuidance', () => {
        const wrapper = mount(<ChangePasswordModal user={TEST_USER_READER} onSuccess={jest.fn()} onHide={jest.fn()} />);

        wrapper.setState({
            model: new ChangePasswordModel({ oldPassword: 'old', password: 'new', password2: 'new2' }),
            passwordRule: { summary: 'Testing password rule description', shouldShowPasswordGuidance: true },
            submitting: true,
            error: 'Test Error',
        });

        const modal = wrapper.find('.modal-dialog');
        expect(modal.find(Alert)).toHaveLength(1);
        expect(modal.find('input')).toHaveLength(3);
        expect(modal.find('#strengthGuidance')).toHaveLength(1);
        expect(modal.find(LabelHelpTip)).toHaveLength(1);
        expect(modal.find('.btn')).toHaveLength(2);

        wrapper.unmount();
    });
});
