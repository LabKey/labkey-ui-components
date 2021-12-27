import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { QueryColumn } from '../../../../public/QueryColumn';

import { TextChoiceInput } from './TextChoiceInput';
import { SelectInput } from './SelectInput';

describe('TextChoiceInput', () => {
    const DEFAULT_PROPS = {
        queryColumn: new QueryColumn(),
    };

    function validate(wrapper: ReactWrapper, placeholder?: string, options = []): void {
        const input = wrapper.find(SelectInput);
        expect(input).toHaveLength(1);
        expect(input.prop('placeholder')).toBe(placeholder);
        expect(input.prop('options')).toStrictEqual(options);
    }

    test('default props', () => {
        const wrapper = mount(<TextChoiceInput {...DEFAULT_PROPS} />);
        validate(wrapper);
        wrapper.unmount();
    });

    test('placeholder', () => {
        const wrapper = mount(<TextChoiceInput {...DEFAULT_PROPS} placeholder="testing" />);
        validate(wrapper, 'testing');
        wrapper.unmount();
    });

    test('validValues, undefined', () => {
        const wrapper = mount(
            <TextChoiceInput {...DEFAULT_PROPS} queryColumn={new QueryColumn({ validValues: undefined })} />
        );
        validate(wrapper);
        wrapper.unmount();
    });

    test('validValues, empty', () => {
        const wrapper = mount(
            <TextChoiceInput {...DEFAULT_PROPS} queryColumn={new QueryColumn({ validValues: [] })} />
        );
        validate(wrapper);
        wrapper.unmount();
    });

    test('validValues, with values', () => {
        const wrapper = mount(
            <TextChoiceInput {...DEFAULT_PROPS} queryColumn={new QueryColumn({ validValues: ['a', 'b', 'c'] })} />
        );
        validate(wrapper, undefined, [
            { label: 'a', value: 'a' },
            { label: 'b', value: 'b' },
            { label: 'c', value: 'c' },
        ]);
        wrapper.unmount();
    });
});
