import React from 'react';
import Formsy from 'formsy-react';

import { mount, ReactWrapper } from 'enzyme';

import { DERIVATIVE_CREATION, POOLED_SAMPLE_CREATION } from '../samples/models';

import { QueryInfoQuantity } from './QueryInfoQuantity';
import { FormsyInput } from './input/FormsyReactComponents';
import { RadioGroupInput } from './input/RadioGroupInput';

describe('QueryInfoQuantity', () => {
    function validate(wrapper: ReactWrapper, optionCount: number, includeCount: boolean): void {
        expect(wrapper.find(RadioGroupInput)).toHaveLength(optionCount === 0 ? 0 : 1);
        expect(wrapper.find(FormsyInput)).toHaveLength(includeCount || optionCount > 0 ? 1 : 0);
    }

    test('no content', () => {
        const wrapper = mount(
            <QueryInfoQuantity
                creationTypeOptions={undefined}
                includeCountField={false}
                maxCount={5}
                countText="Quantity"
            />
        );
        validate(wrapper, 0, false);
        wrapper.unmount();
    });

    test('no options, show quantity', () => {
        const wrapper = mount(
            <Formsy>
                <QueryInfoQuantity creationTypeOptions={[]} includeCountField maxCount={5} countText="Quantity" />
            </Formsy>
        );
        validate(wrapper, 0, true);
        const input = wrapper.find(FormsyInput);
        expect(input.prop('max')).toBe(5);
        expect(input.prop('value')).toBe('1');
        wrapper.unmount();
    });

    test('multiple options, no default selection', () => {
        const wrapper = mount(
            <Formsy>
                <QueryInfoQuantity
                    creationTypeOptions={[DERIVATIVE_CREATION, POOLED_SAMPLE_CREATION]}
                    includeCountField={false}
                    maxCount={5}
                    countText="Quantity"
                />
            </Formsy>
        );
        validate(wrapper, 2, false);
        const inputs = wrapper.find({ type: 'radio' });
        expect(inputs).toHaveLength(2);
        expect(wrapper.find('.control-label')).toHaveLength(1);
        expect(wrapper.find('.control-label').text()).toBe('Quantity *');
        wrapper.unmount();
    });

    test('multiple options, default selection', () => {
        const wrapper = mount(
            <Formsy>
                <QueryInfoQuantity
                    creationTypeOptions={[{ ...DERIVATIVE_CREATION, selected: true }, POOLED_SAMPLE_CREATION]}
                    includeCountField
                    maxCount={5}
                    countText="Quantity"
                />
            </Formsy>
        );
        validate(wrapper, 2, false);
        const inputs = wrapper.find({ type: 'radio' });
        expect(inputs).toHaveLength(2);
        expect(wrapper.find('.control-label')).toHaveLength(1);
        expect(wrapper.find('.control-label').text()).toBe('Derivatives per Parent *');
        wrapper.unmount();
    });
});
