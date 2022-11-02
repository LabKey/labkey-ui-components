import React from 'react';

import { initUnitTestMocks } from '../../../test/testHelperMocks';
import { initAssayPickerOptions } from '../../../test/mock';
import { mountWithAppServerContext, waitForLifecycle } from '../../testHelpers';

import { AssayPicker, AssayPickerTabs } from './AssayPicker';

beforeAll(() => {
    initUnitTestMocks([initAssayPickerOptions]);
});

describe('AssayPicker', () => {
    test('AssayPicker', async () => {
        const wrapper = mountWithAppServerContext(
            <AssayPicker hasPremium onChange={jest.fn()} showContainerSelect showImport />
        );
        await waitForLifecycle(wrapper);

        // Verify all three tabs shown and standard assay selected
        expect(wrapper.find('.nav-tabs li')).toHaveLength(3);
        expect(wrapper.find('.nav-tabs li.active a#assay-picker-tabs-tab-standard')).toHaveLength(1);
        expect(wrapper.find('#assay-type-select-container')).toHaveLength(3);

        // Click import tab and verify it's shown
        expect(wrapper.find('.nav-tabs li.active a#assay-picker-tabs-tab-import')).toHaveLength(0);
        const importTab = wrapper.find('.nav-tabs li a#assay-picker-tabs-tab-import');
        expect(importTab).toHaveLength(1);
        importTab.simulate('click');
        expect(wrapper.find('.nav-tabs li.active a#assay-picker-tabs-tab-import')).toHaveLength(1);
        expect(wrapper.find('.file-upload--container')).toHaveLength(1);

        wrapper.unmount();
    });

    test('AssayPicker No Import, No Container, Selected Specialty tab, No premium', async () => {
        const wrapper = mountWithAppServerContext(
            <AssayPicker
                defaultTab={AssayPickerTabs.SPECIALTY_ASSAY_TAB}
                hasPremium={false}
                onChange={jest.fn()}
                showContainerSelect={false}
                showImport={false}
            />
        );
        await waitForLifecycle(wrapper);

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
