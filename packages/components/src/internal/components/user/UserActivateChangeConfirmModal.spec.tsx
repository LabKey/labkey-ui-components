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

import { UserActivateChangeConfirmModal } from './UserActivateChangeConfirmModal';

describe('UserActivateChangeConfirmModal', () => {
    test('reactivate single user selected', () => {
        const component = (
            <UserActivateChangeConfirmModal
                userIds={[1]}
                reactivate={true}
                onCancel={jest.fn()}
                onComplete={jest.fn()}
            />
        );

        const wrapper = mount(component);
        expect(wrapper.find('Alert')).toHaveLength(0);
        expect(wrapper.find('.modal-title').text()).toBe('Reactivate 1 User?');
        expect(wrapper.find('.modal-body').text()).toContain('Reactivated users');
        expect(wrapper.find('.modal-body').text()).toContain('1 user will be updated.');
        expect(wrapper.find('.btn')).toHaveLength(2);
        expect(wrapper.find('.btn-danger')).toHaveLength(0);
        expect(wrapper.find('.btn-success')).toHaveLength(1);
        expect(wrapper.find('.btn-success').props().disabled).toBe(false);
        wrapper.unmount();
    });

    test('reactivate multiple users selected', () => {
        const component = (
            <UserActivateChangeConfirmModal
                userIds={[1, 2, 3]}
                reactivate={true}
                onCancel={jest.fn()}
                onComplete={jest.fn()}
            />
        );

        const wrapper = mount(component);
        expect(wrapper.find('Alert')).toHaveLength(0);
        expect(wrapper.find('.modal-title').text()).toBe('Reactivate 3 Users?');
        expect(wrapper.find('.modal-body').text()).toContain('Reactivated users');
        expect(wrapper.find('.modal-body').text()).toContain('3 users will be updated.');
        expect(wrapper.find('.btn')).toHaveLength(2);
        expect(wrapper.find('.btn-danger')).toHaveLength(0);
        expect(wrapper.find('.btn-success')).toHaveLength(1);
        expect(wrapper.find('.btn-success').props().disabled).toBe(false);
        wrapper.unmount();
    });

    test('reactivate with state', () => {
        const component = (
            <UserActivateChangeConfirmModal
                userIds={[1, 2, 3]}
                reactivate={true}
                onCancel={jest.fn()}
                onComplete={jest.fn()}
            />
        );

        const wrapper = mount(component);
        wrapper.setState({ submitting: true, error: 'Test Error' });

        expect(wrapper.find('Alert')).toHaveLength(1);
        expect(wrapper.find('.modal-title').text()).toBe('Reactivate 3 Users?');
        expect(wrapper.find('.modal-body').text()).toContain('Reactivated users');
        expect(wrapper.find('.modal-body').text()).toContain('3 users will be updated.');
        expect(wrapper.find('.btn')).toHaveLength(2);
        expect(wrapper.find('.btn-danger')).toHaveLength(0);
        expect(wrapper.find('.btn-success')).toHaveLength(1);
        expect(wrapper.find('.btn-success').props().disabled).toBe(true);
        wrapper.unmount();
    });

    test('deactivate single user selected', () => {
        const component = (
            <UserActivateChangeConfirmModal
                userIds={[1]}
                reactivate={false}
                onCancel={jest.fn()}
                onComplete={jest.fn()}
            />
        );

        const wrapper = mount(component);
        expect(wrapper.find('Alert')).toHaveLength(0);
        expect(wrapper.find('.modal-title').text()).toBe('Deactivate 1 User?');
        expect(wrapper.find('.modal-body').text()).toContain('Deactivated users');
        expect(wrapper.find('.modal-body').text()).toContain('1 user will be updated.');
        expect(wrapper.find('.btn')).toHaveLength(2);
        expect(wrapper.find('.btn-success')).toHaveLength(0);
        expect(wrapper.find('.btn-danger')).toHaveLength(1);
        expect(wrapper.find('.btn-danger').props().disabled).toBe(false);
        wrapper.unmount();
    });

    test('deactivate multiple users selected', () => {
        const component = (
            <UserActivateChangeConfirmModal
                userIds={[1, 2, 3]}
                reactivate={false}
                onCancel={jest.fn()}
                onComplete={jest.fn()}
            />
        );

        const wrapper = mount(component);
        expect(wrapper.find('Alert')).toHaveLength(0);
        expect(wrapper.find('.modal-title').text()).toBe('Deactivate 3 Users?');
        expect(wrapper.find('.modal-body').text()).toContain('Deactivated users');
        expect(wrapper.find('.modal-body').text()).toContain('3 users will be updated.');
        expect(wrapper.find('.btn')).toHaveLength(2);
        expect(wrapper.find('.btn-success')).toHaveLength(0);
        expect(wrapper.find('.btn-danger')).toHaveLength(1);
        expect(wrapper.find('.btn-danger').props().disabled).toBe(false);
        wrapper.unmount();
    });

    test('deactivate with state', () => {
        const component = (
            <UserActivateChangeConfirmModal
                userIds={[1, 2, 3]}
                reactivate={false}
                onCancel={jest.fn()}
                onComplete={jest.fn()}
            />
        );

        const wrapper = mount(component);
        wrapper.setState({ submitting: true, error: 'Test Error' });

        expect(wrapper.find('Alert')).toHaveLength(1);
        expect(wrapper.find('.modal-title').text()).toBe('Deactivate 3 Users?');
        expect(wrapper.find('.modal-body').text()).toContain('Deactivated users');
        expect(wrapper.find('.modal-body').text()).toContain('3 users will be updated.');
        expect(wrapper.find('.btn')).toHaveLength(2);
        expect(wrapper.find('.btn-success')).toHaveLength(0);
        expect(wrapper.find('.btn-danger')).toHaveLength(1);
        expect(wrapper.find('.btn-danger').props().disabled).toBe(true);
        wrapper.unmount();
    });
});
