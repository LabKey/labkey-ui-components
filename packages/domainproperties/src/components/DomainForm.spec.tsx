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


import * as React from "react";
import {DomainDesign} from "../models";
import DomainForm from "./DomainForm";
import {
    ATTACHMENT_RANGE_URI,
    BOOLEAN_RANGE_URI,
    DATETIME_RANGE_URI,
    DOMAIN_FIELD_DELETE,
    DOMAIN_FIELD_EXPAND,
    DOMAIN_FIELD_NAME,
    DOMAIN_FIELD_TYPE,
    DOUBLE_RANGE_URI,
    FILELINK_RANGE_URI,
    FLAG_CONCEPT_URI,
    INT_RANGE_URI,
    MULTILINE_RANGE_URI,
    PARTICIPANTID_CONCEPT_URI,
    STRING_RANGE_URI
} from "../constants";
import {mount} from "enzyme";
import {clearFieldDetails, createFormInputId, updateDomainField} from "../actions/actions";
import toJson from "enzyme-to-json";

describe('DomainForm', () => {

    test('with empty domain form', () => {
        const domain = DomainDesign.create({});
        const form  = mount(<DomainForm
            domain={domain}
            helpNoun='domain'
            helpURL='https://www.labkey.org/Documentation/wiki-page.view?name=propertyFields'
            showHeader={true}
            initCollapsed={false}
            onChange={jest.fn()}
        />);

        expect(toJson(form)).toMatchSnapshot();
        form.unmount();
    });

    test('domain form with no fields', () => {
        const domain = DomainDesign.create({
            name: "no fields",
            description: 'no field description',
            domainURI: 'test',
            domainId: 1,
            fields: [],
            indices: []
        });
        const form  = mount(<DomainForm
            domain={domain}
            helpNoun='domain'
            helpURL='https://www.labkey.org/Documentation/wiki-page.view?name=propertyFields'
            showHeader={true}
            initCollapsed={false}
            onChange={jest.fn()}
        />);

        expect(toJson(form)).toMatchSnapshot();
        form.unmount();
    });

    test('domain form with all field types', () => {

        let fields = [];
        fields.push({
            name: 'key',
            rangeURI: INT_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test'
        });
        fields.push({
            name: 'string',
            rangeURI: STRING_RANGE_URI,
            propertyId: 2,
            propertyURI: 'test'
        });
        fields.push({
            name: 'multiline',
            rangeURI: MULTILINE_RANGE_URI,
            propertyId: 3,
            propertyURI: 'test'
        });
        fields.push({
            name: 'boolean',
            rangeURI: BOOLEAN_RANGE_URI,
            propertyId: 4,
            propertyURI: 'test'
        });
        fields.push({
            name: 'double',
            rangeURI: DOUBLE_RANGE_URI,
            propertyId: 5,
            propertyURI: 'test'
        });
        fields.push({
            name: 'datetime',
            rangeURI: DATETIME_RANGE_URI,
            propertyId: 6,
            propertyURI: 'test'
        });
        fields.push({
            name: 'flag',
            rangeURI: STRING_RANGE_URI,
            conceptURI: FLAG_CONCEPT_URI,
            propertyId: 7,
            propertyURI: 'test'
        });
        fields.push({
            name: 'file link',
            rangeURI: FILELINK_RANGE_URI,
            propertyId: 8,
            propertyURI: 'test'
        });
        fields.push({
            name: 'participant id',
            rangeURI: STRING_RANGE_URI,
            conceptURI: PARTICIPANTID_CONCEPT_URI,
            propertyId: 9,
            propertyURI: 'test'
        });
        fields.push({
            name: 'attachment',
            rangeURI: ATTACHMENT_RANGE_URI,
            propertyId: 10,
            propertyURI: 'test'
        });

        const domain = DomainDesign.create({
            name: "all field types",
            description: 'description',
            domainURI: 'test',
            domainId: 1,
            fields: fields,
            indices: []
        });
        const form  = mount(<DomainForm
            domain={domain}
            helpNoun='domain'
            helpURL='https://www.labkey.org/Documentation/wiki-page.view?name=propertyFields'
            showHeader={true}
            initCollapsed={false}
            onChange={jest.fn()}
        />);

        expect(toJson(form)).toMatchSnapshot();
        form.unmount();
    });

    test('domain form with updated fields', () => {
        let fields = [];
        fields.push({
            name: 'fieldname',
            rangeURI: INT_RANGE_URI,
            propertyId: 0,
            propertyURI: 'test'
        });
        fields.push({
            name: 'string changed to boolean',
            rangeURI: STRING_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test'
        });
        fields.push({
            name: 'int changed to participant',
            rangeURI: INT_RANGE_URI,
            propertyId: 2,
            propertyURI: 'test'
        });
        fields.push({
            name: 'flag changed to attachment',
            rangeURI: STRING_RANGE_URI,
            conceptURI: FLAG_CONCEPT_URI,
            propertyId: 3,
            propertyURI: 'test'
        });

        let domain = DomainDesign.create({
            name: "update field types",
            description: 'description',
            domainURI: 'test',
            domainId: 1,
            fields: fields,
            indices:[]
        });

        domain = updateDomainField(domain, {id: createFormInputId(DOMAIN_FIELD_NAME, 0), value: "newfieldname"});
        domain = updateDomainField(domain, {id: createFormInputId(DOMAIN_FIELD_TYPE, 1), value: "boolean"});
        domain = updateDomainField(domain, {id: createFormInputId(DOMAIN_FIELD_TYPE, 2), value: "ParticipantId"});
        domain = updateDomainField(domain, {id: createFormInputId(DOMAIN_FIELD_TYPE, 3), value: "attachment"});

        const form = mount(<DomainForm
            domain={domain}
            helpNoun='domain'
            helpURL='https://www.labkey.org/Documentation/wiki-page.view?name=propertyFields'
            showHeader={true}
            initCollapsed={false}
            onChange={jest.fn()} />);

        expect(toJson(form)).toMatchSnapshot();
        form.unmount();
    });

    test('domain form updated field, cleared details', () => {
        let fields = [];
        fields.push({
            name: 'fieldname',
            rangeURI: INT_RANGE_URI,
            propertyId: 0,
            propertyURI: 'test'
        });

        let domain = DomainDesign.create({
            name: "update field types",
            description: 'description',
            domainURI: 'test',
            domainId: 1,
            fields: fields,
            indices: [],
            key: 1
        });

        domain = updateDomainField(domain, {id: createFormInputId(DOMAIN_FIELD_NAME, 0), value: "newfieldname"});
        domain = clearFieldDetails(domain);

        const form = mount(<DomainForm
            domain={domain}
            helpNoun='domain'
            helpURL='https://www.labkey.org/Documentation/wiki-page.view?name=propertyFields'
            showHeader={true}
            initCollapsed={false}
            key='domainForm'
            onChange={jest.fn()} />);

        expect(toJson(form)).toMatchSnapshot();
        form.unmount();
    });

    test('domain form add, expand, and delete field', () => {
        let fields = [{
            name: 'fieldname',
            rangeURI: INT_RANGE_URI,
            propertyId: 0,
            propertyURI: 'test'
        }];

        const domain = DomainDesign.create({
            name: "Add/remove field",
            description: 'Add field description',
            domainURI: 'test',
            domainId: 1,
            fields: fields,
            indices: []
        });

        let updatedDomain;
        const changeHandler = (newDomain, dirty) => {
            updatedDomain = newDomain.merge({
                name: 'updated'
            }) as DomainDesign;
        };

        const form  = mount(<DomainForm
            domain={domain}
            helpNoun='domain'
            helpURL='https://www.labkey.org/Documentation/wiki-page.view?name=propertyFields'
            showHeader={true}
            initCollapsed={false}
            onChange={changeHandler}

        />);

        // Add new row
        let findButton = form.find({className: 'domain-form-add'});
        expect(findButton.length).toEqual(1);
        findButton.simulate('click');

        // Update state.  This is controlled outside glass component so set it here.
        form.setProps({domain: updatedDomain, onChange: changeHandler});

        // Check new row is added
        let expandButton = form.find({id: createFormInputId(DOMAIN_FIELD_EXPAND, 1)});
        expect(expandButton.length).toEqual(1);

        // Expand first row
        expandButton = form.find({id: createFormInputId(DOMAIN_FIELD_EXPAND, 0)});
        expect(expandButton.length).toEqual(1);
        expandButton.simulate('click');

        // Delete first row
        let deleteButton = form.find({id: createFormInputId(DOMAIN_FIELD_DELETE, 0), type: "button"});
        expect(deleteButton.length).toEqual(1);
        deleteButton.simulate('click');
        let confirmButton = form.find('.btn-danger[children="Yes"]');
        confirmButton.simulate('click');

        // Update state.  This is controlled outside glass component so set it here.
        form.setProps({domain: updatedDomain, onChange: changeHandler});

        // Ensure only one row and expand it
        expandButton = form.find({id: createFormInputId(DOMAIN_FIELD_EXPAND, 1)});
        expect(expandButton.length).toEqual(0);
        expandButton = form.find({id: createFormInputId(DOMAIN_FIELD_EXPAND, 0)});
        expect(expandButton.length).toEqual(1);
        expandButton.simulate('click');
        
        expect(toJson(form)).toMatchSnapshot();
        form.unmount();

    });

});

