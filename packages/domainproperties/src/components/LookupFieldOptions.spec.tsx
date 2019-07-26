import {mount} from "enzyme";
import {createFormInputId} from "../actions/actions";
import {
    DOMAIN_FIELD_LOOKUP_CONTAINER, DOMAIN_FIELD_LOOKUP_QUERY,
    DOMAIN_FIELD_LOOKUP_SCHEMA,
    INT_RANGE_URI,
} from "../constants";
import * as React from "react";
import toJson from "enzyme-to-json";
import {DomainField} from "../models";
import {LookupFieldOptions} from "./LookupFieldOptions";
import {MockLookupProvider} from "../test/components/Lookup";


describe('LookupFieldOptions', () => {

    const waitForLoad = jest.fn((field) => {
        return Promise.resolve(!field.state().loading);
    });

    test('Lookup field options', () => {
        const _container = '/StudyVerifyProject/My Study';
        const _schema = 'exp';
        const _query = 'Data';
        const _label = 'Lookup Field Options';
        const _container0 = "StudyVerifyProject";
        const _container1 = "My Study";
        const _schema0 = "exp";
        const _schema2 = "study";
        const _queries1 = "DataInputs";

        const field = DomainField.create({
            name: 'key',
            rangeURI: INT_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test'
        });

        const lookupField  = mount(<MockLookupProvider><LookupFieldOptions
            lookupContainer={_container}
            lookupSchema={_schema}
            lookupQueryValue={_query}
            original={field}
            onChange={jest.fn()}
            index={1}
            label={_label}
        /></MockLookupProvider>);

        // Verify section label
        const sectionLabel = lookupField.find({className: 'domain-field-section-heading'});
        expect(sectionLabel.length).toEqual(1);
        expect(sectionLabel.text()).toEqual(_label);

        // Get container field and wait for it to populate
        let container = lookupField.find({id: createFormInputId(DOMAIN_FIELD_LOOKUP_CONTAINER, 1), name: "folder-select"}).not({bsClass: 'form-control'}).not({className: "form-control"});
        expect(container.length).toEqual(1);
        return waitForLoad(container)
            .then(() => {
                expect(container.props().value).toEqual(_container);
                expect(container.state().containers.size).toEqual(2);
                expect(container.state().containers.get(0).name).toEqual(_container0);
                expect(container.state().containers.get(1).name).toEqual(_container1);

                // Schema
                let schema = lookupField.find({id: createFormInputId(DOMAIN_FIELD_LOOKUP_SCHEMA, 1), name: "schema-select"}).not({bsClass: 'form-control'}).not({className: "form-control"});
                expect(schema.length).toEqual(1);
                return waitForLoad(schema)
                    .then(() => {
                        expect(schema.props().value).toEqual(_schema);
                        expect(schema.state().schemas.size).toEqual(5);
                        expect(schema.state().schemas.get(0).schemaName).toEqual(_schema0);
                        expect(schema.state().schemas.get(4).schemaName).toEqual(_schema2);

                        // Query
                        let query = lookupField.find({
                            id: createFormInputId(DOMAIN_FIELD_LOOKUP_QUERY, 1),
                            name: "query-select"
                        }).not({bsClass: 'form-control'}).not({className: "form-control"});
                        expect(query.length).toEqual(1);
                        return waitForLoad(query)
                            .then(() => {
                                expect(query.props().value).toEqual(_query);
                                expect(query.state().queries.size).toEqual(3);
                                expect(query.state().queries.get(1).name).toEqual(_queries1);

                                expect(toJson(lookupField)).toMatchSnapshot();
                                lookupField.unmount();
                            })
                    })
            })
    });

    test('Selected container changes schemas', () => {
        const _container1 = '/StudyVerifyProject/My Study';
        const _container2 = '/StudyVerifyProject';
        const _schema = 'exp';
        const _query = 'Data';
        const _label = 'Lookup Field Options';
        const _newSchema = "lists";

        const field = DomainField.create({
            name: 'key',
            rangeURI: INT_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test'
        });

        const lookupField = mount(<MockLookupProvider><LookupFieldOptions
            lookupContainer={_container1}
            lookupSchema={_schema}
            lookupQueryValue={_query}
            original={field}
            onChange={jest.fn()}
            index={1}
            label={_label}
        /></MockLookupProvider>);

        // Get container field and wait for it to populate
        let container = lookupField.find({
            id: createFormInputId(DOMAIN_FIELD_LOOKUP_CONTAINER, 1),
            name: "folder-select",
        }).not({bsClass: 'form-control'}).not({className: "form-control"});
        return waitForLoad(container)
            .then(() => {
                expect(container.props().value).toEqual(_container1);

                // Get schema field and wait for load
                let schema = lookupField.find({
                    id: createFormInputId(DOMAIN_FIELD_LOOKUP_SCHEMA, 1),
                    name: "schema-select"
                }).not({bsClass: 'form-control'}).not({className: "form-control"});
                return waitForLoad(schema)
                    .then(() => {
                        expect(schema.props().value).toEqual(_schema);
                        expect(schema.state().schemas.size).toEqual(5);

                        // A bit of a hacky way to set props
                        lookupField.setProps({children: <LookupFieldOptions
                                lookupContainer={_container2}
                                lookupSchema=""
                                lookupQueryValue=""
                                original={field}
                                onChange={jest.fn()}
                                index={1}
                                label={_label}
                            />});

                        // Wait for schema to load and verify values updated
                        return waitForLoad(schema)
                            .then(() => {
                                expect(schema.state().schemas.size).toEqual(1);
                                expect(schema.state().schemas.get(0).schemaName).toEqual(_newSchema);

                                expect(toJson(lookupField)).toMatchSnapshot();
                                lookupField.unmount();
                            })
                    })
            })
    });

    test('Selected schema changes queries', () => {
        const _container = '/StudyVerifyProject/My Study';
        const _schema1 = 'exp';
        const _schema2 = 'study';
        const _query1 = 'Data';
        const _query2 = 'Treatment';
        const _label = 'Lookup Field Options';

        const field = DomainField.create({
            name: 'key',
            rangeURI: INT_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test'
        });

        const lookupField = mount(<MockLookupProvider><LookupFieldOptions
            lookupContainer={_container}
            lookupSchema={_schema1}
            lookupQueryValue={_query1}
            original={field}
            onChange={jest.fn()}
            index={1}
            label={_label}
        /></MockLookupProvider>);

        // Get container field and wait for it to populate
        let container = lookupField.find({
            id: createFormInputId(DOMAIN_FIELD_LOOKUP_CONTAINER, 1),
            name: "folder-select",
        }).not({bsClass: 'form-control'}).not({className: "form-control"});
        return waitForLoad(container)
            .then(() => {
                expect(container.props().value).toEqual(_container);

                // Get schema and ensure its loaded
                let schema = lookupField.find({
                    id: createFormInputId(DOMAIN_FIELD_LOOKUP_SCHEMA, 1),
                    name: "schema-select"
                }).not({bsClass: 'form-control'}).not({className: "form-control"});
                return waitForLoad(schema)
                    .then(() => {
                        expect(schema.props().value).toEqual(_schema1);

                        // A bit of a hacky way to set props
                        lookupField.setProps({children: <LookupFieldOptions
                                lookupContainer={_container}
                                lookupSchema={_schema2}
                                lookupQueryValue=""
                                original={field}
                                onChange={jest.fn()}
                                index={1}
                                label={_label}
                            />});

                        // Get query field
                        let query = lookupField.find({
                            id: createFormInputId(DOMAIN_FIELD_LOOKUP_QUERY, 1),
                            name: "query-select"
                        }).not({bsClass: 'form-control'}).not({className: "form-control"});
                        expect(query.length).toEqual(1);
                        return waitForLoad(query)
                            .then(() => {
                                // Verify query field
                                expect(query.state().queries.size).toEqual(1);
                                expect(query.state().queries.get(0).name).toEqual(_query2);

                                expect(toJson(lookupField)).toMatchSnapshot();
                                lookupField.unmount();
                            })
                    })
            })
    })
});