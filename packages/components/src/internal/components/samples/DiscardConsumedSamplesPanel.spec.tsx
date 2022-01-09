import React from 'react';
import { mount } from 'enzyme';

import { DiscardConsumedSamplesPanel } from './DiscardConsumedSamplesPanel';

describe('DiscardConsumedSamplesPanel', () => {
    test('discard enabled', () => {
        const wrapper = mount(
            <DiscardConsumedSamplesPanel
                shouldDiscard={true}
                onCommentChange={jest.fn()}
                toggleShouldDiscard={jest.fn()}
                discardTitle="Discard All?"
            />
        );

        expect(wrapper.find('textarea').prop('disabled')).toBe(false);
        expect(wrapper.text()).toContain('Discard All?');
        wrapper.unmount();
    });

    test('discard disabled', () => {
        const wrapper = mount(
            <DiscardConsumedSamplesPanel
                shouldDiscard={false}
                onCommentChange={jest.fn()}
                toggleShouldDiscard={jest.fn()}
            />
        );

        expect(wrapper.find('textarea').prop('disabled')).toBe(true);
        expect(wrapper.text()).toContain('Discard sample?');
        wrapper.unmount();
    });
});
