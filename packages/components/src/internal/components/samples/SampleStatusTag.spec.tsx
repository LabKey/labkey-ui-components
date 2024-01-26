import React from 'react';

import { ReactWrapper } from 'enzyme';

import { mountWithAppServerContext } from '../../test/enzymeTestHelpers';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT } from '../../productFixtures';

import { SampleStatusTag } from './SampleStatusTag';
import { SampleStateType } from './constants';

describe('SampleStatusTag', () => {
    const serverContext = { moduleContext: TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT };

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

    function validateIconOnly(wrapper: ReactWrapper, expectedClass: string): void {
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
    ): void {
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
        const wrapper = mountWithAppServerContext(<SampleStatusTag status={lockedStatus} />);
        expect(wrapper.find('span').exists()).toBeFalsy();
    });

    test('enabled, no label', () => {
        const wrapper = mountWithAppServerContext(
            <SampleStatusTag status={{ label: undefined, statusType: SampleStateType.Locked }} />,
            undefined,
            serverContext
        );
        expect(wrapper.find('span').exists()).toBeFalsy();
    });

    test('iconOnly, locked', () => {
        const wrapper = mountWithAppServerContext(
            <SampleStatusTag status={lockedStatus} iconOnly />,
            undefined,
            serverContext
        );
        validateIconOnly(wrapper, 'danger');
    });

    test('iconOnly, consumed', () => {
        const wrapper = mountWithAppServerContext(
            <SampleStatusTag status={consumedStatus} iconOnly />,
            undefined,
            serverContext
        );
        validateIconOnly(wrapper, 'warning');
    });

    test('iconOnly, available', () => {
        const wrapper = mountWithAppServerContext(
            <SampleStatusTag status={availableStatus} iconOnly />,
            undefined,
            serverContext
        );
        validateIconOnly(wrapper, 'success');
    });

    test('iconOnly, no description', () => {
        const wrapper = mountWithAppServerContext(
            <SampleStatusTag status={availableNoDescription} iconOnly />,
            undefined,
            serverContext
        );
        validateIconOnly(wrapper, 'success');
    });

    test('not iconOnly, locked status type', () => {
        const wrapper = mountWithAppServerContext(<SampleStatusTag status={lockedStatus} />, undefined, serverContext);
        validateNotIconOnly(wrapper, 'danger', lockedStatus.label);
    });

    test('consumed status type', () => {
        const wrapper = mountWithAppServerContext(
            <SampleStatusTag status={consumedStatus} />,
            undefined,
            serverContext
        );
        validateNotIconOnly(wrapper, 'warning', consumedStatus.label);
    });

    test('available status type with description', () => {
        const wrapper = mountWithAppServerContext(
            <SampleStatusTag status={availableStatus} />,
            undefined,
            serverContext
        );
        validateNotIconOnly(wrapper, 'success', availableStatus.label);
    });

    test('available status, hide description', () => {
        const wrapper = mountWithAppServerContext(
            <SampleStatusTag status={availableStatus} hideDescription />,
            undefined,
            serverContext
        );
        validateNotIconOnly(wrapper, 'success', availableStatus.label, false);
    });

    test('available status type, no description', () => {
        const status = {
            label: 'Also available',
            statusType: SampleStateType.Available,
        };
        const wrapper = mountWithAppServerContext(<SampleStatusTag status={status} />, undefined, serverContext);
        validateNotIconOnly(wrapper, 'success', status.label, false);
    });
});
