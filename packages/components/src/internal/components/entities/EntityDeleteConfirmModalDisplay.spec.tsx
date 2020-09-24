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

import { EntityDeleteConfirmModalDisplay } from './EntityDeleteConfirmModalDisplay';
import { SampleTypeDataType } from './constants';

describe('<EntityDeleteConfirmModal/>', () => {
    test('Can delete 1', () => {
        const component = (
            <EntityDeleteConfirmModalDisplay
                confirmationData={{
                    canDelete: [
                        {
                            Name: 'D-2.3.1',
                            RowId: 351,
                        },
                    ],
                    cannotDelete: [],
                }}
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
                entityDataType={SampleTypeDataType}
            />
        );
        const wrapper = mount(component);
        expect(wrapper.find('.modal-title').text()).toBe('Permanently delete 1 sample?');
        expect(
            wrapper.find('.modal-body').text().indexOf('The selected sample will be permanently deleted.')
        ).toBeGreaterThan(-1);
    });

    test('Can delete all', () => {
        const component = (
            <EntityDeleteConfirmModalDisplay
                confirmationData={{
                    canDelete: [
                        {
                            Name: 'D-2.3.1',
                            RowId: 351,
                        },
                        {
                            Name: 'D-3',
                            RowId: 352,
                        },
                        {
                            Name: 'D-4',
                            RowId: 5,
                        },
                    ],
                    cannotDelete: [],
                }}
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
                entityDataType={SampleTypeDataType}
            />
        );
        const wrapper = mount(component);
        expect(wrapper.find('.modal-title').text()).toBe('Permanently delete 3 samples?');
        expect(
            wrapper.find('.modal-body').text().indexOf('All 3 samples will be permanently deleted.')
        ).toBeGreaterThan(-1);
    });

    test('Can delete some', () => {
        const component = (
            <EntityDeleteConfirmModalDisplay
                confirmationData={{
                    canDelete: [
                        {
                            Name: 'D-2.3.1',
                            RowId: 351,
                        },
                        {
                            Name: 'D-3',
                            RowId: 352,
                        },
                    ],
                    cannotDelete: [
                        {
                            Name: 'D-4',
                            RowId: 5,
                        },
                    ],
                }}
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
                entityDataType={SampleTypeDataType}
            />
        );
        const wrapper = mount(component);

        expect(wrapper.find('.modal-title').text()).toBe('Permanently delete 2 samples?');
        expect(
            wrapper.find('.modal-body').text().indexOf('selected 3 samples but only 2 can be deleted.')
        ).toBeGreaterThan(-1);
        expect(wrapper.find('.modal-body').text().indexOf('1 sample cannot be deleted')).toBeGreaterThan(-1);
    });

    test('Cannot delete any', () => {
        const component = (
            <EntityDeleteConfirmModalDisplay
                confirmationData={{
                    canDelete: [],
                    cannotDelete: [
                        {
                            Name: 'D-2.3.1',
                            RowId: 351,
                        },
                        {
                            Name: 'D-3',
                            RowId: 352,
                        },
                        {
                            Name: 'D-4',
                            RowId: 5,
                        },
                    ],
                }}
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
                entityDataType={SampleTypeDataType}
            />
        );
        const wrapper = mount(component);
        expect(wrapper.find('.modal-title').text()).toBe('No samples can be deleted');
        expect(
            wrapper.find('.modal-body').text().indexOf("None of the 3 samples you've selected can be deleted")
        ).toBeGreaterThan(-1);
    });

    test('Cannot delete two', () => {
        const component = (
            <EntityDeleteConfirmModalDisplay
                confirmationData={{
                    canDelete: [],
                    cannotDelete: [
                        {
                            Name: 'D-2.3.1',
                            RowId: 351,
                        },
                        {
                            Name: 'D-3',
                            RowId: 44,
                        },
                    ],
                }}
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
                entityDataType={SampleTypeDataType}
            />
        );
        const wrapper = mount(component);
        expect(wrapper.find('.modal-title').text()).toBe('No samples can be deleted');
        expect(
            wrapper.find('.modal-body').text().indexOf("Neither of the 2 samples you've selected can be deleted")
        ).toBeGreaterThan(-1);
    });

    test('Cannot delete one', () => {
        const component = (
            <EntityDeleteConfirmModalDisplay
                confirmationData={{
                    canDelete: [],
                    cannotDelete: [
                        {
                            Name: 'D-2.3.1',
                            RowId: 351,
                        },
                    ],
                }}
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
                entityDataType={SampleTypeDataType}
            />
        );
        const wrapper = mount(component);
        expect(wrapper.find('.modal-title').text()).toBe('Cannot delete sample');
        expect(
            wrapper.find('.modal-body').text().indexOf("The sample you've selected cannot be deleted")
        ).toBeGreaterThan(-1);
    });

    test('button clicks', () => {
        const onConfirmFn = jest.fn();
        const onCancelFn = jest.fn();
        const component = (
            <EntityDeleteConfirmModalDisplay
                confirmationData={{
                    canDelete: [
                        {
                            Name: 'D-4',
                            RowId: 441,
                        },
                    ],
                    cannotDelete: [
                        {
                            Name: 'D-2.3.1',
                            RowId: 351,
                        },
                        {
                            Name: 'D-3',
                            RowId: 352,
                        },
                        {
                            Name: 'D-4',
                            RowId: 5,
                        },
                    ],
                }}
                onCancel={onCancelFn}
                onConfirm={onConfirmFn}
                entityDataType={SampleTypeDataType}
            />
        );

        const wrapper = mount(component);
        const cancelBtn = wrapper.find('.modal-footer').findWhere(n => n.type() === 'button' && n.text() === 'Cancel');
        const confirmBtn = wrapper
            .find('.modal-footer')
            .findWhere(n => n.type() === 'button' && n.text() === 'Yes, Delete');
        expect(onCancelFn).toHaveBeenCalledTimes(0);
        expect(onConfirmFn).toHaveBeenCalledTimes(0);

        cancelBtn.simulate('click');
        expect(onCancelFn).toHaveBeenCalledTimes(1);
        expect(onConfirmFn).toHaveBeenCalledTimes(0);

        confirmBtn.simulate('click');
        expect(onCancelFn).toHaveBeenCalledTimes(1);
        expect(onConfirmFn).toHaveBeenCalledTimes(1);

        confirmBtn.simulate('click');
        expect(onCancelFn).toHaveBeenCalledTimes(1);
        expect(onConfirmFn).toHaveBeenCalledTimes(2);

        wrapper.unmount();
    });
});
