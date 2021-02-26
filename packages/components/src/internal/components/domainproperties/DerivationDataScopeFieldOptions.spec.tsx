import { mount } from 'enzyme';
import React, { ReactNode } from 'react';

import { createFormInputId } from './actions';
import { DOMAIN_FIELD_DERIVATION_DATA_SCOPE, DOMAIN_FIELD_NOT_LOCKED } from './constants';
import { DerivationDataScopeFieldOptions } from './DerivationDataScopeFieldOptions';

describe('DerivationDataScopeFieldOptions', () => {
    test('Derivation Data Scope Field Options', () => {
        const label = 'Aliquot properties';

        const props = {
            index: 1,
            domainIndex: 1,
            label,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
        };

        const aliquot = mount(<DerivationDataScopeFieldOptions {...props} />);

        // Verify label
        const sectionLabel = aliquot.find({ className: 'domain-field-section-heading domain-field-section-hdr' });
        expect(sectionLabel.length).toEqual(1);
        expect(sectionLabel.text()).toEqual(label);

        const fieldName = createFormInputId(DOMAIN_FIELD_DERIVATION_DATA_SCOPE, 1, 1);
        // Test format field initial value
        let checkbox = aliquot.find({ id: fieldName, bsClass: 'checkbox' });
        expect(checkbox.length).toEqual(1);
        expect(checkbox.props().checked).toEqual(false);

        // Verify format value changes with props
        aliquot.setProps({ value: 'ChildOnly' });
        checkbox = aliquot.find({ id: fieldName, bsClass: 'checkbox' });
        expect(checkbox.props().checked).toEqual(true);

        expect(aliquot).toMatchSnapshot();
        aliquot.unmount();
    });

    test('With config', () => {
        const label = 'Aliquot field';

        const props = {
            index: 1,
            domainIndex: 1,
            label,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
            config: {
                show: true,
                disable: false,
                sectionTitle: 'Aliquot field',
                fieldLabel: 'Aliquot Only',
            },
        };

        const aliquot = mount(<DerivationDataScopeFieldOptions {...props} />);
        expect(aliquot).toMatchSnapshot();
        aliquot.unmount();
    });
});
