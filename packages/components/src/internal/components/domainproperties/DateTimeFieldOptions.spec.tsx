import { mount } from 'enzyme';
import React from 'react';

import { createFormInputId } from './utils';
import { DOMAIN_FIELD_FORMAT, DOMAIN_FIELD_NOT_LOCKED } from './constants';
import { DateTimeFieldOptions } from './DateTimeFieldOptions';

describe('DateTimeFieldOptions', () => {
    test('Date Time data type', () => {
        const _section = 'Date and Time Field Options';
        const _format = 'yyyy/MM/dd';
        const _format2 = 'MM/dd/yyyy hh:mm';

        const props = {
            index: 1,
            domainIndex: 1,
            label: _section,
            format: _format,
            excludeFromShifting: true,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
            type: 'datetime'
        };

        const dateTime = mount(<DateTimeFieldOptions {...props} />);

        // Verify label
        const sectionLabel = dateTime.find({ className: 'domain-field-section-heading' });
        expect(sectionLabel.length).toEqual(1);
        expect(sectionLabel.text()).toEqual(_section);

        // Test format field initial value
        let formatField = dateTime.find({
            id: createFormInputId(DOMAIN_FIELD_FORMAT, 1, 1),
            className: 'form-control',
        });
        expect(formatField.length).toEqual(1);
        expect(formatField.props().value).toEqual(_format);

        // Verify format value changes with props
        dateTime.setProps({ format: _format2 });
        formatField = dateTime.find({ id: createFormInputId(DOMAIN_FIELD_FORMAT, 1, 1), className: 'form-control' });
        expect(formatField.props().value).toEqual(_format2);

        expect(dateTime).toMatchSnapshot();
        dateTime.unmount();
    });
});
