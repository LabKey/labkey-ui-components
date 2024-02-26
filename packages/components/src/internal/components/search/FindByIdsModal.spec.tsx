import React from 'react';

import { mount } from 'enzyme';

import { FindField } from '../samples/models';
import { UNIQUE_ID_FIND_FIELD } from '../samples/constants';
import { LabelHelpTip } from '../base/LabelHelpTip';

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
        const wrapper = mount(<FindFieldOption field={TEST_FIELD} checked={true} onFieldChange={jest.fn()} />);
        expect(wrapper.find('label').text()).toBe(TEST_FIELD.label);
        const input = wrapper.find('input');
        expect(input.prop('name')).toBe(TEST_FIELD.name);
        expect(input.prop('value')).toBe(TEST_FIELD.name);
        expect(input.prop('checked')).toBe(true);
        expect(wrapper.find(LabelHelpTip)).toHaveLength(0);
    });

    test('field with help text, not checked', () => {
        const wrapper = mount(
            <FindFieldOption field={TEST_FIELD_WITH_HELP} checked={false} onFieldChange={jest.fn()} />
        );

        expect(wrapper.find('label').text()).toBe(TEST_FIELD_WITH_HELP.label);
        const input = wrapper.find('input');
        expect(input.prop('name')).toBe(TEST_FIELD_WITH_HELP.name);
        expect(input.prop('value')).toBe(TEST_FIELD_WITH_HELP.name);
        expect(input.prop('checked')).toBe(false);
        expect(wrapper.find(LabelHelpTip)).toHaveLength(1);
    });
});

describe('FindByIdsModal', () => {
    test('default view', () => {
        const wrapper = mount(
            <FindByIdsModal onCancel={jest.fn()} onFind={jest.fn()} nounPlural="tests" />
        );
        expect(wrapper.find('.modal-title').text()).toBe('Find Tests');
        expect(wrapper.find('.modal-body').text()).toContain('Find tests using');
        const uniqueIdsInput = wrapper.find({ name: UNIQUE_ID_FIND_FIELD.name, type: 'radio' });
        expect(uniqueIdsInput.prop('checked')).toBe(true);
        const textArea = wrapper.find('textarea');
        expect(textArea.prop('placeholder')).toBe('List Barcodes here');
        const findButton = wrapper.find('button.btn-success');
        expect(findButton.text()).toBe('Find Tests');
    });
});
