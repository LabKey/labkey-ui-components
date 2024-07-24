import React from 'react';
import { render } from '@testing-library/react';

import { createFormInputId } from './utils';
import {
    CALCULATED_CONCEPT_URI,
    DOMAIN_FIELD_DESCRIPTION,
    DOMAIN_FIELD_IMPORTALIASES,
    DOMAIN_FIELD_LABEL,
    DOMAIN_FIELD_ONTOLOGY_PRINCIPAL_CONCEPT,
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

const calculatedField = DomainField.create({
    name: 'calcField',
    rangeURI: STRING_RANGE_URI,
    propertyId: 2,
    description: 'test calc',
    label: 'Calc label',
    conceptURI: CALCULATED_CONCEPT_URI,
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
        const container = render(<NameAndLinkingOptions {...DEFAULT_PROPS} />).container;

        // Verify section label
        const sectionLabel = document.querySelectorAll('.domain-field-section-heading');
        expect(sectionLabel.length).toEqual(1);
        expect(sectionLabel[0].textContent).toEqual('Name and Linking Options');

        // Verify values
        // Description
        let formField = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_DESCRIPTION, 1, 1));
        expect(formField.length).toEqual(1);
        expect(formField[0].textContent).toEqual(_description);

        // Label
        formField = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_LABEL, 1, 1));
        expect(formField.length).toEqual(1);
        expect(formField[0].getAttribute('value')).toEqual(_label);

        // Aliases
        formField = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_IMPORTALIASES, 1, 1));
        expect(formField.length).toEqual(1);
        expect(formField[0].getAttribute('value')).toEqual(_importAliases);

        // URL
        formField = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_URL, 1, 1));
        expect(formField.length).toEqual(1);
        expect(formField[0].getAttribute('value')).toEqual(_URL);

        expect(container).toMatchSnapshot();
    });

    test('appPropertiesOnly without ontology module', () => {
        render(<NameAndLinkingOptions {...DEFAULT_PROPS} appPropertiesOnly={true} />);
        expect(
            document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_ONTOLOGY_PRINCIPAL_CONCEPT, 1, 1))
        ).toHaveLength(0);
    });

    test('appPropertiesOnly with ontology module', () => {
        LABKEY.moduleContext = {
            api: {
                moduleNames: ['ontology'],
            },
        };
        render(<NameAndLinkingOptions {...DEFAULT_PROPS} appPropertiesOnly={false} />);
        expect(
            document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_ONTOLOGY_PRINCIPAL_CONCEPT, 1, 1))
        ).toHaveLength(1);
    });

    test('uniqueId field', () => {
        render(<NameAndLinkingOptions {...DEFAULT_PROPS} field={uniqueIdField} />);
        expect(document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_IMPORTALIASES, 1, 1))).toHaveLength(0);
    });

    test('calculated field', () => {
        render(<NameAndLinkingOptions {...DEFAULT_PROPS} field={calculatedField} />);
        expect(document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_IMPORTALIASES, 1, 1))).toHaveLength(0);
    });

    test('hideImportAliases', () => {
        render(
            <NameAndLinkingOptions
                {...DEFAULT_PROPS}
                domainFormDisplayOptions={{
                    hideImportAliases: true,
                }}
            />
        );
        expect(document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_IMPORTALIASES, 1, 1))).toHaveLength(0);
    });
});
