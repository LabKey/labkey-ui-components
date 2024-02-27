import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { TextChoiceAddValuesModal } from './TextChoiceAddValuesModal';

describe('TextChoiceAddValuesModal', () => {
    const DEFAULT_PROPS = {
        fieldName: undefined,
        onCancel: jest.fn,
        onApply: jest.fn,
    };

    function validate(wrapper: ReactWrapper, fieldName?: string): void {
        expect(wrapper.find('p')).toHaveLength(1);
        expect(wrapper.find('textarea')).toHaveLength(1);
        expect(wrapper.find('button')).toHaveLength(3); // close, cancel, apply
        expect(wrapper.find('.btn-success')).toHaveLength(1); // apply

        const title = 'Add Text Choice Values' + (fieldName ? ' for ' + fieldName : '');
        expect(wrapper.find('.modal-title').text()).toBe(title);
    }

    function validateCounterText(wrapper: ReactWrapper, totalStr: string, newStr: string): void {
        expect(wrapper.find('p').text()).toBe(`Enter each value on a new line. ${totalStr} can be added.`);
        expect(wrapper.find('.text-choice-value-count').text()).toBe(`${newStr} provided.`);
    }

    test('default props', () => {
        const wrapper = mount(<TextChoiceAddValuesModal {...DEFAULT_PROPS} />);
        validate(wrapper);
        validateCounterText(wrapper, '200 values', '0 new values');
        wrapper.unmount();
    });

    test('initialValueCount', () => {
        const wrapper = mount(<TextChoiceAddValuesModal {...DEFAULT_PROPS} initialValueCount={70} />);
        validate(wrapper);
        validateCounterText(wrapper, '130 values', '0 new values');
        wrapper.unmount();
    });

    test('fieldName', () => {
        const wrapper = mount(<TextChoiceAddValuesModal {...DEFAULT_PROPS} fieldName="Test" />);
        validate(wrapper, 'Test');
        wrapper.unmount();
    });

    test('textarea input updates', () => {
        const wrapper = mount(<TextChoiceAddValuesModal {...DEFAULT_PROPS} />);
        validate(wrapper);
        expect(wrapper.find('.btn-success').prop('disabled')).toBeTruthy();
        validateCounterText(wrapper, '200 values', '0 new values');

        wrapper.find('textarea').simulate('change', { target: { value: 'a' } });
        validate(wrapper);
        expect(wrapper.find('.btn-success').prop('disabled')).toBeFalsy();
        validateCounterText(wrapper, '200 values', '1 new value');

        // empty rows and duplicates (after trim) should be removed
        wrapper.find('textarea').simulate('change', { target: { value: 'a\n\na\na \n a\nb' } });
        validate(wrapper);
        expect(wrapper.find('.btn-success').prop('disabled')).toBeFalsy();
        validateCounterText(wrapper, '200 values', '2 new values');

        wrapper.unmount();
    });

    test('success button disabled after max reached', () => {
        const wrapper = mount(<TextChoiceAddValuesModal {...DEFAULT_PROPS} maxValueCount={2} />);
        expect(wrapper.find('.btn-success').prop('disabled')).toBeTruthy();
        validateCounterText(wrapper, '2 values', '0 new values');

        wrapper.find('textarea').simulate('change', { target: { value: 'a\nb' } });
        expect(wrapper.find('.btn-success').prop('disabled')).toBeFalsy();
        validateCounterText(wrapper, '2 values', '2 new values');

        wrapper.find('textarea').simulate('change', { target: { value: 'a\nb\nc' } });
        expect(wrapper.find('.btn-success').prop('disabled')).toBeTruthy();
        validateCounterText(wrapper, '2 values', '3 new values');

        wrapper.unmount();
    });

    test('initial already equal to max', () => {
        const wrapper = mount(<TextChoiceAddValuesModal {...DEFAULT_PROPS} initialValueCount={2} maxValueCount={2} />);
        expect(wrapper.find('.btn-success').prop('disabled')).toBeTruthy();
        validateCounterText(wrapper, '0 values', '0 new values');

        wrapper.find('textarea').simulate('change', { target: { value: 'a\nb' } });
        expect(wrapper.find('.btn-success').prop('disabled')).toBeTruthy();
        validateCounterText(wrapper, '0 values', '2 new values');

        wrapper.unmount();
    });
});
