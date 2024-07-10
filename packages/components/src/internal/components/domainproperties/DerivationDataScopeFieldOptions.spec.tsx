import { mount } from 'enzyme';
import React from 'react';

import { Alert } from '../base/Alert';

import { DomainDesignerRadio } from './DomainDesignerRadio';

import { DERIVATION_DATA_SCOPES, DOMAIN_FIELD_NOT_LOCKED } from './constants';
import { DerivationDataScopeFieldOptions } from './DerivationDataScopeFieldOptions';
import { PropDescType, TEXT_TYPE, UNIQUE_ID_TYPE } from './PropDescType';

describe('DerivationDataScopeFieldOptions', () => {
    test('Default config, new field', () => {
        const props = {
            index: 1,
            domainIndex: 1,
            label: null,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
            isExistingField: false,
        };

        const wrapper = mount(<DerivationDataScopeFieldOptions {...props} />);

        const sectionLabel = wrapper.find({ className: 'domain-field-section-heading domain-field-section-hdr' });
        expect(sectionLabel.length).toEqual(1);
        expect(sectionLabel.text()).toEqual('Derivation Data Scope');

        const radios = wrapper.find(DomainDesignerRadio);
        expect(radios).toHaveLength(3);
        expect(radios.at(0).prop('checked')).toBeTruthy();
        expect(radios.at(0).prop('disabled')).toBeFalsy();
        expect(radios.at(0).text()).toBe('Editable for parent data only (default)');
        expect(radios.at(1).prop('checked')).toBeFalsy();
        expect(radios.at(1).prop('disabled')).toBeFalsy();
        expect(radios.at(1).text()).toBe('Editable for child data only');
        expect(radios.at(2).prop('checked')).toBeFalsy();
        expect(radios.at(2).prop('disabled')).toBeFalsy();
        expect(radios.at(2).text()).toBe('Editable for parent and child data independently');
        expect(wrapper.find(Alert)).toHaveLength(0);

        wrapper.unmount();
    });

    test('Existing field, value = ParentOnly', () => {
        const props = {
            index: 1,
            domainIndex: 1,
            label: null,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
            isExistingField: true,
            value: DERIVATION_DATA_SCOPES.PARENT_ONLY,
        };

        const wrapper = mount(<DerivationDataScopeFieldOptions {...props} />);

        const radios = wrapper.find(DomainDesignerRadio);
        expect(radios).toHaveLength(3);
        expect(radios.at(0).prop('checked')).toBeTruthy();
        expect(radios.at(0).prop('disabled')).toBeFalsy();
        expect(radios.at(1).prop('checked')).toBeFalsy();
        expect(radios.at(1).prop('disabled')).toBeTruthy();
        expect(radios.at(2).prop('checked')).toBeFalsy();
        expect(radios.at(2).prop('disabled')).toBeFalsy();
        expect(wrapper.find(Alert)).toHaveLength(0);

        wrapper.unmount();
    });

    test('Existing field, value is empty', () => {
        const props = {
            index: 1,
            domainIndex: 1,
            label: null,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
            isExistingField: true,
            value: '',
        };

        const wrapper = mount(<DerivationDataScopeFieldOptions {...props} />);

        const radios = wrapper.find(DomainDesignerRadio);
        expect(radios).toHaveLength(3);
        expect(radios.at(0).prop('checked')).toBeTruthy();
        expect(radios.at(0).prop('disabled')).toBeFalsy();
        expect(radios.at(1).prop('checked')).toBeFalsy();
        expect(radios.at(1).prop('disabled')).toBeTruthy();
        expect(radios.at(2).prop('checked')).toBeFalsy();
        expect(radios.at(2).prop('disabled')).toBeFalsy();
        expect(wrapper.find(Alert)).toHaveLength(0);

        wrapper.unmount();
    });

    test('Existing field, value = ChildOnly', () => {
        const props = {
            index: 1,
            domainIndex: 1,
            label: null,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
            isExistingField: true,
            value: DERIVATION_DATA_SCOPES.CHILD_ONLY,
        };

        const wrapper = mount(<DerivationDataScopeFieldOptions {...props} />);

        const radios = wrapper.find(DomainDesignerRadio);
        expect(radios).toHaveLength(3);
        expect(radios.at(0).prop('checked')).toBeFalsy();
        expect(radios.at(0).prop('disabled')).toBeTruthy();
        expect(radios.at(0).text()).toBe('Editable for parent data only (default)');
        expect(radios.at(1).prop('checked')).toBeTruthy();
        expect(radios.at(1).prop('disabled')).toBeFalsy();
        expect(radios.at(1).text()).toBe('Editable for child data only');
        expect(radios.at(2).prop('checked')).toBeFalsy();
        expect(radios.at(2).prop('disabled')).toBeFalsy();
        expect(radios.at(2).text()).toBe('Editable for parent and child data independently');
        expect(wrapper.find(Alert)).toHaveLength(0);

        wrapper.unmount();
    });

    test('Existing field, value = All', () => {
        const props = {
            index: 1,
            domainIndex: 1,
            label: null,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
            isExistingField: true,
            value: DERIVATION_DATA_SCOPES.ALL,
        };

        const wrapper = mount(<DerivationDataScopeFieldOptions {...props} />);

        const radios = wrapper.find(DomainDesignerRadio);
        expect(radios).toHaveLength(3);
        expect(radios.at(0).prop('checked')).toBeFalsy();
        expect(radios.at(0).prop('disabled')).toBeTruthy();
        expect(radios.at(1).prop('checked')).toBeFalsy();
        expect(radios.at(1).prop('disabled')).toBeTruthy();
        expect(radios.at(2).prop('checked')).toBeTruthy();
        expect(radios.at(2).prop('disabled')).toBeFalsy();
        expect(wrapper.find(Alert)).toHaveLength(0);

        wrapper.unmount();
    });

    test('With config, show = true', () => {
        const label = 'Sample/Aliquot Options';
        const warning =
            "Updating a 'Samples Only' field to be 'Samples and Aliquots' will blank out the field values for all aliquots. This action cannot be undone.";
        const props = {
            index: 1,
            domainIndex: 1,
            label,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
            config: {
                show: true,
                sectionTitle: 'Sample/Aliquot Options',
                labelAll: 'Separately editable for samples and aliquots',
                labelChild: 'Editable for aliquots only',
                labelParent: 'Editable for samples only (default)',
                helpLinkNode: <>help</>,
                scopeChangeWarning: warning,
            },
            isExistingField: true,
            value: DERIVATION_DATA_SCOPES.PARENT_ONLY,
        };

        const wrapper = mount(<DerivationDataScopeFieldOptions {...props} />);

        const sectionLabel = wrapper.find({ className: 'domain-field-section-heading domain-field-section-hdr' });
        expect(sectionLabel.length).toEqual(1);
        expect(sectionLabel.text()).toEqual(label);

        const radios = wrapper.find(DomainDesignerRadio);
        expect(radios).toHaveLength(3);
        expect(radios.at(0).prop('checked')).toBeTruthy();
        expect(radios.at(0).text()).toBe('Editable for samples only (default)');
        expect(radios.at(1).prop('checked')).toBeFalsy();
        expect(radios.at(1).text()).toBe('Editable for aliquots only');
        expect(radios.at(2).prop('checked')).toBeFalsy();
        expect(radios.at(2).text()).toBe('Separately editable for samples and aliquots');
        expect(wrapper.find(Alert)).toHaveLength(0);

        wrapper.unmount();
    });

    test('With config, show = false', () => {
        const label = 'Sample/Aliquot Options';
        const props = {
            index: 1,
            domainIndex: 1,
            label,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
            config: {
                show: false,
            },
        };

        const wrapper = mount(<DerivationDataScopeFieldOptions {...props} />);
        expect(wrapper).toEqual({});
        wrapper.unmount();
    });

    test('With config, isExistingField is not applicable', () => {
        const props = {
            index: 1,
            domainIndex: 1,
            label: null,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
            isExistingField: true,
            value: DERIVATION_DATA_SCOPES.ALL,
            config: {
                show: true,
                dataTypeFilter: (dataType: PropDescType) => !dataType.isUniqueId(),
            },
            fieldDataType: UNIQUE_ID_TYPE,
        };

        const wrapper = mount(<DerivationDataScopeFieldOptions {...props} />);

        expect(wrapper).toEqual({});

        wrapper.unmount();
    });

    test('With config, isExistingField is applicable', () => {
        const props = {
            index: 1,
            domainIndex: 1,
            label: null,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
            isExistingField: true,
            value: DERIVATION_DATA_SCOPES.ALL,
            config: {
                show: true,
                dataTypeFilter: (dataType: PropDescType) => !dataType.isUniqueId(),
            },
            fieldDataType: TEXT_TYPE,
        };

        const wrapper = mount(<DerivationDataScopeFieldOptions {...props} />);

        const radios = wrapper.find(DomainDesignerRadio);
        expect(radios).toHaveLength(3);

        wrapper.unmount();
    });
});
