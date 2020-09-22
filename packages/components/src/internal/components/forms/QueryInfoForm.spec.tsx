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

import { Button, Modal, ModalTitle } from 'react-bootstrap';

import { initUnitTestMocks } from '../../../testHelpers';
import { getQueryDetails } from '../../../query/api';
import { SchemaQuery } from '../base/models/model';

import { TextInput } from './input/TextInput';
import { QueryFormInputs } from './QueryFormInputs';
import { QueryInfoForm } from './QueryInfoForm';

beforeAll(() => {
    initUnitTestMocks();
});

const schemaQuery = new SchemaQuery({
    schemaName: 'exp.data',
    queryName: 'Mixtures',
});

describe('QueryInfoForm', () => {
    test('default props', () => {
        expect.hasAssertions();
        return getQueryDetails(schemaQuery).then(queryInfo => {
            const formWrapper = shallow(
                <QueryInfoForm schemaQuery={schemaQuery} queryInfo={queryInfo} onSubmit={jest.fn()} />
            );
            expect(formWrapper.find(QueryFormInputs)).toHaveLength(1);
            expect(formWrapper.find(Button)).toHaveLength(2);
        });
    });

    test('with header', () => {
        expect.hasAssertions();
        return getQueryDetails(schemaQuery).then(queryInfo => {
            const header = <span className="header-info">Header info here</span>;
            const formWrapper = shallow(
                <QueryInfoForm header={header} schemaQuery={schemaQuery} queryInfo={queryInfo} onSubmit={jest.fn()} />
            );

            expect(formWrapper.find('.header-info')).toHaveLength(1);
        });
    });

    test('as modal', () => {
        expect.hasAssertions();
        return getQueryDetails(schemaQuery).then(queryInfo => {
            const formWrapper = shallow(
                <QueryInfoForm asModal={true} schemaQuery={schemaQuery} queryInfo={queryInfo} onSubmit={jest.fn()} />
            );
            expect(formWrapper.find(Modal)).toHaveLength(1);
            expect(formWrapper.find(ModalTitle)).toHaveLength(0);
        });
    });

    test('as modal with title', () => {
        expect.hasAssertions();
        return getQueryDetails(schemaQuery).then(queryInfo => {
            const formWrapper = shallow(
                <QueryInfoForm
                    asModal={true}
                    title="Test modal title"
                    schemaQuery={schemaQuery}
                    queryInfo={queryInfo}
                    onSubmit={jest.fn()}
                />
            );
            expect(formWrapper.find(Modal)).toHaveLength(1);
            const modalTitle = formWrapper.find(ModalTitle);
            expect(modalTitle).toHaveLength(1);
            expect(modalTitle.childAt(0).text()).toBe('Test modal title');
        });
    });

    test("don't include count field", () => {
        expect.hasAssertions();
        return getQueryDetails(schemaQuery).then(queryInfo => {
            const formWrapper = shallow(
                <QueryInfoForm
                    includeCountField={false}
                    schemaQuery={schemaQuery}
                    queryInfo={queryInfo}
                    onSubmit={jest.fn()}
                />
            );
            expect(formWrapper.find('input#numItems')).toHaveLength(0);
        });
    });

    test('custom text', () => {
        return getQueryDetails(schemaQuery).then(queryInfo => {
            const cancelText = 'custom cancel text';
            const countText = 'custom count text';
            const submitText = 'custom submit text';
            const formWrapper = shallow(
                <QueryInfoForm
                    cancelText={cancelText}
                    countText={countText}
                    submitText={submitText}
                    schemaQuery={schemaQuery}
                    queryInfo={queryInfo}
                    onSubmit={jest.fn()}
                />
            );
            const cancelButton = formWrapper.find('.test-loc-cancel-button');
            expect(cancelButton.childAt(0).text()).toBe(cancelText);
            const submitButton = formWrapper.find('.test-loc-submit-button');
            expect(submitButton.childAt(0).text()).toBe(submitText);
            expect(formWrapper.find({ label: countText })).toHaveLength(1);
        });
    });

    test('with footer', () => {
        expect.hasAssertions();
        return getQueryDetails(schemaQuery).then(queryInfo => {
            const footer = <span className="footer-info">Footer info here</span>;
            const formWrapper = shallow(
                <QueryInfoForm footer={footer} schemaQuery={schemaQuery} queryInfo={queryInfo} onSubmit={jest.fn()} />
            );

            expect(formWrapper.find('.footer-info')).toHaveLength(1);
        });
    });

    test('with only submitForEdit', () => {
        return getQueryDetails(schemaQuery).then(queryInfo => {
            const submitForEditText = 'Test Submit for Edit';
            const formWrapper = shallow(
                <QueryInfoForm
                    includeCountField={false}
                    checkRequiredFields={false}
                    schemaQuery={schemaQuery}
                    queryInfo={queryInfo}
                    submitForEditText={submitForEditText}
                    onSubmitForEdit={jest.fn()}
                />
            );

            const submitForEditButton = formWrapper.find('.test-loc-submit-for-edit-button');
            expect(submitForEditButton.childAt(0).text()).toBe(submitForEditText);
            expect(submitForEditButton.props().disabled).toBe(false);
        });
    });

    test('with submitForEdit and submit enabled', () => {
        return getQueryDetails(schemaQuery).then(queryInfo => {
            const formWrapper = shallow(
                <QueryInfoForm
                    includeCountField={false}
                    checkRequiredFields={false}
                    schemaQuery={schemaQuery}
                    queryInfo={queryInfo}
                    onSubmitForEdit={jest.fn()}
                    onSubmit={jest.fn()}
                />
            );

            const submitForEditButton = formWrapper.find('.test-loc-submit-for-edit-button');
            expect(submitForEditButton.props().disabled).toBe(false);
            const submitButton = formWrapper.find('.test-loc-submit-button');
            expect(submitButton.props().disabled).toBe(false);
        });
    });

    test('with submitForEdit and submit disabled', () => {
        return getQueryDetails(schemaQuery).then(queryInfo => {
            const formWrapper = shallow(
                <QueryInfoForm
                    includeCountField={true}
                    schemaQuery={schemaQuery}
                    queryInfo={queryInfo}
                    onSubmitForEdit={jest.fn()}
                    onSubmit={jest.fn()}
                />
            );

            const submitForEditButton = formWrapper.find('.test-loc-submit-for-edit-button');
            expect(submitForEditButton.props().disabled).toBe(true);
            const submitButton = formWrapper.find('.test-loc-submit-button');
            expect(submitButton.props().disabled).toBe(true);
        });
    });

    test("don't allow canSubmitNotDirty", () => {
        return getQueryDetails(schemaQuery).then(queryInfo => {
            const formWrapper = shallow(
                <QueryInfoForm
                    includeCountField={false}
                    checkRequiredFields={false}
                    schemaQuery={schemaQuery}
                    queryInfo={queryInfo}
                    onSubmit={jest.fn()}
                    canSubmitNotDirty={false}
                />
            );

            const submitButton = formWrapper.find('.test-loc-submit-button');
            expect(submitButton.props().disabled).toBe(true);
        });
    });

    test('customize column filter', () => {
        const filter = col => {
            return col.name === 'extraTestColumn';
        };

        return getQueryDetails(schemaQuery).then(queryInfo => {
            const formWrapper = mount(
                <QueryInfoForm
                    schemaQuery={schemaQuery}
                    queryInfo={queryInfo}
                    columnFilter={filter}
                    onSubmit={jest.fn()}
                />
            );

            expect(formWrapper.find(TextInput)).toHaveLength(1);
            formWrapper.unmount();
        });
    });

    test('skip required check', () => {
        return getQueryDetails(schemaQuery).then(queryInfo => {
            const formWrapper = mount(
                <QueryInfoForm
                    schemaQuery={schemaQuery}
                    queryInfo={queryInfo}
                    checkRequiredFields={false}
                    onSubmit={jest.fn()}
                />
            );

            expect(formWrapper.text()).toContain('Extra Test Column Cancel');
            formWrapper.unmount();
        });
    });

    test('skip required check but show asterisk on label', () => {
        return getQueryDetails(schemaQuery).then(queryInfo => {
            const formWrapper = mount(
                <QueryInfoForm
                    schemaQuery={schemaQuery}
                    queryInfo={queryInfo}
                    checkRequiredFields={false}
                    showLabelAsterisk={true}
                    onSubmit={jest.fn()}
                />
            );

            expect(formWrapper.text()).toContain('Extra Test Column  *');
            formWrapper.unmount();
        });
    });

    test('all fields disabled', () => {
        return getQueryDetails(schemaQuery).then(queryInfo => {
            const formWrapper = mount(
                <QueryInfoForm
                    schemaQuery={schemaQuery}
                    queryInfo={queryInfo}
                    initiallyDisableFields={true}
                    onSubmit={jest.fn()}
                />
            );
            expect(formWrapper.find('Button[type="submit"]').prop('disabled')).toBeTruthy();
            formWrapper.unmount();
        });
    });
});
