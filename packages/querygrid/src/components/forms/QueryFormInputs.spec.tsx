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
import * as React from 'react';
import Formsy from 'formsy-react'
import { SchemaQuery } from "@glass/base";
import assayQueryInfo from "../../test/data/gpatAssay-getQueryDetails.json";
import { QueryFormInputs } from "./QueryFormInputs";
import { getQueryDetails, initQueryGridState } from "../..";
import mock, { proxy } from "xhr-mock";
import { mount } from "enzyme";
import { TextInput } from "./input/TextInput";
import { DateInput } from "./input/DateInput";
import { CheckboxInput } from "./input/CheckboxInput";
import { FileInput } from "./input/FileInput";
import { SelectInput } from "./input/SelectInput";

beforeAll(() => {
    initQueryGridState();

    mock.setup();

    mock.get(/.*\/query\/getQueryDetails.*/, {
        status: 200,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(assayQueryInfo)
    });

    mock.use(proxy);

    LABKEY.container = {
        formats: {
            dateFormat: "yyyy-MM-dd",
            dateTimeFormat: "yyyy-MM-dd HH:mm",
            numberFormat: null
        }
    }
});

describe("QueryFormInputs", () => {
    test("default properties with queryInfo", () => {

        const schemaQuery = new SchemaQuery({
            schemaName: "schema",
            queryName: "q-snapshot"
        });
        return getQueryDetails(schemaQuery).then((queryInfo) => {
            const formWrapper = mount(
                <Formsy>
                    <QueryFormInputs queryInfo = {queryInfo}/>
                </Formsy>);
            expect(formWrapper.find(TextInput)).toHaveLength(4);
            expect(formWrapper.find(DateInput)).toHaveLength(1);
            expect(formWrapper.find(CheckboxInput)).toHaveLength(1);
            expect(formWrapper.find(SelectInput)).toHaveLength(1);
            // default properties don't render file inputs
            expect(formWrapper.find(FileInput)).toHaveLength(0);

            formWrapper.unmount();
        });
    });

    test("render file inputs", () => {
        const schemaQuery = new SchemaQuery({
            schemaName: "schema",
            queryName: "q-snapshot"
        });
        return getQueryDetails(schemaQuery).then((queryInfo) => {
            const formWrapper = mount(
                <Formsy>
                    <QueryFormInputs renderFileInputs={true} queryInfo={queryInfo}/>
                </Formsy>);

            expect(formWrapper.find(FileInput)).toHaveLength(1);

            formWrapper.unmount();
        });
    });

    test("custom columnFilter", () => {
        const schemaQuery = new SchemaQuery({
            schemaName: "schema",
            queryName: "q-snapshot"
        });
        const filter = (col) => {
            return col.name === "Healthy";
        };
        return getQueryDetails(schemaQuery).then((queryInfo) => {
            const formWrapper = mount(
                <Formsy>
                    <QueryFormInputs columnFilter={filter} queryInfo={queryInfo}/>
                </Formsy>);

            expect(formWrapper.find(CheckboxInput)).toHaveLength(1);
            expect(formWrapper.find(TextInput)).toHaveLength(0);

            formWrapper.unmount();
        });

    });

});