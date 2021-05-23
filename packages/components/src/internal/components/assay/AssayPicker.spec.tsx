import React from 'react';
import { mount } from 'enzyme';

import { AssayPicker, AssayPickerTabs, initNotificationsState, sleep } from '../../..';
import { initUnitTestMocks } from '../../testHelperMocks';
import { initAssayPickerOptions } from '../../../stories/mock';

beforeAll(() => {
    initNotificationsState();
    initUnitTestMocks([initAssayPickerOptions]);
});

describe('AssayPicker', () => {
    test('AssayPicker', async () => {
        const component = <AssayPicker showImport={true} showContainerSelect={true} onChange={jest.fn()} hasPremium={true}/>;

        const wrapper = mount(component);
        await sleep();

        // Verify all three tabs shown and standard assay selected
        expect(wrapper.find('.nav-tabs li')).toHaveLength(3);
        expect(wrapper.find('.nav-tabs li.active a#assay-picker-tabs-tab-standard')).toHaveLength(1);
        expect(wrapper.find('#assay-type-select-container')).toHaveLength(1);

        // Click import tab and verify it's shown
        expect(wrapper.find('.nav-tabs li.active a#assay-picker-tabs-tab-import')).toHaveLength(0);
        const importTab = wrapper.find('.nav-tabs li a#assay-picker-tabs-tab-import');
        expect(importTab).toHaveLength(1);
        importTab.simulate('click');
        expect(wrapper.find('.nav-tabs li.active a#assay-picker-tabs-tab-import')).toHaveLength(1);
        expect(wrapper.find('.file-upload--container')).toHaveLength(1);

        expect(wrapper).toMatchSnapshot();
        wrapper.unmount();
    });

    test('AssayPicker No Import, No Container, Selected Specialty tab, No premium', async () => {
        const component = (
            <AssayPicker
                showImport={false}
                showContainerSelect={false}
                selectedTab={AssayPickerTabs.SPECIALTY_ASSAY_TAB}
                onChange={jest.fn()}
                hasPremium={false}
            />
        );

        const wrapper = mount(component);
        await sleep(1000);

        // Verify only two tabs and specialty tab selected
        expect(wrapper.find('.nav-tabs li')).toHaveLength(2);
        expect(wrapper.find('.nav-tabs li a#assay-picker-tabs-tab-import')).toHaveLength(0);
        expect(wrapper.find('.nav-tabs li.active a#assay-picker-tabs-tab-specialty')).toHaveLength(1);
        expect(wrapper.find('#assay-type-select-container')).toHaveLength(0);
        expect(wrapper.find('.alert-info')).toHaveLength(1);

        const activeTab = wrapper.find('.nav-tabs li a#assay-picker-tabs-tab-standard');
        expect(activeTab).toHaveLength(1);
        activeTab.simulate('click');
        expect(wrapper.find('#assay-type-select-container')).toHaveLength(0);

        wrapper.unmount();
    });
});
