import * as React from "react";
import toJson from "enzyme-to-json";
import {mount, ReactWrapper} from "enzyme";

import {createFormInputId} from "../actions/actions";
import {
    DOMAIN_FIELD_LOOKUP_CONTAINER, DOMAIN_FIELD_LOOKUP_QUERY,
    DOMAIN_FIELD_LOOKUP_SCHEMA,
    INT_RANGE_URI,
} from "../constants";
import {DomainField} from "../models";
import {
    FolderSelectProps, IFolderSelectImplState,
    SchemaSelectProps, ISchemaSelectImplState,
    QuerySelectProps, IQuerySelectImplState
} from "./Lookup/Fields";
import {LookupFieldOptions} from "./LookupFieldOptions";
import {MockLookupProvider} from "../test/components/Lookup";


describe('LookupFieldOptions', () => {

    const waitForLoad = jest.fn((field) => Promise.resolve(!field.state().loading));

    // Helper methods to select fields
    const folderFieldSelector = (field: ReactWrapper<any>, index: number): ReactWrapper<FolderSelectProps, IFolderSelectImplState> => {
        return field.find({
            id: createFormInputId(DOMAIN_FIELD_LOOKUP_CONTAINER, index),
            name: 'folder-select'
        }).not({bsClass: 'form-control'}).not({className: "form-control"});
    };

    const schemaFieldSelector = (field: ReactWrapper<any>, index: number): ReactWrapper<SchemaSelectProps, ISchemaSelectImplState> => {
        return field.find({
            id: createFormInputId(DOMAIN_FIELD_LOOKUP_SCHEMA, index),
            name: 'schema-select'
        }).not({bsClass: 'form-control'}).not({className: "form-control"});
    };

    const queryFieldSelector = (field: ReactWrapper<any>, index: number): ReactWrapper<QuerySelectProps, IQuerySelectImplState> => {
        return field.find({
            id: createFormInputId(DOMAIN_FIELD_LOOKUP_QUERY, index),
            name: 'query-select'
        }).not({bsClass: 'form-control'}).not({className: "form-control"});
    };

    // Tests
    test('Lookup field options', () => {
        const _container = '/StudyVerifyProject/My Study';
        const _schema = 'exp';
        const _query = 'Data';
        const _index = 1;
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

        const lookupField = mount(
            <MockLookupProvider>
                <LookupFieldOptions
                    lookupContainer={_container}
                    lookupSchema={_schema}
                    lookupQueryValue={_query}
                    original={field}
                    onChange={jest.fn()}
                    index={_index}
                    label={_label}/>
            </MockLookupProvider>
        );

        // Verify section label
        const sectionLabel = lookupField.find({className: 'domain-field-section-heading'});
        expect(sectionLabel.length).toEqual(1);
        expect(sectionLabel.text()).toEqual(_label);

        // Folder
        let folderField = folderFieldSelector(lookupField, _index);

        expect(folderField.length).toEqual(1);

        return waitForLoad(folderField)
            .then(() => {
                expect(folderField.props().value).toEqual(_container);
                expect(folderField.state().containers.size).toEqual(2);
                expect(folderField.state().containers.get(0).name).toEqual(_container0);
                expect(folderField.state().containers.get(1).name).toEqual(_container1);

                // Schema
                let schemaField = schemaFieldSelector(lookupField, _index);

                expect(schemaField.length).toEqual(1);

                return waitForLoad(schemaField)
                    .then(() => {
                        expect(schemaField.props().value).toEqual(_schema);
                        expect(schemaField.state().schemas.size).toEqual(5);
                        expect(schemaField.state().schemas.get(0).schemaName).toEqual(_schema0);
                        expect(schemaField.state().schemas.get(4).schemaName).toEqual(_schema2);

                        // Query
                        let queryField = queryFieldSelector(lookupField, _index);

                        return waitForLoad(queryField)
                            .then(() => {
                                expect(queryField.props().value).toEqual(_query);
                                expect(queryField.state().queries.size).toEqual(3);
                                expect(queryField.state().queries.get(1).name).toEqual(_queries1);

                                expect(toJson(lookupField)).toMatchSnapshot();
                                lookupField.unmount();
                            })
                    })
            })
    });

    test('Selected container changes schemas', () => {
        const _container1 = '/StudyVerifyProject/My Study';
        const _container2 = '/StudyVerifyProject';
        const _index = 1;
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

        const lookupField = mount(
            <MockLookupProvider>
                <LookupFieldOptions
                    lookupContainer={_container1}
                    lookupSchema={_schema}
                    lookupQueryValue={_query}
                    original={field}
                    onChange={jest.fn()}
                    index={_index}
                    label={_label}/>
            </MockLookupProvider>
        );

        // Get container field and wait for it to populate
        let container = folderFieldSelector(lookupField, _index);

        return waitForLoad(container)
            .then(() => {
                expect(container.props().value).toEqual(_container1);

                // Get schema field and wait for load
                let schema = schemaFieldSelector(lookupField, _index);

                return waitForLoad(schema)
                    .then(() => {
                        expect(schema.props().value).toEqual(_schema);
                        expect(schema.state().schemas.size).toEqual(5);

                        // A bit of a hacky way to set props
                        lookupField.setProps({
                            children: (
                                <LookupFieldOptions
                                    lookupContainer={_container2}
                                    lookupSchema=""
                                    lookupQueryValue=""
                                    original={field}
                                    onChange={jest.fn()}
                                    index={1}
                                    label={_label}
                                />
                            )
                        });

                        // Wait for schema to load and verify values updated
                        return waitForLoad(schema)
                            .then(() => {
                                expect(schema.state().schemas.size).toEqual(1);
                                expect(schema.state().schemas.get(0).schemaName).toEqual(_newSchema);

                                expect(toJson(lookupField)).toMatchSnapshot();
                                lookupField.unmount();
                            });
                    });
            });
    });

    test('Selected schema changes queries', () => {
        const _container = '/StudyVerifyProject/My Study';
        const _schema1 = 'exp';
        const _schema2 = 'study';
        const _query1 = 'Data';
        const _query2 = 'Treatment';
        const _label = 'Lookup Field Options';
        const _index = 1;

        const field = DomainField.create({
            name: 'key',
            rangeURI: INT_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test'
        });

        const lookupField = mount(
            <MockLookupProvider>
                <LookupFieldOptions
                    lookupContainer={_container}
                    lookupSchema={_schema1}
                    lookupQueryValue={_query1}
                    original={field}
                    onChange={jest.fn()}
                    index={_index}
                    label={_label}
                />
            </MockLookupProvider>
        );

        // Folder
        let folderField = folderFieldSelector(lookupField, _index);

        return waitForLoad(folderField)
            .then(() => {
                expect(folderField.props().value).toEqual(_container);

                // Schema
                let schemaField = schemaFieldSelector(lookupField, _index);

                return waitForLoad(schemaField)
                    .then(() => {
                        expect(schemaField.props().value).toEqual(_schema1);

                        // A bit of a hacky way to set props
                        lookupField.setProps({
                            children: (
                                <LookupFieldOptions
                                    lookupContainer={_container}
                                    lookupSchema={_schema2}
                                    lookupQueryValue=""
                                    original={field}
                                    onChange={jest.fn()}
                                    index={1}
                                    label={_label}
                                />
                            )
                        });

                        // Query
                        let queryField = queryFieldSelector(lookupField, _index);

                        return waitForLoad(queryField)
                            .then(() => {
                                // Verify query field
                                expect(queryField.state().queries.size).toEqual(1);
                                expect(queryField.state().queries.get(0).name).toEqual(_query2);

                                expect(toJson(lookupField)).toMatchSnapshot();
                                lookupField.unmount();
                            });
                    });
            });
    });
});