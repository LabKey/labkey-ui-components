import React from 'react';
import { render } from '@testing-library/react';

import { FindField } from '../samples/models';
import { UNIQUE_ID_FIND_FIELD } from '../samples/constants';

import { FindByIdsModal, FindFieldOption } from './FindByIdsModal';

const TEST_FIELD: FindField = {
    nounSingular: 'Test',
    nounPlural: 'Tests',
    name: 'test',
    label: 'The Test',
    storageKeyPrefix: 't1:',
};

const TEST_FIELD_WITH_HELP: FindField = {
    nounSingular: 'Helper',
    nounPlural: 'Helpers',
    name: 'helper',
    label: 'The Helper',
    storageKeyPrefix: 'h:',
    helpText: 'You might find this helpful',
    helpTextTitle: "I'm here to help",
};

describe('FindFieldOption', () => {
    test('field without help text, checked', () => {
        render(<FindFieldOption field={TEST_FIELD} checked={true} onFieldChange={jest.fn()} />);
        expect(document.querySelector('label').textContent).toBe(TEST_FIELD.label);
        const input = document.querySelector('input');
        expect(input.getAttribute('name')).toBe(TEST_FIELD.name);
        expect(input.getAttribute('value')).toBe(TEST_FIELD.name);
        expect(input.getAttribute('checked')).not.toBeNull();
        expect(document.querySelector('.label-help-target')).toBeNull();
    });

    test('field with help text, not checked', () => {
        render(<FindFieldOption field={TEST_FIELD_WITH_HELP} checked={false} onFieldChange={jest.fn()} />);

        expect(document.querySelector('label').textContent).toBe(TEST_FIELD_WITH_HELP.label);
        const input = document.querySelector('input');
        expect(input.getAttribute('name')).toBe(TEST_FIELD_WITH_HELP.name);
        expect(input.getAttribute('value')).toBe(TEST_FIELD_WITH_HELP.name);
        expect(input.getAttribute('checked')).toBeNull();
        expect(document.querySelector('.label-help-target')).not.toBeNull();
    });
});

describe('FindByIdsModal', () => {
    test('default view', () => {
        render(<FindByIdsModal onCancel={jest.fn()} onFind={jest.fn()} nounPlural="tests" />);
        expect(document.querySelector('.modal-title').textContent).toBe('Find Tests');
        expect(document.querySelector('.modal-body').textContent).toContain('Find tests using');
        const uniqueIdsInput = document.querySelector('[name=' + UNIQUE_ID_FIND_FIELD.name + ']');
        expect(uniqueIdsInput.getAttribute('checked')).not.toBeNull();
        const textArea = document.querySelector('textarea');
        expect(textArea.getAttribute('placeholder')).toBe('List Barcodes here (max: 1,000)');
        const findButton = document.querySelector('button.btn-success');
        expect(findButton.textContent).toBe('Find Tests');
    });
});
