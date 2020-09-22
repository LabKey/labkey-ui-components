import { mount } from 'enzyme';
import React from 'react';

import { createFormInputId } from './actions';
import { DOMAIN_FIELD_DEFAULT_SCALE, DOMAIN_FIELD_FORMAT, DOMAIN_FIELD_NOT_LOCKED } from './constants';
import { NumericFieldOptions } from './NumericFieldOptions';

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
});
