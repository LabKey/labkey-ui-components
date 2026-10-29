/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { ChatSidebar } from './ChatModal';
import { createChatMessage } from './utils';
import { ChatMessage, ChatRole } from './models';
import { useRequestHandler } from '../../util/RequestHandler';
import { incrementClientSideMetricCount } from '../../actions';
import { resolveErrorMessage } from '../../util/messaging';
import { LabKeyAssistantAPIWrapper, LabKeyAssistantServerAPIWrapper } from './api';
import { getSavedConversationId, saveConversationId, useAssistantService } from './AssistantService';
import { useLoadableState } from '../../useLoadableState';
import { isLoading } from '../../../public/LoadingState';

// Note: this was taken from ai_stars_icon.svg, but the fill values were stripped so we can apply styles via CSS.
// We may no longer need ai_stars_icon.svg or ai_starts_icon_white.svg
const BIG_STAR =
    'M7.98357 4.39577C8.12565 3.86808 8.87434 3.86808 9.01643 4.39577L9.6414 6.71695C9.98829 8.00533 10.9947 9.01171 12.2831 9.3586L14.6042 9.98357C15.1319 10.1257 15.1319 10.8743 14.6042 11.0164L12.2831 11.6414C10.9947 11.9883 9.98829 12.9947 9.6414 14.2831L9.01643 16.6042C8.87435 17.1319 8.12565 17.1319 7.98357 16.6042L7.3586 14.2831C7.01171 12.9947 6.00533 11.9883 4.71695 11.6414L2.39577 11.0164C1.86808 10.8743 1.86808 10.1257 2.39577 9.98357L4.71695 9.3586C6.00533 9.01171 7.01171 8.00533 7.3586 6.71695L7.98357 4.39577Z';
const LITTLE_STAR =
    'M14.1296 2.39505C14.2427 1.86836 14.9942 1.86836 15.1074 2.39506L15.2783 3.19099C15.3609 3.57566 15.6614 3.87615 16.046 3.95875L16.842 4.12967C17.3687 4.24277 17.3687 4.99428 16.842 5.10738L16.046 5.2783C15.6614 5.3609 15.3609 5.66139 15.2783 6.04606L15.1074 6.842C14.9942 7.36869 14.2427 7.36869 14.1296 6.84199L13.9587 6.04606C13.8761 5.66139 13.5756 5.3609 13.191 5.2783L12.395 5.10738C11.8683 4.99428 11.8683 4.24277 12.395 4.12967L13.191 3.95875C13.5756 3.87615 13.8761 3.57566 13.9587 3.19099L14.1296 2.39505Z';
const AIStars = (
    <svg aria-hidden="true" fill="none" height="19" viewBox="0 -2 19 19" width="19" xmlns="http://www.w3.org/2000/svg">
        <path d={BIG_STAR} fill="currentColor" />
        <path d={LITTLE_STAR} fill="currentColor" />
    </svg>
);

export const LABKEY_ASSISTANT_METRIC_FEATURE_AREA = 'labKeyAssistant';

interface AssistantButtonProps {
    className?: string;
    label: ReactNode;
    onClick: () => void;
    showLabel?: boolean;
}

export const AssistantButton: FC<AssistantButtonProps> = memo(
    ({ className = 'btn btn-default', onClick, showLabel, label }) => (
        <button className={className} onClick={onClick} type="button">
            {AIStars}
            <span className={showLabel ? 'margin-left-small' : 'sr-only'}>{label}</span>
        </button>
    )
);
AssistantButton.displayName = 'AssistantButton';

const NEW_INTRO = '<div>How can I help?</div><div>I can answer questions about how to use LabKey.</div>';
const createIntroMessage = () =>
    createChatMessage({ role: ChatRole.assistant, segments: [{ html: NEW_INTRO, type: 'html' }] });

type VoidFn = () => void;

interface LabkeyAssistantState {
    isPending: boolean;
    loading: boolean;
    messages: ChatMessage[];
    onClose: VoidFn;
    onInterrupt: VoidFn;
    sendPrompt: (prompt: string) => Promise<void>;
    startNewChat: VoidFn;
}

function useLabKeyAssistant(api: LabKeyAssistantAPIWrapper = LabKeyAssistantServerAPIWrapper): LabkeyAssistantState {
    const { open, close } = useAssistantService();
    const [conversationId, setConversationId] = useState<string>();
    const [messages, setMessages] = useState<ChatMessage[]>(() => []);
    const [isPending, setIsPending] = useState(false);
    const { abortRequest, requestHandler, resetRequestHandler } = useRequestHandler();
    const resetState = useCallback(() => {
        abortRequest();
        setIsPending(false);
        setConversationId(undefined);
        setMessages([createIntroMessage()]);
        // If we have an active conversation send the '/clear' prompt so the server can clean up the conversation
        if (conversationId) api.labKeyAssistant({ conversationId, prompt: '/clear' }).catch(() => undefined);
    }, [abortRequest, api, conversationId]);
    const onClose = useCallback(() => {
        resetState();
        close();
    }, [close, resetState]);
    const loadSavedConversation = useCallback(async () => {
        try {
            const savedId = await getSavedConversationId();

            if (!savedId) return undefined;

            return await api.getChatHistory({ conversationId: savedId });
        } catch (e) {
            if (e?.status !== 404) console.error(e);
            return undefined;
        }
    }, [api]);
    const { loadingState, value: savedConversation } = useLoadableState(loadSavedConversation);
    const loading = isLoading(loadingState);
    const initialized = useRef(false);

    const pushMessage = useCallback((message: Partial<ChatMessage>) => {
        setMessages(prev => [...prev, createChatMessage(message)]);
    }, []);

    useEffect(() => {
        if (loading || (!loading && initialized.current)) return;
        initialized.current = true;

        if (savedConversation) {
            setConversationId(savedConversation.conversationId);
            setMessages([createIntroMessage(), ...savedConversation.messages]);
            open();
        } else {
            pushMessage(createIntroMessage());
        }
    }, [loading, open, pushMessage, savedConversation]);

    useEffect(() => {
        const save = () => saveConversationId(conversationId);
        window.addEventListener('pagehide', save);
        return () => {
            window.removeEventListener('pagehide', save);
        };
    }, [conversationId]);

    const onInterrupt = useCallback(
        (stoppedByUser?: boolean) => {
            abortRequest();
            setIsPending(false);

            if (stoppedByUser) pushMessage({ role: ChatRole.assistant, text: 'Stopped.' });
        },
        [abortRequest, pushMessage]
    );

    const runRequest = useCallback(
        async (prompt: string) => {
            setIsPending(true);
            let aborted = false;
            try {
                const response = await api.labKeyAssistant({ conversationId, prompt, requestHandler });
                resetRequestHandler();

                if (response.reset) {
                    // Not resetState(), which would send "/clear" again
                    setConversationId(undefined);
                    setMessages([createChatMessage({ role: ChatRole.assistant, text: response.text })]);
                } else {
                    // Failures without a conversationId keep the current conversation
                    if (response.conversationId && response.conversationId !== conversationId) {
                        setConversationId(response.conversationId);
                    }

                    pushMessage({
                        error: response.success ? response.error : (response.error ?? 'Request failed.'),
                        role: ChatRole.assistant,
                        segments: response.segments,
                        text: response.text,
                    });
                }

                incrementClientSideMetricCount(LABKEY_ASSISTANT_METRIC_FEATURE_AREA, 'submitPrompt');
            } catch (e) {
                aborted = !e.status;
                if (!aborted) {
                    pushMessage({
                        error: resolveErrorMessage(e) ?? 'Request failed. Please try again.',
                        role: ChatRole.assistant,
                    });
                }
            } finally {
                setIsPending(false);
            }
        },
        [api, conversationId, pushMessage, requestHandler, resetRequestHandler]
    );

    const sendPrompt = useCallback(
        async (prompt: string) => {
            pushMessage({ role: ChatRole.user, text: prompt });
            await runRequest(prompt);
        },
        [pushMessage, runRequest]
    );

    return { isPending, loading, messages, onClose, onInterrupt, sendPrompt, startNewChat: resetState };
}

interface AssistantPanelProps {
    api?: LabKeyAssistantAPIWrapper;
}

export const AssistantPanel: FC<AssistantPanelProps> = memo(({ api }) => {
    const { show } = useAssistantService();
    const { isPending, loading, messages, onClose, onInterrupt, sendPrompt, startNewChat } = useLabKeyAssistant(api);

    if (!show) return null;

    return (
        <ChatSidebar
            isPending={isPending}
            loading={loading}
            messages={messages}
            onClose={onClose}
            onInterrupt={onInterrupt}
            sendPrompt={sendPrompt}
            startNewChat={startNewChat}
            title="LabKey Assistant"
        />
    );
});
AssistantPanel.displayName = 'AssistantPanel';
