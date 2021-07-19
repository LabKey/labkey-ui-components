import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { fromJS } from 'immutable';

import { ImportAliasRenderer } from './ImportAliasRenderer';

const DEFAULT_PROPS = {
    appRouteMap: { 'materialInputs/': 'samples' },
    data: undefined,
};

describe('ImportAliasRenderer', () => {
    function validate(wrapper: ReactWrapper, aliasCount = 0): void {
        expect(wrapper.find('a')).toHaveLength(aliasCount);
    }

    test('without data', () => {
        const wrapper = mount(<ImportAliasRenderer {...DEFAULT_PROPS} />);
        validate(wrapper);
        wrapper.unmount();
    });

    test('with single alias key', () => {
        const wrapper = mount(
            <ImportAliasRenderer
                {...DEFAULT_PROPS}
                data={fromJS({
                    displayValue: {
                        key1: 'materialInputs/value1',
                    },
                })}
            />
        );
        validate(wrapper, 1);
        expect(wrapper.find('a').prop('href')).toBe('#/samples/value1');
        expect(wrapper.find('a').text()).toBe('value1');
        wrapper.unmount();
    });

    test('with multiple alias key', () => {
        const wrapper = mount(
            <ImportAliasRenderer
                {...DEFAULT_PROPS}
                data={fromJS({
                    displayValue: {
                        key1: 'materialInputs/value1',
                        key2: 'materialInputs/value2',
                    },
                })}
            />
        );
        validate(wrapper, 2);
        expect(wrapper.find('a').first().prop('href')).toBe('#/samples/value1');
        expect(wrapper.find('a').first().text()).toBe('value1');
        expect(wrapper.find('a').last().prop('href')).toBe('#/samples/value2');
        expect(wrapper.find('a').last().text()).toBe('value2');
        wrapper.unmount();
    });

    test('with multiple appRouteMap entries', () => {
        const wrapper = mount(
            <ImportAliasRenderer
                {...DEFAULT_PROPS}
                appRouteMap={{ 'materialInputs/': 'samples', 'dataInputs/': 'registry' }}
                data={fromJS({
                    displayValue: {
                        key1: 'materialInputs/value1',
                        key2: 'materialInputs/value2',
                        key3: 'dataInputs/value3',
                    },
                })}
            />
        );
        validate(wrapper, 3);
        expect(wrapper.find('a').first().prop('href')).toBe('#/samples/value1');
        expect(wrapper.find('a').first().text()).toBe('value1');
        expect(wrapper.find('a').last().prop('href')).toBe('#/registry/value3');
        expect(wrapper.find('a').last().text()).toBe('value3');
        wrapper.unmount();
    });
});
