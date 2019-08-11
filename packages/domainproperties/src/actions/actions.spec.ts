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
import { createFormInputId, getBannerMessages, updateDomainException } from "./actions";
import {DomainDesign, DomainException, DomainField} from "../models";
import {
    DOMAIN_FIELD_PREFIX,
    FLAG_CONCEPT_URI,
    INT_RANGE_URI,
    SEVERITY_LEVEL_ERROR, SEVERITY_LEVEL_WARN,
    STRING_RANGE_URI,
    USER_RANGE_URI
} from "../constants";
import {mount} from "enzyme";
import toJson from "enzyme-to-json";
import * as React from "react";

describe("domain properties actions", () => {

    test("test create id", () => {
        return expect(createFormInputId("marty", 100)).toBe(DOMAIN_FIELD_PREFIX + "-marty-100");
    });

    test("test get field type", () => {
        const field1 = DomainField.create({
            name: 'field1name',
            rangeURI: INT_RANGE_URI,
            propertyId: 0,
            propertyURI: 'test'
        });
        expect(field1.dataType.rangeURI).toBe(INT_RANGE_URI);

        const field2 = DomainField.create({
            name: 'field2name',
            rangeURI: STRING_RANGE_URI,
            conceptURI: FLAG_CONCEPT_URI,
            propertyId: 0,
            propertyURI: 'test'
        });
        expect(field2.dataType.name).toBe('flag');

        const field3 = DomainField.create({
            name: 'field3name',
            rangeURI: USER_RANGE_URI,
            propertyId: 0,
            propertyURI: 'test'
        });
        expect(field3.dataType.name).toBe('users');
    });

    test('server side error on the banner', () => {

        let fields = [];
        fields.push({
            name: 'column1',
            rangeURI: INT_RANGE_URI,
            propertyId: 1, //simulate existing field
            propertyURI: 'test'
        });

        fields.push({
            name: 'column1',
            rangeURI: INT_RANGE_URI,
            propertyId: undefined, //new field with duplicate column name
            propertyURI: 'test'
        });

        let message = "The field name 'column1' is already taken. Please provide a unique name for each field.";
        let fieldName = 'column1';
        let severity = SEVERITY_LEVEL_ERROR;
        let domainFieldError = [];
        domainFieldError.push({message, fieldName, propertyId: undefined, severity});
        let domainException = new DomainException({exception: message, success: false, severity, errors: domainFieldError});

        let domain = DomainDesign.create({
            name: "CancerCuringStudy",
            schemaName : 'Study',
            queryName : 'CancerCuringStudy',
            description: 'description',
            domainURI: 'test',
            domainId: 123,
            fields: fields,
            indices: []
        }, domainException);

        expect(domain.domainException.errors.get(0).message).toBe(message);
        expect(getBannerMessages(domain).get(0).message).toBe(message);

        fields.push({
            name: 'modified',//reserved field
            rangeURI: INT_RANGE_URI,
            propertyId: undefined,
            propertyURI: 'test'
        });

        let multipleErrorMsg = "Multiple fields contain issues that need to be fixed. Review the red highlighted fields below for more information.";

        message = "'modified' is a reserved field name in 'CancerCuringStudy'";
        fieldName = 'modified';
        domainFieldError.push({message, fieldName, propertyId: undefined, severity});
        domainException = new DomainException({exception: message, success: false, severity, errors: domainFieldError});

        domain = DomainDesign.create({
            name: "CancerCuringStudy",
            schemaName : 'Study',
            queryName : 'CancerCuringStudy',
            description: 'description',
            domainURI: 'test',
            domainId: 123,
            fields: fields,
            indices: []
        }, domainException);

        expect(getBannerMessages(domain).get(0).message).toBe(multipleErrorMsg);
    });

    test('client side warning on the banner', () => {

        let fields = [];
        fields.push({
            name: '#column#',
            rangeURI: INT_RANGE_URI,
            propertyId: undefined,
            propertyURI: 'test'
        });

        let fieldName = '#column#';
        let message = "SQL queries, R scripts, and other code are easiest to write when field names only contain combination of letters, numbers, and underscores, and start with a letter or underscore.";
        let severity = SEVERITY_LEVEL_WARN;
        let domainFieldError = [];
        domainFieldError.push({message, fieldName, propertyId: undefined, severity});

        let domain = DomainDesign.create({
            name: "CancerCuringStudy",
            description: 'description',
            domainURI: 'test',
            domainId: 123,
            fields: fields,
            indices: []
        }, undefined);

        let updatedDomain = updateDomainException(domain, 0, domainFieldError);
        expect(updatedDomain.domainException.get('errors').get(0)[0].message).toBe(message);
    });
});