import React, { FC, memo, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { BaseModal } from '../../Modal';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { ChatMessage, ChatRole } from './models';
import { cancelEvent } from '../../events';
import { useTimeout } from '../../hooks';

interface ChatBubbleProps {
    message: ChatMessage;
    onComplete?: (analysis: string) => void;
}

const ChatBubble: FC<ChatBubbleProps> = memo(({ message, onComplete }) => {
    const handleApply = useCallback((): void => {
        if (message.sql) onComplete?.(message.sql);
    }, [message.sql, onComplete]);

    if (message.role === ChatRole.user) {
        return <div className="chat-item user-prompt">{message.text}</div>;
    }

    if (message.error) {
        return <div className="chat-item assistant-response error-response">{message.error}</div>;
    }

    return (
        <div className="chat-item assistant-response">
            {message.text && <div className="assistant-text">{message.text}</div>}
            {message.html && <div className="assistant-text" dangerouslySetInnerHTML={{ __html: message.html }} />}
            {message.sql && (
                <div className="assistant-expression">
                    <pre>
                        <code className="language-sql">{message.sql}</code>
                    </pre>
                </div>
            )}
            {message.sql && message.allowApplySql !== false && onComplete && (
                <a className="apply-expression" onClick={handleApply} role="button" tabIndex={0}>
                    <i className="fa fa-check" /> Apply Expression
                </a>
            )}
        </div>
    );
});
ChatBubble.displayName = 'ChatBubble';

interface Props {
    isPending: boolean;
    messages: ChatMessage[];
    onCancel: () => void;
    onComplete?: (analysis: string) => void;
    onInterrupt: (isUser?: boolean) => void;
    sendPrompt: (prompt: string) => Promise<void>;
    title: ReactNode;
}

export const ChatModal: FC<Props> = memo(props => {
    const { isPending, messages, onCancel, onComplete, onInterrupt, sendPrompt, title } = props;
    const [prompt, setPrompt] = useState('');
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const historyRef = useRef<HTMLDivElement>(null);
    const timer = useTimeout();

    // Autofocus the prompt on mount
    useEffect(() => {
        timer.set(() => textAreaRef.current?.focus());
        return timer.clear;
    }, [timer]);

    useEffect(() => {
        const el = historyRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }, [messages, isPending]);

    const handleCancel = useCallback(() => {
        onInterrupt(false);
        onCancel();
    }, [onCancel, onInterrupt]);

    const handleChange = useCallback<React.ChangeEventHandler<HTMLTextAreaElement>>(evt => {
        setPrompt(evt.target.value);
    }, []);

    const handleInterrupt = useCallback(() => {
        onInterrupt(true);
    }, [onInterrupt]);

    const handleSend = useCallback(() => {
        const trimmed = prompt.trim();
        if (!trimmed || isPending) return;
        setPrompt('');
        sendPrompt(trimmed);
    }, [prompt, isPending, sendPrompt]);

    const handleKeyDown = useCallback<React.KeyboardEventHandler<HTMLTextAreaElement>>(
        evt => {
            if (evt.key === 'Enter' && !evt.shiftKey) {
                cancelEvent(evt);
                handleSend();
            }
        },
        [handleSend]
    );

    const handleSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(
        evt => {
            cancelEvent(evt);
            handleSend();
        },
        [handleSend]
    );

    return (
        <BaseModal className="chat-modal">
            <div className="modal-header">
                <h4 className="modal-title text__wrap">{title}</h4>
                <button className="btn btn-sm btn-default" onClick={handleCancel} type="button">
                    End Chat
                </button>
            </div>
            <div className="modal-body">
                <div className="chat-history" ref={historyRef}>
                    {messages.map(message => (
                        <ChatBubble key={message.id} message={message} onComplete={onComplete} />
                    ))}
                    {isPending && (
                        <div className="chat-item assistant-response pending">
                            <LoadingSpinner msg="Thinking..." />
                        </div>
                    )}
                </div>
            </div>
            <div className="modal-footer">
                <form className="form-inline" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <div className="col-xs-12">
                            <textarea
                                aria-label="Expression Assistant Prompt"
                                className="form-control prompt-input"
                                name="expression-assistant-prompt"
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter a prompt"
                                ref={textAreaRef}
                                value={prompt}
                            />
                        </div>
                    </div>
                    {isPending && (
                        <button className="btn btn-default prompt-button" onClick={handleInterrupt} type="button">
                            <i className="fa fa-stop" />
                        </button>
                    )}
                    {!isPending && (
                        <button className="btn btn-default prompt-button" disabled={!prompt.trim()} type="submit">
                            <i className="fa fa-arrow-up" />
                        </button>
                    )}
                </form>
                <div className="chat-modal__caution">
                    Your data and chats are private. AI can make mistakes. Double check any suggestions.
                </div>
            </div>
        </BaseModal>
    );
});
ChatModal.displayName = 'ChatModal';
