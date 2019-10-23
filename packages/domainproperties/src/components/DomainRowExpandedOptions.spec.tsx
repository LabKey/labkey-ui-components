import {DomainRowExpandedOptions} from "./DomainRowExpandedOptions";
import * as React from "react";
import {DomainField} from "../models";
import {BOOLEAN_RANGE_URI, DATETIME_RANGE_URI, INT_RANGE_URI, STRING_RANGE_URI} from "../constants";
import {mount} from "enzyme";
import toJson from "enzyme-to-json";


describe('DomainExpandedOptions', () => {

    test('Numeric data type', () => {
        const field = DomainField.create({
            name: 'key',
            rangeURI: INT_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test'
        });

        const row  = mount(<DomainRowExpandedOptions
            field={field}
            index={1}
            onChange={jest.fn()}
            onMultiChange={jest.fn()}
            setDragDisabled={jest.fn()}
        />);

        expect(toJson(row)).toMatchSnapshot();
        row.unmount();
    });

    test('Boolean data type', () => {
        const field = DomainField.create({
            name: 'key',
            rangeURI: BOOLEAN_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test'
        });

        const row  = mount(<DomainRowExpandedOptions
            field={field}
            index={1}
            onChange={jest.fn()}
            onMultiChange={jest.fn()}
            setDragDisabled={jest.fn()}
        />);

        expect(toJson(row)).toMatchSnapshot();
        row.unmount();
    });

    test('Date/time data type', () => {
        const field = DomainField.create({
            name: 'key',
            rangeURI: DATETIME_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test'
        });

        const row  = mount(<DomainRowExpandedOptions
            field={field}
            index={1}
            onChange={jest.fn()}
            onMultiChange={jest.fn()}
            setDragDisabled={jest.fn()}
        />);

        expect(toJson(row)).toMatchSnapshot();
        row.unmount();
    });

    test('Text data type', () => {
        const field = DomainField.create({
            name: 'key',
            rangeURI: STRING_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test'
        });

        const row  = mount(<DomainRowExpandedOptions
            field={field}
            index={1}
            onChange={jest.fn()}
            onMultiChange={jest.fn()}
            setDragDisabled={jest.fn()}
        />);

        expect(toJson(row)).toMatchSnapshot();
        row.unmount();
    });

});