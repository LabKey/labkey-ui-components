import { mount } from 'enzyme';
import { createFormInputId } from './actions';
import {
    DOMAIN_FIELD_CUSTOM_LENGTH,
    DOMAIN_FIELD_MAX_LENGTH,
    DOMAIN_FIELD_NOT_LOCKED,
    DOMAIN_FIELD_SCALE,
} from './constants';
import React from 'react';
import toJson from 'enzyme-to-json';
import { TextFieldOptions, TextFieldState } from './TextFieldOptions';


describe('TextFieldOptions', () => {

    test('Text data type', () => {
        const _section = 'Text Field Options';
        const _scale = 4000;
        const _scale2 = 200;

        const props = {
            index: 1,
            label: _section,
            scale: _scale,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED
        };

        let textField  = mount(<TextFieldOptions
            {...props}
        />);

        // Verify label
        const sectionLabel = textField.find({className: 'domain-field-section-heading'});
        expect(sectionLabel.length).toEqual(1);
        expect(sectionLabel.text()).toEqual(_section);

        // Verify max length is set for scale 4000
        let maxLength = textField.find({id: createFormInputId(DOMAIN_FIELD_MAX_LENGTH, 1)}).not({bsClass: 'form-control'});
        expect(maxLength.length).toEqual(1);
        expect(maxLength.props().checked).toEqual(true);

        // Custom length is not checked for scale 4000
        let customLength = textField.find({id: createFormInputId(DOMAIN_FIELD_CUSTOM_LENGTH, 1)}).not({bsClass: 'form-control'});
        expect(customLength.length).toEqual(1);
        expect(customLength.props().checked).toEqual(false);

        // Change scale and verify radio buttons
        const props2 = {
            index: 1,
            label: _section,
            scale: _scale2,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED
        };
        textField  = mount(<TextFieldOptions
            {...props2}
        />);
        const radioState = textField.state() as TextFieldState;
        expect(radioState.radio).toEqual(DOMAIN_FIELD_CUSTOM_LENGTH);

        // Custom value
        const lengthField = textField.find({id: createFormInputId(DOMAIN_FIELD_SCALE, 1), className: 'domain-text-length-field form-control'});
        expect(lengthField.length).toEqual(1);
        expect(lengthField.props().value).toEqual(_scale2);

        expect(toJson(textField)).toMatchSnapshot();
        textField.unmount();
    });
});
