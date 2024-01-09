import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { RadioGroupInput, RadioGroupOption } from './RadioGroupInput';

describe('<RadioGroupInput>', () => {
    function validateOptionDisplay(
        wrapper: ReactWrapper,
        option: RadioGroupOption,
        selected: boolean,
        hidden?: boolean,
        showDescription = false
    ) {
        if (hidden) {
            expect(wrapper.text()).toBe('');
        } else {
            expect(wrapper.text()).toContain(option.label);
        }
        const input = wrapper.find('input');
        expect(input.prop('value')).toBe(option.value);
        expect(input.prop('checked')).toBe(selected);
        if (option.disabled) {
            expect(input.prop('disabled')).toBe(true);
        }
        if (showDescription) {
            expect(wrapper.find({ id: 'tooltip' })).toHaveLength(0);
            expect(wrapper.find('.radioinput-description')).toHaveLength(!hidden && option.description ? 1 : 0);
        } else {
            expect(wrapper.find({ id: 'tooltip' })).toHaveLength(!hidden && option.description ? 1 : 0);
            expect(wrapper.find('.radioinput-description')).toHaveLength(0);
        }
    }

    test('no options', () => {
        const wrapper = mount(<RadioGroupInput formsy={false} options={undefined} name="testRadio" />);
        expect(wrapper.find('input')).toHaveLength(0);
        wrapper.unmount();
    });

    test('one option', () => {
        const option = {
            value: 'only',
            label: 'only me',
            description: "It's only me here",
        };
        const wrapper = mount(<RadioGroupInput formsy={false} options={[option]} name="testRadio" />);
        const divs = wrapper.find('div');
        expect(divs).toHaveLength(1);
        validateOptionDisplay(divs.at(0), option, true, true);
        wrapper.unmount();
    });

    test('with options', () => {
        const options = [
            {
                value: 'one',
                label: 'one label',
                description: 'describe one',
            },
            {
                value: 'two',
                label: 'two label',
                description: <span className="two-description">Two description</span>,
                selected: true,
            },
            {
                value: 'three',
                label: 'three label',
                disabled: true,
            },
        ];

        const wrapper = mount(<RadioGroupInput formsy={false} options={options} name="testRadio" />);
        const divs = wrapper.find('.radio-input-wrapper');
        expect(divs).toHaveLength(3);
        validateOptionDisplay(divs.at(0), options[0], false, false);
        validateOptionDisplay(divs.at(1), options[1], true, false);
        validateOptionDisplay(divs.at(2), options[2], false, false);
        wrapper.unmount();
    });

    test('showDescriptions', () => {
        const options = [
            {
                value: 'one',
                label: 'one label',
                description: 'describe one',
            },
            {
                value: 'two',
                label: 'two label',
                description: <span className="two-description">Two description</span>,
                selected: true,
            },
            {
                value: 'three',
                label: 'three label',
            },
        ];

        const wrapper = mount(<RadioGroupInput formsy={false} options={options} name="testRadio" showDescriptions />);
        const divs = wrapper.find('div');
        expect(divs).toHaveLength(3);
        validateOptionDisplay(divs.at(0), options[0], false, false, true);
        validateOptionDisplay(divs.at(1), options[1], true, false, true);
        validateOptionDisplay(divs.at(2), options[2], false, false, true);
        wrapper.unmount();
    });
});
