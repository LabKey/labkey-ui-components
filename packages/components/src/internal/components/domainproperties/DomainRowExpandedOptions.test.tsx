import React from 'react';
import { render } from '@testing-library/react';

import { waitFor } from '@testing-library/dom';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { DomainRowExpandedOptions } from './DomainRowExpandedOptions';
import { DomainField } from './models';
import { DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS, DOMAIN_FIELD_FULLY_LOCKED } from './constants';
import {
    BOOLEAN_TYPE,
    CALCULATED_TYPE,
    DATETIME_TYPE,
    DOUBLE_TYPE,
    FLAG_TYPE,
    INTEGER_TYPE,
    MULTILINE_TYPE,
    ONTOLOGY_LOOKUP_TYPE,
    SAMPLE_TYPE,
    TEXT_CHOICE_TYPE,
    TEXT_TYPE,
} from './PropDescType';

jest.mock('./actions', () => ({
    ...jest.requireActual('./actions'),
    fetchQueries: jest.fn().mockResolvedValue([]),
}));

const DEFAULT_PROPS = {
    index: 1,
    domainIndex: 1,
    domainFormDisplayOptions: DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS,
    onChange: jest.fn(),
    onMultiChange: jest.fn(),
    showingModal: jest.fn(),
};

describe('DomainRowExpandedOptions', () => {
    test('Integer data type', async () => {
        const field = DomainField.create({
            rangeURI: INTEGER_TYPE.rangeURI,
        });

        render(<DomainRowExpandedOptions {...DEFAULT_PROPS} field={field} />);

        await waitFor(() => {
            const headers = document.querySelectorAll('.domain-field-section-heading');
            expect(headers.length).toBe(3);
            expect(headers[0].textContent).toBe('Integer Options');
            expect(headers[1].textContent).toBe('Name and Linking Options');
            expect(headers[2].textContent).toBe('Conditional Formatting and Validation Options');
        });
    });

    test('Double data type', async () => {
        const field = DomainField.create({
            rangeURI: DOUBLE_TYPE.rangeURI,
        });

        render(<DomainRowExpandedOptions {...DEFAULT_PROPS} field={field} />);

        await waitFor(() => {
            const headers = document.querySelectorAll('.domain-field-section-heading');
            expect(headers.length).toBe(3);
            expect(headers[0].textContent).toBe('Decimal Options');
            expect(headers[1].textContent).toBe('Name and Linking Options');
            expect(headers[2].textContent).toBe('Conditional Formatting and Validation Options');
        });
    });

    test('Boolean data type', async () => {
        const field = DomainField.create({
            rangeURI: BOOLEAN_TYPE.rangeURI,
        });

        render(<DomainRowExpandedOptions {...DEFAULT_PROPS} field={field} />);

        await waitFor(() => {
            const headers = document.querySelectorAll('.domain-field-section-heading');
            expect(headers.length).toBe(3);
            expect(headers[0].textContent).toBe('Boolean Field Options');
            expect(headers[1].textContent).toBe('Name and Linking Options');
            expect(headers[2].textContent).toBe('Conditional Formatting Options');
        });
    });

    test('Date/time data type', async () => {
        const field = DomainField.create({
            rangeURI: DATETIME_TYPE.rangeURI,
        });

        render(<DomainRowExpandedOptions {...DEFAULT_PROPS} field={field} />);

        await waitFor(() => {
            const headers = document.querySelectorAll('.domain-field-section-heading');
            expect(headers.length).toBe(3);
            expect(headers[0].textContent).toBe('Date and Time Options');
            expect(headers[1].textContent).toBe('Name and Linking Options');
            expect(headers[2].textContent).toBe('Conditional Formatting and Validation Options');
        });
    });

    test('Text data type', async () => {
        const field = DomainField.create({
            rangeURI: TEXT_TYPE.rangeURI,
        });

        render(<DomainRowExpandedOptions {...DEFAULT_PROPS} field={field} />);

        await waitFor(() => {
            const headers = document.querySelectorAll('.domain-field-section-heading');
            expect(headers.length).toBe(3);
            expect(headers[0].textContent).toBe('Text Options');
            expect(headers[1].textContent).toBe('Name and Linking Options');
            expect(headers[2].textContent).toBe('Conditional Formatting and Validation Options');
        });
    });

    test('No text options for primary key', async () => {
        const field = DomainField.create({
            rangeURI: TEXT_TYPE.rangeURI,
            isPrimaryKey: true,
        });

        render(<DomainRowExpandedOptions {...DEFAULT_PROPS} field={field} />);

        await waitFor(() => {
            const headers = document.querySelectorAll('.domain-field-section-heading');
            expect(headers.length).toBe(2);
            expect(headers[0].textContent).toBe('Name and Linking Options');
            expect(headers[1].textContent).toBe('Conditional Formatting and Validation Options');
        });
    });

    test('No text options', async () => {
        const field = DomainField.create({
            rangeURI: TEXT_TYPE.rangeURI,
        });

        render(
            <DomainRowExpandedOptions
                {...DEFAULT_PROPS}
                field={field}
                domainFormDisplayOptions={{
                    hideTextOptions: true,
                }}
            />
        );

        await waitFor(() => {
            const headers = document.querySelectorAll('.domain-field-section-heading');
            expect(headers.length).toBe(2);
            expect(headers[0].textContent).toBe('Name and Linking Options');
            expect(headers[1].textContent).toBe('Conditional Formatting and Validation Options');
        });
    });

    test('Flag data type', async () => {
        const field = DomainField.create({
            conceptURI: FLAG_TYPE.conceptURI,
            rangeURI: FLAG_TYPE.rangeURI,
        });

        render(<DomainRowExpandedOptions {...DEFAULT_PROPS} field={field} />);

        await waitFor(() => {
            const headers = document.querySelectorAll('.domain-field-section-heading');
            expect(headers.length).toBe(3);
            expect(headers[0].textContent).toBe('Flag Options');
            expect(headers[1].textContent).toBe('Name and Linking Options');
            expect(headers[2].textContent).toBe('Conditional Formatting and Validation Options');
        });
    });

    test('Multiline data type', async () => {
        const field = DomainField.create({
            rangeURI: MULTILINE_TYPE.rangeURI,
        });

        render(<DomainRowExpandedOptions {...DEFAULT_PROPS} field={field} />);

        await waitFor(() => {
            const headers = document.querySelectorAll('.domain-field-section-heading');
            expect(headers.length).toBe(3);
            expect(headers[0].textContent).toBe('Multi-line Text Field Options');
            expect(headers[1].textContent).toBe('Name and Linking Options');
            expect(headers[2].textContent).toBe('Conditional Formatting and Validation Options');
        });
    });

    test('Ontology data type', async () => {
        // FIXME: This test is disabled because the Ontology lookup components make network requests, which causes
        //  failures. They'll need to be updated to get their API methods from context.
        // const field = DomainField.create({
        //     conceptURI: ONTOLOGY_LOOKUP_TYPE.conceptURI,
        //     rangeURI: ONTOLOGY_LOOKUP_TYPE.rangeURI,
        // });
        //
        // render(<DomainRowExpandedOptions {...DEFAULT_PROPS} field={field} />);
        //
        // await waitFor(() => {
        //     const headers = document.querySelectorAll('.domain-field-section-heading');
        //     expect(headers.length).toBe(3);
        //     expect(headers[0].textContent).toBe('Ontology Lookup Options');
        //     expect(headers[1].textContent).toBe('Name and Linking Options');
        //     expect(headers[2].textContent).toBe('Conditional Formatting and Validation Options');
        // });
    });

    test('Sample data type', async () => {
        const field = DomainField.create({
            conceptURI: SAMPLE_TYPE.conceptURI,
            rangeURI: SAMPLE_TYPE.rangeURI,
        });

        render(<DomainRowExpandedOptions {...DEFAULT_PROPS} field={field} />);

        await waitFor(() => {
            const headers = document.querySelectorAll('.domain-field-section-heading');
            expect(headers.length).toBe(3);
            expect(headers[0].textContent).toBe('Sample Options');
            expect(headers[1].textContent).toBe('Name and Linking Options');
            expect(headers[2].textContent).toBe('Conditional Formatting Options');
        });
    });

    test('Text Choice data type', async () => {
        const field = DomainField.create({
            conceptURI: TEXT_CHOICE_TYPE.conceptURI,
            rangeURI: TEXT_CHOICE_TYPE.rangeURI,
        });

        render(<DomainRowExpandedOptions {...DEFAULT_PROPS} field={field} />);

        await waitFor(() => {
            const headers = document.querySelectorAll('.domain-field-section-heading');
            expect(headers.length).toBe(3);
            expect(headers[0].textContent).toBe('Text Choice Options');
            expect(headers[1].textContent).toBe('Name and Linking Options');
            expect(headers[2].textContent).toBe('Conditional Formatting Options');
        });
    });

    test('Calculation data type, text', async () => {
        const field = DomainField.create({
            conceptURI: CALCULATED_TYPE.conceptURI,
            rangeURI: TEXT_TYPE.rangeURI,
        });

        renderWithAppContext(<DomainRowExpandedOptions {...DEFAULT_PROPS} field={field} />);

        await waitFor(() => {
            const headers = document.querySelectorAll('.domain-field-section-heading');
            expect(headers.length).toBe(3);
            expect(headers[0].textContent).toBe('Expression');
            expect(headers[1].textContent).toBe('Name and Linking Options');
            expect(headers[2].textContent).toBe('Conditional Formatting Options');
        });
    });

    test('Calculation data type, non-text', async () => {
        const field = DomainField.create({
            conceptURI: CALCULATED_TYPE.conceptURI,
            rangeURI: INTEGER_TYPE.rangeURI,
        });

        renderWithAppContext(<DomainRowExpandedOptions {...DEFAULT_PROPS} field={field} />);

        await waitFor(() => {
            const headers = document.querySelectorAll('.domain-field-section-heading');
            expect(headers.length).toBe(4);
            expect(headers[0].textContent).toBe('Expression');
            expect(headers[1].textContent).toBe('Integer Options');
            expect(headers[2].textContent).toBe('Name and Linking Options');
            expect(headers[3].textContent).toBe('Conditional Formatting Options');
        });
    });

    test('Fully locked data type', async () => {
        const field = DomainField.create({
            rangeURI: TEXT_TYPE.rangeURI,
            lockType: DOMAIN_FIELD_FULLY_LOCKED,
        });

        render(<DomainRowExpandedOptions {...DEFAULT_PROPS} field={field} />);

        await waitFor(() => {
            const headers = document.querySelectorAll('.domain-field-section-heading');
            expect(headers.length).toBe(2);
            expect(headers[0].textContent).toBe('Text Options');
            expect(headers[1].textContent).toBe('Name and Linking Options');
        });
    });

    test('Include DerivationDataScope', async () => {
        const field = DomainField.create({
            rangeURI: BOOLEAN_TYPE.rangeURI,
        });

        const displayOption = { ...DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS };
        displayOption['derivationDataScopeConfig'] = { show: true };
        const props = { ...DEFAULT_PROPS, domainFormDisplayOptions: displayOption };
        render(<DomainRowExpandedOptions {...props} field={field} />);

        await waitFor(() => {
            const headers = document.querySelectorAll('.domain-field-section-heading');
            expect(headers.length).toBe(4);
            expect(headers[0].textContent).toBe(''); // derive / aliquot
            expect(headers[1].textContent).toBe('Boolean Field Options');
            expect(headers[2].textContent).toBe('Name and Linking Options');
            expect(headers[3].textContent).toBe('Conditional Formatting Options');
        });
    });
});
