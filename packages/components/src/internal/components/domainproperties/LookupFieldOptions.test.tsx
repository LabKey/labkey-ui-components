/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react';

import { MockLookupProvider } from '../../../test/MockLookupProvider';

import { createFormInputId } from './utils';
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
import { LookupFieldOptions } from './LookupFieldOptions';
import { PropDescType } from './PropDescType';

describe('LookupFieldOptions', () => {
    function getFolderSelect(domainIndex: number, index: number): HTMLSelectElement {
        return document.getElementById(
            createFormInputId(DOMAIN_FIELD_LOOKUP_CONTAINER, domainIndex, index)
        ) as HTMLSelectElement;
    }

    function getSchemaSelect(domainIndex: number, index: number): HTMLSelectElement {
        return document.getElementById(
            createFormInputId(DOMAIN_FIELD_LOOKUP_SCHEMA, domainIndex, index)
        ) as HTMLSelectElement;
    }

    function getQuerySelect(domainIndex: number, index: number): HTMLSelectElement {
        return document.getElementById(
            createFormInputId(DOMAIN_FIELD_LOOKUP_QUERY, domainIndex, index)
        ) as HTMLSelectElement;
    }

    test('Lookup field options', async () => {
        const _container = '/StudyVerifyProject/My Study';
        const _schema = 'exp';
        const _index = 1;
        const _domainIndex = 1;
        const _label = 'Lookup Field Options';

        const field = DomainField.create({
            name: 'key',
            rangeURI: INT_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test',
        });

        render(
            <MockLookupProvider>
                <LookupFieldOptions
                    field={
                        new DomainField({
                            original: field,
                            dataType: PropDescType.fromName('lookup'),
                            lookupSchema: _schema,
                            lookupQueryValue: 'Data',
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
        expect(document.querySelector('.domain-field-section-heading')).toHaveTextContent(_label);

        // Folder: wait for 2 containers to load (plus the "Current Folder" option = 3 total)
        await waitFor(() => expect(getFolderSelect(_domainIndex, _index).options.length).toBeGreaterThan(1));
        const folderOptions = Array.from(getFolderSelect(_domainIndex, _index).options).map(o => o.text);
        expect(folderOptions).toHaveLength(3);
        expect(folderOptions).toContain('/StudyVerifyProject');
        expect(folderOptions).toContain('/StudyVerifyProject/My Study');

        // Schema: wait for 5 schemas to load for /StudyVerifyProject/My Study (sorted by fullyQualifiedName)
        await waitFor(() => expect(getSchemaSelect(_domainIndex, _index).options.length).toBe(5));
        expect(getSchemaSelect(_domainIndex, _index).options[0].value).toBe('exp');
        expect(getSchemaSelect(_domainIndex, _index).options[4].value).toBe('study');

        // Query: wait for 3 queries to load for exp schema
        await waitFor(() => expect(getQuerySelect(_domainIndex, _index).options.length).toBe(3));
        const queryOptions = Array.from(getQuerySelect(_domainIndex, _index).options).map(o => o.text);
        expect(queryOptions[1]).toContain('DataInputs');
    });

    test('Selected container changes schemas', async () => {
        const _container1 = '/StudyVerifyProject/My Study';
        const _container2 = '/StudyVerifyProject';
        const _index = 1;
        const _domainIndex = 1;
        const _schema = 'exp';
        const _label = 'Lookup Field Options';

        const field = DomainField.create({
            name: 'key',
            rangeURI: INT_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test',
        });

        const { rerender } = render(
            <MockLookupProvider>
                <LookupFieldOptions
                    field={
                        new DomainField({
                            original: field,
                            dataType: PropDescType.fromName('lookup'),
                            lookupSchema: _schema,
                            lookupQueryValue: 'Data',
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

        // Wait for initial schemas to load for /StudyVerifyProject/My Study (5 schemas)
        await waitFor(() => expect(getSchemaSelect(_domainIndex, _index).options.length).toBe(5));
        expect(getSchemaSelect(_domainIndex, _index).options[0].value).toBe('exp');
        expect(getSchemaSelect(_domainIndex, _index).options[1].value).toBe('exp.data');
        expect(getSchemaSelect(_domainIndex, _index).options[2].value).toBe('exp.materials');
        expect(getSchemaSelect(_domainIndex, _index).options[3].value).toBe('lists');
        expect(getSchemaSelect(_domainIndex, _index).options[4].value).toBe('study');

        // Re-render with the new container
        rerender(
            <MockLookupProvider>
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
            </MockLookupProvider>
        );

        // Schema count should update to 1 for /StudyVerifyProject (only 'lists')
        await waitFor(() => expect(getSchemaSelect(_domainIndex, _index).options.length).toBe(2));
        expect(getSchemaSelect(_domainIndex, _index).options[0].value).toBe('');
        expect(getSchemaSelect(_domainIndex, _index).options[1].value).toBe('lists');
    });

    test('Selected schema changes queries', async () => {
        const _container = '/StudyVerifyProject/My Study';
        const _schema1 = 'exp';
        const _schema2 = 'study';
        const _label = 'Lookup Field Options';
        const _index = 1;
        const _domainIndex = 1;

        const field = DomainField.create({
            name: 'key',
            rangeURI: INT_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test',
        });

        const { rerender } = render(
            <MockLookupProvider>
                <LookupFieldOptions
                    field={
                        new DomainField({
                            original: field,
                            dataType: PropDescType.fromName('lookup'),
                            lookupSchema: _schema1,
                            lookupQueryValue: 'Data',
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

        // Wait for initial query options (4: 3 from exp + 1 prepended for invalid lookup since lookupIsValid is not set)
        await waitFor(() => expect(getQuerySelect(_domainIndex, _index).options.length).toBe(4));
        expect(getSchemaSelect(_domainIndex, _index).options[0].value).toBe('exp');
        expect(getSchemaSelect(_domainIndex, _index).options[1].value).toBe('exp.data');
        expect(getSchemaSelect(_domainIndex, _index).options[2].value).toBe('exp.materials');
        expect(getSchemaSelect(_domainIndex, _index).options[3].value).toBe('lists');

        // Re-render with the new schema (study)
        rerender(
            <MockLookupProvider>
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
            </MockLookupProvider>
        );

        // Query options should update to 1 (study schema has 1 query: Treatment)
        await waitFor(() => expect(getQuerySelect(_domainIndex, _index).options.length).toBe(2));
        expect(getQuerySelect(_domainIndex, _index).options[0].text).toContain('');
        expect(getQuerySelect(_domainIndex, _index).options[1].text).toContain('Treatment');
    });

    test('Selected container changes queries', async () => {
        const _container1 = '/StudyVerifyProject/My Study';
        const _container2 = '/StudyVerifyProject';
        const _schema1 = 'exp';
        const _label = 'Lookup Field Options';
        const _index = 1;
        const _domainIndex = 1;

        const field = DomainField.create({
            name: 'key',
            rangeURI: INT_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test',
        });

        const { rerender } = render(
            <MockLookupProvider>
                <LookupFieldOptions
                    field={
                        new DomainField({
                            original: field,
                            dataType: PropDescType.fromName('lookup'),
                            lookupSchema: _schema1,
                            lookupQueryValue: 'Data',
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

        // Wait for initial query options (3 queries for exp in /StudyVerifyProject/My Study)
        await waitFor(() => expect(getQuerySelect(_domainIndex, _index).options.length).toBe(3));

        // Re-render with the new container and empty schema/query
        rerender(
            <MockLookupProvider>
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
            </MockLookupProvider>
        );

        // No schema selected → no queries; the select shows a disabled "(No tables)" option
        await waitFor(() =>
            expect(
                document.querySelector(
                    `#${createFormInputId(DOMAIN_FIELD_LOOKUP_QUERY, _domainIndex, _index)} option[disabled]`
                )
            ).toHaveTextContent('(No tables)')
        );
    });

    test('lockType', async () => {
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

        async function validateDisabled(lockType: string, expectDisabled: boolean): Promise<void> {
            const { unmount } = render(
                <MockLookupProvider>
                    <LookupFieldOptions {...base} lockType={lockType} />
                </MockLookupProvider>
            );

            if (expectDisabled) {
                expect(getFolderSelect(0, 0)).toBeDisabled();
                expect(getSchemaSelect(0, 0)).toBeDisabled();
                expect(getQuerySelect(0, 0)).toBeDisabled();
            } else {
                // Wait for async loading to complete before checking enabled state
                await waitFor(() => expect(getFolderSelect(0, 0)).not.toBeDisabled());
                expect(getSchemaSelect(0, 0)).not.toBeDisabled();
            }

            unmount();
        }

        await validateDisabled(DOMAIN_FIELD_NOT_LOCKED, false);
        await validateDisabled(DOMAIN_FIELD_PARTIALLY_LOCKED, true);
        await validateDisabled(DOMAIN_FIELD_FULLY_LOCKED, true);
    });

    test('Invalid lookup', async () => {
        const _index = 1;
        const _domainIndex = 1;
        const _invalidLookup = 'rangeURI|InvalidLookup';

        const field = DomainField.create({
            name: 'key',
            rangeURI: INT_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test',
        });

        render(
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

        // Wait for queries to load: exp queries plus the invalid/unknown query prepended = 4 total
        await waitFor(() => expect(getQuerySelect(_domainIndex, _index).options.length).toBe(4));

        // The invalid lookup entry is prepended with 'Unknown' label
        const firstOption = getQuerySelect(_domainIndex, _index).options[0].text;
        expect(firstOption).toContain('InvalidLookup');
        expect(firstOption).toContain('Unknown');
    });
});
