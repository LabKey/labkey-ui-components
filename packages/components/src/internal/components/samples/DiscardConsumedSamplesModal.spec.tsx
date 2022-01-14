import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { DiscardConsumedSamplesModal } from './DiscardConsumedSamplesModal';

describe('DiscardConsumedSamplesModal', () => {
    function validate(
        modal: ReactWrapper,
        expectedTitle: string,
        expectedContent: string,
        expectedFinishText: string,
        isDiscard: boolean
    ): void {
        expect(modal.find('.modal-title').text()).toBe(expectedTitle);

        expect(modal.find('.modal-body').text()).toContain(expectedContent);

        expect(modal.find('.btn')).toHaveLength(2);
        expect(modal.find('.btn-danger')).toHaveLength(isDiscard ? 1 : 0);
        expect(modal.find('.btn-success')).toHaveLength(isDiscard ? 0 : 1);

        expect(modal.find('.btn').at(1).text()).toBe(expectedFinishText);
    }

    test('1 consumed out of 1 sample', () => {
        const wrapper = mount(
            <DiscardConsumedSamplesModal
                consumedSampleCount={1}
                totalSampleCount={1}
                onConfirm={jest.fn()}
                onCancel={jest.fn()}
            />
        );

        validate(
            wrapper,
            'Setting Sample to Consumed',
            'You are updating 1 sample and setting it to consumed. Would you like to also discard the consumed sample from storage?Yes, discard the sample',
            'Yes, Discard Sample',
            true
        );

        wrapper.unmount();
    });

    test('2 consumed out of 2 samples', () => {
        const wrapper = mount(
            <DiscardConsumedSamplesModal
                consumedSampleCount={2}
                totalSampleCount={2}
                onConfirm={jest.fn()}
                onCancel={jest.fn()}
            />
        );

        validate(
            wrapper,
            'Setting 2 Samples to Consumed',
            'You are updating 2 samples and setting them to consumed. Would you like to also discard the 2 consumed samples from storage?Yes, discard the samples',
            'Yes, Discard Samples',
            true
        );

        wrapper.unmount();
    });

    test('1 consumed out of 2 samples', () => {
        const wrapper = mount(
            <DiscardConsumedSamplesModal
                consumedSampleCount={1}
                totalSampleCount={2}
                onConfirm={jest.fn()}
                onCancel={jest.fn()}
            />
        );

        validate(
            wrapper,
            'Setting Sample to Consumed',
            'You are updating 2 samples and setting 1 in-storage sample to consumed. Would you like to also discard the consumed sample from storage?Yes, discard the sample',
            'Yes, Discard Sample',
            true
        );

        wrapper.unmount();
    });

    test('2 consumed out of 3 samples', () => {
        const wrapper = mount(
            <DiscardConsumedSamplesModal
                consumedSampleCount={2}
                totalSampleCount={3}
                onConfirm={jest.fn()}
                onCancel={jest.fn()}
            />
        );

        validate(
            wrapper,
            'Setting 2 Samples to Consumed',
            'You are updating 3 samples and setting 2 in-storage samples to consumed. Would you like to also discard the 2 consumed samples from storage?Yes, discard the samples',
            'Yes, Discard Samples',
            true
        );

        wrapper.unmount();
    });

    test('1 consumed out of 1 sample, skip discard', () => {
        const wrapper = mount(
            <DiscardConsumedSamplesModal
                consumedSampleCount={1}
                totalSampleCount={1}
                onConfirm={jest.fn()}
                onCancel={jest.fn()}
            />
        );

        wrapper.setState({ shouldDiscard: false });
        validate(
            wrapper,
            'Setting Sample to Consumed',
            'You are updating 1 sample and setting it to consumed. Would you like to also discard the consumed sample from storage?Yes, discard the sample',
            'Update Sample Only',
            false
        );

        wrapper.unmount();
    });

    test('1 consumed out of 3 sample, skip discard', () => {
        const wrapper = mount(
            <DiscardConsumedSamplesModal
                consumedSampleCount={1}
                totalSampleCount={3}
                onConfirm={jest.fn()}
                onCancel={jest.fn()}
            />
        );

        wrapper.setState({ shouldDiscard: false });
        validate(
            wrapper,
            'Setting Sample to Consumed',
            'You are updating 3 samples and setting 1 in-storage sample to consumed. Would you like to also discard the consumed sample from storage?Yes, discard the sample',
            'Update Samples Only',
            false
        );

        wrapper.unmount();
    });
});
