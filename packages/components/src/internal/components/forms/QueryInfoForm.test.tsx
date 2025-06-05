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
import { render } from '@testing-library/react';

import { makeQueryInfo } from '../../test/testHelpers';
import mixturesQueryInfo from '../../../test/data/mixtures-getQueryDetails.json';

import { getUpdatedFields, QueryInfoForm } from './QueryInfoForm';

const MIXTURE_QUERY_INFO = makeQueryInfo(mixturesQueryInfo);

describe('QueryInfoForm', () => {
    test('default props', () => {
        render(<QueryInfoForm queryInfo={MIXTURE_QUERY_INFO} onHide={jest.fn()} onSubmit={jest.fn()} />);

        expect(document.querySelectorAll('.form-group.row')).toHaveLength(8);
        expect(document.querySelectorAll('button')).toHaveLength(2);
    });

    test('with header', () => {
        const header = <span className="header-info">Header info here</span>;
        render(<QueryInfoForm header={header} queryInfo={MIXTURE_QUERY_INFO} onSubmit={jest.fn()} />);

        expect(document.querySelectorAll('.header-info')).toHaveLength(1);
    });

    test('as modal', () => {
        render(<QueryInfoForm asModal queryInfo={MIXTURE_QUERY_INFO} onSubmit={jest.fn()} />);

        expect(document.querySelectorAll('.form-modal')).toHaveLength(1);
    });

    test('as modal with title', () => {
        render(<QueryInfoForm asModal title="Test modal title" queryInfo={MIXTURE_QUERY_INFO} onSubmit={jest.fn()} />);

        const modals = document.querySelectorAll('.form-modal');
        expect(modals).toHaveLength(1);
        expect(modals[0].querySelector('.modal-title')).toHaveTextContent('Test modal title');
    });

    test("don't include count field", () => {
        render(<QueryInfoForm includeCountField={false} queryInfo={MIXTURE_QUERY_INFO} onSubmit={jest.fn()} />);

        expect(document.querySelectorAll('input#numItems')).toHaveLength(0);
    });

    test('custom text', () => {
        const cancelText = 'custom cancel text';
        const countText = 'custom count text';
        const submitText = 'custom submit text';
        render(
            <QueryInfoForm
                cancelText={cancelText}
                countText={countText}
                submitText={submitText}
                queryInfo={MIXTURE_QUERY_INFO}
                onHide={jest.fn()}
                onSubmit={jest.fn()}
            />
        );

        const cancelButton = document.querySelector('.test-loc-cancel-button');
        expect(cancelButton).toHaveTextContent(cancelText);
        const submitButton = document.querySelector('.test-loc-submit-button');
        expect(submitButton).toHaveTextContent(submitText);
        const inputs = document.querySelectorAll('.form-group.row');
        const quantityInput = inputs[0];
        expect(quantityInput.querySelector('label')).toHaveTextContent(countText + ' *');
    });

    test('with footer', () => {
        const footer = <span className="footer-info">Footer info here</span>;
        render(<QueryInfoForm footer={footer} queryInfo={MIXTURE_QUERY_INFO} onSubmit={jest.fn()} />);

        expect(document.querySelectorAll('.footer-info')).toHaveLength(1);
    });

    test('with only submitForEdit', () => {
        const submitForEditText = 'Test Submit for Edit';
        render(
            <QueryInfoForm
                includeCountField={false}
                checkRequiredFields={false}
                queryInfo={MIXTURE_QUERY_INFO}
                submitForEditText={submitForEditText}
                onSubmitForEdit={jest.fn()}
            />
        );

        const submitForEditButton = document.querySelector('.test-loc-submit-for-edit-button');
        expect(submitForEditButton).toHaveTextContent(submitForEditText);
        expect(submitForEditButton).not.toBeDisabled();
    });

    test('with submitForEdit and submit enabled', () => {
        render(
            <QueryInfoForm
                includeCountField={false}
                checkRequiredFields={false}
                queryInfo={MIXTURE_QUERY_INFO}
                onSubmitForEdit={jest.fn()}
                onSubmit={jest.fn()}
            />
        );

        const submitForEditButton = document.querySelector('.test-loc-submit-for-edit-button');
        expect(submitForEditButton).not.toBeDisabled();
        const submitButton = document.querySelector('.test-loc-submit-button');
        expect(submitButton).not.toBeDisabled();
    });

    test('with submitForEdit and submit disabled', () => {
        render(
            <QueryInfoForm
                includeCountField
                queryInfo={MIXTURE_QUERY_INFO}
                onSubmitForEdit={jest.fn()}
                onSubmit={jest.fn()}
            />
        );

        const submitForEditButton = document.querySelector('.test-loc-submit-for-edit-button');
        expect(submitForEditButton).toBeDisabled();
        const submitButton = document.querySelector('.test-loc-submit-button');
        expect(submitButton).toBeDisabled();
    });

    test("don't allow canSubmitNotDirty", () => {
        render(
            <QueryInfoForm
                includeCountField={false}
                checkRequiredFields={false}
                queryInfo={MIXTURE_QUERY_INFO}
                onSubmit={jest.fn()}
                canSubmitNotDirty={false}
            />
        );

        const submitButton = document.querySelector('.test-loc-submit-button');
        expect(submitButton).toBeDisabled();
    });

    test('customize column filter', () => {
        const filter = jest.fn().mockImplementation(col => col.name === 'extraTestColumn');

        render(<QueryInfoForm queryInfo={MIXTURE_QUERY_INFO} columnFilter={filter} onSubmit={jest.fn()} />);

        expect(document.querySelectorAll('input[type="text"]')).toHaveLength(1);
    });

    test('skip required check', () => {
        render(
            <QueryInfoForm
                queryInfo={MIXTURE_QUERY_INFO}
                checkRequiredFields={false}
                onHide={jest.fn()}
                onSubmit={jest.fn()}
            />
        );

        expect(document.querySelector('body')).toHaveTextContent('Extra Test Column Cancel');
    });

    test('skip required check but show asterisk on label', () => {
        render(
            <QueryInfoForm
                queryInfo={MIXTURE_QUERY_INFO}
                checkRequiredFields={false}
                showLabelAsterisk
                onSubmit={jest.fn()}
            />
        );

        expect(document.querySelector('body')).toHaveTextContent('Extra Test Column *');
    });

    test('all fields disabled', () => {
        render(<QueryInfoForm queryInfo={MIXTURE_QUERY_INFO} initiallyDisableFields onSubmit={jest.fn()} />);

        expect(document.querySelector('button[type="submit"]')).toBeDisabled();
    });
});

describe('getUpdatedFields', () => {
    const formData = {
        expirationTime: '22:20:00.000',
        extraTestColumn: 'abc ',
        numItems: 10,
    };

    test('without ::enabled', () => {
        expect(getUpdatedFields(MIXTURE_QUERY_INFO, formData).toJS()).toEqual({
            expirationTime: '22:20:00.000',
            extraTestColumn: 'abc'
        });
    });

    test('without ::enabled, with additionalFields', () => {
        expect(getUpdatedFields(MIXTURE_QUERY_INFO, formData, ['numItems']).toJS()).toEqual({
            expirationTime: '22:20:00.000',
            extraTestColumn: 'abc',
            numItems: 10
        });
    });

    test('with ::enabled=false', () => {
        expect(getUpdatedFields(MIXTURE_QUERY_INFO, {
            ...formData,
            'extraTestColumn::enabled': false
        }).toJS()).toEqual({
            expirationTime: '22:20:00.000',
        });
    });

    test('with ::enabled=false, with additionalFields', () => {
        expect(getUpdatedFields(MIXTURE_QUERY_INFO, {
            ...formData,
            'extraTestColumn::enabled': false
        }, ['numItems', 'extraTestColumn']).toJS()).toEqual({
            expirationTime: '22:20:00.000',
            extraTestColumn: 'abc',
            numItems: 10
        });
    });
});
