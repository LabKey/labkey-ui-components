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
import React, { act } from 'react';
import { render } from '@testing-library/react';

import { makeQueryInfo } from '../../test/testHelpers';
import mixturesQueryInfo from '../../../test/data/mixtures-getQueryDetails.json';

import { QueryInfoForm } from './QueryInfoForm';

const QUERY_INFO = makeQueryInfo(mixturesQueryInfo);

describe('QueryInfoForm', () => {
    test('default props', () => {
        let container;
        act(() => {
            container = render(<QueryInfoForm queryInfo={QUERY_INFO} onHide={jest.fn()} onSubmit={jest.fn()} />);
        });
        expect(document.querySelectorAll('.form-group.row')).toHaveLength(8);
        expect(document.querySelectorAll('button')).toHaveLength(2);
    });

    test('with header', () => {
        const header = <span className="header-info">Header info here</span>;
        act(() => {
            render(<QueryInfoForm header={header} queryInfo={QUERY_INFO} onSubmit={jest.fn()} />);
        });
        expect(document.querySelectorAll('.header-info')).toHaveLength(1);
    });

    test('as modal', () => {
        act(() => {
            render(<QueryInfoForm asModal={true} queryInfo={QUERY_INFO} onSubmit={jest.fn()} />);
        });
        expect(document.querySelectorAll('.form-modal')).toHaveLength(1);
    });

    test('as modal with title', () => {
        act(() => {
            render(<QueryInfoForm asModal={true} title="Test modal title" queryInfo={QUERY_INFO} onSubmit={jest.fn()} />);
        });
        expect(document.querySelectorAll('.form-modal')).toHaveLength(1);
        const modal = document.querySelector('.form-modal');
        expect(modal.querySelector('.modal-title').textContent).toBe('Test modal title');
    });

    test("don't include count field", () => {
        act(() => {
            render(<QueryInfoForm includeCountField={false} queryInfo={QUERY_INFO} onSubmit={jest.fn()} />);
        });
        expect(document.querySelectorAll('input#numItems')).toHaveLength(0);
    });

    test('custom text', () => {
        const cancelText = 'custom cancel text';
        const countText = 'custom count text';
        const submitText = 'custom submit text';
        let container;
        act(() => {
            container = render(
                <QueryInfoForm
                    cancelText={cancelText}
                    countText={countText}
                    submitText={submitText}
                    queryInfo={QUERY_INFO}
                    onHide={jest.fn()}
                    onSubmit={jest.fn()}
                />
            );
        });

        const cancelButton = document.querySelector('.test-loc-cancel-button');
        expect(cancelButton.textContent).toBe(cancelText);
        const submitButton = document.querySelector('.test-loc-submit-button');
        expect(submitButton.textContent).toBe(submitText);
        const inputs = document.querySelectorAll('.form-group.row');
        const quantityInput = inputs[0];
        expect(quantityInput.querySelector('label').textContent).toBe(countText + " *");
    });

    test('with footer', () => {
        const footer = <span className="footer-info">Footer info here</span>;
        act(() => {
            render(<QueryInfoForm footer={footer} queryInfo={QUERY_INFO} onSubmit={jest.fn()} />);
        });
        expect(document.querySelectorAll('.footer-info')).toHaveLength(1);
    });

    test('with only submitForEdit', () => {
        const submitForEditText = 'Test Submit for Edit';
        act(() => {
            render(
                <QueryInfoForm
                    includeCountField={false}
                    checkRequiredFields={false}
                    queryInfo={QUERY_INFO}
                    submitForEditText={submitForEditText}
                    onSubmitForEdit={jest.fn()}
                />
            );
        });

        const submitForEditButton = document.querySelector('.test-loc-submit-for-edit-button');
        expect(submitForEditButton.textContent).toBe(submitForEditText);
        expect(submitForEditButton.hasAttribute('disabled')).toBeFalsy();
    });

    test('with submitForEdit and submit enabled', () => {
        act(() => {
            render(
                <QueryInfoForm
                    includeCountField={false}
                    checkRequiredFields={false}
                    queryInfo={QUERY_INFO}
                    onSubmitForEdit={jest.fn()}
                    onSubmit={jest.fn()}
                />
            );
        });

        const submitForEditButton = document.querySelector('.test-loc-submit-for-edit-button');
        expect(submitForEditButton.hasAttribute('disabled')).toBeFalsy()
        const submitButton = document.querySelector('.test-loc-submit-button');
        expect(submitButton.hasAttribute('disabled')).toBeFalsy();
    });

    test('with submitForEdit and submit disabled', () => {
        act(() => {
            render(
                <QueryInfoForm
                    includeCountField={true}
                    queryInfo={QUERY_INFO}
                    onSubmitForEdit={jest.fn()}
                    onSubmit={jest.fn()}
                />
            );
        });

        const submitForEditButton = document.querySelector('.test-loc-submit-for-edit-button');
        expect(submitForEditButton.hasAttribute('disabled')).toBeTruthy();
        const submitButton = document.querySelector('.test-loc-submit-button');
        expect(submitButton.hasAttribute('disabled')).toBeTruthy();
    });

    test("don't allow canSubmitNotDirty", () => {
        act(() => {
            render(
                <QueryInfoForm
                    includeCountField={false}
                    checkRequiredFields={false}
                    queryInfo={QUERY_INFO}
                    onSubmit={jest.fn()}
                    canSubmitNotDirty={false}
                />
            );
        });

        const submitButton = document.querySelector('.test-loc-submit-button');
        expect(submitButton.hasAttribute('disabled')).toBeTruthy();
    });

    test('customize column filter', () => {
        const filter = col => {
            return col.name === 'extraTestColumn';
        };

        act(() => {
            render(
                <QueryInfoForm queryInfo={QUERY_INFO} columnFilter={filter} onSubmit={jest.fn()} />
            );
        });

        expect(document.querySelectorAll('input[type="text"]')).toHaveLength(1);
    });

    test('skip required check', () => {
        act(() => {
            render(
                <QueryInfoForm queryInfo={QUERY_INFO} checkRequiredFields={false} onHide={jest.fn()} onSubmit={jest.fn()} />
            );
        });

        expect(document.querySelector('body').textContent).toContain('Extra Test Column Cancel');
    });

    test('skip required check but show asterisk on label', () => {
        act(() => {
            render(
                <QueryInfoForm
                    queryInfo={QUERY_INFO}
                    checkRequiredFields={false}
                    showLabelAsterisk={true}
                    onSubmit={jest.fn()}
                />
            );
        });

        expect(document.querySelector('body').textContent).toContain('Extra Test Column *');
    });

    test('all fields disabled', () => {
        act(() => {
            render(
                <QueryInfoForm queryInfo={QUERY_INFO} initiallyDisableFields={true} onSubmit={jest.fn()} />
            );
        });
        expect(document.querySelector('button[type="submit"]').hasAttribute('disabled')).toBeTruthy();
    });
});
