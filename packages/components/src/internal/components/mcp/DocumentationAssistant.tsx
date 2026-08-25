/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { SVGIcon } from '../base/SVGIcon';
import { ChatSidebar } from './ChatModal';
import { chatInProgress, createChatMessage } from './utils';
import { ChatMessage, ChatRole } from './models';
import { useAppContext } from '../../AppContext';
import { useRequestHandler } from '../../util/RequestHandler';
import { incrementClientSideMetricCount } from '../../actions';
import { resolveErrorMessage } from '../../util/messaging';
import { documentationAssistant } from './actions';

export const DOCS_ASST_METRIC_FEATURE_AREA = 'documentationAssistant';
interface ButtonProps {
    iconSrc?: string;
    label: ReactNode;
    onClick: () => void;
    showLabel?: boolean;
}

export const AssistantButton: FC<ButtonProps> = memo(props => {
    const { iconSrc = 'ai_stars_icon', onClick, showLabel, label } = props;

    return (
        <button className="btn btn-default navbar-assistant" onClick={onClick} type="button">
            <SVGIcon height="16px" iconSrc={iconSrc} style={{ marginRight: '4px', marginTop: '-4px' }} width="16px" />
            <span className={showLabel ? '' : 'sr-only'}>{label}</span>
        </button>
    );
});

AssistantButton.displayName = 'AssistantButton';

const NEW_INTRO = "<div>How can I help?</div><div>I can answer questions about how to use LabKey.</div>";

function useDocumentationAssistance() {
    const [conversationId, setConversationId] = useState<string>();
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        return [createChatMessage({ role: ChatRole.assistant, segments: [{ html: NEW_INTRO, type: 'html' }] })];
    });
    const [isPending, setIsPending] = useState(false);
    const { api } = useAppContext();
    const { abortRequest, requestHandler, resetRequestHandler } = useRequestHandler();

    const pushMessage = useCallback((message: Partial<ChatMessage>) => {
        setMessages(prev => [...prev, createChatMessage(message)]);
    }, []);

    const onInterrupt = useCallback(
        (isUser?: boolean) => {
            abortRequest();
            setIsPending(false);

            // If the user interrupted the request, then display a message confirming that it is no longer thinking
            if (isUser === true) {
                pushMessage({ role: ChatRole.assistant, text: 'Stopped.' });
            }
        },
        [abortRequest, pushMessage]
    );

    const runRequest = useCallback(
        async (prompt: string) => {
            setIsPending(true);
            let aborted = false;
            try {
                const response = await documentationAssistant({ prompt })
                // const response = {
                //     conversationId: 'id1',
                //     success: true,
                //     error: undefined,
                //     segments: undefined,
                //     text: 'In answer to your prompt: ' + prompt,
                // };
                resetRequestHandler();

                if (response.conversationId !== conversationId) {
                    setConversationId(response.conversationId);
                }

                pushMessage({
                    error: response.success ? response.error : (response.error ?? 'Request failed.'),
                    role: ChatRole.assistant,
                    segments: response.segments,
                    text: response.text,
                });

                incrementClientSideMetricCount(DOCS_ASST_METRIC_FEATURE_AREA, 'submitPrompt');
            } catch (e) {
                aborted = !e.status;
                if (!aborted) {
                    pushMessage({
                        error: resolveErrorMessage(e) ?? 'Request failed. Please try again.',
                        role: ChatRole.assistant,
                    });
                }
            } finally {
                if (!aborted) {
                    setIsPending(false);
                }
            }
        },
        [conversationId, pushMessage, resetRequestHandler]
    );

    const sendPrompt = useCallback(
        async (prompt: string) => {
            pushMessage({ role: ChatRole.user, text: prompt });
            await runRequest(prompt);
        },
        [pushMessage, runRequest]
    );

    return { isPending, messages, onInterrupt, sendPrompt };
}

interface SidebarProps {
    onChatStop: () => void;
}

export const AssistantSidebar: FC<SidebarProps> = memo(props => {
    const { onChatStop } = props;
    const { isPending, messages, onInterrupt, sendPrompt } = useDocumentationAssistance();

    if (!chatInProgress()) {
        return null;
    }

    return (
        <ChatSidebar
            isPending={isPending}
            messages={messages}
            onCancel={onChatStop}
            onInterrupt={onInterrupt}
            sendPrompt={sendPrompt}
            title={'AI Assistant'}
        />
    );
});
AssistantSidebar.displayName = 'AssistantSidebar';
