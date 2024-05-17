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

import { mount, shallow } from 'enzyme';

import { makeQueryInfo } from '../../test/testHelpers';
import mixturesQueryInfo from '../../../test/data/mixtures-getQueryDetails.json';

import { TextInput } from './input/TextInput';
import { QueryFormInputs } from './QueryFormInputs';
import { QueryInfoForm } from './QueryInfoForm';
import { QueryInfoQuantity } from './QueryInfoQuantity';

const QUERY_INFO = makeQueryInfo(mixturesQueryInfo);

describe('QueryInfoForm', () => {
    test('default props', () => {
        const formWrapper = shallow(<QueryInfoForm queryInfo={QUERY_INFO} onHide={jest.fn()} onSubmit={jest.fn()} />);
        expect(formWrapper.find(QueryFormInputs)).toHaveLength(1);
        expect(formWrapper.find('button')).toHaveLength(2);
    });

    test('with header', () => {
        const header = <span className="header-info">Header info here</span>;
        const formWrapper = shallow(<QueryInfoForm header={header} queryInfo={QUERY_INFO} onSubmit={jest.fn()} />);

        expect(formWrapper.find('.header-info')).toHaveLength(1);
    });

    test('as modal', () => {
        const formWrapper = shallow(<QueryInfoForm asModal={true} queryInfo={QUERY_INFO} onSubmit={jest.fn()} />);
        expect(formWrapper.find('Modal')).toHaveLength(1);
    });

    test('as modal with title', () => {
        const formWrapper = mount(
            <QueryInfoForm asModal={true} title="Test modal title" queryInfo={QUERY_INFO} onSubmit={jest.fn()} />
        );
        expect(formWrapper.find('Modal')).toHaveLength(1);
        const modalTitle = formWrapper.find('.modal-title');
        expect(modalTitle).toHaveLength(1);
        expect(modalTitle.childAt(0).text()).toBe('Test modal title');
    });

    test("don't include count field", () => {
        const formWrapper = shallow(
            <QueryInfoForm includeCountField={false} queryInfo={QUERY_INFO} onSubmit={jest.fn()} />
        );
        expect(formWrapper.find('input#numItems')).toHaveLength(0);
    });

    test('custom text', () => {
        const cancelText = 'custom cancel text';
        const countText = 'custom count text';
        const submitText = 'custom submit text';
        const formWrapper = shallow(
            <QueryInfoForm
                cancelText={cancelText}
                countText={countText}
                submitText={submitText}
                queryInfo={QUERY_INFO}
                onHide={jest.fn()}
                onSubmit={jest.fn()}
            />
        );
        const cancelButton = formWrapper.find('.test-loc-cancel-button');
        expect(cancelButton.childAt(0).text()).toBe(cancelText);
        const submitButton = formWrapper.find('.test-loc-submit-button');
        expect(submitButton.childAt(0).text()).toBe(submitText);
        expect(formWrapper.find(QueryInfoQuantity)).toHaveLength(1);
        expect(formWrapper.find(QueryInfoQuantity).prop('countText')).toBe(countText);
    });

    test('with footer', () => {
        const footer = <span className="footer-info">Footer info here</span>;
        const formWrapper = shallow(<QueryInfoForm footer={footer} queryInfo={QUERY_INFO} onSubmit={jest.fn()} />);

        expect(formWrapper.find('.footer-info')).toHaveLength(1);
    });

    test('with only submitForEdit', () => {
        const submitForEditText = 'Test Submit for Edit';
        const formWrapper = shallow(
            <QueryInfoForm
                includeCountField={false}
                checkRequiredFields={false}
                queryInfo={QUERY_INFO}
                submitForEditText={submitForEditText}
                onSubmitForEdit={jest.fn()}
            />
        );

        const submitForEditButton = formWrapper.find('.test-loc-submit-for-edit-button');
        expect(submitForEditButton.childAt(0).text()).toBe(submitForEditText);
        expect(submitForEditButton.props().disabled).toBe(false);
    });

    test('with submitForEdit and submit enabled', () => {
        const formWrapper = shallow(
            <QueryInfoForm
                includeCountField={false}
                checkRequiredFields={false}
                queryInfo={QUERY_INFO}
                onSubmitForEdit={jest.fn()}
                onSubmit={jest.fn()}
            />
        );

        const submitForEditButton = formWrapper.find('.test-loc-submit-for-edit-button');
        expect(submitForEditButton.props().disabled).toBe(false);
        const submitButton = formWrapper.find('.test-loc-submit-button');
        expect(submitButton.props().disabled).toBeFalsy();
    });

    test('with submitForEdit and submit disabled', () => {
        const formWrapper = shallow(
            <QueryInfoForm
                includeCountField={true}
                queryInfo={QUERY_INFO}
                onSubmitForEdit={jest.fn()}
                onSubmit={jest.fn()}
            />
        );

        const submitForEditButton = formWrapper.find('.test-loc-submit-for-edit-button');
        expect(submitForEditButton.props().disabled).toBe(true);
        const submitButton = formWrapper.find('.test-loc-submit-button');
        expect(submitButton.props().disabled).toBe(true);
    });

    test("don't allow canSubmitNotDirty", () => {
        const formWrapper = shallow(
            <QueryInfoForm
                includeCountField={false}
                checkRequiredFields={false}
                queryInfo={QUERY_INFO}
                onSubmit={jest.fn()}
                canSubmitNotDirty={false}
            />
        );

        const submitButton = formWrapper.find('.test-loc-submit-button');
        expect(submitButton.props().disabled).toBe(true);
    });

    test('customize column filter', () => {
        const filter = col => {
            return col.name === 'extraTestColumn';
        };

        const formWrapper = mount(<QueryInfoForm queryInfo={QUERY_INFO} columnFilter={filter} onSubmit={jest.fn()} />);

        expect(formWrapper.find(TextInput)).toHaveLength(1);
        formWrapper.unmount();
    });

    test('skip required check', () => {
        const formWrapper = mount(
            <QueryInfoForm queryInfo={QUERY_INFO} checkRequiredFields={false} onHide={jest.fn()} onSubmit={jest.fn()} />
        );

        expect(formWrapper.text()).toContain('Extra Test Column Cancel');
        formWrapper.unmount();
    });

    test('skip required check but show asterisk on label', () => {
        const formWrapper = mount(
            <QueryInfoForm
                queryInfo={QUERY_INFO}
                checkRequiredFields={false}
                showLabelAsterisk={true}
                onSubmit={jest.fn()}
            />
        );

        expect(formWrapper.text()).toContain('Extra Test Column  *');
        formWrapper.unmount();
    });

    test('all fields disabled', () => {
        const formWrapper = mount(
            <QueryInfoForm queryInfo={QUERY_INFO} initiallyDisableFields={true} onSubmit={jest.fn()} />
        );
        expect(formWrapper.find('button[type="submit"]').prop('disabled')).toBeTruthy();
        formWrapper.unmount();
    });
});
