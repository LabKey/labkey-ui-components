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
import Formsy from 'formsy-react';
import { List } from 'immutable';

import { mount } from 'enzyme';

import { initUnitTestMocks } from '../../testHelperMocks';

import { getQueryDetails, QueryColumn, SchemaQuery } from '../../..';

import { QueryFormInputs } from './QueryFormInputs';
import { TextInput } from './input/TextInput';
import { CheckboxInput } from './input/CheckboxInput';
import { FileInput } from './input/FileInput';
import { SelectInput } from './input/SelectInput';

import { DatePickerInput } from './input/DatePickerInput';
import { FieldLabel } from './FieldLabel';

beforeAll(() => {
    initUnitTestMocks();
});

const SCHEMA_QUERY = new SchemaQuery({
    schemaName: 'assay.General.GPAT 1',
    queryName: 'Data',
});

describe('QueryFormInputs', () => {
    test('default properties with queryInfo', () => {
        return getQueryDetails(SCHEMA_QUERY).then(queryInfo => {
            const formWrapper = mount(
                <Formsy>
                    <QueryFormInputs queryInfo={queryInfo} />
                </Formsy>
            );

            expect(formWrapper.find('input').findWhere(input => input.prop('disabled'))).toHaveLength(0);
            expect(formWrapper.find(TextInput)).toHaveLength(4);
            expect(formWrapper.find(DatePickerInput)).toHaveLength(1);
            expect(formWrapper.find(CheckboxInput)).toHaveLength(1);
            expect(formWrapper.find(SelectInput)).toHaveLength(0);
            // default properties don't render file inputs
            expect(formWrapper.find(FileInput)).toHaveLength(0);

            // by default all inputs should render labels with FieldLabel
            expect(formWrapper.find(FieldLabel)).toHaveLength(7);

            formWrapper.unmount();
        });
    });

    test('renderFieldLabel', () => {
        return getQueryDetails(SCHEMA_QUERY).then(queryInfo => {
            const formWrapper = mount(
                <Formsy>
                    <QueryFormInputs
                        queryInfo={queryInfo}
                        renderFieldLabel={(queryColumn: QueryColumn) => {
                            return <div className="jest-field-label-test">{queryColumn.name}</div>;
                        }}
                    />
                </Formsy>
            );

            expect(formWrapper.find(FieldLabel)).toHaveLength(0);
            expect(formWrapper.find('.jest-field-label-test')).toHaveLength(7);

            formWrapper.unmount();
        });
    });

    test('render file inputs', () => {
        return getQueryDetails(SCHEMA_QUERY).then(queryInfo => {
            const formWrapper = mount(
                <Formsy>
                    <QueryFormInputs renderFileInputs={true} queryInfo={queryInfo} />
                </Formsy>
            );

            expect(formWrapper.find(FileInput)).toHaveLength(1);

            formWrapper.unmount();
        });
    });

    test('custom columnFilter', () => {
        const filter = col => {
            return col.name === 'Healthy';
        };

        return getQueryDetails(SCHEMA_QUERY).then(queryInfo => {
            const formWrapper = mount(
                <Formsy>
                    <QueryFormInputs columnFilter={filter} queryInfo={queryInfo} />
                </Formsy>
            );

            expect(formWrapper.find(CheckboxInput)).toHaveLength(1);
            expect(formWrapper.find(TextInput)).toHaveLength(0);

            formWrapper.unmount();
        });
    });

    test('disabledFields', () => {
        return getQueryDetails(SCHEMA_QUERY).then(queryInfo => {
            const formWrapper = mount(
                <Formsy>
                    <QueryFormInputs
                        queryInfo={queryInfo}
                        disabledFields={List<string>(['date', 'ParticipantID', 'textarea'])}
                    />
                </Formsy>
            );

            expect(formWrapper.find('input').findWhere(input => !input.prop('disabled'))).toHaveLength(5);
            expect(formWrapper.find('input').findWhere(input => input.prop('disabled'))).toHaveLength(1);

            formWrapper.unmount();
        });
    });
});
