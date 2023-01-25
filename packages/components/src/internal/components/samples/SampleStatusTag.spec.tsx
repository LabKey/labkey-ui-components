import React from 'react';

import { mount, ReactWrapper } from 'enzyme';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { SampleStatusTag } from './SampleStatusTag';
import { SampleStateType } from './constants';

beforeEach(() => {
    LABKEY.moduleContext = { api: { moduleNames: ['samplemanagement'] } };
});

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
        const wrapper = mount(<SampleStatusTag status={{ label: undefined, statusType: SampleStateType.Locked }} />);
        expect(wrapper.find('span').exists()).toBeFalsy();
    });

    test('iconOnly, locked', () => {
        const wrapper = mount(<SampleStatusTag status={lockedStatus} iconOnly={true} />);
        validateIconOnly(wrapper, 'danger');
    });

    test('iconOnly, consumed', () => {
        const wrapper = mount(<SampleStatusTag status={consumedStatus} iconOnly={true} />);
        validateIconOnly(wrapper, 'warning');
    });

    test('iconOnly, available', () => {
        const wrapper = mount(<SampleStatusTag status={availableStatus} iconOnly={true} />);
        validateIconOnly(wrapper, 'success');
    });

    test('iconOnly, no description', () => {
        const wrapper = mount(<SampleStatusTag status={availableNoDescription} iconOnly={true} />);
        validateIconOnly(wrapper, 'success');
    });

    test('not iconOnly, locked status type', () => {
        const wrapper = mount(<SampleStatusTag status={lockedStatus} />);
        validateNotIconOnly(wrapper, 'danger', lockedStatus.label);
    });

    test('consumed status type', () => {
        const wrapper = mount(<SampleStatusTag status={consumedStatus} />);
        validateNotIconOnly(wrapper, 'warning', consumedStatus.label);
    });

    test('available status type with description', () => {
        const wrapper = mount(<SampleStatusTag status={availableStatus} />);
        validateNotIconOnly(wrapper, 'success', availableStatus.label);
    });

    test('available status, hide description', () => {
        const wrapper = mount(<SampleStatusTag status={availableStatus} hideDescription />);
        validateNotIconOnly(wrapper, 'success', availableStatus.label, false);
    });

    test('available status type, no description', () => {
        const status = {
            label: 'Also available',
            statusType: SampleStateType.Available,
        };
        const wrapper = mount(<SampleStatusTag status={status} />);
        validateNotIconOnly(wrapper, 'success', status.label, false);
    });
});
