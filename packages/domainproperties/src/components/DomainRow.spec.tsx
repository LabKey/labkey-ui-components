
import * as React from "react";
import renderer from 'react-test-renderer'
import {DomainField} from "../models";
import {DomainRow} from "./DomainRow";
import {
    ATTACHMENT_RANGE_URI,
    DATETIME_RANGE_URI,
    DOUBLE_RANGE_URI,
    PARTICIPANTID_CONCEPT_URI,
    STRING_RANGE_URI
} from "../constants";

describe('DomainRowDisplay', () => {

    test('with empty domain form', () => {
        const field = new DomainField();
        const tree  = renderer.create(<DomainRow
            index={1}
            field={field}
            onChange={jest.fn()}
        />).toJSON();

        expect(tree).toMatchSnapshot();
    });

    test('string field', () => {
        const field = new DomainField({
            name: 'key',
            rangeURI: STRING_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test'
        });

        const tree  = renderer.create(<DomainRow
            index={1}
            field={field}
            onChange={jest.fn()}
        />).toJSON();

        expect(tree).toMatchSnapshot();
    });

    test('decimal field', () => {
        const field = new DomainField({
            name: 'key',
            rangeURI: DOUBLE_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test'
        });

        const tree  = renderer.create(<DomainRow
            index={1}
            field={field}
            onChange={jest.fn()}
        />).toJSON();

        expect(tree).toMatchSnapshot();
    });

    test('date time field', () => {
        const field = new DomainField({
            name: 'key',
            rangeURI: DATETIME_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test'
        });

        const tree  = renderer.create(<DomainRow
            index={1}
            field={field}
            onChange={jest.fn()}
        />).toJSON();

        expect(tree).toMatchSnapshot();
    });

    test('participant id field', () => {
        const field = new DomainField({
            name: 'key',
            rangeURI: STRING_RANGE_URI,
            conceptURI: PARTICIPANTID_CONCEPT_URI,
            propertyId: 1,
            propertyURI: 'test'
        });

        const tree  = renderer.create(<DomainRow
            index={1}
            field={field}
            onChange={jest.fn()}
        />).toJSON();

        expect(tree).toMatchSnapshot();
    });

    test('attachment field', () => {
        const field = new DomainField({
            name: 'key',
            rangeURI: ATTACHMENT_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test'
        });

        const tree  = renderer.create(<DomainRow
            index={1}
            field={field}
            onChange={jest.fn()}
        />).toJSON();

        expect(tree).toMatchSnapshot();
    })
});