import React from 'react';
import { mount } from 'enzyme';

import { OntologyConceptAnnotation } from '../ontology/OntologyConceptAnnotation';

import { createFormInputId } from './actions';
import {
    DOMAIN_FIELD_DESCRIPTION,
    DOMAIN_FIELD_IMPORTALIASES,
    DOMAIN_FIELD_LABEL,
    DOMAIN_FIELD_URL,
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

const DEFAULT_PROPS = {
    index: 1,
    domainIndex: 1,
    field,
    onChange: jest.fn,
    appPropertiesOnly: false,
};

describe('NameAndLinkingOptions', () => {
    test('Name and Linking options', () => {
        const numeric = mount(<NameAndLinkingOptions {...DEFAULT_PROPS} />);

        // Verify section label
        const sectionLabel = numeric.find({ className: 'domain-field-section-heading domain-field-section-hdr' });
        expect(sectionLabel.length).toEqual(1);
        expect(sectionLabel.text()).toEqual('Name and Linking Options');

        // Verify values
        // Description
        let formField = numeric.find({
            id: createFormInputId(DOMAIN_FIELD_DESCRIPTION, 1, 1),
            className: 'form-control textarea-noresize form-control',
        });
        expect(formField.length).toEqual(1);
        expect(formField.props().value).toEqual(_description);

        // Label
        formField = numeric.find({ id: createFormInputId(DOMAIN_FIELD_LABEL, 1, 1), className: 'form-control' });
        expect(formField.length).toEqual(1);
        expect(formField.props().value).toEqual(_label);

        // Aliases
        formField = numeric.find({
            id: createFormInputId(DOMAIN_FIELD_IMPORTALIASES, 1, 1),
            className: 'form-control',
        });
        expect(formField.length).toEqual(1);
        expect(formField.props().value).toEqual(_importAliases);

        // URL
        formField = numeric.find({ id: createFormInputId(DOMAIN_FIELD_URL, 1, 1), className: 'form-control' });
        expect(formField.length).toEqual(1);
        expect(formField.props().value).toEqual(_URL);

        expect(numeric).toMatchSnapshot();
        numeric.unmount();
    });

    test('appPropertiesOnly and ontology module', () => {
        LABKEY.container.activeModules = ['Core', 'Query', 'Ontology'];
        let wrapper = mount(<NameAndLinkingOptions {...DEFAULT_PROPS} appPropertiesOnly={true} />);
        expect(wrapper.find(OntologyConceptAnnotation)).toHaveLength(0);
        wrapper.unmount();

        wrapper = mount(<NameAndLinkingOptions {...DEFAULT_PROPS} appPropertiesOnly={false} />);
        expect(wrapper.find(OntologyConceptAnnotation)).toHaveLength(1);
        wrapper.unmount();
    });
});
