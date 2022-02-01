import React from 'react';
import { mount } from 'enzyme';

import { SampleStatusLegend } from '../samples/SampleStatusLegend';

import { HelpTipRenderer } from './HelpTipRenderer';

describe('HelpTipRenderer', () => {
    test('SampleStatusLegend', () => {
        const wrapper = mount(<HelpTipRenderer type="SampleStatusLegend" />);
        expect(wrapper.find(SampleStatusLegend)).toHaveLength(1);
        wrapper.unmount();
    });

    test('other', () => {
        const wrapper = mount(<HelpTipRenderer type="Other" />);
        expect(wrapper.find(SampleStatusLegend)).toHaveLength(0);
        wrapper.unmount();
    });
});
