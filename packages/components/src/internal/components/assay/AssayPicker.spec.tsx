import React from 'react';

import getAssayDesignSectionOptions from '../../../test/data/assay-getAssayDesignSelectOptions.json';
import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';

import { AssayPicker, AssayPickerTabs } from './AssayPicker';

const load = (): Promise<any> => {
    return Promise.resolve(getAssayDesignSectionOptions);
};

describe('AssayPicker', () => {
    test('AssayPicker', async () => {
        const wrapper = mountWithAppServerContext(
            <AssayPicker loadOptions={load} hasPremium onChange={jest.fn()} showContainerSelect showImport />
        );
        await waitForLifecycle(wrapper);

        // Verify all three tabs shown and standard assay selected
        expect(wrapper.find('.nav-tabs li')).toHaveLength(3);
        expect(wrapper.find('.nav-tabs li').at(0).props().className).toEqual('active')
        expect(wrapper.find('#assay-type-select-container')).toHaveLength(3);

        // Click import tab and verify it's shown
        expect(wrapper.find('.nav-tabs li.active a#assay-picker-tabs-tab-import')).toHaveLength(0);
        const importTab = wrapper.find('.nav-tabs li a').at(2);
        importTab.simulate('click');
        expect(wrapper.find('.nav-tabs li').at(2).props().className).toEqual('active');
        expect(wrapper.find('.file-upload--container')).toHaveLength(1);

        wrapper.unmount();
    });

    test('AssayPicker No Import, No Container, Selected Specialty tab, No premium', async () => {
        const wrapper = mountWithAppServerContext(
            <AssayPicker
                defaultTab={AssayPickerTabs.SPECIALTY_ASSAY_TAB}
                hasPremium={false}
                loadOptions={load}
                onChange={jest.fn()}
                showContainerSelect={false}
                showImport={false}
            />
        );
        await waitForLifecycle(wrapper);

        // Verify only two tabs and specialty tab selected
        expect(wrapper.find('.nav-tabs li')).toHaveLength(2);
        expect(wrapper.find('.nav-tabs li').at(0).text()).toEqual('Standard Assay');
        expect(wrapper.find('.nav-tabs li').at(1).text()).toEqual('Specialty Assays');
        expect(wrapper.find('.nav-tabs li').at(1).props().className).toEqual('active')
        expect(wrapper.find('#assay-type-select-container')).toHaveLength(0);
        expect(wrapper.find('.alert-info')).toHaveLength(1);

        wrapper.unmount();
    });
});
