import React from 'react';

import { Button, Checkbox, FormControl } from 'react-bootstrap';

import { mountWithServerContext, waitForLifecycle } from '../../testHelpers';

import { LoadingSpinner } from '../base/LoadingSpinner';
import { ConfirmModal } from '../base/ConfirmModal';

import { BIOLOGICS_APP_PROPERTIES, SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';

import { NameIdSettingsForm } from './NameIdSettings';

describe('NameIdSettings', () => {
    let DEFAULT_PROPS;
    beforeEach(() => {
        LABKEY.moduleContext = {
            biologics: {
                productId: BIOLOGICS_APP_PROPERTIES.productId,
            },
        };

        DEFAULT_PROPS = {
            loadNameExpressionOptions: jest.fn(async () => {
                return { prefix: 'ABC-', allowUserSpecifiedNames: false };
            }),
            saveNameExpressionOptions: jest.fn(async () => {}),
            getIsDirty: jest.fn(),
            setIsDirty: jest.fn(),
        };
    });

    test('on init', async () => {
        const wrapper = mountWithServerContext(<NameIdSettingsForm {...DEFAULT_PROPS} />);
        expect(wrapper.find(LoadingSpinner).length).toEqual(2);
        expect(wrapper.find('.name-id-setting__prefix-field').exists()).toEqual(false);
        expect(wrapper.find(Checkbox).exists()).toEqual(false);

        await waitForLifecycle(wrapper);

        expect(wrapper.find(LoadingSpinner).length).toEqual(0);
        expect(wrapper.find('.name-id-setting__setting-section')).toHaveLength(2);
        expect(wrapper.find('.name-id-setting__prefix-field')).toHaveLength(1);
        expect(wrapper.find(Checkbox)).toHaveLength(1);
        expect(wrapper.find(FormControl)).toHaveLength(1);
        expect(DEFAULT_PROPS.loadNameExpressionOptions).toHaveBeenCalled();
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

        wrapper.find(Button).simulate('click');
        expect(wrapper.find(ConfirmModal).exists()).toEqual(true);
        wrapper.find('.close').simulate('click');
        expect(wrapper.find(ConfirmModal).exists()).toEqual(false);
    });

    test('apply prefix confirm modal -- save', async () => {
        const wrapper = mountWithServerContext(<NameIdSettingsForm {...DEFAULT_PROPS} />);
        await waitForLifecycle(wrapper);

        wrapper.find(Button).simulate('click');
        expect(wrapper.find(ConfirmModal).exists()).toEqual(true);

        // Click on 'Yes, Save and Apply Prefix' button
        wrapper.find(Button).last().simulate('click');
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
        expect(wrapper.find(FormControl)).toHaveLength(0);
    });
});
