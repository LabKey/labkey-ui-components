import {mount} from "enzyme";
import {createFormInputId} from "../actions/actions";
import {DOMAIN_FIELD_EXCLUDE_FROM_SHIFTING, DOMAIN_FIELD_FORMAT} from "../constants";
import * as React from "react";
import {DateTimeFieldOptions} from "./DateTimeFieldOptions";
import toJson from "enzyme-to-json";


describe('DateTimeFieldOptions', () => {

    test('Date Time data type', () => {
        const _section = 'Date and Time Field Options';
        const _format = 'yyyy/MM/dd';
        const _format2 = 'MM/dd/yyyy hh:mm';

        const props = {
            index: 1,
            label: _section,
            format: _format,
            excludeFromShifting: true,
            onChange: jest.fn()
        };

        const dateTime  = mount(<DateTimeFieldOptions
            {...props}
        />);

        // Verify label
        const sectionLabel = dateTime.find({className: 'domain-field-section-heading'});
        expect(sectionLabel.length).toEqual(1);
        expect(sectionLabel.text()).toEqual(_section);

        // Test format field initial value
        let formatField = dateTime.find({id: createFormInputId(DOMAIN_FIELD_FORMAT, 1), className: 'form-control'});
        expect(formatField.length).toEqual(1);
        expect(formatField.props().value).toEqual(_format);

        // Verify format value changes with props
        dateTime.setProps({format: _format2});
        formatField = dateTime.find({id: createFormInputId(DOMAIN_FIELD_FORMAT, 1), className: 'form-control'});
        expect(formatField.props().value).toEqual(_format2);

        // Verify checked field
        let excludeField = dateTime.find({id: createFormInputId(DOMAIN_FIELD_EXCLUDE_FROM_SHIFTING, 1)});
        expect(excludeField.length).toEqual(1);
        expect(excludeField.props().checked).toEqual(true);

        // Uncheck excludeFromShifting
        dateTime.setProps({excludeFromShifting: false});
        excludeField = dateTime.find({id: createFormInputId(DOMAIN_FIELD_EXCLUDE_FROM_SHIFTING, 1)});
        expect(excludeField.props().checked).toEqual(false);

        expect(toJson(dateTime)).toMatchSnapshot();
        dateTime.unmount();
    });
});