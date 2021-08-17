import React from 'react';
import { mount } from 'enzyme';
import { LineageDepthLimitMessage } from '../../../index';

describe("LineageDepthLimitMessage", () => {
    test("default properties", () => {
        const wrapper = mount(<LineageDepthLimitMessage />);
        expect(wrapper.text()).toBe("Note: Showing a maximum of 3 generations from the seed node.");
        expect(wrapper.find("div").prop("className")).toBe("lineage-graph-generation-limit-msg");
    });

    test("custom props, not root", () => {
        const wrapper = mount(<LineageDepthLimitMessage className={'my-class'} maxDistance={5} />);
        expect(wrapper.text()).toBe("Note: Showing a maximum of 5 generations from the seed node.");
        expect(wrapper.find("div").prop("className")).toBe("my-class");
    });

    test("is root", () => {
        const wrapper = mount(<LineageDepthLimitMessage isRoot />);
        expect(wrapper.text()).toBe("Note: Showing a maximum of 3 generations.");
        expect(wrapper.find("div").prop("className")).toBe("lineage-graph-generation-limit-msg");
    });
})
