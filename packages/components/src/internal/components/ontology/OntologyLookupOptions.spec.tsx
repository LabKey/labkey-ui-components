import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { List } from 'immutable';

import { DomainField } from '../../..';
import { sleep } from '../../testHelpers';
import { initUnitTestMocks } from '../../testHelperMocks';

import { SectionHeading } from '../domainproperties/SectionHeading';
import { INTEGER_TYPE, ONTOLOGY_LOOKUP_TYPE, TEXT_TYPE } from '../domainproperties/PropDescType';
import { DOMAIN_FIELD_FULLY_LOCKED } from '../domainproperties/constants';

import { OntologyLookupOptions } from './OntologyLookupOptions';

const DEFAULT_PROPS = {
    index: 0,
    domainIndex: 0,
    label: 'Test',
    lockType: undefined,
    onChange: jest.fn(),
};

const field1 = DomainField.create({
    name: 'field1',
    conceptURI: ONTOLOGY_LOOKUP_TYPE.conceptURI,
    rangeURI: ONTOLOGY_LOOKUP_TYPE.rangeURI,
    sourceOntology: 'NCIT',
    conceptImportColumn: 'field2',
    conceptLabelColumn: 'field3',
});
const field2 = DomainField.create({
    name: 'field2', // conceptImportColumn
    rangeURI: TEXT_TYPE.rangeURI,
});
const field3 = DomainField.create({
    name: 'field3', // conceptLabelColumn
    rangeURI: TEXT_TYPE.rangeURI,
});
const field4 = DomainField.create({
    name: 'field4', // other text field that should show as option
    rangeURI: TEXT_TYPE.rangeURI,
});
const field5 = DomainField.create({
    name: 'field5', // int field should not show as option
    rangeURI: INTEGER_TYPE.rangeURI,
});
const field6 = DomainField.create({
    name: '', // invalid name field should not show as option
    rangeURI: TEXT_TYPE.rangeURI,
});

beforeAll(() => {
    initUnitTestMocks();
});

describe('OntologyLookupOptions', () => {
    function validate(
        wrapper: ReactWrapper,
        disabled: boolean,
        selectedSource: string,
        importOptions: string[],
        labelOptions: string[]
    ): void {
        expect(wrapper.find(SectionHeading)).toHaveLength(1);
        expect(wrapper.find('.domain-field-label')).toHaveLength(3);

        const selectInputs = wrapper.find('select');
        expect(selectInputs).toHaveLength(3);

        // source ontology select
        let selectInput = selectInputs.at(0);
        expect(selectInput.prop('disabled')).toBe(disabled);
        expect(selectInput.prop('value')).toBe(selectedSource);
        let options = selectInput.children();
        expect(options).toHaveLength(2);
        expect(options.find({ value: '45887' })).toHaveLength(1);
        expect(options.find({ value: 'NCIT' })).toHaveLength(1);

        // import field select
        selectInput = selectInputs.at(1);
        expect(selectInput.prop('disabled')).toBe(disabled);
        options = selectInput.children();
        expect(options).toHaveLength(importOptions.length);
        importOptions.forEach(value => {
            expect(options.find({ value })).toHaveLength(1);
        });

        // label field select
        selectInput = selectInputs.at(2);
        expect(selectInput.prop('disabled')).toBe(disabled);
        options = selectInput.children();
        expect(options).toHaveLength(labelOptions.length);
        labelOptions.forEach(value => {
            expect(options.find({ value })).toHaveLength(1);
        });
    }

    test('default props', async () => {
        const field = DomainField.create({});
        const domainFields = List.of(field);

        const wrapper = mount(<OntologyLookupOptions {...DEFAULT_PROPS} field={field} domainFields={domainFields} />);
        await sleep();
        wrapper.update();

        validate(wrapper, false, undefined, [null], [null]);
        wrapper.unmount();
    });

    test('with additional fields and ontology field props', async () => {
        const domainFields = List.of(field1, field2, field3, field4, field5, field6);
        const wrapper = mount(<OntologyLookupOptions {...DEFAULT_PROPS} field={field1} domainFields={domainFields} />);
        await sleep();
        wrapper.update();

        validate(wrapper, false, 'NCIT', [null, 'field2', 'field4'], [null, 'field3', 'field4']);
        wrapper.unmount();
    });

    test('disabled selects', async () => {
        const domainFields = List.of(field1, field2, field3, field4, field5, field6);
        const wrapper = mount(
            <OntologyLookupOptions
                {...DEFAULT_PROPS}
                field={field1}
                domainFields={domainFields}
                lockType={DOMAIN_FIELD_FULLY_LOCKED}
            />
        );
        await sleep();
        wrapper.update();

        validate(wrapper, true, 'NCIT', [null, 'field2', 'field4'], [null, 'field3', 'field4']);
        wrapper.unmount();
    });
});
