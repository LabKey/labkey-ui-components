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

import { EntityTypeDeleteConfirmModal } from './EntityTypeDeleteConfirmModal';

describe('<EntityTypeDeleteConfirmModal/>', () => {
    test('showDependenciesLink prop', () => {
        const component = (
            <EntityTypeDeleteConfirmModal
                rowId={0}
                noun="sample"
                deleteConfirmationActionName="deleteSampleTypes"
                showDependenciesLink={true}
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
            />
        );

        const wrapper = mount(component);
        expect(wrapper.find('.modal-body').find('a')).toHaveLength(1);
        wrapper.unmount();
    });

    test('button clicks', () => {
        const onConfirmFn = jest.fn();
        const onCancelFn = jest.fn();
        const component = (
            <EntityTypeDeleteConfirmModal
                rowId={0}
                noun="sample"
                deleteConfirmationActionName="deleteSampleTypes"
                onCancel={onCancelFn}
                onConfirm={onConfirmFn}
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
