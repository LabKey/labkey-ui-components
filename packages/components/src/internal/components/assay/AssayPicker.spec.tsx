import React from 'react';
import {mount} from 'enzyme';
import {AssayPicker, AssayPickerTabs} from '../../..';

import renderer from "react-test-renderer";
import {Simulate} from "react-dom/test-utils";
import click = Simulate.click;

describe('AssayPicker', () => {
    test('AssayPicker', () => {
        const component = <AssayPicker
            showImport={true}
            onChange={jest.fn()}
        />;

        const wrapper = mount(component);

        // Verify all three tabs shown and standard assay selected
        expect(wrapper.find('.nav-tabs li')).toHaveLength(3);
        expect(wrapper.find('.nav-tabs li.active a#assay-picker-tabs-tab-standard')).toHaveLength(1);
        expect(wrapper.find('#assay-type-select-container')).toHaveLength(2);

        // Click import tab and verify it's shown
        expect(wrapper.find('.nav-tabs li.active a#assay-picker-tabs-tab-import')).toHaveLength(0);
        const importTab = wrapper.find('.nav-tabs li a#assay-picker-tabs-tab-import');
        expect(importTab).toHaveLength(1);
        importTab.simulate("click");
        expect(wrapper.find('.nav-tabs li.active a#assay-picker-tabs-tab-import')).toHaveLength(1);
        expect(wrapper.find('.file-upload--container')).toHaveLength(1);

        expect(wrapper).toMatchSnapshot();
        wrapper.unmount();
    });

    test('AssayPicker No Import, Selected Specialty tab', () => {
        const component = <AssayPicker
            showImport={false}
            selectedTab={AssayPickerTabs.SPECIALTY_ASSAY_TAB}
            onChange={jest.fn()}
        />;

        const wrapper = mount(component);

        // Verify only two tabs and specialty tab selected
        expect(wrapper.find('.nav-tabs li')).toHaveLength(2);
        expect(wrapper.find('.nav-tabs li.active a#assay-picker-tabs-tab-specialty')).toHaveLength(1);
        expect(wrapper.find('select')).toHaveLength(2);

        wrapper.unmount();
    });


});
