import React from 'react';
import { act } from '@testing-library/react';

import { DiscardConsumedSamplesPanel } from './DiscardConsumedSamplesPanel';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';
import { getTestAPIWrapper } from '../../APIWrapper';
import { COMMENT_FIELD_ID } from '../forms/input/CommentTextArea';
import { TEST_PROJECT_CONTAINER } from '../../containerFixtures';

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
                discardTitle="Remove All?"
                onCommentChange={jest.fn()}
                shouldDiscard
                toggleShouldDiscard={jest.fn()}
            />,
            {
                serverContext: {
                    container: TEST_PROJECT_CONTAINER,
                },
            }
        );

        expect(getCommentField().disabled).toBe(false);
        expect(getTitle()).toEqual('Remove All?');
    });

    test('remove disabled', () => {
        renderWithAppContext(
            <DiscardConsumedSamplesPanel
                onCommentChange={jest.fn()}
                shouldDiscard={false}
                toggleShouldDiscard={jest.fn()}
            />,
            {
                serverContext: {
                    container: TEST_PROJECT_CONTAINER,
                },
            }
        );

        expect(getCommentField().disabled).toBe(true);
        expect(getTitle()).toEqual('Remove Sample(s) from Storage?');
    });

    const apiRequireComments = getTestAPIWrapper(jest.fn, {
        folder: {
            ...getTestAPIWrapper(jest.fn).folder,
            getAuditSettings: jest.fn().mockResolvedValue({ requireUserComments: true }),
        },
    });

    test('discard enabled and comments required', async () => {
        await act(async () => {
            renderWithAppContext(
                <DiscardConsumedSamplesPanel
                    onCommentChange={jest.fn()}
                    shouldDiscard
                    toggleShouldDiscard={jest.fn()}
                />,
                {
                    appContext: {
                        api: apiRequireComments,
                    },
                    serverContext: {
                        container: TEST_PROJECT_CONTAINER,
                    },
                }
            );
        });
        const textArea = getCommentField();
        expect(textArea.disabled).toBe(false);
        expect(textArea.placeholder).toBe('Enter reason (required)');
    });
});
