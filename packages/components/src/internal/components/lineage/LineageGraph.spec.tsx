import React from 'react';
import { mount } from 'enzyme';

import { LineageDepthLimitMessage } from './LineageGraph';

describe('LineageDepthLimitMessage', () => {
    test('default properties', () => {
        const wrapper = mount(<LineageDepthLimitMessage />);
        expect(wrapper.text()).toBe('Note: Showing a maximum of 5 generations from the seed node.');
        expect(wrapper.find('div').prop('className')).toBe('lineage-graph-generation-limit-msg');
    });

    test('custom props, not root', () => {
        const wrapper = mount(<LineageDepthLimitMessage className="my-class" maxDistance={10} nodeName="B-52" />);
        expect(wrapper.text()).toBe('Note: Showing a maximum of 10 generations from B-52.');
        expect(wrapper.find('div').prop('className')).toBe('my-class');
    });

    test('is root', () => {
        const wrapper = mount(<LineageDepthLimitMessage isRoot />);
        expect(wrapper.text()).toBe('Note: Showing a maximum of 5 generations.');
        expect(wrapper.find('div').prop('className')).toBe('lineage-graph-generation-limit-msg');
    });
});
