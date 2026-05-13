import React, { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext } from '../../AppContext';
import { generateId } from '../../util/utils';
import { ChatModal, RenderSegment } from '../mcp/ChatModal';
import { ChatMessage, ChatRole, ChatSegment } from '../mcp/models';
import { DomainField, GetDomainFields, SystemField } from './models';
import { useRequestHandler } from '../../util/RequestHandler';
import { incrementClientSideMetricCount } from '../../actions';
import { getColumnTypeMap, getPHIColumnNames } from './CalculatedFieldOptions';

export const EXPR_ASST_METRIC_FEATURE_AREA = 'expressionAssistant';
const CHANGE_INTRO =
    "Explain how you would like to change this calculation and I'll help you write the expression. You can also ask questions about what fields can be used and what calculations can be done. The current expression:";
const NEW_INTRO =
    "Explain the calculation you would like and I'll help you write the expression. You can also ask questions about what fields can be used and what calculations can be done.";
const VALIDATE_INTRO = 'Let me take a look at this expression and see how I can help.';

function createChatMessage(message: Partial<ChatMessage>): ChatMessage {
    return {
        ...message,
        id: generateId('chat-'),
        timestamp: Date.now(),
    } as ChatMessage;
}

interface SqlSnippetProps {
    onApply?: (sql: string) => void;
    readOnly?: boolean;
    sql: string;
}

const SqlExpression: FC<SqlSnippetProps> = memo(({ onApply, readOnly, sql }) => {
    const handleApply = useCallback(() => onApply?.(sql), [onApply, sql]);
    return (
        <div className="assistant-expression">
            <pre>
                <code className="language-sql">{sql}</code>
            </pre>
            {!readOnly && onApply && (
                <span className="clickable-text" onClick={handleApply} role="button">
                    <i className="fa fa-check" /> Apply Expression
                </span>
            )}
        </div>
    );
});
SqlExpression.displayName = 'SqlExpression';

export interface ExpressionAssistantModalProps {
    fieldError?: string;
    fieldExpression?: string;
    getDomainFields: GetDomainFields;
    onCancel: () => void;
    onComplete?: (analysis: string) => void;
}

function useExpressionAssistance(
    domainFields: DomainField[],
    systemFields: SystemField[],
    fieldExpression?: string,
    fieldError?: string
) {
    const [conversationId, setConversationId] = useState<string>();
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        let text: string;
        let segments: ChatSegment[] | undefined;
        if (fieldError) {
            text = VALIDATE_INTRO;
        } else if (fieldExpression) {
            text = CHANGE_INTRO;
            segments = [{ type: 'sql', sql: fieldExpression }];
        } else {
            text = NEW_INTRO;
        }
        return [createChatMessage({ role: ChatRole.assistant, segments, text })];
    });
    const [isPending, setIsPending] = useState(false);
    const firstChatRef = useRef(true);
    const autoEvalRef = useRef(false);
    const { api } = useAppContext();
    const { abortRequest, requestHandler, resetRequestHandler } = useRequestHandler();

    const pushMessage = useCallback((message: Partial<ChatMessage>) => {
        setMessages(prev => [...prev, createChatMessage(message)]);
    }, []);

    const { columnMap, fieldsBlock, phiColumns } = useMemo(
        () => ({
            columnMap: getColumnTypeMap(domainFields, systemFields),
            fieldsBlock: `The following enumerates the available columns and their types:\n\`\`\`json\n${JSON.stringify(domainFields)}\`\`\``,
            phiColumns: getPHIColumnNames(domainFields),
        }),
        [domainFields, systemFields]
    );

    // This prompt is used when the user has an erroneous expression, and we want the agent to help in triaging
    const evaluatePrompt = useMemo(() => {
        if (!fieldError) return undefined;
        return [
            fieldsBlock,
            'The user already has the following calculated column expression:',
            '```',
            fieldExpression,
            '```',
            'This expression contains an error:',
            '```',
            fieldError,
            '```',
            'Evaluate this expression and see if you can determine how to fix this error. If you can, point them out and propose corrections.',
        ].join('\n');
    }, [fieldError, fieldExpression, fieldsBlock]);

    const onInterrupt = useCallback(
        (isUser?: boolean) => {
            abortRequest();
            setIsPending(false);

            // If the user interrupted then request, then display a message confirming that it is no longer thinking
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
                const response = await api.domain.expressionAssistant({
                    conversationId,
                    columnMap,
                    phiColumns,
                    prompt,
                    requestHandler,
                });
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
                incrementClientSideMetricCount(EXPR_ASST_METRIC_FEATURE_AREA, 'submitPrompt');
            } catch (e) {
                aborted = !e.status;
                if (!aborted) {
                    pushMessage({ error: 'Request failed. Please try again.', role: ChatRole.assistant });
                }
            } finally {
                if (!aborted) {
                    setIsPending(false);
                }
            }
        },
        [api, columnMap, conversationId, phiColumns, pushMessage, requestHandler, resetRequestHandler]
    );

    const sendPrompt = useCallback(
        async (prompt: string) => {
            pushMessage({ role: ChatRole.user, text: prompt });
            let fullPrompt = prompt;
            if (firstChatRef.current) {
                fullPrompt = `${fieldsBlock}\nGenerate a calculated column expression that matches the following description:\n${prompt}`;
            }
            firstChatRef.current = false;
            await runRequest(fullPrompt);
        },
        [fieldsBlock, pushMessage, runRequest]
    );

    useEffect(() => {
        if (!evaluatePrompt || autoEvalRef.current) return;
        autoEvalRef.current = true;
        firstChatRef.current = false;
        runRequest(evaluatePrompt);
    }, [evaluatePrompt, runRequest]);

    return { isPending, messages, onInterrupt, sendPrompt };
}

export const ExpressionAssistantModal: FC<ExpressionAssistantModalProps> = memo(props => {
    const { fieldError, fieldExpression, getDomainFields, onCancel, onComplete } = props;
    const { domainFields, systemFields } = useMemo(() => {
        const { domainFields, systemFields } = getDomainFields();
        return { domainFields: domainFields.toArray(), systemFields };
    }, [getDomainFields]);
    const { isPending, messages, onInterrupt, sendPrompt } = useExpressionAssistance(
        domainFields,
        systemFields,
        fieldExpression,
        fieldError
    );

    const renderSegment = useCallback<RenderSegment>(
        (segment, index) => {
            if (segment.type === 'expression' && segment.sql) {
                return <SqlExpression key={index} onApply={onComplete} sql={segment.sql} />;
            }
            if (segment.type === 'sql' && segment.sql) {
                return <SqlExpression key={index} readOnly sql={segment.sql} />;
            }
            return undefined;
        },
        [onComplete]
    );

    return (
        <ChatModal
            isPending={isPending}
            messages={messages}
            onCancel={onCancel}
            onInterrupt={onInterrupt}
            renderSegment={renderSegment}
            sendPrompt={sendPrompt}
            title="Expression AI Assistant"
        />
    );
});
ExpressionAssistantModal.displayName = 'ExpressionAssistantModal';
