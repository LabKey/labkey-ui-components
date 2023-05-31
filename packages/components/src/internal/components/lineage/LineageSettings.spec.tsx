import React from 'react';
import { mount } from 'enzyme';

import { waitForLifecycle } from '../../enzymeTestHelpers';

import { LineageFilter } from './types';
import { LineageSettings } from './LineageSettings';

describe('LineageSettings', () => {
    test('onFilterChange', async () => {
        const filter = new LineageFilter('type', ['Awesome']);
        const filter2 = new LineageFilter('lsid', ['lsid:value:1']);
        const onSettingsChange = jest.fn();
        const wrapper = mount(<LineageSettings filters={[filter, filter2]} onSettingsChange={onSettingsChange} />);

        const input = wrapper.find('input[type="checkbox"][name="type"]');
        expect(input.exists()).toBe(true);
        input.simulate('change', { target: { checked: true, name: filter.field } });
        input.simulate('change', { target: { checked: false, name: filter.field } });
        input.simulate('change', { target: { checked: false, name: filter2.field } });
        await waitForLifecycle(wrapper, 500); // needs long wait

        expect(onSettingsChange).toHaveBeenCalledTimes(1);
        expect(onSettingsChange).toHaveBeenCalledWith({ filters: [], originalFilters: [filter, filter2] });

        input.simulate('change', { target: { checked: true, name: filter.field } });
        await waitForLifecycle(wrapper, 500);

        expect(onSettingsChange).toHaveBeenCalledTimes(2);
        expect(onSettingsChange).toHaveBeenCalledWith({ filters: [filter], originalFilters: [filter, filter2] });

        wrapper.unmount();
    });
});
