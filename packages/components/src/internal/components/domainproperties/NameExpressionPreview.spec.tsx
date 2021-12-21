import React from 'react';
import { mount } from 'enzyme';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { NameExpressionPreview } from './NameExpressionPreview';

describe('NameExpressionPreview', () => {
    test('loading', () => {
        const wrapper = mount(<NameExpressionPreview isPreviewLoading={true} />);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(1);
        wrapper.unmount();
    });

    test('with preview', () => {
        const wrapper = mount(<NameExpressionPreview previewName="S-1001" />);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(0);
        expect(wrapper.text()).toEqual('Example of name that will be generated from the current pattern:\u00a0S-1001');
        wrapper.unmount();
    });

    test('without preview', () => {
        const wrapper = mount(<NameExpressionPreview previewName={null} />);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(0);
        expect(wrapper.text()).toBe(
            'Unable to generate example name from the current pattern. Check for syntax errors.'
        );
        wrapper.unmount();
    });
});
