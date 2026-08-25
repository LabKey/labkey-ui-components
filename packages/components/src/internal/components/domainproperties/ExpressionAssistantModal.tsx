/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { useAppContext } from '../../AppContext';
import { ChatModal, RenderSegment } from '../mcp/ChatModal';
import { ChatMessage, ChatRole, ChatSegment } from '../mcp/models';
import { DomainField, GetDomainFields, SystemField } from './models';
import { useRequestHandler } from '../../util/RequestHandler';
import { incrementClientSideMetricCount } from '../../actions';
import { getColumnTypeMap, getPHIColumnNames, typeToDisplay } from './CalculatedFieldOptions';
import { ExpressionAssistOptions } from './actions';
import { resolveErrorMessage } from '../../util/messaging';
import { createChatMessage } from '../mcp/utils';

export const EXPR_ASST_METRIC_FEATURE_AREA = 'expressionAssistant';
const CHANGE_INTRO =
    "Explain how you would like to change this calculation and I'll help you write the expression. You can also ask questions about what fields can be used and what calculations can be done. The current expression:";
const NEW_INTRO =
    "Explain the calculation you would like and I'll help you write the expression. You can also ask questions about what fields can be used and what calculations can be done.";
const VALIDATE_INTRO = 'Let me take a look at this expression and see how I can help.';

interface SqlSnippetProps {
    jdbcType?: string;
    onApplyExpression?: (sql: string) => void;
    readOnly?: boolean;
    sql: string;
}

const SqlExpression: FC<SqlSnippetProps> = memo(({ onApplyExpression, jdbcType, readOnly, sql }) => {
    const [animating, setAnimating] = useState<boolean>(false);
    const handleApply = useCallback(() => {
        setAnimating(true);
        onApplyExpression(sql);
    }, [onApplyExpression, sql]);

    const onAnimationEnd = useCallback(() => {
        setAnimating(false);
    }, []);

    return (
        <div className="assistant-expression">
            <pre>
                <code className="language-sql">{sql}</code>
            </pre>
            {!readOnly && onApplyExpression && (
                <>
                    <button className="clickable-text" onClick={handleApply} type="button">
                        <i
                            className={classNames('fa fa-check', { 'bounce-effect': animating })}
                            onAnimationEnd={onAnimationEnd}
                        />{' '}
                        Apply Expression
                    </button>
                    {jdbcType && (
                        <span className="assistant-expression__type">
                            The calculated data type is {typeToDisplay(jdbcType).toLowerCase()}
                        </span>
                    )}
                </>
            )}
        </div>
    );
});
SqlExpression.displayName = 'SqlExpression';

export interface ExpressionAssistantModalProps {
    field: DomainField;
    fieldError?: string;
    getDomainFields: GetDomainFields;
    onApplyExpression?: (analysis: string) => void;
    onCancel: () => void;
}

function useExpressionAssistance(
    domainFields: DomainField[],
    systemFields: SystemField[],
    field: DomainField,
    fieldError?: string
) {
    const [conversationId, setConversationId] = useState<string>();
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        let text: string;
        let segments: ChatSegment[] | undefined;
        if (fieldError) {
            text = VALIDATE_INTRO;
        } else if (field.valueExpression) {
            text = CHANGE_INTRO;
            segments = [{ type: 'sql', sql: field.valueExpression }];
        } else {
            text = NEW_INTRO;
        }
        return [createChatMessage({ role: ChatRole.assistant, segments, text })];
    });
    const [isPending, setIsPending] = useState(false);
    const autoEvalRef = useRef(false);
    const { api } = useAppContext();
    const { abortRequest, requestHandler, resetRequestHandler } = useRequestHandler();

    const pushMessage = useCallback((message: Partial<ChatMessage>) => {
        setMessages(prev => [...prev, createChatMessage(message)]);
    }, []);

    const { columnMap, combinedFields, phiColumns } = useMemo(
        () => ({
            columnMap: getColumnTypeMap(domainFields, systemFields),
            combinedFields: [...(domainFields ?? []), ...(systemFields ?? [])],
            phiColumns: getPHIColumnNames(domainFields),
        }),
        [domainFields, systemFields]
    );

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
                const options: ExpressionAssistOptions = {
                    conversationId,
                    columnMap,
                    phiColumns,
                    prompt,
                    requestHandler,
                };

                if (conversationId === undefined) {
                    options.domainFields = combinedFields;
                    options.field = field;
                    options.fieldError = fieldError;
                    options.fieldExpression = field.valueExpression;
                }

                const response = await api.domain.expressionAssistant(options);
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
        [
            api,
            columnMap,
            combinedFields,
            conversationId,
            field,
            fieldError,
            phiColumns,
            pushMessage,
            requestHandler,
            resetRequestHandler,
        ]
    );

    const sendPrompt = useCallback(
        async (prompt: string) => {
            pushMessage({ role: ChatRole.user, text: prompt });
            await runRequest(prompt);
        },
        [pushMessage, runRequest]
    );

    useEffect(() => {
        if (!fieldError || autoEvalRef.current) return;
        autoEvalRef.current = true;
        runRequest('');
    }, [fieldError, runRequest]);

    return { isPending, messages, onInterrupt, sendPrompt };
}

export const ExpressionAssistantModal: FC<ExpressionAssistantModalProps> = memo(props => {
    const { field, fieldError, getDomainFields, onApplyExpression, onCancel } = props;
    const { domainFields, systemFields } = useMemo(() => {
        const { domainFields, systemFields } = getDomainFields();
        return { domainFields: domainFields.toArray(), systemFields };
    }, [getDomainFields]);
    const { isPending, messages, onInterrupt, sendPrompt } = useExpressionAssistance(
        domainFields,
        systemFields,
        field,
        fieldError
    );

    const renderSegment = useCallback<RenderSegment>(
        (segment, index) => {
            if (segment.type === 'expression' && segment.sql) {
                return (
                    <SqlExpression
                        jdbcType={segment.jdbcType}
                        key={index}
                        onApplyExpression={onApplyExpression}
                        sql={segment.sql}
                    />
                );
            }
            if (segment.type === 'sql' && segment.sql) {
                return <SqlExpression key={index} readOnly sql={segment.sql} />;
            }
            return undefined;
        },
        [onApplyExpression]
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
