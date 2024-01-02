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

import { UserDeleteConfirmModal } from './UserDeleteConfirmModal';

describe('UserDeleteConfirmModal', () => {
    test('single user selected', () => {
        const component = <UserDeleteConfirmModal userIds={[1]} onCancel={jest.fn()} onComplete={jest.fn()} />;

        const wrapper = mount(component);
        expect(wrapper.find('.alert-danger')).toHaveLength(0);
        expect(wrapper.find('.modal-title').text()).toBe('Delete 1 User?');
        expect(wrapper.find('.modal-body').text()).toContain('Deletion of a user is');
        expect(wrapper.find('.modal-body').text()).toContain('1 user will be deleted.');
        expect(wrapper.find('.btn')).toHaveLength(2);
        expect(wrapper.find('.btn-danger')).toHaveLength(1);
        expect(wrapper.find('.btn-danger').props().disabled).toBe(false);
        wrapper.unmount();
    });

    test('multiple users selected', () => {
        const component = <UserDeleteConfirmModal userIds={[1, 2, 3]} onCancel={jest.fn()} onComplete={jest.fn()} />;

        const wrapper = mount(component);
        expect(wrapper.find('.alert-danger')).toHaveLength(0);
        expect(wrapper.find('.modal-title').text()).toBe('Delete 3 Users?');
        expect(wrapper.find('.modal-body').text()).toContain('Deletion of a user is');
        expect(wrapper.find('.modal-body').text()).toContain('3 users will be deleted.');
        expect(wrapper.find('.btn')).toHaveLength(2);
        expect(wrapper.find('.btn-danger')).toHaveLength(1);
        expect(wrapper.find('.btn-danger').props().disabled).toBe(false);
        wrapper.unmount();
    });

    test('with state', () => {
        const component = <UserDeleteConfirmModal userIds={[1, 2, 3]} onCancel={jest.fn()} onComplete={jest.fn()} />;

        const wrapper = mount(component);
        wrapper.setState({ submitting: true, error: 'Test Error' });

        expect(wrapper.find('.alert-danger')).toHaveLength(1);
        expect(wrapper.find('.modal-title').text()).toBe('Delete 3 Users?');
        expect(wrapper.find('.modal-body').text()).toContain('Deletion of a user is');
        expect(wrapper.find('.modal-body').text()).toContain('3 users will be deleted.');
        expect(wrapper.find('.btn')).toHaveLength(2);
        expect(wrapper.find('.btn-danger')).toHaveLength(1);
        expect(wrapper.find('.btn-danger').props().disabled).toBe(true);
        wrapper.unmount();
    });
});
