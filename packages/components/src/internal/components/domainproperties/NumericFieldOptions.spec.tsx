import { mount } from 'enzyme';
import React from 'react';

import { createFormInputId } from './utils';
import { DOMAIN_FIELD_DEFAULT_SCALE, DOMAIN_FIELD_FORMAT, DOMAIN_FIELD_NOT_LOCKED } from './constants';
import { NumericFieldOptions } from './NumericFieldOptions';

const SCANNABLE_OPTION_CLASS = '.domain-text-option-scannable';

describe('NumericFieldOptions', () => {
    test('Numeric data type', () => {
        const _section = 'Numeric Field Options';
        const _format = '0.00';
        const _format2 = '#.##';

        const props = {
            index: 1,
            domainIndex: 1,
            label: _section,
            format: _format,
            defaultScale: 'LINEAR',
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
        };

        const numeric = mount(<NumericFieldOptions {...props} />);

        // Verify label
        const sectionLabel = numeric.find({ className: 'domain-field-section-heading' });
        expect(sectionLabel.length).toEqual(1);
        expect(sectionLabel.text()).toEqual(_section);

        // Test format field initial value
        let formatField = numeric.find({ id: createFormInputId(DOMAIN_FIELD_FORMAT, 1, 1), className: 'form-control' });
        expect(formatField.length).toEqual(1);
        expect(formatField.props().value).toEqual(_format);

        // Verify format value changes with props
        numeric.setProps({ format: _format2 });
        formatField = numeric.find({ id: createFormInputId(DOMAIN_FIELD_FORMAT, 1, 1), className: 'form-control' });
        expect(formatField.props().value).toEqual(_format2);

        // Verify default scale field
        let defaultScale = numeric.find({
            id: createFormInputId(DOMAIN_FIELD_DEFAULT_SCALE, 1, 1),
            className: 'form-control',
        });
        expect(defaultScale.length).toEqual(1);
        expect(defaultScale.props().value).toEqual('LINEAR');

        // Select LOG default scale
        numeric.setProps({ defaultScale: 'LOG' });
        defaultScale = numeric.find({
            id: createFormInputId(DOMAIN_FIELD_DEFAULT_SCALE, 1, 1),
            className: 'form-control',
        });
        expect(defaultScale.props().value).toEqual('LOG');

        expect(numeric).toMatchSnapshot();
        numeric.unmount();
    });

    test('Scannable Option field not shown', () => {
        const _section = 'Numeric Field Options';
        const _format = '';

        const props = {
            index: 1,
            domainIndex: 1,
            label: _section,
            format: _format,
            defaultScale: 'LINEAR',
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
        };

        // All cases below should not display the field
        const textField = mount(
            <NumericFieldOptions {...props} showScannableOption={false} appPropertiesOnly={false} />
        );
        expect(textField.find(SCANNABLE_OPTION_CLASS)).toHaveLength(0);
        textField.unmount();

        const textField2 = mount(
            <NumericFieldOptions {...props} showScannableOption={true} appPropertiesOnly={false} />
        );
        expect(textField2.find(SCANNABLE_OPTION_CLASS)).toHaveLength(0);
        textField2.unmount();

        const textField3 = mount(
            <NumericFieldOptions {...props} showScannableOption={false} appPropertiesOnly={true} />
        );
        expect(textField3.find(SCANNABLE_OPTION_CLASS)).toHaveLength(0);
        textField3.unmount();
    });

    test('Scannable Option field shown and default false', () => {
        const _section = 'Numeric Field Options';
        const _format = '';

        const props = {
            index: 1,
            domainIndex: 1,
            label: _section,
            format: _format,
            defaultScale: 'LINEAR',
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
        };

        const textField = mount(<NumericFieldOptions {...props} appPropertiesOnly={true} showScannableOption={true} />);
        const scannable = textField.find(SCANNABLE_OPTION_CLASS).not({ bsClass: 'form-control' });
        expect(scannable.length).toEqual(1);
        expect(scannable.props().checked).toEqual(false);
        textField.unmount();
    });

    test('Scannable Option value', () => {
        const _section = 'Numeric Field Options';
        const _format = '';

        const props = {
            index: 1,
            domainIndex: 1,
            label: _section,
            format: _format,
            defaultScale: 'LINEAR',
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
            showScannableOption: true,
            appPropertiesOnly: true,
        };

        const textField = mount(<NumericFieldOptions {...props} scannable={true} />);
        const scannable = textField.find(SCANNABLE_OPTION_CLASS).not({ bsClass: 'form-control' });
        expect(scannable.length).toEqual(1);
        expect(scannable.props().checked).toEqual(true);
        textField.unmount();

        const textField2 = mount(<NumericFieldOptions {...props} scannable={false} />);
        const scannable2 = textField2.find(SCANNABLE_OPTION_CLASS).not({ bsClass: 'form-control' });
        expect(scannable2.length).toEqual(1);
        expect(scannable2.props().checked).toEqual(false);
        textField2.unmount();
    });
});
