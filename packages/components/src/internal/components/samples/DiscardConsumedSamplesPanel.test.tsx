import React from 'react';
import { render } from '@testing-library/react';

import { DiscardConsumedSamplesPanel, DISCARD_CONSUMED_COMMENT_FIELD } from './DiscardConsumedSamplesPanel';

describe('DiscardConsumedSamplesPanel', () => {
    function getCommentField(): HTMLTextAreaElement {
        return document.getElementById(DISCARD_CONSUMED_COMMENT_FIELD) as HTMLTextAreaElement;
    }

    function getTitle(): string {
        return document.getElementsByClassName('discard-consumed-title')[0].innerHTML;
    }

    test('discard enabled', () => {
        render(
            <DiscardConsumedSamplesPanel
                discardTitle="Discard All?"
                onCommentChange={jest.fn()}
                shouldDiscard
                toggleShouldDiscard={jest.fn()}
            />
        );

        expect(getCommentField().disabled).toBe(false);
        expect(getTitle()).toEqual('Discard All?');
    });

    test('discard disabled', () => {
        render(
            <DiscardConsumedSamplesPanel
                onCommentChange={jest.fn()}
                shouldDiscard={false}
                toggleShouldDiscard={jest.fn()}
            />
        );

        expect(getCommentField().disabled).toBe(true);
        expect(getTitle()).toEqual('Discard sample(s) from storage?');
    });
});
