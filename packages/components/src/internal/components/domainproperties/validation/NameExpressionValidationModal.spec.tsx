import React from 'react';
import { mount } from 'enzyme';

import { Modal } from 'react-bootstrap';

import { ConfirmModal } from '../../base/ConfirmModal';

import { NameExpressionValidationModal } from './NameExpressionValidationModal';

beforeAll(() => {
    LABKEY.moduleContext = {
        inventory: {},
    };
});

describe('NameExpressionValidationModal', () => {
    const DEFAULT_PROPS = {
        previews: ['S-1001', 'S-parentSample-002'],
        show: true,
        onHide: jest.fn(),
        onConfirm: jest.fn(),
    };

    const warnings = [
        'Name Expression warning: No ending parentheses found.',
        'Name Expression warning: Invalid starting value xyz.',
    ];
    const aliquotWarnings = [
        "Aliquot Name Expression warning: The 'withCounter' substitution pattern starting at position 27 should be enclosed in ${}.",
    ];

    test('name and aliquot name warnings', () => {
        const wrapper = mount(
            <NameExpressionValidationModal {...DEFAULT_PROPS} warnings={[...warnings, ...aliquotWarnings]} />
        );

        const modal = wrapper.find(ConfirmModal);
        expect(modal.prop('confirmButtonText')).toBe('Save anyways...');
        expect(modal.find('.modal-title').text()).toBe('Sample and Aliquot Naming Patten Warning(s)');
        expect(modal.find('.modal-body').text()).toBe(
            "Naming Patten Warning(s):Example name generated: S-1001No ending parentheses found.Invalid starting value xyz.Aliquot Naming Patten Warning(s):Example aliquot name generated: S-parentSample-002The 'withCounter' substitution pattern starting at position 27 should be enclosed in ${}."
        );
        wrapper.unmount();
    });

    test('name warnings', () => {
        const wrapper = mount(<NameExpressionValidationModal {...DEFAULT_PROPS} warnings={warnings} />);

        const modal = wrapper.find(ConfirmModal);
        expect(modal.prop('confirmButtonText')).toBe('Save anyways...');
        expect(modal.find('.modal-title').text()).toBe('Naming Patten Warning(s)');
        expect(modal.find('.modal-body').text()).toBe(
            'Example name generated: S-1001No ending parentheses found.Invalid starting value xyz.'
        );
        wrapper.unmount();
    });

    test('aliquot name warnings only', () => {
        const wrapper = mount(<NameExpressionValidationModal {...DEFAULT_PROPS} warnings={aliquotWarnings} />);

        const modal = wrapper.find(ConfirmModal);
        expect(modal.prop('confirmButtonText')).toBe('Save anyways...');
        expect(modal.find('.modal-title').text()).toBe('Aliquot Naming Patten Warning(s)');
        expect(modal.find('.modal-body').text()).toBe(
            "Example aliquot name generated: S-parentSample-002The 'withCounter' substitution pattern starting at position 27 should be enclosed in ${}."
        );
        wrapper.unmount();
    });

    test('override title', () => {
        const wrapper = mount(
            <NameExpressionValidationModal {...DEFAULT_PROPS} warnings={warnings} title="bad expression!!" />
        );

        const modal = wrapper.find(ConfirmModal);
        expect(modal.prop('confirmButtonText')).toBe('Save anyways...');
        expect(modal.find('.modal-title').text()).toBe('bad expression!!');
        expect(modal.find('.modal-body').text()).toBe(
            'Example name generated: S-1001No ending parentheses found.Invalid starting value xyz.'
        );
        wrapper.unmount();
    });
});
