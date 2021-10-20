import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { waitForLifecycle } from '../../testHelpers';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { AddEntityButton } from '../buttons/AddEntityButton';
import { Alert } from '../base/Alert';
import { SampleState } from './actions';

import { ManageSampleStatusesPanel, SampleStatusDetail, SampleStatusesList } from './ManageSampleStatusesPanel';

import { getTestAPIWrapper } from '../../APIWrapper';
import { getSamplesTestAPIWrapper } from './APIWrapper';

const DEFAULT_PROPS = {
    api: getTestAPIWrapper(jest.fn, {
        samples: getSamplesTestAPIWrapper(jest.fn, {
            getSampleStatuses: () => Promise.resolve([new SampleState()]),
        }),
    }),
};

describe('ManageSampleStatusesPanel', () => {
    function validate(wrapper: ReactWrapper, hasError = false, hasTitleCls = false): void {
        expect(wrapper.find(LoadingSpinner)).toHaveLength(0);
        expect(wrapper.find(Alert)).toHaveLength(hasError ? 1 : 0);

        expect(wrapper.find('.panel')).toHaveLength(1);
        expect(wrapper.find('h4')).toHaveLength(hasTitleCls ? 1 : 0);
        expect(wrapper.find('.panel-heading')).toHaveLength(!hasTitleCls ? 1 : 0);

        const elCount = !hasError ? 1 : 0;
        expect(wrapper.find('.choices-container')).toHaveLength(elCount);
        expect(wrapper.find(SampleStatusesList)).toHaveLength(elCount);
        expect(wrapper.find(AddEntityButton)).toHaveLength(elCount);
        expect(wrapper.find(SampleStatusDetail)).toHaveLength(elCount);
    }

    test('loading', async () => {
        const wrapper = mount(<ManageSampleStatusesPanel {...DEFAULT_PROPS} />);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(1);
        await waitForLifecycle(wrapper);
        validate(wrapper);
        wrapper.unmount();
    });

    test('no states', async () => {
        const wrapper = mount(
            <ManageSampleStatusesPanel
                {...DEFAULT_PROPS}
                api={getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSampleStatuses: () => Promise.resolve([]),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(SampleStatusesList).prop('states').length).toBe(0);
        expect(wrapper.find(SampleStatusDetail).prop('state')).toBe(null);
        wrapper.unmount();
    });

    test('with states and selection', async () => {
        const wrapper = mount(<ManageSampleStatusesPanel {...DEFAULT_PROPS} />);
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(SampleStatusesList).prop('states').length).toBe(1);
        expect(wrapper.find(SampleStatusesList).prop('selected')).toBe(undefined);
        expect(wrapper.find(SampleStatusDetail).prop('state')).toBeUndefined();

        // click on a status row to select it
        wrapper.find('.list-group-item').first().simulate('click');
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(SampleStatusesList).prop('states').length).toBe(1);
        expect(wrapper.find(SampleStatusesList).prop('selected')).toBe(0);
        expect(wrapper.find(SampleStatusDetail).prop('state')).toBeDefined();

        wrapper.unmount();
    });

    test('error retrieving states', async () => {
        const wrapper = mount(
            <ManageSampleStatusesPanel
                {...DEFAULT_PROPS}
                api={getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSampleStatuses: () => Promise.reject({ exception: 'Failure' }),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);
        validate(wrapper, true);
        wrapper.unmount();
    });

    test('add new', async () => {
        const wrapper = mount(<ManageSampleStatusesPanel {...DEFAULT_PROPS} />);
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(SampleStatusesList).prop('states').length).toBe(1);
        expect(wrapper.find(SampleStatusesList).prop('selected')).toBe(undefined);
        expect(wrapper.find(SampleStatusDetail).prop('state')).toBeUndefined();
        expect(wrapper.find(SampleStatusDetail).prop('addNew')).toBe(false);
        expect(wrapper.find(AddEntityButton).prop('disabled')).toBe(false);

        wrapper.find('.btn').simulate('click');
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(SampleStatusesList).prop('states').length).toBe(1);
        expect(wrapper.find(SampleStatusesList).prop('selected')).toBe(-1);
        expect(wrapper.find(SampleStatusDetail).prop('state')).toBeUndefined();
        expect(wrapper.find(SampleStatusDetail).prop('addNew')).toBe(true);
        expect(wrapper.find(AddEntityButton).prop('disabled')).toBe(true);

        wrapper.unmount();
    });

    test('titleCls', async () => {
        const wrapper = mount(<ManageSampleStatusesPanel {...DEFAULT_PROPS} titleCls="test-cls" />);
        await waitForLifecycle(wrapper);
        validate(wrapper, false, true);
        wrapper.unmount();
    });
});
