/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render } from '@testing-library/react';

import { createFormInputId } from './utils';
import {
    CALCULATED_CONCEPT_URI,
    DOMAIN_FIELD_DESCRIPTION,
    DOMAIN_FIELD_FULLY_LOCKED,
    DOMAIN_FIELD_IMPORTALIASES,
    DOMAIN_FIELD_LABEL,
    DOMAIN_FIELD_ONTOLOGY_PRINCIPAL_CONCEPT,
    DOMAIN_FIELD_URL,
    DOMAIN_FIELD_URL_TARGET,
    MULTI_CHOICE_RANGE_URI,
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
    isTargetBlank: true,
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

const lockedField = DomainField.create({
    name: 'lockedField',
    rangeURI: STRING_RANGE_URI,
    propertyId: 3,
    description: 'locked field desc',
    label: 'Locked Field',
    lockType: DOMAIN_FIELD_FULLY_LOCKED,
});

const DEFAULT_PROPS = {
    index: 1,
    domainIndex: 1,
    field,
    onChange: jest.fn,
    appPropertiesOnly: false,
    serverModuleNames: undefined,
};

const MULTI_CHOICE_FIELD = DomainField.create({
    name: 'mvtcField',
    rangeURI: MULTI_CHOICE_RANGE_URI,
    propertyId: 5,
    description: 'array',
    label: 'multi value',
});

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
        expect(formField[0].hasAttribute('disabled')).toEqual(false);

        // Label
        formField = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_LABEL, 1, 1));
        expect(formField.length).toEqual(1);
        expect(formField[0].getAttribute('value')).toEqual(_label);
        expect(formField[0].hasAttribute('disabled')).toEqual(false);

        // Aliases
        formField = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_IMPORTALIASES, 1, 1));
        expect(formField.length).toEqual(1);
        expect(formField[0].getAttribute('value')).toEqual(_importAliases);
        expect(formField[0].hasAttribute('disabled')).toEqual(false);

        // URL
        formField = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_URL, 1, 1));
        expect(formField.length).toEqual(1);
        expect(formField[0].getAttribute('value')).toEqual(_URL);
        expect(formField[0].hasAttribute('disabled')).toEqual(false);

        // URL Target
        formField = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_URL_TARGET, 1, 1));
        expect(formField.length).toEqual(1);
        expect(formField[0].hasAttribute('checked')).toEqual(true);
        expect(formField[0].hasAttribute('disabled')).toEqual(false);

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

        expect(document.querySelector('#' + createFormInputId(DOMAIN_FIELD_URL, 1, 1)).getAttribute('value')).toEqual(
            ''
        );
        expect(
            document.querySelector('#' + createFormInputId(DOMAIN_FIELD_URL_TARGET, 1, 1)).hasAttribute('checked')
        ).toEqual(false);
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

    test('locked field', () => {
        render(<NameAndLinkingOptions {...DEFAULT_PROPS} field={lockedField} />);
        expect(
            document.querySelector('#' + createFormInputId(DOMAIN_FIELD_LABEL, 1, 1)).hasAttribute('disabled')
        ).toEqual(true);
        expect(
            document.querySelector('#' + createFormInputId(DOMAIN_FIELD_DESCRIPTION, 1, 1)).hasAttribute('disabled')
        ).toEqual(true);
        expect(
            document.querySelector('#' + createFormInputId(DOMAIN_FIELD_IMPORTALIASES, 1, 1)).hasAttribute('disabled')
        ).toEqual(true);
        expect(
            document.querySelector('#' + createFormInputId(DOMAIN_FIELD_URL, 1, 1)).hasAttribute('disabled')
        ).toEqual(true);
        expect(
            document.querySelector('#' + createFormInputId(DOMAIN_FIELD_URL_TARGET, 1, 1)).hasAttribute('disabled')
        ).toEqual(true);
    });

    test('multi value text choice field', () => {
        render(<NameAndLinkingOptions {...DEFAULT_PROPS} field={MULTI_CHOICE_FIELD} />);
        expect(document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_LABEL, 1, 1))).toHaveLength(1);
        expect(document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_DESCRIPTION, 1, 1))).toHaveLength(1);
        expect(document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_IMPORTALIASES, 1, 1))).toHaveLength(1);
        expect(document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_URL, 1, 1))).toHaveLength(0);
        expect(document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_URL_TARGET, 1, 1))).toHaveLength(0);
    });
});
