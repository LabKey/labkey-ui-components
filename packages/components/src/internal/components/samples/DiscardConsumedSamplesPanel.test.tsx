import React from 'react';

import { DiscardConsumedSamplesPanel } from './DiscardConsumedSamplesPanel';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';
import { getTestAPIWrapper } from '../../APIWrapper';
import { act } from 'react-dom/test-utils';
import { COMMENT_FIELD_ID } from '../forms/input/CommentTextArea';

describe('DiscardConsumedSamplesPanel', () => {
    function getCommentField(): HTMLTextAreaElement {
        return document.getElementById(COMMENT_FIELD_ID) as HTMLTextAreaElement;
    }

    function getTitle(): string {
        return document.getElementsByClassName('discard-consumed-title')[0].innerHTML;
    }

    test('discard enabled', () => {
        renderWithAppContext(
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
        renderWithAppContext(
            <DiscardConsumedSamplesPanel
                onCommentChange={jest.fn()}
                shouldDiscard={false}
                toggleShouldDiscard={jest.fn()}
            />
        );

        expect(getCommentField().disabled).toBe(true);
        expect(getTitle()).toEqual('Discard Sample(s) from Storage?');
    });

    const apiRequireComments = getTestAPIWrapper(jest.fn, {
        folder: {
            ...getTestAPIWrapper(jest.fn).folder,
            getAuditSettings: jest.fn().mockResolvedValue({ requireUserComments: true }),
        },
    });

    test('discard enabled and comments required', async () => {
        await act(async() => {
            renderWithAppContext(
                <DiscardConsumedSamplesPanel
                    onCommentChange={jest.fn()}
                    shouldDiscard
                    toggleShouldDiscard={jest.fn()}
                />, {
                    appContext: {
                        api: apiRequireComments,
                    },
                }
            );
        });
        const textArea = getCommentField();
        expect(textArea.disabled).toBe(false);
        expect(textArea.placeholder).toBe('Enter reason (required)');
    });
});
