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
import React from 'react'
import { mount } from 'enzyme'

import { SampleDeleteConfirmModalDisplay } from './SampleDeleteConfirmModalDisplay';
import { SampleDeleteConfirmModal } from './SampleDeleteConfirmModal';
import { ConfirmModal } from '../base/ConfirmModal';

describe("<SampleDeleteConfirmModal/>", () => {

    test("Error display", () => {
        const errorMsg = "There was an error";
        const component = (
            <SampleDeleteConfirmModal
                selectionKey={"nonesuch"}
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
            />
        );
        const wrapper = mount(component);
        wrapper.setState({
            isLoading: false,
            error: errorMsg,
        });
        const confirmModal = wrapper.find(ConfirmModal);
        expect(confirmModal.props().msg).toBe(errorMsg);
        expect(confirmModal.props().cancelButtonText).toBe("Dismiss");
    });
    test("Have confirmation data", () => {
        const component = (
            <SampleDeleteConfirmModal
                selectionKey={"nonesuch"}
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
            />
        );
        const wrapper = mount(component);
        wrapper.setState({
            isLoading: false,
            confirmationData: {
                "canDelete" : [ {
                    "Name" : "D-2.3.1",
                    "RowId" : 351
                } ],
                "cannotDelete" : [  ]
            }
        });
        expect(wrapper.find(SampleDeleteConfirmModalDisplay)).toHaveLength(1);
    })
});
