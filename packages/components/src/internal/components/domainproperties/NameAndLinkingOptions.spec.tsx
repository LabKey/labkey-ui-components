import React from 'react';
import { mount } from 'enzyme';

import { OntologyConceptAnnotation } from '../ontology/OntologyConceptAnnotation';

import { createFormInputId } from './actions';
import {
    DOMAIN_FIELD_DESCRIPTION,
    DOMAIN_FIELD_IMPORTALIASES,
    DOMAIN_FIELD_LABEL,
    DOMAIN_FIELD_URL,
    STORAGE_UNIQUE_ID_CONCEPT_URI,
    STRING_RANGE_URI,
} from './constants';

import { DomainField } from './models';
import { NameAndLinkingOptions } from './NameAndLinkingOptions';

const _description = 'This is a description';
const _label = 'This is a label';
const _importAliases = 'This is an alias';
const _URL = 'This is a URL';

const field = DomainField.create({
    name: 'key',
    rangeURI: STRING_RANGE_URI,
    propertyId: 1,
    description: _description,
    label: _label,
    importAliases: _importAliases,
    URL: _URL,
    propertyURI: 'test',
});

const uniqueIdField = DomainField.create({
    name: 'uniqueId',
    rangeURI: STRING_RANGE_URI,
    propertyId: 2,
    description: 'test uniqueId',
    label: 'UniqueId label',
    conceptURI: STORAGE_UNIQUE_ID_CONCEPT_URI,
});

const DEFAULT_PROPS = {
    index: 1,
    domainIndex: 1,
    field,
    onChange: jest.fn,
    appPropertiesOnly: false,
    serverModuleNames: undefined,
};

describe('NameAndLinkingOptions', () => {
    test('Name and Linking options', () => {
        const wrapper = mount(<NameAndLinkingOptions {...DEFAULT_PROPS} />);

        // Verify section label
        const sectionLabel = wrapper.find({ className: 'domain-field-section-heading domain-field-section-hdr' });
        expect(sectionLabel.length).toEqual(1);
        expect(sectionLabel.text()).toEqual('Name and Linking Options');

        // Verify values
        // Description
        let formField = wrapper.find({
            id: createFormInputId(DOMAIN_FIELD_DESCRIPTION, 1, 1),
            className: 'form-control textarea-noresize form-control',
        });
        expect(formField.length).toEqual(1);
        expect(formField.props().value).toEqual(_description);

        // Label
        formField = wrapper.find({ id: createFormInputId(DOMAIN_FIELD_LABEL, 1, 1), className: 'form-control' });
        expect(formField.length).toEqual(1);
        expect(formField.props().value).toEqual(_label);

        // Aliases
        formField = wrapper.find({
            id: createFormInputId(DOMAIN_FIELD_IMPORTALIASES, 1, 1),
            className: 'form-control',
        });
        expect(formField.length).toEqual(1);
        expect(formField.props().value).toEqual(_importAliases);

        // URL
        formField = wrapper.find({ id: createFormInputId(DOMAIN_FIELD_URL, 1, 1), className: 'form-control' });
        expect(formField.length).toEqual(1);
        expect(formField.props().value).toEqual(_URL);

        expect(wrapper).toMatchSnapshot();
        wrapper.unmount();
    });

    test('appPropertiesOnly and ontology module', () => {
        let wrapper = mount(
            <NameAndLinkingOptions {...DEFAULT_PROPS} serverModuleNames={['ontology']} appPropertiesOnly={true} />
        );
        expect(wrapper.find(OntologyConceptAnnotation)).toHaveLength(0);
        wrapper.unmount();

        wrapper = mount(
            <NameAndLinkingOptions {...DEFAULT_PROPS} serverModuleNames={['ontology']} appPropertiesOnly={false} />
        );
        expect(wrapper.find(OntologyConceptAnnotation)).toHaveLength(1);
        wrapper.unmount();
    });

    test('uniqueId field', () => {
        const wrapper = mount(<NameAndLinkingOptions {...DEFAULT_PROPS} field={uniqueIdField} />);
        expect(
            wrapper.find({
                id: createFormInputId(DOMAIN_FIELD_IMPORTALIASES, 1, 1),
                className: 'form-control',
            })
        ).toHaveLength(0);
        wrapper.unmount();
    });
});
