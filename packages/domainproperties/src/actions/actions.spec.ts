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
import { createFormInputId } from "./actions";
import {DomainField} from "../models";
import {DOMAIN_FIELD_PREFIX, FLAG_CONCEPT_URI, INT_RANGE_URI, STRING_RANGE_URI, USER_RANGE_URI} from "../constants";

describe("domain properties actions", () => {

    test("test create id", () => {
        return expect(createFormInputId("marty", 100)).toBe(DOMAIN_FIELD_PREFIX + "-marty-100");
    });

    test("test get field type", () => {
        const field1 = new DomainField({
            name: 'field1name',
            rangeURI: INT_RANGE_URI,
            propertyId: 0,
            propertyURI: 'test'
        });
        expect(field1.getDataType().rangeURI).toBe(INT_RANGE_URI);

        const field2 = new DomainField({
            name: 'field2name',
            rangeURI: STRING_RANGE_URI,
            conceptURI: FLAG_CONCEPT_URI,
            propertyId: 0,
            propertyURI: 'test'
        });
        expect(field2.getDataType().name).toBe('flag');

        const field3 = new DomainField({
            name: 'field3name',
            rangeURI: USER_RANGE_URI,
            propertyId: 0,
            propertyURI: 'test'
        });
        expect(field3.getDataType().name).toBe('users');
    });
});