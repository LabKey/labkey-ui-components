/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import { mount } from 'enzyme';

import { UserResetPasswordConfirmModal } from './UserResetPasswordConfirmModal';

describe('<UserResetPasswordConfirmModal/>', () => {
    test('with login', () => {
        const component = (
            <UserResetPasswordConfirmModal
                email="jest@localhost.test"
                hasLogin={true}
                onCancel={jest.fn()}
                onComplete={jest.fn()}
            />
        );

        const wrapper = mount(component);
        expect(wrapper.find('Alert')).toHaveLength(0);
        expect(wrapper.find('.modal-title').text()).toBe('Reset Password?');
        expect(wrapper.find('.modal-body').text()).toContain('You are about to clear the current password for');
        expect(wrapper.find('.btn')).toHaveLength(2);
        expect(wrapper.find('.btn-success')).toHaveLength(1);
        expect(wrapper.find('.btn-success').props().disabled).toBe(false);
        wrapper.unmount();
    });

    test('without login', () => {
        const component = (
            <UserResetPasswordConfirmModal
                email="jest@localhost.test"
                hasLogin={false}
                onCancel={jest.fn()}
                onComplete={jest.fn()}
            />
        );

        const wrapper = mount(component);
        expect(wrapper.find('Alert')).toHaveLength(0);
        expect(wrapper.find('.modal-title').text()).toBe('Reset Password?');
        expect(wrapper.find('.modal-body').text()).toContain('You are about to send');
        expect(wrapper.find('.btn')).toHaveLength(2);
        expect(wrapper.find('.btn-success')).toHaveLength(1);
        expect(wrapper.find('.btn-success').props().disabled).toBe(false);
        wrapper.unmount();
    });

    test('with state', () => {
        const component = (
            <UserResetPasswordConfirmModal
                email="jest@localhost.test"
                hasLogin={false}
                onCancel={jest.fn()}
                onComplete={jest.fn()}
            />
        );

        const wrapper = mount(component);
        wrapper.setState({ submitting: true, error: 'Test Error' });

        expect(wrapper.find('Alert')).toHaveLength(2);
        expect(wrapper.find('.modal-title').text()).toBe('Reset Password?');
        expect(wrapper.find('.modal-body').text()).toContain('You are about to send');
        expect(wrapper.find('.btn')).toHaveLength(2);
        expect(wrapper.find('.btn-success')).toHaveLength(1);
        expect(wrapper.find('.btn-success').props().disabled).toBe(true);
        wrapper.unmount();
    });
});
