import React from 'react';
import { mount } from 'enzyme';

import { ContentGroup, ContentGroupLabel } from './ContentGroup';

describe('ContentGroupLabel', () => {
    test('default props', () => {
        const wrapper = mount(<ContentGroupLabel />);
        expect(wrapper.find('.content-group-label')).toHaveLength(1);
        expect(wrapper.find('.content-group')).toHaveLength(1);
        wrapper.unmount();
    });

    test('withoutBottomMargin', () => {
        const wrapper = mount(<ContentGroupLabel withoutBottomMargin />);
        expect(wrapper.find('.content-group-label')).toHaveLength(1);
        expect(wrapper.find('.content-group')).toHaveLength(0);
        wrapper.unmount();
    });
});

describe('ContentGroup', () => {
    test('default props', () => {
        const wrapper = mount(<ContentGroup />);
        expect(wrapper.find('.content-group')).toHaveLength(1);
        expect(wrapper.find(ContentGroupLabel)).toHaveLength(0);
        wrapper.unmount();
    });

    test('label', () => {
        const wrapper = mount(<ContentGroup label={<div>testing</div>} />);
        expect(wrapper.find('.content-group')).toHaveLength(2);
        expect(wrapper.find(ContentGroupLabel)).toHaveLength(1);
        wrapper.unmount();
    });
});
