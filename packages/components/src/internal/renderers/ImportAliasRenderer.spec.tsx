import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { fromJS } from 'immutable';

import { ImportAliasRenderer } from './ImportAliasRenderer';

const DEFAULT_PROPS = {
    type: 'TestType',
    data: undefined,
};

describe('ImportAliasRenderer', () => {
    function validate(wrapper: ReactWrapper, aliasCount = 0): void {
        expect(wrapper.find('a')).toHaveLength(aliasCount);
        expect(wrapper.find('span')).toHaveLength(aliasCount > 0 ? aliasCount - 1 : 0);
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
                        key1: 'value1',
                    },
                })}
            />
        );
        validate(wrapper, 1);
        expect(wrapper.find('a').prop('href')).toBe('#/TestType/value1');
        expect(wrapper.find('a').text()).toBe('key1');
        wrapper.unmount();
    });

    test('with multiple alias key', () => {
        const wrapper = mount(
            <ImportAliasRenderer
                {...DEFAULT_PROPS}
                data={fromJS({
                    displayValue: {
                        key1: 'value1',
                        key2: 'value2',
                    },
                })}
            />
        );
        validate(wrapper, 2);
        expect(wrapper.find('a').first().prop('href')).toBe('#/TestType/value1');
        expect(wrapper.find('a').first().text()).toBe('key1');
        expect(wrapper.find('a').last().prop('href')).toBe('#/TestType/value2');
        expect(wrapper.find('a').last().text()).toBe('key2');
        wrapper.unmount();
    });
});
