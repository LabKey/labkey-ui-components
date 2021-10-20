import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { waitForLifecycle } from '../../testHelpers';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { AddEntityButton } from '../buttons/AddEntityButton';
import { Alert } from '../base/Alert';
import { LockIcon } from '../base/LockIcon';
import { SampleState } from './actions';

import {
    ManageSampleStatusesPanel,
    SampleStatusDetail,
    SampleStatusesList,
    SampleStatusesListItem,
} from './ManageSampleStatusesPanel';

import { getTestAPIWrapper } from '../../APIWrapper';
import { getSamplesTestAPIWrapper } from './APIWrapper';

describe('ManageSampleStatusesPanel', () => {
    const DEFAULT_PROPS = {
        api: getTestAPIWrapper(jest.fn, {
            samples: getSamplesTestAPIWrapper(jest.fn, {
                getSampleStatuses: () => Promise.resolve([new SampleState()]),
            }),
        }),
    };

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

describe('SampleStatusesList', () => {
    const DEFAULT_PROPS = {
        states: [],
        selected: undefined,
        onSelect: jest.fn,
    };

    function validate(wrapper: ReactWrapper, count = 0): void {
        expect(wrapper.find('.choices-list__empty-message')).toHaveLength(count === 0 ? 1 : 0);
        expect(wrapper.find('.list-group')).toHaveLength(1);
        expect(wrapper.find(SampleStatusesListItem)).toHaveLength(count);
    }

    test('no states', () => {
        const wrapper = mount(<SampleStatusesList {...DEFAULT_PROPS} />);
        validate(wrapper);
        wrapper.unmount();
    });

    test('with states, no selection', () => {
        const states = [new SampleState(), new SampleState()];
        const wrapper = mount(<SampleStatusesList {...DEFAULT_PROPS} states={states} />);
        validate(wrapper, states.length);
        expect(wrapper.find(SampleStatusesListItem).first().prop('active')).toBe(false);
        expect(wrapper.find(SampleStatusesListItem).last().prop('active')).toBe(false);
        wrapper.unmount();
    });

    test('with states, with selection', () => {
        const states = [new SampleState(), new SampleState()];
        const wrapper = mount(<SampleStatusesList {...DEFAULT_PROPS} states={states} selected={1} />);
        validate(wrapper, states.length);
        expect(wrapper.find(SampleStatusesListItem).first().prop('active')).toBe(false);
        expect(wrapper.find(SampleStatusesListItem).last().prop('active')).toBe(true);
        wrapper.unmount();
    });
});

describe('SampleStatusesListItem', () => {
    const DEFAULT_PROPS = {
        index: 0,
        state: new SampleState({ label: 'Available', stateType: 'Available', inUse: false }),
        onSelect: jest.fn,
    };

    function validate(wrapper: ReactWrapper, active = false, inUse = false, text = 'Available'): void {
        expect(wrapper.find('button')).toHaveLength(1);
        expect(wrapper.find('.active')).toHaveLength(active ? 1 : 0);
        expect(wrapper.find('.choices-list__item-type')).toHaveLength(text !== 'Available' ? 1 : 0);
        expect(wrapper.find(LockIcon)).toHaveLength(inUse ? 1 : 0);
        expect(wrapper.find('button').text()).toBe(text);
    }

    test('default props', () => {
        const wrapper = mount(<SampleStatusesListItem {...DEFAULT_PROPS} />);
        validate(wrapper);
        wrapper.unmount();
    });

    test('active', () => {
        const wrapper = mount(<SampleStatusesListItem {...DEFAULT_PROPS} active />);
        validate(wrapper, true);
        wrapper.unmount();
    });

    test('stateType not same as label', () => {
        const state = new SampleState({ label: 'Received', stateType: 'Available', inUse: false });
        const wrapper = mount(<SampleStatusesListItem {...DEFAULT_PROPS} state={state} />);
        validate(wrapper, false, false, 'ReceivedAvailable');
        wrapper.unmount();
    });

    test('in use', () => {
        const state = new SampleState({ label: 'Available', stateType: 'Available', inUse: true });
        const wrapper = mount(<SampleStatusesListItem {...DEFAULT_PROPS} state={state} />);
        validate(wrapper, false, true);
        wrapper.unmount();
    });
});
