import React from 'react';

import { mount, ReactWrapper } from 'enzyme';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { SampleStatusTag } from './SampleStatusTag';
import { SampleStateType } from './constants';

describe('SampleStatusTag', () => {
    const lockedStatus = {
        label: 'Locked for testing',
        statusType: SampleStateType.Locked,
        description: 'Locked description',
    };

    const consumedStatus = {
        label: 'Consumed for testing',
        statusType: SampleStateType.Consumed,
        description: 'Consumed description',
    };

    const availableStatus = {
        label: 'Available for testing',
        statusType: SampleStateType.Available,
        description: 'Available description',
    };

    const availableNoDescription = {
        label: 'Also available',
        statusType: SampleStateType.Available,
    };

    function validateIconOnly(wrapper: ReactWrapper, expectedClass: string) {
        const helpTip = wrapper.find(LabelHelpTip);
        expect(helpTip.exists()).toBeTruthy();
        const icon = helpTip.find('i');
        expect(icon.exists()).toBeTruthy();
        expect(icon.prop('className')).toContain(expectedClass);
        expect(wrapper.find(LabelHelpTip).exists()).toBeTruthy(); // displays the label
    }

    function validateNotIconOnly(
        wrapper: ReactWrapper,
        expectedClass: string,
        expectedText: string,
        hasHelpTip = true
    ) {
        const spans = wrapper.find('span');
        expect(spans).toHaveLength(hasHelpTip ? 3 : 1);
        expect(spans.at(0).prop('className')).toContain(expectedClass);
        expect(spans.at(hasHelpTip ? 2 : 0).text()).toBe(expectedText);
        if (hasHelpTip) {
            expect(wrapper.find(LabelHelpTip).exists()).toBeTruthy();
        } else {
            expect(wrapper.find(LabelHelpTip).exists()).toBeFalsy();
        }
    }

    test('not enabled', () => {
        LABKEY.moduleContext = {};
        const wrapper = mount(<SampleStatusTag status={lockedStatus} />);
        expect(wrapper.find('span').exists()).toBeFalsy();
    });

    test('enabled, no label', () => {
        LABKEY.moduleContext = { experiment: { 'experimental-sample-status': true } };
        const wrapper = mount(<SampleStatusTag status={{ label: undefined, statusType: SampleStateType.Locked }} />);
        expect(wrapper.find('span').exists()).toBeFalsy();
    });

    test('iconOnly, locked', () => {
        LABKEY.moduleContext = { experiment: { 'experimental-sample-status': true } };
        const wrapper = mount(<SampleStatusTag status={lockedStatus} iconOnly={true} />);
        validateIconOnly(wrapper, 'alert-danger');
    });

    test('iconOnly, consumed', () => {
        LABKEY.moduleContext = { experiment: { 'experimental-sample-status': true } };
        const wrapper = mount(<SampleStatusTag status={consumedStatus} iconOnly={true} />);
        validateIconOnly(wrapper, 'alert-warning');
    });

    test('iconOnly, available', () => {
        LABKEY.moduleContext = { experiment: { 'experimental-sample-status': true } };
        const wrapper = mount(<SampleStatusTag status={availableStatus} iconOnly={true} />);
        validateIconOnly(wrapper, 'alert-success');
    });

    test('iconOnly, no description', () => {
        LABKEY.moduleContext = { experiment: { 'experimental-sample-status': true } };
        const wrapper = mount(<SampleStatusTag status={availableNoDescription} iconOnly={true} />);
        validateIconOnly(wrapper, 'alert-success');
    })

    test('not iconOnly, locked status type', () => {
        LABKEY.moduleContext = { experiment: { 'experimental-sample-status': true } };
        const wrapper = mount(<SampleStatusTag status={lockedStatus} />);
        validateNotIconOnly(wrapper, 'alert-danger', lockedStatus.label);
    });

    test('consumed status type', () => {
        LABKEY.moduleContext = { experiment: { 'experimental-sample-status': true } };
        const wrapper = mount(<SampleStatusTag status={consumedStatus} />);
        validateNotIconOnly(wrapper, 'alert-warning', consumedStatus.label);
    });

    test('available status type with description', () => {
        LABKEY.moduleContext = { experiment: { 'experimental-sample-status': true } };
        const wrapper = mount(<SampleStatusTag status={availableStatus} />);
        validateNotIconOnly(wrapper, 'alert-success', availableStatus.label);
    });

    test('available status type, no description', () => {
        LABKEY.moduleContext = { experiment: { 'experimental-sample-status': true } };
        const status = {
            label: 'Also available',
            statusType: SampleStateType.Available,
        };
        const wrapper = mount(<SampleStatusTag status={status} />);
        validateNotIconOnly(wrapper, 'alert-success', status.label, false);
    });
});
