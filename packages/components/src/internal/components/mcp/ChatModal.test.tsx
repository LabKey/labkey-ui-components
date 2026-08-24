/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import {
    ChatHistory,
    ChatHistoryProps,
    ChatModal,
    ChatPrompt,
    ChatPromptProps,
    ChatSessionProps,
    RenderSegment,
} from './ChatModal';
import { ChatMessage, ChatRole, ChatSegment } from './models';

const TITLE = 'Test Chat';

function makeMessage(overrides?: Partial<ChatMessage>): ChatMessage {
    return {
        id: overrides?.id ?? `msg-${Math.random()}`,
        role: ChatRole.assistant,
        timestamp: 0,
        ...overrides,
    };
}

function getHistoryProps(overrides?: Partial<ChatHistoryProps>): ChatHistoryProps {
    return {
        isPending: false,
        messages: [],
        ...overrides,
    };
}

function getPromptProps(overrides?: Partial<ChatPromptProps>): ChatPromptProps {
    return {
        isPending: false,
        onInterrupt: jest.fn(),
        sendPrompt: jest.fn().mockResolvedValue(undefined),
        title: TITLE,
        ...overrides,
    };
}

function getSessionProps(overrides?: Partial<ChatSessionProps>): ChatSessionProps {
    return {
        isPending: false,
        messages: [],
        onCancel: jest.fn(),
        onInterrupt: jest.fn(),
        sendPrompt: jest.fn().mockResolvedValue(undefined),
        title: TITLE,
        ...overrides,
    };
}

function getTextarea(): HTMLTextAreaElement {
    return screen.getByLabelText(`${TITLE} Prompt`) as HTMLTextAreaElement;
}

function getPromptButton(): HTMLButtonElement {
    return document.querySelector('.prompt-button') as HTMLButtonElement;
}

describe('ChatHistory', () => {
    describe('message rendering', () => {
        test('renders user messages as user-prompt and assistant text', () => {
            // Arrange
            const messages = [
                makeMessage({ id: 'u1', role: ChatRole.user, text: 'Hello there' }),
                makeMessage({ id: 'a1', role: ChatRole.assistant, text: 'Hi back' }),
            ];

            // Act
            render(<ChatHistory {...getHistoryProps({ messages })} />);

            // Assert - user message is in user-prompt bubble; assistant message is in assistant-response with its text
            const userBubble = document.querySelector('.chat-item.user-prompt');
            expect(userBubble).toHaveTextContent('Hello there');
            const assistantBubble = document.querySelector('.chat-item.assistant-response');
            expect(assistantBubble).toHaveTextContent('Hi back');
            expect(assistantBubble).not.toHaveClass('error-response');
        });

        test('renders assistant error and suppresses text/segments', () => {
            // Arrange
            const messages = [
                makeMessage({
                    id: 'e1',
                    role: ChatRole.assistant,
                    error: 'Something broke',
                    text: 'should not be shown',
                    segments: [{ type: 'text', text: 'also not shown' }],
                }),
            ];

            // Act
            render(<ChatHistory {...getHistoryProps({ messages })} />);

            // Assert - the error-response bubble shows the error and nothing else from text/segments
            const errorBubble = document.querySelector('.chat-item.assistant-response.error-response');
            expect(errorBubble).toHaveTextContent('Something broke');
            expect(screen.queryByText('should not be shown')).not.toBeInTheDocument();
            expect(screen.queryByText('also not shown')).not.toBeInTheDocument();
        });

        test('renders no chat items when there are no messages', () => {
            // Act
            render(<ChatHistory {...getHistoryProps()} />);

            // Assert - the history container is present but empty
            expect(document.querySelector('.chat-history')).toBeInTheDocument();
            expect(document.querySelectorAll('.chat-item')).toHaveLength(0);
        });
    });

    describe('pending state', () => {
        test('appends a pending bubble after the messages while isPending', () => {
            // Arrange
            const messages = [makeMessage({ id: 'u1', role: ChatRole.user, text: 'Hello there' })];

            // Act
            render(<ChatHistory {...getHistoryProps({ isPending: true, messages })} />);

            // Assert - the pending bubble renders the spinner and is the last chat item
            const pending = document.querySelector('.chat-item.assistant-response.pending');
            expect(pending).toBeInTheDocument();
            expect(pending).toHaveTextContent('Thinking...');
            const items = document.querySelectorAll('.chat-item');
            expect(items).toHaveLength(2);
            expect(items[1]).toBe(pending);
        });

        test('does not render a pending bubble when not pending', () => {
            // Act
            render(<ChatHistory {...getHistoryProps({ messages: [makeMessage({ id: 'a1', text: 'done' })] })} />);

            // Assert
            expect(document.querySelector('.chat-item.pending')).toBeNull();
        });
    });

    describe('segment rendering', () => {
        test('renders default html and text segments', () => {
            // Arrange
            const messages = [
                makeMessage({
                    id: 'a1',
                    segments: [
                        { type: 'html', html: '<strong>bold</strong>' },
                        { type: 'text', text: 'plain text segment' },
                    ],
                }),
            ];

            // Act
            render(<ChatHistory {...getHistoryProps({ messages })} />);

            // Assert - html segment renders via innerHTML; text segment renders as text node
            const htmlSegment = document.querySelector('.assistant-text strong');
            expect(htmlSegment).toHaveTextContent('bold');
            expect(screen.getByText('plain text segment')).toBeInTheDocument();
        });

        test('custom renderSegment overrides default rendering when defined', () => {
            // Arrange
            const renderSegment: RenderSegment = (segment, index) =>
                segment.type === 'text' ? (
                    <span data-testid="custom" key={index}>
                        CUSTOM:{segment.text}
                    </span>
                ) : undefined;
            const messages = [
                makeMessage({
                    id: 'a1',
                    segments: [
                        { type: 'text', text: 'one' },
                        { type: 'html', html: '<em>two</em>' },
                    ],
                }),
            ];

            // Act
            render(<ChatHistory {...getHistoryProps({ messages, renderSegment })} />);

            // Assert - text segment uses custom renderer; html segment falls through to default
            expect(screen.getByTestId('custom')).toHaveTextContent('CUSTOM:one');
            const htmlSegment = document.querySelector('.assistant-text em');
            expect(htmlSegment).toHaveTextContent('two');
        });

        test('unknown segment types render nothing', () => {
            // Arrange
            const messages = [
                makeMessage({
                    id: 'a1',
                    segments: [{ type: 'mystery', sql: 'select 1' } as ChatSegment],
                }),
            ];

            // Act
            render(<ChatHistory {...getHistoryProps({ messages })} />);

            // Assert - assistant response bubble exists but has no segment content rendered
            const bubble = document.querySelector('.chat-item.assistant-response');
            expect(bubble).toBeInTheDocument();
            expect(bubble?.textContent).toBe('');
        });
    });
});

describe('ChatPrompt', () => {
    describe('send behavior', () => {
        test('submit calls sendPrompt with trimmed value and clears the textarea', async () => {
            // Arrange
            const sendPrompt = jest.fn().mockResolvedValue(undefined);
            render(<ChatPrompt {...getPromptProps({ sendPrompt })} />);
            const user = userEvent.setup();

            // Act
            await user.type(getTextarea(), '  hello world  ');
            await user.click(getPromptButton());

            // Assert - sendPrompt receives the trimmed value once and the textarea is reset
            expect(sendPrompt).toHaveBeenCalledTimes(1);
            expect(sendPrompt).toHaveBeenCalledWith('hello world');
            expect(getTextarea()).toHaveValue('');
        });

        test('Enter without shift submits, Shift+Enter does not', () => {
            // Arrange
            const sendPrompt = jest.fn().mockResolvedValue(undefined);
            render(<ChatPrompt {...getPromptProps({ sendPrompt })} />);
            const textarea = getTextarea();

            // Act - Shift+Enter first (should not submit), then plain Enter (should submit)
            fireEvent.change(textarea, { target: { value: 'line one' } });
            fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
            // Assert - Shift+Enter did not call sendPrompt and did not clear input
            expect(sendPrompt).not.toHaveBeenCalled();
            expect(textarea).toHaveValue('line one');

            // Act - plain Enter
            fireEvent.keyDown(textarea, { key: 'Enter' });
            // Assert - plain Enter submits the trimmed prompt
            expect(sendPrompt).toHaveBeenCalledTimes(1);
            expect(sendPrompt).toHaveBeenCalledWith('line one');
        });

        test('empty / whitespace-only prompt does not send and submit is disabled', () => {
            // Arrange
            const sendPrompt = jest.fn().mockResolvedValue(undefined);
            render(<ChatPrompt {...getPromptProps({ sendPrompt })} />);
            const textarea = getTextarea();

            // Act & Assert - with no input, the submit button is disabled
            const submitBtn = getPromptButton();
            expect(submitBtn).toHaveAttribute('type', 'submit');
            expect(submitBtn).toBeDisabled();

            // Act - typing whitespace and pressing Enter should still not send
            fireEvent.change(textarea, { target: { value: '   ' } });
            fireEvent.keyDown(textarea, { key: 'Enter' });

            // Assert - sendPrompt never called and submit remains disabled (trim() empty)
            expect(sendPrompt).not.toHaveBeenCalled();
            expect(submitBtn).toBeDisabled();
        });

        test('while isPending: stop button shown, submit hidden, send blocked', () => {
            // Arrange
            const sendPrompt = jest.fn().mockResolvedValue(undefined);
            const onInterrupt = jest.fn();
            render(<ChatPrompt {...getPromptProps({ isPending: true, sendPrompt, onInterrupt })} />);

            // Act
            const textarea = getTextarea();
            fireEvent.change(textarea, { target: { value: 'queued prompt' } });
            fireEvent.keyDown(textarea, { key: 'Enter' });

            // Assert - submit button absent and sendPrompt not called
            expect(document.querySelector('button[type="submit"]')).toBeNull();
            expect(sendPrompt).not.toHaveBeenCalled();

            // Assert - the stop button is rendered in its place and calls onInterrupt(true)
            const stopBtn = getPromptButton();
            expect(stopBtn.querySelector('.fa-stop')).toBeInTheDocument();
            fireEvent.click(stopBtn);
            expect(onInterrupt).toHaveBeenCalledTimes(1);
            expect(onInterrupt).toHaveBeenCalledWith(true);
        });
    });

    describe('interrupt behavior', () => {
        test('stop refills the prompt with the last sent value when the input is empty', () => {
            // Arrange
            const sendPrompt = jest.fn().mockResolvedValue(undefined);
            const onInterrupt = jest.fn();
            const { rerender } = render(<ChatPrompt {...getPromptProps({ sendPrompt, onInterrupt })} />);

            // Act - send a prompt, then simulate the pending state, then click stop
            fireEvent.change(getTextarea(), { target: { value: 'first prompt' } });
            fireEvent.keyDown(getTextarea(), { key: 'Enter' });
            expect(sendPrompt).toHaveBeenCalledWith('first prompt');
            expect(getTextarea()).toHaveValue('');

            rerender(<ChatPrompt {...getPromptProps({ isPending: true, sendPrompt, onInterrupt })} />);
            fireEvent.click(getPromptButton());

            // Assert - interrupt fired and the empty input is repopulated with the last sent value
            expect(onInterrupt).toHaveBeenCalledWith(true);
            expect(getTextarea()).toHaveValue('first prompt');
        });

        test('stop preserves the current input when the user has typed something else', () => {
            // Arrange
            const sendPrompt = jest.fn().mockResolvedValue(undefined);
            const onInterrupt = jest.fn();
            const { rerender } = render(<ChatPrompt {...getPromptProps({ sendPrompt, onInterrupt })} />);

            // Act - send a prompt, transition to pending, then type a new prompt before clicking stop
            fireEvent.change(getTextarea(), { target: { value: 'first prompt' } });
            fireEvent.keyDown(getTextarea(), { key: 'Enter' });

            rerender(<ChatPrompt {...getPromptProps({ isPending: true, sendPrompt, onInterrupt })} />);
            fireEvent.change(getTextarea(), { target: { value: 'new draft' } });
            fireEvent.click(getPromptButton());

            // Assert - interrupt fired and the user's in-progress text is not overwritten
            expect(onInterrupt).toHaveBeenCalledWith(true);
            expect(getTextarea()).toHaveValue('new draft');
        });
    });

    describe('rendering', () => {
        test('labels the textarea with the title and renders the caution message', () => {
            // Act
            render(<ChatPrompt {...getPromptProps({ title: 'Expression Assistant' })} />);

            // Assert - the aria-label is derived from the title so callers get distinct labels
            expect(screen.getByLabelText('Expression Assistant Prompt')).toBeInTheDocument();
            expect(document.querySelector('.chat-modal__caution')).toHaveTextContent(
                'AI can make mistakes. Double check any suggestions.'
            );
        });
    });
});

describe('ChatModal', () => {
    describe('composition', () => {
        test('renders ChatHistory and ChatPrompt with the session props', () => {
            // Arrange
            const renderSegment: RenderSegment = (segment, index) =>
                segment.type === 'text' ? (
                    <span data-testid="custom" key={index}>
                        CUSTOM:{segment.text}
                    </span>
                ) : undefined;
            const messages = [
                makeMessage({ id: 'u1', role: ChatRole.user, text: 'Hello there' }),
                makeMessage({ id: 'a1', segments: [{ type: 'text', text: 'one' }] }),
            ];

            // Act
            render(<ChatModal {...getSessionProps({ isPending: true, messages, renderSegment })} />);

            // Assert - the history renders the messages, the pending state, and the caller's renderSegment
            expect(document.querySelector('.chat-history')).toHaveTextContent('Hello there');
            expect(document.querySelector('.chat-item.pending')).toBeInTheDocument();
            expect(screen.getByTestId('custom')).toHaveTextContent('CUSTOM:one');

            // Assert - the prompt renders in the modal footer, labeled from the title
            expect(getTextarea()).toBeInTheDocument();
        });

        test('sendPrompt from the footer prompt reaches the caller', () => {
            // Arrange
            const sendPrompt = jest.fn().mockResolvedValue(undefined);
            render(<ChatModal {...getSessionProps({ sendPrompt })} />);

            // Act
            fireEvent.change(getTextarea(), { target: { value: 'hello world' } });
            fireEvent.keyDown(getTextarea(), { key: 'Enter' });

            // Assert
            expect(sendPrompt).toHaveBeenCalledTimes(1);
            expect(sendPrompt).toHaveBeenCalledWith('hello world');
        });

        test('the footer stop button forwards onInterrupt(true)', () => {
            // Arrange
            const onInterrupt = jest.fn();
            render(<ChatModal {...getSessionProps({ isPending: true, onInterrupt })} />);

            // Act
            fireEvent.click(getPromptButton());

            // Assert
            expect(onInterrupt).toHaveBeenCalledTimes(1);
            expect(onInterrupt).toHaveBeenCalledWith(true);
        });
    });

    describe('cancel behavior', () => {
        test('End Chat calls onInterrupt(false) then onCancel', () => {
            // Arrange
            const onCancel = jest.fn();
            const onInterrupt = jest.fn();
            render(<ChatModal {...getSessionProps({ onCancel, onInterrupt })} />);

            // Act
            fireEvent.click(screen.getByRole('button', { name: /end chat/i }));

            // Assert - both handlers fire, interrupt receives false (non-user dismissal)
            expect(onInterrupt).toHaveBeenCalledTimes(1);
            expect(onInterrupt).toHaveBeenCalledWith(false);
            expect(onCancel).toHaveBeenCalledTimes(1);
        });
    });
});
