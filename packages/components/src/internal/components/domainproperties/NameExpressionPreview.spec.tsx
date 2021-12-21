import React from 'react';
import { mount } from 'enzyme';
import { NameExpressionPreview } from "./NameExpressionPreview";
import {LoadingSpinner} from "../base/LoadingSpinner";

describe('NameExpressionPreview', () => {
    test('loading', () => {
        let wrapper = mount(<NameExpressionPreview isPreviewLoading={true} />);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(1);
        wrapper.unmount();
    });

    test('with preview', () => {
        let wrapper = mount(<NameExpressionPreview previewName={"S-1001"} />);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(0);
        expect(wrapper.text()).toEqual("Example of name that will be generated from the current pattern:\u00a0S-1001");
        wrapper.unmount();
    });

    test('without preview', () => {
        let wrapper = mount(<NameExpressionPreview previewName={null} />);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(0);
        expect(wrapper.text()).toBe("Unable to generate example name from the current pattern. Check for syntax errors.");
        wrapper.unmount();
    });
});
