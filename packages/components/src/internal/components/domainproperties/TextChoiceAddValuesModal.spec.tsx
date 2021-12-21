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

        const title = 'Add Text Choice Values ' + (fieldName ? 'for ' + fieldName : '');
        expect(wrapper.find('.modal-title').text()).toBe(title);
    }

    test('default props', () => {
        const wrapper = mount(<TextChoiceAddValuesModal {...DEFAULT_PROPS} />);
        validate(wrapper);
        expect(wrapper.find('p').text()).toBe(
            'A total of 200 values can be added. There are currently 0 new text choice values provided below.'
        );
        wrapper.unmount();
    });

    test('initialValueCount', () => {
        const wrapper = mount(<TextChoiceAddValuesModal {...DEFAULT_PROPS} initialValueCount={70} />);
        validate(wrapper);
        expect(wrapper.find('p').text()).toBe(
            'A total of 130 values can be added. There are currently 0 new text choice values provided below.'
        );
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
        expect(wrapper.find('p').text()).toBe(
            'A total of 200 values can be added. There are currently 0 new text choice values provided below.'
        );

        wrapper.find('textarea').simulate('change', { target: { value: 'a' } });
        validate(wrapper);
        expect(wrapper.find('.btn-success').prop('disabled')).toBeFalsy();
        expect(wrapper.find('p').text()).toBe(
            'A total of 200 values can be added. There is currently 1 new text choice value provided below.'
        );

        wrapper.find('textarea').simulate('change', { target: { value: 'a\nb\n\n' } });
        validate(wrapper);
        expect(wrapper.find('.btn-success').prop('disabled')).toBeFalsy();
        expect(wrapper.find('p').text()).toBe(
            'A total of 200 values can be added. There are currently 4 new text choice values provided below.'
        );

        wrapper.unmount();
    });

    test('success button disabled after max reached', () => {
        const wrapper = mount(<TextChoiceAddValuesModal {...DEFAULT_PROPS} maxValueCount={2} />);
        expect(wrapper.find('.btn-success').prop('disabled')).toBeTruthy();
        expect(wrapper.find('p').text()).toBe(
            'A total of 2 values can be added. There are currently 0 new text choice values provided below.'
        );

        wrapper.find('textarea').simulate('change', { target: { value: 'a\nb' } });
        expect(wrapper.find('.btn-success').prop('disabled')).toBeFalsy();
        expect(wrapper.find('p').text()).toBe(
            'A total of 2 values can be added. There are currently 2 new text choice values provided below.'
        );

        wrapper.find('textarea').simulate('change', { target: { value: 'a\nb\nc' } });
        expect(wrapper.find('.btn-success').prop('disabled')).toBeTruthy();
        expect(wrapper.find('p').text()).toBe(
            'A total of 2 values can be added. There are currently 3 new text choice values provided below.'
        );

        wrapper.unmount();
    });

    test('initial already equal to max', () => {
        const wrapper = mount(<TextChoiceAddValuesModal {...DEFAULT_PROPS} initialValueCount={2} maxValueCount={2} />);
        expect(wrapper.find('.btn-success').prop('disabled')).toBeTruthy();
        expect(wrapper.find('p').text()).toBe(
            'A total of 0 values can be added. There are currently 0 new text choice values provided below.'
        );

        wrapper.find('textarea').simulate('change', { target: { value: 'a\nb' } });
        expect(wrapper.find('.btn-success').prop('disabled')).toBeTruthy();
        expect(wrapper.find('p').text()).toBe(
            'A total of 0 values can be added. There are currently 2 new text choice values provided below.'
        );

        wrapper.unmount();
    });
});
