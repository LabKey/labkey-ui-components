/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import { List } from 'immutable';

import { INTEGER_TYPE, ONTOLOGY_LOOKUP_TYPE, TEXT_TYPE } from '../domainproperties/PropDescType';
import { DOMAIN_FIELD_FULLY_LOCKED } from '../domainproperties/constants';
import { DomainField } from '../domainproperties/models';
import { getDomainPropertiesTestAPIWrapper } from '../domainproperties/APIWrapper';

import { OntologyLookupOptions } from './OntologyLookupOptions';
import { OntologyModel } from './models';

const field1 = DomainField.create({
    name: 'field1',
    conceptURI: ONTOLOGY_LOOKUP_TYPE.conceptURI,
    rangeURI: ONTOLOGY_LOOKUP_TYPE.rangeURI,
    sourceOntology: 'NCIT',
    conceptImportColumn: 'field2',
    conceptLabelColumn: 'field3',
});
const field2 = DomainField.create({ name: 'field2', rangeURI: TEXT_TYPE.rangeURI });
const field3 = DomainField.create({ name: 'field3', rangeURI: TEXT_TYPE.rangeURI });
const field4 = DomainField.create({ name: 'field4', rangeURI: TEXT_TYPE.rangeURI });
const field5 = DomainField.create({ name: 'field5', rangeURI: INTEGER_TYPE.rangeURI });
const field6 = DomainField.create({ name: '', rangeURI: TEXT_TYPE.rangeURI });

function getDefaultProps() {
    return {
        domainContainerPath: '/Where/The/Domain/Lives',
        index: 0,
        domainIndex: 0,
        label: 'Test',
        lockType: undefined,
        onChange: jest.fn(),
        onMultiChange: jest.fn(),
        api: getDomainPropertiesTestAPIWrapper(jest.fn, {
            fetchOntologies: jest.fn().mockResolvedValue([
                new OntologyModel({
                    rowId: 2,
                    name: "Test HOM-UCARE-->\">'>'\"<script>alert('8(');</script>",
                    abbreviation: '45887',
                }),
                new OntologyModel({
                    rowId: 1,
                    name: 'Test National Cancer Institute Thesaurus',
                    abbreviation: 'NCIT',
                }),
            ]),
        }),
    };
}

async function validateSelects(
    container: HTMLElement,
    disabled: boolean,
    importOptionCount: number,
    labelOptionCount: number,
    importOptionValues: string[],
    labelOptionValues: string[]
): Promise<void> {
    await waitFor(() => {
        const selects = container.querySelectorAll('select');
        expect(selects).toHaveLength(3);
        // Source ontology select should have 2 options (the 2 mocked ontologies)
        expect(selects[0].querySelectorAll('option')).toHaveLength(2);
    });

    const selects = container.querySelectorAll('select');

    // source ontology select
    expect((selects[0] as HTMLSelectElement).disabled).toBe(disabled);
    expect(selects[0].querySelector('option[value="45887"]')).not.toBeNull();
    expect(selects[0].querySelector('option[value="NCIT"]')).not.toBeNull();

    // import field select
    expect((selects[1] as HTMLSelectElement).disabled).toBe(disabled);
    expect(selects[1].querySelectorAll('option')).toHaveLength(importOptionCount);
    importOptionValues.forEach(value => {
        if (value !== null) {
            expect(selects[1].querySelector(`option[value="${value}"]`)).not.toBeNull();
        }
    });

    // label field select
    expect((selects[2] as HTMLSelectElement).disabled).toBe(disabled);
    expect(selects[2].querySelectorAll('option')).toHaveLength(labelOptionCount);
    labelOptionValues.forEach(value => {
        if (value !== null) {
            expect(selects[2].querySelector(`option[value="${value}"]`)).not.toBeNull();
        }
    });
}

describe('OntologyLookupOptions', () => {
    test('default props', async () => {
        const field = DomainField.create({});
        const domainFields = List.of(field);
        const { container } = render(
            <OntologyLookupOptions {...getDefaultProps()} domainFields={domainFields} field={field} />
        );
        await validateSelects(container, false, 1, 1, [null], [null]);
        expect(container.querySelector('.domain-field-section-heading')).not.toBeNull();
        expect(container.querySelectorAll('.domain-field-label')).toHaveLength(4);
    });

    test('with additional fields and ontology field props', async () => {
        const domainFields = List.of(field1, field2, field3, field4, field5, field6);
        const { container } = render(
            <OntologyLookupOptions {...getDefaultProps()} domainFields={domainFields} field={field1} />
        );
        await validateSelects(container, false, 3, 3, [null, 'field2', 'field4'], [null, 'field3', 'field4']);
    });

    test('disabled selects', async () => {
        const domainFields = List.of(field1, field2, field3, field4, field5, field6);
        const { container } = render(
            <OntologyLookupOptions
                {...getDefaultProps()}
                domainFields={domainFields}
                field={field1}
                lockType={DOMAIN_FIELD_FULLY_LOCKED}
            />
        );
        await validateSelects(container, true, 3, 3, [null, 'field2', 'field4'], [null, 'field3', 'field4']);
    });
});
