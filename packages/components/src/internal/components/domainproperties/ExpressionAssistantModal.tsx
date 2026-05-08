import React, { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext } from '../../AppContext';
import { generateId } from '../../util/utils';
import { ChatModal } from '../mcp/ChatModal';
import { ChatMessage, ChatRole } from '../mcp/models';
import { DomainField, GetDomainFields } from './models';
import { useRequestHandler } from '../../util/RequestHandler';

interface Props {
    field: DomainField;
    getDomainFields: GetDomainFields;
    onCancel: () => void;
    onComplete?: (analysis: string) => void;
}

const GENERATE_INTRO =
    "Explain the calculation you would like and I'll help you write the expression. You can also ask questions about what fields can be used and what calculations can be done.";

function useExpressionAssistance(domainFields: DomainField[], existingExpression?: string) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isPending, setIsPending] = useState(false);
    const firstChatRef = useRef(true);
    const autoEvalRef = useRef(false);
    const { api } = useAppContext();
    const { abortRequest, requestHandler, resetRequestHandler } = useRequestHandler();

    const fieldsBlock = useMemo(
        () =>
            [
                'The following JSON blob enumerates the available columns and their types:',
                JSON.stringify(domainFields),
            ].join('\n'),
        [domainFields]
    );

    const generatePreamble = useMemo(
        () => `${fieldsBlock}\nGenerate a calculated column expression that matches the following description:`,
        [fieldsBlock]
    );

    const evaluatePrompt = useMemo(() => {
        if (!existingExpression) return undefined;
        return [
            fieldsBlock,
            'The user already has the following calculated column expression:',
            '```',
            existingExpression,
            '```',
            'Evaluate this expression. If you find errors or issues, point them out and propose corrections. If the expression is valid, ask the user what they would like to change. Also flag edge cases the user may want to handle, such as empty data, division by zero, or null values.',
        ].join('\n');
    }, [existingExpression, fieldsBlock]);

    const onInterrupt = useCallback(() => {
        abortRequest();
        setIsPending(false);
    }, [abortRequest]);

    const runRequest = useCallback(
        async (fullPrompt: string) => {
            setIsPending(true);
            let aborted = false;
            try {
                const response = await api.query.expressionAssistant({ prompt: fullPrompt, requestHandler });
                resetRequestHandler();
                setMessages(prev => [
                    ...prev,
                    {
                        id: generateId('chat-'),
                        role: ChatRole.assistant,
                        timestamp: Date.now(),
                        error: response.success ? response.error : (response.error ?? 'Request failed.'),
                        html: response.html,
                        sql: response.sql,
                        text: response.text,
                    },
                ]);
            } catch (e) {
                aborted = !e.status;
                if (!aborted) {
                    setMessages(prev => [
                        ...prev,
                        {
                            id: generateId('chat-'),
                            role: ChatRole.assistant,
                            timestamp: Date.now(),
                            error: 'Request failed. Please try again.',
                        },
                    ]);
                }
            } finally {
                if (!aborted) {
                    setIsPending(false);
                }
            }
        },
        [api, requestHandler, resetRequestHandler]
    );

    const sendPrompt = useCallback(
        async (prompt: string) => {
            setMessages(prev => [
                ...prev,
                { id: generateId('chat-'), role: ChatRole.user, text: prompt, timestamp: Date.now() },
            ]);
            const fullPrompt = firstChatRef.current ? `${generatePreamble}\n${prompt}` : prompt;
            firstChatRef.current = false;
            await runRequest(fullPrompt);
        },
        [generatePreamble, runRequest]
    );

    useEffect(() => {
        if (!evaluatePrompt || autoEvalRef.current) return;
        autoEvalRef.current = true;
        firstChatRef.current = false;
        runRequest(evaluatePrompt);
    }, [evaluatePrompt, runRequest]);

    return { messages, isPending, onInterrupt, sendPrompt };
}

export const ExpressionAssistantModal: FC<Props> = memo(({ field, getDomainFields, onCancel, onComplete }) => {
    const domainFields = useMemo(() => getDomainFields().domainFields.toArray(), [getDomainFields]);
    const existingExpression = field.valueExpression?.trim();
    const { isPending, messages, onInterrupt, sendPrompt } = useExpressionAssistance(domainFields, existingExpression);

    return (
        <ChatModal
            intro={existingExpression ? undefined : GENERATE_INTRO}
            isPending={isPending}
            messages={messages}
            onCancel={onCancel}
            onComplete={onComplete}
            onInterrupt={onInterrupt}
            sendPrompt={sendPrompt}
            title="Expression AI Assistant"
        />
    );
});
ExpressionAssistantModal.displayName = 'ExpressionAssistantModal';
