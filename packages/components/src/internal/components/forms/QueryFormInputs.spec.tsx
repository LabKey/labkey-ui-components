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

import { makeQueryInfo } from '../../test/testHelpers';
import assayGpatDataQueryInfo from '../../../test/data/assayGpatData-getQueryDetails.json';
import { QueryColumn } from '../../../public/QueryColumn';

import { QueryFormInputs } from './QueryFormInputs';
import { TextInput } from './input/TextInput';
import { CheckboxInput } from './input/CheckboxInput';
import { FileInput } from './input/FileInput';
import { SelectInput } from './input/SelectInput';
import { DatePickerInput } from './input/DatePickerInput';
import { TextChoiceInput } from './input/TextChoiceInput';
import { FieldLabel } from './FieldLabel';

const QUERY_INFO = makeQueryInfo(assayGpatDataQueryInfo);

describe('QueryFormInputs', () => {
    test('default properties with queryInfo', () => {
        const formWrapper = mount(
            <Formsy>
                <QueryFormInputs queryInfo={QUERY_INFO} />
            </Formsy>
        );

        expect(formWrapper.find('input').findWhere(input => input.prop('disabled'))).toHaveLength(0);
        expect(formWrapper.find(TextInput)).toHaveLength(3);
        expect(formWrapper.find(DatePickerInput)).toHaveLength(3); // datetime, date, time
        expect(formWrapper.find(CheckboxInput)).toHaveLength(1);
        expect(formWrapper.find(TextChoiceInput)).toHaveLength(1);
        expect(formWrapper.find(SelectInput)).toHaveLength(1); // this is from the TextChoiceInput
        // default properties don't render file inputs
        expect(formWrapper.find(FileInput)).toHaveLength(0);
        expect(formWrapper.find(FieldLabel)).toHaveLength(9);

        formWrapper.unmount();
    });

    test('renderFieldLabel', () => {
        const formWrapper = mount(
            <Formsy>
                <QueryFormInputs
                    queryInfo={QUERY_INFO}
                    renderFieldLabel={(queryColumn: QueryColumn, label: string) => {
                        return <div className="jest-field-label-test">{queryColumn?.name || label}</div>;
                    }}
                />
            </Formsy>
        );

        expect(formWrapper.find(FieldLabel)).toHaveLength(0);
        expect(formWrapper.find('.jest-field-label-test')).toHaveLength(9);

        formWrapper.unmount();
    });

    test('render file inputs', () => {
        const formWrapper = mount(
            <Formsy>
                <QueryFormInputs renderFileInputs={true} queryInfo={QUERY_INFO} />
            </Formsy>
        );

        expect(formWrapper.find(FileInput)).toHaveLength(1);

        formWrapper.unmount();
    });

    test('custom columnFilter', () => {
        const filter = col => {
            return col.name === 'Healthy';
        };

        const formWrapper = mount(
            <Formsy>
                <QueryFormInputs columnFilter={filter} queryInfo={QUERY_INFO} />
            </Formsy>
        );

        expect(formWrapper.find(CheckboxInput)).toHaveLength(1);
        expect(formWrapper.find(TextInput)).toHaveLength(0);

        formWrapper.unmount();
    });

    test('disabledFields', () => {
        const formWrapper = mount(
            <Formsy>
                <QueryFormInputs
                    queryInfo={QUERY_INFO}
                    disabledFields={List<string>(['date', 'ParticipantID', 'textarea'])}
                />
            </Formsy>
        );

        expect(formWrapper.find('input').findWhere(input => !input.prop('disabled'))).toHaveLength(8);
        expect(formWrapper.find('input').findWhere(input => input.prop('disabled'))).toHaveLength(1);

        formWrapper.unmount();
    });
});
