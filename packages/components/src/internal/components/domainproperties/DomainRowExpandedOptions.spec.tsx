import React from 'react';
import { mount } from 'enzyme';

import { DomainRowExpandedOptions } from './DomainRowExpandedOptions';
import { DomainField } from './models';
import { DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS, DOMAIN_FIELD_FULLY_LOCKED } from './constants';
import {
    BOOLEAN_TYPE,
    DATETIME_TYPE,
    DOUBLE_TYPE,
    FLAG_TYPE,
    INTEGER_TYPE,
    MULTILINE_TYPE,
    ONTOLOGY_LOOKUP_TYPE,
    SAMPLE_TYPE,
    TEXT_TYPE,
} from './PropDescType';
import { OntologyLookupOptions } from '../ontology/OntologyLookupOptions';
import { TextFieldOptions } from './TextFieldOptions';
import { BooleanFieldOptions } from './BooleanFieldOptions';
import { DateTimeFieldOptions } from './DateTimeFieldOptions';
import { NumericFieldOptions } from './NumericFieldOptions';
import { LookupFieldOptions } from './LookupFieldOptions';
import { SampleFieldOptions } from './SampleFieldOptions';
import { NameAndLinkingOptions } from './NameAndLinkingOptions';
import { ConditionalFormattingAndValidation } from './ConditionalFormattingAndValidation';

const DEFAULT_PROPS = {
    index: 1,
    domainIndex: 1,
    domainFormDisplayOptions: DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS,
    onChange: jest.fn(),
    onMultiChange: jest.fn(),
    showingModal: jest.fn(),
};

describe('DomainExpandedOptions', () => {
    function validateRender(row: any, expected: { [key: string]: number }, expectCondFormAndVal = true) {
        expect(row.find(TextFieldOptions)).toHaveLength(expected.text || 0);
        expect(row.find(BooleanFieldOptions)).toHaveLength(expected.boolean || 0);
        expect(row.find(DateTimeFieldOptions)).toHaveLength(expected.dateTime || 0);
        expect(row.find(NumericFieldOptions)).toHaveLength(expected.numeric || 0);
        expect(row.find(LookupFieldOptions)).toHaveLength(expected.lookup || 0);
        expect(row.find(SampleFieldOptions)).toHaveLength(expected.sample || 0);
        expect(row.find(OntologyLookupOptions)).toHaveLength(expected.ontologyLookup || 0);

        expect(row.find(NameAndLinkingOptions)).toHaveLength(1);
        expect(row.find(ConditionalFormattingAndValidation)).toHaveLength(expectCondFormAndVal ? 1 : 0);
    }

    test('Integer data type', () => {
        const field = DomainField.create({
            rangeURI: INTEGER_TYPE.rangeURI,
        });

        const row = mount(<DomainRowExpandedOptions {...DEFAULT_PROPS} field={field} />);
        validateRender(row, { numeric: 1 });
        row.unmount();
    });

    test('Double data type', () => {
        const field = DomainField.create({
            rangeURI: DOUBLE_TYPE.rangeURI,
        });

        const row = mount(<DomainRowExpandedOptions {...DEFAULT_PROPS} field={field} />);
        validateRender(row, { numeric: 1 });
        row.unmount();
    });

    test('Boolean data type', () => {
        const field = DomainField.create({
            rangeURI: BOOLEAN_TYPE.rangeURI,
        });

        const row = mount(<DomainRowExpandedOptions {...DEFAULT_PROPS} field={field} />);
        validateRender(row, { boolean: 1 });
        row.unmount();
    });

    test('Date/time data type', () => {
        const field = DomainField.create({
            rangeURI: DATETIME_TYPE.rangeURI,
        });

        const row = mount(<DomainRowExpandedOptions {...DEFAULT_PROPS} field={field} />);
        validateRender(row, { dateTime: 1 });
        row.unmount();
    });

    test('Text data type', () => {
        const field = DomainField.create({
            rangeURI: TEXT_TYPE.rangeURI,
        });

        const row = mount(<DomainRowExpandedOptions {...DEFAULT_PROPS} field={field} />);
        validateRender(row, { text: 1 });
        row.unmount();
    });

    test('No text options for primary key', () => {
        const field = DomainField.create({
            rangeURI: TEXT_TYPE.rangeURI,
            isPrimaryKey: true,
        });

        const row = mount(<DomainRowExpandedOptions {...DEFAULT_PROPS} field={field} />);
        validateRender(row, {});
        row.unmount();
    });

    test('No text options', () => {
        const field = DomainField.create({
            rangeURI: TEXT_TYPE.rangeURI,
        });

        const row = mount(
            <DomainRowExpandedOptions
                {...DEFAULT_PROPS}
                field={field}
                domainFormDisplayOptions={{
                    hideTextOptions: true,
                }}
            />
        );
        validateRender(row, {});
        row.unmount();
    });

    test('Flag data type', () => {
        const field = DomainField.create({
            conceptURI: FLAG_TYPE.conceptURI,
            rangeURI: FLAG_TYPE.rangeURI,
        });

        const row = mount(<DomainRowExpandedOptions {...DEFAULT_PROPS} field={field} />);
        validateRender(row, { text: 1 });
        row.unmount();
    });

    test('Multiline data type', () => {
        const field = DomainField.create({
            rangeURI: MULTILINE_TYPE.rangeURI,
        });

        const row = mount(<DomainRowExpandedOptions {...DEFAULT_PROPS} field={field} />);
        validateRender(row, { text: 1 });
        row.unmount();
    });

    test('Ontology data type', () => {
        const field = DomainField.create({
            conceptURI: ONTOLOGY_LOOKUP_TYPE.conceptURI,
            rangeURI: ONTOLOGY_LOOKUP_TYPE.rangeURI,
        });

        const row = mount(<DomainRowExpandedOptions {...DEFAULT_PROPS} field={field} />);
        validateRender(row, { ontologyLookup: 1 });
        row.unmount();
    });

    test('Sample data type', () => {
        const field = DomainField.create({
            conceptURI: SAMPLE_TYPE.conceptURI,
            rangeURI: SAMPLE_TYPE.rangeURI,
        });

        const row = mount(<DomainRowExpandedOptions {...DEFAULT_PROPS} field={field} />);
        validateRender(row, { sample: 1 });
        row.unmount();
    });

    test('Fully locked data type', () => {
        const field = DomainField.create({
            rangeURI: TEXT_TYPE.rangeURI,
            lockType: DOMAIN_FIELD_FULLY_LOCKED,
        });

        const row = mount(<DomainRowExpandedOptions {...DEFAULT_PROPS} field={field} />);
        validateRender(row, { text: 1 }, false);
        row.unmount();
    });
});
