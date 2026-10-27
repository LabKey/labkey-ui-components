/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { AssistantButton, AssistantPanel } from './AssistantPanel';
import { DocumentationAssistantAPIWrapper, getDocumentationAssistantTestAPIWrapper } from './api';
import { getSavedConversationId, saveConversationId } from './AssistantService';
import { ChatRole } from './models';

const mockService = { close: jest.fn(), enabled: true, open: jest.fn(), show: true };

jest.mock('./AssistantService', () => ({
    getSavedConversationId: jest.fn(),
    saveConversationId: jest.fn(),
    useAssistantService: () => mockService,
}));

jest.mock('../../actions', () => ({
    incrementClientSideMetricCount: jest.fn(),
}));

const CONVERSATION_ID = 'c6a5d3f2-1b2c-4d5e-8f90-123456789abc';

const HISTORY = {
    conversationId: CONVERSATION_ID,
    messages: [
        { id: '41', role: ChatRole.user, text: 'How do I configure LDAP?', timestamp: 1 },
        { error: 'The chat model request failed.', id: '42', role: ChatRole.assistant, timestamp: 2 },
        { id: '43', role: ChatRole.user, text: 'Try again', timestamp: 3 },
        { id: '44', role: ChatRole.assistant, segments: [{ html: '<p>Like this</p>', type: 'html' }], timestamp: 4 },
    ],
    success: true,
};

function renderPanel(overrides: Partial<DocumentationAssistantAPIWrapper> = {}) {
    const api = getDocumentationAssistantTestAPIWrapper(jest.fn, overrides);
    return { api, ...render(<AssistantPanel api={api} />) };
}

describe('AssistantPanel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('starts with the intro when there is no saved conversation', async () => {
        jest.mocked(getSavedConversationId).mockResolvedValue(undefined);
        const { api } = renderPanel();

        expect(await screen.findByText('How can I help?')).toBeInTheDocument();
        expect(api.getChatHistory).not.toHaveBeenCalled();
        expect(mockService.open).not.toHaveBeenCalled();
    });

    test('shows a loading spinner until the saved conversation loads', async () => {
        jest.mocked(getSavedConversationId).mockResolvedValue(CONVERSATION_ID);
        let resolveHistory: (history: typeof HISTORY) => void;
        const { api } = renderPanel({
            getChatHistory: jest.fn().mockReturnValue(new Promise(resolve => (resolveHistory = resolve))),
        });

        await waitFor(() => expect(api.getChatHistory).toHaveBeenCalled());
        expect(screen.getByText('Loading chat history...')).toBeInTheDocument();
        expect(screen.queryByText('How can I help?')).not.toBeInTheDocument();
        expect(mockService.open).not.toHaveBeenCalled();

        resolveHistory(HISTORY);
        expect(await screen.findByText('How do I configure LDAP?')).toBeInTheDocument();
        expect(screen.queryByText('Loading chat history...')).not.toBeInTheDocument();
    });

    test('replays a saved conversation, including errors', async () => {
        jest.mocked(getSavedConversationId).mockResolvedValue(CONVERSATION_ID);
        const { api } = renderPanel({ getChatHistory: jest.fn().mockResolvedValue(HISTORY) });

        expect(await screen.findByText('How do I configure LDAP?')).toBeInTheDocument();
        expect(api.getChatHistory).toHaveBeenCalledWith({ conversationId: CONVERSATION_ID });
        expect(screen.getByText('The chat model request failed.')).toHaveClass('error-response');
        expect(screen.getByText('Like this')).toBeInTheDocument();
        expect(screen.getByText('How can I help?')).toBeInTheDocument();
        expect(mockService.open).toHaveBeenCalled();
    });

    test('starts fresh when the saved conversation is gone', async () => {
        jest.mocked(getSavedConversationId).mockResolvedValue(CONVERSATION_ID);
        const consoleError = jest.spyOn(console, 'error');
        renderPanel({
            getChatHistory: jest.fn().mockRejectedValue({ exception: 'Conversation not found', status: 404 }),
        });

        expect(await screen.findByText('How can I help?')).toBeInTheDocument();
        expect(consoleError).not.toHaveBeenCalled();
        expect(mockService.open).not.toHaveBeenCalled();
    });

    test('starts fresh, and logs the error, when loading history fails', async () => {
        jest.mocked(getSavedConversationId).mockResolvedValue(CONVERSATION_ID);
        const error = new Error('Network down');
        const consoleError = jest.spyOn(console, 'error').mockReturnValue(undefined);
        renderPanel({ getChatHistory: jest.fn().mockRejectedValue(error) });

        expect(await screen.findByText('How can I help?')).toBeInTheDocument();
        expect(consoleError).toHaveBeenCalledWith(error);
        expect(mockService.open).not.toHaveBeenCalled();
    });

    test('does not clear anything when starting a new chat without a conversation', async () => {
        jest.mocked(getSavedConversationId).mockResolvedValue(undefined);
        const { api, container } = renderPanel();
        await screen.findByText('How can I help?');

        await userEvent.click(container.querySelector('.fa-plus').closest('button'));

        expect(api.documentationAssistant).not.toHaveBeenCalled();
    });

    test('clears the conversation when starting a new chat', async () => {
        jest.mocked(getSavedConversationId).mockResolvedValue(CONVERSATION_ID);
        const { api, container } = renderPanel({
            documentationAssistant: jest.fn().mockRejectedValue({ status: 500 }),
            getChatHistory: jest.fn().mockResolvedValue(HISTORY),
        });
        await screen.findByText('How do I configure LDAP?');

        await userEvent.click(container.querySelector('.fa-plus').closest('button'));

        expect(api.documentationAssistant).toHaveBeenCalledWith({ conversationId: CONVERSATION_ID, prompt: '/clear' });
        expect(screen.queryByText('How do I configure LDAP?')).not.toBeInTheDocument();
        expect(screen.getByText('How can I help?')).toBeInTheDocument();
    });

    test('clears the conversation when ending the chat', async () => {
        jest.mocked(getSavedConversationId).mockResolvedValue(CONVERSATION_ID);
        const { api } = renderPanel({
            documentationAssistant: jest
                .fn()
                .mockResolvedValue({ reset: true, success: true, text: "OK, let's start over." }),
            getChatHistory: jest.fn().mockResolvedValue(HISTORY),
        });
        await screen.findByText('How do I configure LDAP?');

        await userEvent.click(screen.getByText('End Chat'));

        expect(api.documentationAssistant).toHaveBeenCalledWith({ conversationId: CONVERSATION_ID, prompt: '/clear' });
        expect(mockService.close).toHaveBeenCalled();
        expect(screen.queryByText('How do I configure LDAP?')).not.toBeInTheDocument();
        expect(screen.queryByText("OK, let's start over.")).not.toBeInTheDocument();
    });

    test('clears the messages when the user sends /clear', async () => {
        jest.mocked(getSavedConversationId).mockResolvedValue(CONVERSATION_ID);
        const documentationAssistant = jest
            .fn()
            .mockResolvedValueOnce({ reset: true, success: true, text: "OK, let's start over." })
            .mockResolvedValueOnce({ conversationId: 'new-id', segments: [], success: true });
        renderPanel({ documentationAssistant, getChatHistory: jest.fn().mockResolvedValue(HISTORY) });
        await screen.findByText('How do I configure LDAP?');

        const prompt = screen.getByLabelText('LabKey Assistant Prompt');
        await userEvent.type(prompt, '/clear{Enter}');

        expect(await screen.findByText("OK, let's start over.")).toBeInTheDocument();
        expect(screen.queryByText('How do I configure LDAP?')).not.toBeInTheDocument();
        expect(screen.queryByText('/clear')).not.toBeInTheDocument();
        expect(screen.queryByText('How can I help?')).not.toBeInTheDocument();
        expect(documentationAssistant).toHaveBeenCalledTimes(1);

        await userEvent.type(prompt, 'Next{Enter}');
        await waitFor(() => expect(documentationAssistant).toHaveBeenCalledTimes(2));
        expect(documentationAssistant.mock.calls[1][0].conversationId).toBeUndefined();
    });

    test('keeps the conversation after a failure without a conversationId', async () => {
        jest.mocked(getSavedConversationId).mockResolvedValue(CONVERSATION_ID);
        const documentationAssistant = jest
            .fn()
            .mockResolvedValueOnce({ conversationId: undefined, error: 'Boom', success: false })
            .mockResolvedValueOnce({ conversationId: CONVERSATION_ID, segments: [], success: true });
        renderPanel({ documentationAssistant, getChatHistory: jest.fn().mockResolvedValue(HISTORY) });
        await screen.findByText('How do I configure LDAP?');

        const prompt = screen.getByLabelText('LabKey Assistant Prompt');
        await userEvent.type(prompt, 'First{Enter}');
        expect(await screen.findByText('Boom')).toBeInTheDocument();
        await userEvent.type(prompt, 'Second{Enter}');

        await waitFor(() => expect(documentationAssistant).toHaveBeenCalledTimes(2));
        expect(documentationAssistant.mock.calls[1][0].conversationId).toBe(CONVERSATION_ID);
    });

    test('renders nothing when the assistant is not shown', async () => {
        jest.mocked(getSavedConversationId).mockResolvedValue(undefined);
        mockService.show = false;
        try {
            const { container } = renderPanel();
            await waitFor(() => expect(getSavedConversationId).toHaveBeenCalled());
            expect(container).toBeEmptyDOMElement();
        } finally {
            mockService.show = true;
        }
    });

    test('adopts the conversationId from the first response', async () => {
        jest.mocked(getSavedConversationId).mockResolvedValue(undefined);
        const documentationAssistant = jest
            .fn()
            .mockResolvedValue({ conversationId: CONVERSATION_ID, segments: [], success: true });
        renderPanel({ documentationAssistant });
        await screen.findByText('How can I help?');

        const prompt = screen.getByLabelText('LabKey Assistant Prompt');
        await userEvent.type(prompt, 'First{Enter}');
        await waitFor(() => expect(documentationAssistant).toHaveBeenCalledTimes(1));
        expect(documentationAssistant.mock.calls[0][0].conversationId).toBeUndefined();
        await userEvent.type(prompt, 'Second{Enter}');

        await waitFor(() => expect(documentationAssistant).toHaveBeenCalledTimes(2));
        expect(documentationAssistant.mock.calls[1][0].conversationId).toBe(CONVERSATION_ID);
    });

    test('shows a generic error when an unsuccessful response has no error', async () => {
        jest.mocked(getSavedConversationId).mockResolvedValue(undefined);
        renderPanel({ documentationAssistant: jest.fn().mockResolvedValue({ success: false }) });
        await screen.findByText('How can I help?');

        await userEvent.type(screen.getByLabelText('LabKey Assistant Prompt'), 'Hello{Enter}');

        expect(await screen.findByText('Request failed.')).toHaveClass('error-response');
    });

    test('shows the server error when the request fails', async () => {
        jest.mocked(getSavedConversationId).mockResolvedValue(undefined);
        renderPanel({
            documentationAssistant: jest.fn().mockRejectedValue({ exception: 'Server exploded', status: 500 }),
        });
        await screen.findByText('How can I help?');

        await userEvent.type(screen.getByLabelText('LabKey Assistant Prompt'), 'Hello{Enter}');

        expect(await screen.findByText('Server exploded')).toHaveClass('error-response');
        expect(screen.queryByText('Thinking...')).not.toBeInTheDocument();
    });

    test('stopping a request says so and does not report the abort as an error', async () => {
        jest.mocked(getSavedConversationId).mockResolvedValue(undefined);
        let rejectRequest: (reason: unknown) => void;
        const { container } = renderPanel({
            documentationAssistant: jest.fn().mockReturnValue(new Promise((_, reject) => (rejectRequest = reject))),
        });
        await screen.findByText('How can I help?');

        await userEvent.type(screen.getByLabelText('LabKey Assistant Prompt'), 'Hello{Enter}');
        expect(await screen.findByText('Thinking...')).toBeInTheDocument();
        await userEvent.click(container.querySelector('.fa-stop').closest('button'));
        rejectRequest({});

        expect(await screen.findByText('Stopped.')).toBeInTheDocument();
        expect(screen.queryByText('Thinking...')).not.toBeInTheDocument();
        expect(container.querySelector('.error-response')).toBeNull();
    });

    test('saves the conversation id when the page is hidden', async () => {
        jest.mocked(getSavedConversationId).mockResolvedValue(CONVERSATION_ID);
        renderPanel({ getChatHistory: jest.fn().mockResolvedValue(HISTORY) });
        await screen.findByText('How do I configure LDAP?');

        window.dispatchEvent(new Event('pagehide'));

        expect(saveConversationId).toHaveBeenCalledWith(CONVERSATION_ID);
    });
});

describe('AssistantButton', () => {
    test('hides the label from sighted users by default', async () => {
        const onClick = jest.fn();
        render(<AssistantButton label="LabKey Assistant" onClick={onClick} />);

        expect(screen.getByText('LabKey Assistant')).toHaveClass('sr-only');
        await userEvent.click(screen.getByRole('button', { name: 'LabKey Assistant' }));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    test('shows the label with showLabel', () => {
        render(<AssistantButton label="LabKey Assistant" onClick={jest.fn()} showLabel />);
        expect(screen.getByText('LabKey Assistant')).not.toHaveClass('sr-only');
    });
});
