import { mount } from 'enzyme';
import React from 'react';

import { createFormInputId } from './utils';
import {
    DOMAIN_FIELD_CUSTOM_LENGTH,
    DOMAIN_FIELD_MAX_LENGTH,
    DOMAIN_FIELD_NOT_LOCKED,
    DOMAIN_FIELD_SCALE,
    MAX_TEXT_LENGTH,
} from './constants';

import { TextFieldOptions, TextFieldState } from './TextFieldOptions';

const SCANNABLE_OPTION_CLASS = '.domain-text-option-scannable';

describe('TextFieldOptions', () => {
    test('Text data type', () => {
        const maxLengthRadio = { id: createFormInputId(DOMAIN_FIELD_MAX_LENGTH, 1, 1) };
        const customLengthRadio = { id: createFormInputId(DOMAIN_FIELD_CUSTOM_LENGTH, 1, 1) };
        const scaleInput = {
            id: createFormInputId(DOMAIN_FIELD_SCALE, 1, 1),
            className: 'form-control domain-text-length-field',
        };

        const _section = 'Text Field Options';
        const _scale0 = MAX_TEXT_LENGTH;
        const _scale1 = 4001; // using a value larger then the max length of 4000, will revert back to unlimited
        const _scale2 = 200;

        const props0 = {
            index: 1,
            domainIndex: 1,
            label: _section,
            scale: _scale0,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
        };

        let textField = mount(<TextFieldOptions {...props0} />);

        // Verify label
        const sectionLabel = textField.find({ className: 'domain-field-section-heading' });
        expect(sectionLabel.length).toEqual(1);
        expect(sectionLabel.text()).toEqual(_section);

        // Verify max length is not set for scale 4000
        const maxLength = textField.find(maxLengthRadio).not({ bsClass: 'form-control' });
        expect(maxLength.length).toEqual(1);
        expect(maxLength.props().checked).toEqual(false);

        // Custom length is checked for scale 4000
        const customLength = textField.find(customLengthRadio).not({ bsClass: 'form-control' });
        expect(customLength.length).toEqual(1);
        expect(customLength.props().checked).toEqual(true);

        // Custom value
        const lengthField0 = textField.find(scaleInput);
        expect(lengthField0.length).toEqual(1);
        expect(lengthField0.props().value).toEqual(MAX_TEXT_LENGTH);

        // Change scale to a value larger then max allowed and verify radio buttons
        const props1 = {
            index: 1,
            domainIndex: 1,
            label: _section,
            scale: _scale1,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
        };
        textField = mount(<TextFieldOptions {...props1} />);
        const radioState1 = textField.state() as TextFieldState;
        expect(radioState1.radio).toEqual(DOMAIN_FIELD_MAX_LENGTH);

        // Custom value
        const lengthField1 = textField.find(scaleInput);
        expect(lengthField1.length).toEqual(1);
        expect(lengthField1.props().value).toEqual(MAX_TEXT_LENGTH);

        // Change scale and verify radio buttons
        const props2 = {
            index: 1,
            domainIndex: 1,
            label: _section,
            scale: _scale2,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
        };
        textField = mount(<TextFieldOptions {...props2} />);
        const radioState2 = textField.state() as TextFieldState;
        expect(radioState2.radio).toEqual(DOMAIN_FIELD_CUSTOM_LENGTH);

        // Custom value
        const lengthField2 = textField.find(scaleInput);
        expect(lengthField2.length).toEqual(1);
        expect(lengthField2.props().value).toEqual(_scale2);

        expect(textField).toMatchSnapshot();
        textField.unmount();
    });

    test('Scannable Option field not shown', () => {
        const props = {
            index: 1,
            domainIndex: 1,
            label: 'Text Field Options',
            scale: 4000,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
        };

        // All cases below should not display the field
        const textField = mount(<TextFieldOptions {...props} showScannableOption={false} appPropertiesOnly={false} />);
        expect(textField.find(SCANNABLE_OPTION_CLASS)).toHaveLength(0);
        textField.unmount();

        const textField2 = mount(<TextFieldOptions {...props} showScannableOption={true} appPropertiesOnly={false} />);
        expect(textField2.find(SCANNABLE_OPTION_CLASS)).toHaveLength(0);
        textField2.unmount();

        const textField3 = mount(<TextFieldOptions {...props} showScannableOption={false} appPropertiesOnly={true} />);
        expect(textField3.find(SCANNABLE_OPTION_CLASS)).toHaveLength(0);
        textField3.unmount();
    });

    test('Scannable Option field shown and default false', () => {
        const props = {
            index: 1,
            domainIndex: 1,
            label: 'Text Field Options',
            scale: 4000,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
        };

        const textField = mount(<TextFieldOptions {...props} appPropertiesOnly={true} showScannableOption={true} />);
        const scannable = textField.find(SCANNABLE_OPTION_CLASS).not({ bsClass: 'form-control' });
        expect(scannable.length).toEqual(1);
        expect(scannable.props().checked).toEqual(false);
        textField.unmount();
    });

    test('Scannable Option value', () => {
        const props = {
            index: 1,
            domainIndex: 1,
            label: 'Text Field Options',
            scale: 4000,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
            showScannableOption: true,
            appPropertiesOnly: true,
        };

        const textField = mount(<TextFieldOptions {...props} scannable={true} />);
        const scannable = textField.find(SCANNABLE_OPTION_CLASS).not({ bsClass: 'form-control' });
        expect(scannable.length).toEqual(1);
        expect(scannable.props().checked).toEqual(true);
        textField.unmount();

        const textField2 = mount(<TextFieldOptions {...props} scannable={false} />);
        const scannable2 = textField2.find(SCANNABLE_OPTION_CLASS).not({ bsClass: 'form-control' });
        expect(scannable2.length).toEqual(1);
        expect(scannable2.props().checked).toEqual(false);
        textField2.unmount();
    });
});
