import React from 'react';

import { Button, Checkbox, FormControl } from 'react-bootstrap';

import { mountWithServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';

import { LoadingSpinner } from '../base/LoadingSpinner';
import { ConfirmModal } from '../base/ConfirmModal';

import { BIOLOGICS_APP_PROPERTIES, SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';

import { getTestAPIWrapper } from '../../APIWrapper';
import { getSamplesTestAPIWrapper } from '../samples/APIWrapper';

import { NameIdSettingsForm } from './NameIdSettings';

describe('NameIdSettings', () => {
    const apiWithSamples = getTestAPIWrapper(jest.fn, {
        samples: getSamplesTestAPIWrapper(jest.fn, {
            getSampleCounter: jest.fn().mockResolvedValue(5),
            hasExistingSamples: jest.fn().mockResolvedValue(true),
        }),
    });
    const apiWithCounterWithoutSamples = getTestAPIWrapper(jest.fn, {
        samples: getSamplesTestAPIWrapper(jest.fn, {
            getSampleCounter: jest.fn().mockResolvedValue(5),
            hasExistingSamples: jest.fn().mockResolvedValue(false),
        }),
    });
    const apiWithNoSamples = getTestAPIWrapper(jest.fn, {
        samples: getSamplesTestAPIWrapper(jest.fn, {
            getSampleCounter: jest.fn().mockResolvedValue(0),
        }),
    });

    let DEFAULT_PROPS;
    beforeEach(() => {
        LABKEY.moduleContext = {
            biologics: {
                productId: BIOLOGICS_APP_PROPERTIES.productId,
            },
        };

        const container = {
            id: 'testContainerId',
            title: 'TestContainer',
            path: '/testContainer',
        };

        DEFAULT_PROPS = {
            loadNameExpressionOptions: jest.fn(async () => {
                return { prefix: 'ABC-', allowUserSpecifiedNames: false };
            }),
            saveNameExpressionOptions: jest.fn(async () => {}),
            api: apiWithNoSamples,
            getIsDirty: jest.fn(),
            setIsDirty: jest.fn(),
            container: container,
            isAppHome: true,
        };
    });

    test('on init', async () => {
        const wrapper = mountWithServerContext(<NameIdSettingsForm {...DEFAULT_PROPS} />);
        expect(wrapper.find(LoadingSpinner).length).toEqual(3);
        expect(wrapper.find('.name-id-setting__prefix-field').exists()).toEqual(false);
        expect(wrapper.find(Checkbox).exists()).toEqual(false);

        await waitForLifecycle(wrapper);

        expect(wrapper.find(LoadingSpinner).length).toEqual(0);
        expect(wrapper.find('.name-id-setting__setting-section')).toHaveLength(2);
        expect(wrapper.find('.name-id-setting__prefix-field')).toHaveLength(1);
        expect(wrapper.find('.sample-counter__setting-section')).toHaveLength(1);
        expect(wrapper.find('.sample-counter__prefix-label')).toHaveLength(2);
        expect(wrapper.find(Checkbox)).toHaveLength(1);
        expect(wrapper.find(FormControl)).toHaveLength(3);
        expect(wrapper.find(Button)).toHaveLength(3);
        expect(DEFAULT_PROPS.loadNameExpressionOptions).toHaveBeenCalled();

        const counterLabel = wrapper.find('div.sample-counter__prefix-label');
        expect(counterLabel.length).toEqual(2);
        expect(counterLabel.at(0).text()).toBe('sampleCount');
        expect(counterLabel.at(1).text()).toBe('rootSampleCount');

        const counterInputs = wrapper.find('input.update-samplecount-input');
        expect(counterInputs.length).toEqual(2);
        expect(counterInputs.at(0).prop('value')).toBe(0);
        expect(counterInputs.at(1).prop('value')).toBe(0);
    });

    test('not app home', async () => {
        const wrapper = mountWithServerContext(<NameIdSettingsForm {...DEFAULT_PROPS} isAppHome={false} />);
        expect(wrapper.find(LoadingSpinner).length).toEqual(2);
        expect(wrapper.find('.name-id-setting__prefix-field').exists()).toEqual(false);
        expect(wrapper.find(Checkbox).exists()).toEqual(false);

        await waitForLifecycle(wrapper);

        expect(wrapper.find(LoadingSpinner).length).toEqual(0);
        expect(wrapper.find('.name-id-setting__setting-section')).toHaveLength(2);
        expect(wrapper.find('.name-id-setting__prefix-field')).toHaveLength(1);
        expect(wrapper.find('.sample-counter__setting-section')).toHaveLength(0);
        expect(wrapper.find('.sample-counter__prefix-label')).toHaveLength(0);
        expect(wrapper.find(Checkbox)).toHaveLength(1);
        expect(wrapper.find(FormControl)).toHaveLength(1);
        expect(wrapper.find(Button)).toHaveLength(1);
        expect(DEFAULT_PROPS.loadNameExpressionOptions).toHaveBeenCalled();

        const counterLabel = wrapper.find('div.sample-counter__prefix-label');
        expect(counterLabel.length).toEqual(0);

        const counterInputs = wrapper.find('input.update-samplecount-input');
        expect(counterInputs.length).toEqual(0);
    });

    test('allowUserSpecifiedNames checkbox', async () => {
        const wrapper = mountWithServerContext(<NameIdSettingsForm {...DEFAULT_PROPS} />);
        await waitForLifecycle(wrapper);

        const checkbox = () => wrapper.find('input').first();
        expect(checkbox().prop('checked')).toBe(false);

        checkbox().simulate('change', { target: { checked: true } });

        await waitForLifecycle(wrapper);
        expect(DEFAULT_PROPS.saveNameExpressionOptions).toHaveBeenCalled();
        expect(checkbox().prop('checked')).toBe(true);
    });

    test('prefix preview', async () => {
        const wrapper = mountWithServerContext(<NameIdSettingsForm {...DEFAULT_PROPS} />);
        await waitForLifecycle(wrapper);

        expect(wrapper.find('.name-id-setting__prefix-example').text()).toContain('ABC-Blood-${GenId}');
    });

    test('apply prefix confirm modal -- cancel', async () => {
        const wrapper = mountWithServerContext(<NameIdSettingsForm {...DEFAULT_PROPS} />);
        await waitForLifecycle(wrapper);

        wrapper
            .find('input[type="text"]')
            .at(0)
            .simulate('change', { target: { value: 'abc' } });

        wrapper.find(Button).at(0).simulate('click');
        expect(wrapper.find(ConfirmModal).exists()).toEqual(true);
        wrapper.find('.close').simulate('click');
        expect(wrapper.find(ConfirmModal).exists()).toEqual(false);
    });

    test('apply prefix confirm modal -- save', async () => {
        const wrapper = mountWithServerContext(<NameIdSettingsForm {...DEFAULT_PROPS} />);
        await waitForLifecycle(wrapper);

        wrapper
            .find('input[type="text"]')
            .at(0)
            .simulate('change', { target: { value: 'abc' } });

        wrapper.find(Button).at(0).simulate('click');
        expect(wrapper.find(ConfirmModal).exists()).toEqual(true);

        // Click on 'Yes, Save and Apply Prefix' button
        wrapper.find(Button).at(2).simulate('click');
        expect(DEFAULT_PROPS.saveNameExpressionOptions).toHaveBeenCalled();
    });

    test('LKSM - not showing prefix', async () => {
        LABKEY.moduleContext = {
            samplemanagement: {
                productId: SAMPLE_MANAGER_APP_PROPERTIES.productId,
            },
        };

        const wrapper = mountWithServerContext(<NameIdSettingsForm {...DEFAULT_PROPS} />);
        await waitForLifecycle(wrapper);

        expect(wrapper.find('.name-id-setting__setting-section')).toHaveLength(1);
        expect(wrapper.find('.name-id-setting__prefix-field')).toHaveLength(0);
        expect(wrapper.find(Checkbox)).toHaveLength(1);
        expect(wrapper.find(FormControl)).toHaveLength(2);
    });

    test('With counter, with existing sample', async () => {
        const wrapper = mountWithServerContext(<NameIdSettingsForm {...DEFAULT_PROPS} api={apiWithSamples} />);
        await waitForLifecycle(wrapper);

        expect(wrapper.find('.sample-counter__setting-section')).toHaveLength(1);
        expect(wrapper.find('.sample-counter__prefix-label')).toHaveLength(2);
        expect(wrapper.find(FormControl)).toHaveLength(3);
        const buttons = wrapper.find(Button);
        expect(buttons.length).toEqual(3);

        expect(buttons.at(1).text()).toBe('Apply New sampleCount');
        expect(buttons.at(2).text()).toBe('Apply New rootSampleCount');

        const counterInputs = wrapper.find('input.update-samplecount-input');
        expect(counterInputs.length).toEqual(2);
        expect(counterInputs.at(0).prop('value')).toBe(5);
        expect(counterInputs.at(1).prop('value')).toBe(5);
    });

    test('With counter, with no existing sample', async () => {
        const wrapper = mountWithServerContext(
            <NameIdSettingsForm {...DEFAULT_PROPS} api={apiWithCounterWithoutSamples} />
        );
        await waitForLifecycle(wrapper);

        expect(wrapper.find('.sample-counter__setting-section')).toHaveLength(1);
        expect(wrapper.find('.sample-counter__prefix-label')).toHaveLength(2);
        expect(wrapper.find(FormControl)).toHaveLength(3);
        const buttons = wrapper.find(Button);
        expect(buttons.length).toEqual(5);

        expect(buttons.at(1).text()).toBe('Apply New sampleCount');
        expect(buttons.at(2).text()).toBe('Reset sampleCount');
        expect(buttons.at(3).text()).toBe('Apply New rootSampleCount');
        expect(buttons.at(4).text()).toBe('Reset rootSampleCount');

        const counterInputs = wrapper.find('input.update-samplecount-input');
        expect(counterInputs.length).toEqual(2);
        expect(counterInputs.at(0).prop('value')).toBe(5);
        expect(counterInputs.at(1).prop('value')).toBe(5);
    });
});
