import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { MockLookupProvider } from '../../../test/components/Lookup';

import { createFormInputId, createFormInputName } from './utils';
import {
    DOMAIN_FIELD_FULLY_LOCKED,
    DOMAIN_FIELD_LOOKUP_CONTAINER,
    DOMAIN_FIELD_LOOKUP_QUERY,
    DOMAIN_FIELD_LOOKUP_SCHEMA,
    DOMAIN_FIELD_NOT_LOCKED,
    DOMAIN_FIELD_PARTIALLY_LOCKED,
    INT_RANGE_URI,
} from './constants';
import { DomainField } from './models';
import {
    FolderSelect,
    FolderSelectProps,
    IFolderSelectImplState,
    ISchemaSelectImplState,
    ITargetTableSelectImplState,
    SchemaSelect,
    SchemaSelectProps,
    TargetTableSelect,
    TargetTableSelectProps,
} from './Lookup/Fields';
import { LookupFieldOptions } from './LookupFieldOptions';
import { PropDescType } from './PropDescType';

describe('LookupFieldOptions', () => {
    const waitForLoad = jest.fn(field => Promise.resolve(!field.state().loading));

    // Helper methods to select fields
    const folderFieldSelector = (
        field: ReactWrapper<any>,
        domainIndex: number,
        index: number
    ): ReactWrapper<FolderSelectProps, IFolderSelectImplState> => {
        return field
            .find({
                id: createFormInputId(DOMAIN_FIELD_LOOKUP_CONTAINER, domainIndex, index),
                name: createFormInputName(DOMAIN_FIELD_LOOKUP_CONTAINER),
            })
            .not({ bsClass: 'form-control' })
            .not({ className: 'form-control' });
    };

    const schemaFieldSelector = (
        field: ReactWrapper<any>,
        domainIndex: number,
        index: number
    ): ReactWrapper<SchemaSelectProps, ISchemaSelectImplState> => {
        return field
            .find({
                id: createFormInputId(DOMAIN_FIELD_LOOKUP_SCHEMA, domainIndex, index),
                name: createFormInputName(DOMAIN_FIELD_LOOKUP_SCHEMA),
            })
            .not({ bsClass: 'form-control' })
            .not({ className: 'form-control' });
    };

    const queryFieldSelector = (
        field: ReactWrapper<any>,
        domainIndex: number,
        index: number
    ): ReactWrapper<TargetTableSelectProps, ITargetTableSelectImplState> => {
        return field
            .find({
                id: createFormInputId(DOMAIN_FIELD_LOOKUP_QUERY, domainIndex, index),
                name: createFormInputName(DOMAIN_FIELD_LOOKUP_QUERY),
            })
            .not({ bsClass: 'form-control' })
            .not({ className: 'form-control' });
    };

    // Tests
    test('Lookup field options', () => {
        const _container = '/StudyVerifyProject/My Study';
        const _schema = 'exp';
        const _query = 'Data';
        const _index = 1;
        const _domainIndex = 1;
        const _label = 'Lookup Field Options';
        const _container0 = 'StudyVerifyProject';
        const _container1 = 'My Study';
        const _schema0 = 'exp';
        const _schema2 = 'study';
        const _queries1 = 'DataInputs';

        const field = DomainField.create({
            name: 'key',
            rangeURI: INT_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test',
        });

        const lookupField = mount(
            <MockLookupProvider>
                <LookupFieldOptions
                    field={
                        new DomainField({
                            original: field,
                            dataType: PropDescType.fromName('lookup'),
                            lookupSchema: _schema,
                            lookupQueryValue: _query,
                            lookupIsValid: true,
                        })
                    }
                    lookupContainer={_container}
                    onChange={jest.fn()}
                    onMultiChange={jest.fn()}
                    index={_index}
                    domainIndex={_domainIndex}
                    label={_label}
                    lockType={DOMAIN_FIELD_NOT_LOCKED}
                />
            </MockLookupProvider>
        );

        // Verify section label
        const sectionLabel = lookupField.find({ className: 'domain-field-section-heading' });
        expect(sectionLabel.length).toEqual(1);
        expect(sectionLabel.text()).toEqual(_label);

        // Folder
        const folderField = folderFieldSelector(lookupField, _domainIndex, _index);

        expect(folderField.length).toEqual(1);

        return waitForLoad(folderField).then(() => {
            expect(folderField.props().value).toEqual(_container);
            expect(folderField.state().containers.size).toEqual(2);
            expect(folderField.state().containers.get(0).name).toEqual(_container0);
            expect(folderField.state().containers.get(1).name).toEqual(_container1);

            // Schema
            const schemaField = schemaFieldSelector(lookupField, _domainIndex, _index);

            expect(schemaField.length).toEqual(1);

            return waitForLoad(schemaField).then(() => {
                expect(schemaField.props().value).toEqual(_schema);
                expect(schemaField.state().schemas.length).toEqual(5);
                expect(schemaField.state().schemas[0].schemaName).toEqual(_schema0);
                expect(schemaField.state().schemas[4].schemaName).toEqual(_schema2);

                // Query
                const queryField = queryFieldSelector(lookupField, _domainIndex, _index);

                return waitForLoad(queryField).then(() => {
                    expect(queryField.props().value).toEqual(_query);
                    expect(queryField.state().queries.length).toEqual(3);
                    expect(queryField.state().queries[1].name).toEqual(_queries1);

                    expect(lookupField).toMatchSnapshot();
                    lookupField.unmount();
                });
            });
        });
    });

    test('Selected container changes schemas', () => {
        const _container1 = '/StudyVerifyProject/My Study';
        const _container2 = '/StudyVerifyProject';
        const _index = 1;
        const _domainIndex = 1;
        const _schema = 'exp';
        const _query = 'Data';
        const _label = 'Lookup Field Options';
        const _newSchema = 'lists';

        const field = DomainField.create({
            name: 'key',
            rangeURI: INT_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test',
        });

        const lookupField = mount(
            <MockLookupProvider>
                <LookupFieldOptions
                    field={
                        new DomainField({
                            original: field,
                            dataType: PropDescType.fromName('lookup'),
                            lookupSchema: _schema,
                            lookupQueryValue: _query,
                        })
                    }
                    lookupContainer={_container1}
                    onChange={jest.fn()}
                    onMultiChange={jest.fn()}
                    index={_index}
                    domainIndex={_domainIndex}
                    label={_label}
                    lockType={DOMAIN_FIELD_NOT_LOCKED}
                />
            </MockLookupProvider>
        );

        // Get container field and wait for it to populate
        const container = folderFieldSelector(lookupField, _domainIndex, _index);

        return waitForLoad(container).then(() => {
            expect(container.props().value).toEqual(_container1);

            // Get schema field and wait for load
            const schema = schemaFieldSelector(lookupField, _domainIndex, _index);

            return waitForLoad(schema).then(() => {
                expect(schema.props().value).toEqual(_schema);
                expect(schema.state().schemas.length).toEqual(5);

                lookupField.setProps({
                    children: (
                        <LookupFieldOptions
                            field={
                                new DomainField({
                                    original: field,
                                    dataType: PropDescType.fromName('lookup'),
                                    lookupSchema: '',
                                    lookupQueryValue: '',
                                })
                            }
                            lookupContainer={_container2}
                            onChange={jest.fn()}
                            onMultiChange={jest.fn()}
                            index={_index}
                            domainIndex={_domainIndex}
                            label={_label}
                            lockType={DOMAIN_FIELD_NOT_LOCKED}
                        />
                    ),
                });

                return waitForLoad(container).then(() => {
                    // Wait for schema to load and verify values updated
                    return waitForLoad(schema).then(() => {
                        expect(schema.state().schemas.length).toEqual(1);
                        expect(schema.state().schemas[0].schemaName).toEqual(_newSchema);

                        expect(lookupField).toMatchSnapshot();
                        lookupField.unmount();
                    });
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
        const _domainIndex = 1;

        const field = DomainField.create({
            name: 'key',
            rangeURI: INT_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test',
        });

        const lookupField = mount(
            <MockLookupProvider>
                <LookupFieldOptions
                    field={
                        new DomainField({
                            original: field,
                            dataType: PropDescType.fromName('lookup'),
                            lookupSchema: _schema1,
                            lookupQueryValue: _query1,
                        })
                    }
                    lookupContainer={_container}
                    onChange={jest.fn()}
                    onMultiChange={jest.fn()}
                    index={_index}
                    domainIndex={_domainIndex}
                    label={_label}
                    lockType={DOMAIN_FIELD_NOT_LOCKED}
                />
            </MockLookupProvider>
        );

        // Folder
        const folderField = folderFieldSelector(lookupField, _domainIndex, _index);

        return waitForLoad(folderField).then(() => {
            expect(folderField.props().value).toEqual(_container);

            // Schema
            const schemaField = schemaFieldSelector(lookupField, _domainIndex, _index);

            return waitForLoad(schemaField).then(() => {
                expect(schemaField.props().value).toEqual(_schema1);

                // Query
                let queryField = queryFieldSelector(lookupField, _domainIndex, _index);
                return waitForLoad(queryField).then(() => {
                    expect(queryField.state().queries.length).toEqual(4);

                    lookupField.setProps({
                        children: (
                            <LookupFieldOptions
                                field={
                                    new DomainField({
                                        original: field,
                                        dataType: PropDescType.fromName('lookup'),
                                        lookupSchema: _schema2,
                                        lookupQueryValue: '',
                                        lookupIsValid: true,
                                    })
                                }
                                lookupContainer={_container}
                                onChange={jest.fn()}
                                onMultiChange={jest.fn()}
                                index={_index}
                                domainIndex={_domainIndex}
                                label={_label}
                                lockType={DOMAIN_FIELD_NOT_LOCKED}
                            />
                        ),
                    });

                    queryField = queryFieldSelector(lookupField, _domainIndex, _index);
                    return waitForLoad(schemaField).then(() => {
                        return waitForLoad(queryField).then(() => {
                            // Verify query field
                            expect(queryField.state().queries.length).toEqual(1);
                            expect(queryField.state().queries[0].name).toEqual(_query2);

                            expect(lookupField).toMatchSnapshot();
                            lookupField.unmount();
                        });
                    });
                });
            });
        });
    });

    test('Selected container changes queries', () => {
        const _container1 = '/StudyVerifyProject/My Study';
        const _container2 = '/StudyVerifyProject';
        const _schema1 = 'exp';
        const _query1 = 'Data';
        const _label = 'Lookup Field Options';
        const _index = 1;
        const _domainIndex = 1;

        const field = DomainField.create({
            name: 'key',
            rangeURI: INT_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test',
        });

        const lookupField = mount(
            <MockLookupProvider>
                <LookupFieldOptions
                    field={
                        new DomainField({
                            original: field,
                            dataType: PropDescType.fromName('lookup'),
                            lookupSchema: _schema1,
                            lookupQueryValue: _query1,
                            lookupIsValid: true,
                        })
                    }
                    lookupContainer={_container1}
                    onChange={jest.fn()}
                    onMultiChange={jest.fn()}
                    index={_index}
                    domainIndex={_domainIndex}
                    label={_label}
                    lockType={DOMAIN_FIELD_NOT_LOCKED}
                />
            </MockLookupProvider>
        );

        // Folder
        const folderField = folderFieldSelector(lookupField, _domainIndex, _index);
        let queryField = queryFieldSelector(lookupField, _domainIndex, _index);
        expect(queryField.state().queries).toBeUndefined();
        return waitForLoad(folderField).then(() => {
            expect(folderField.props().value).toEqual(_container1);

            return waitForLoad(queryField).then(() => {
                expect(queryField.state().queries.length).toEqual(3);

                lookupField.setProps({
                    children: (
                        <LookupFieldOptions
                            field={
                                new DomainField({
                                    original: field,
                                    dataType: PropDescType.fromName('lookup'),
                                    lookupSchema: '',
                                    lookupQueryValue: '',
                                    lookupIsValid: true,
                                })
                            }
                            lookupContainer={_container2}
                            onChange={jest.fn()}
                            onMultiChange={jest.fn()}
                            index={_index}
                            domainIndex={_domainIndex}
                            label={_label}
                            lockType={DOMAIN_FIELD_NOT_LOCKED}
                        />
                    ),
                });

                return waitForLoad(folderField).then(() => {
                    // Query
                    queryField = queryFieldSelector(lookupField, _domainIndex, _index);
                    return waitForLoad(queryField).then(() => {
                        queryField = queryFieldSelector(lookupField, _domainIndex, _index);
                        // Verify query field
                        expect(queryField.props().value).toEqual('');
                        expect(queryField.state().queries.length).toBe(0);

                        expect(lookupField).toMatchSnapshot();
                        lookupField.unmount();
                    });
                });
            });
        });
    });

    test('lockType', () => {
        const base = {
            field: new DomainField({
                original: {},
                dataType: PropDescType.fromName('string'),
                lookupSchema: 'schema',
                lookupQueryValue: 'query',
            }),
            lookupContainer: 'container',
            onMultiChange: jest.fn,
            onChange: jest.fn,
            index: 0,
            domainIndex: 0,
            label: 'Foo',
        };

        function validateDisabled(lockType: string, expectDisabled: boolean) {
            const component = (
                <MockLookupProvider>
                    <LookupFieldOptions {...base} lockType={lockType} />
                </MockLookupProvider>
            );
            const wrapper = mount(component);
            expect(wrapper.find(FolderSelect).prop('disabled')).toBe(expectDisabled);
            expect(wrapper.find(SchemaSelect).prop('disabled')).toBe(expectDisabled);
            expect(wrapper.find(TargetTableSelect).prop('disabled')).toBe(expectDisabled);
            wrapper.unmount();
        }

        validateDisabled(DOMAIN_FIELD_NOT_LOCKED, false);
        validateDisabled(DOMAIN_FIELD_PARTIALLY_LOCKED, true);
        validateDisabled(DOMAIN_FIELD_FULLY_LOCKED, true);
    });

    test('Invalid lookup', () => {
        const _index = 1;
        const _domainIndex = 1;
        const _invalidLookup = 'rangeURI|InvalidLookup';

        const field = DomainField.create({
            name: 'key',
            rangeURI: INT_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test',
        });

        const lookupField = mount(
            <MockLookupProvider>
                <LookupFieldOptions
                    field={
                        new DomainField({
                            original: field,
                            dataType: PropDescType.fromName('int'),
                            lookupSchema: 'exp',
                            lookupQueryValue: _invalidLookup,
                            lookupIsValid: false,
                        })
                    }
                    lookupContainer="/StudyVerifyProject"
                    onChange={jest.fn()}
                    onMultiChange={jest.fn()}
                    index={_index}
                    domainIndex={_domainIndex}
                    label="Lookup Field Options"
                    lockType={DOMAIN_FIELD_NOT_LOCKED}
                />
            </MockLookupProvider>
        );

        const folderField = folderFieldSelector(lookupField, _domainIndex, _index);
        return waitForLoad(folderField).then(() => {
            // Query
            const queryField = queryFieldSelector(lookupField, _domainIndex, _index);

            return waitForLoad(queryField).then(() => {
                // Verify query field
                expect(queryField.state().queries.length).toEqual(4); // exp queries plus unknown query
                expect(queryField.props().value).toEqual(_invalidLookup);
                lookupField.unmount();
            });
        });
    });
});
