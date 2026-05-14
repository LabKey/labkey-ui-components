import React, { FC, memo, ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BaseModal } from '../../Modal';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { ChatMessage, ChatRole, ChatSegment } from './models';
import { cancelEvent } from '../../events';
import { useTimeout } from '../../hooks';

export type RenderSegment = (segment: ChatSegment, index: number) => ReactNode | undefined;

function renderSegmentDefault(segment: ChatSegment, index: number): ReactNode | undefined {
    if (segment.type === 'html' && segment.html) {
        return <div className="assistant-text" dangerouslySetInnerHTML={{ __html: segment.html }} key={index} />;
    }
    if (segment.type === 'text' && segment.text) {
        return (
            <div className="assistant-text" key={index}>
                {segment.text}
            </div>
        );
    }
    return undefined;
}

interface ChatBubbleProps {
    message: ChatMessage;
    renderSegment?: RenderSegment;
}

const ChatItem: FC<ChatBubbleProps> = memo(({ message, renderSegment }) => {
    if (message.role === ChatRole.user) {
        return <div className="chat-item user-prompt">{message.text}</div>;
    }

    if (message.error) {
        return <div className="chat-item assistant-response error-response">{message.error}</div>;
    }

    return (
        <div className="chat-item assistant-response">
            {message.text && <div className="assistant-text">{message.text}</div>}
            {message.segments?.map((segment, index) => {
                const custom = renderSegment?.(segment, index);
                return <React.Fragment key={index}>{custom ?? renderSegmentDefault(segment, index)}</React.Fragment>;
            })}
        </div>
    );
});
ChatItem.displayName = 'ChatItem';

export interface ChatModalProps {
    isPending: boolean;
    messages: ChatMessage[];
    onCancel: () => void;
    onInterrupt: (isUser?: boolean) => void;
    renderSegment?: RenderSegment;
    sendPrompt: (prompt: string) => Promise<void>;
    title: ReactNode;
}

export const ChatModal: FC<ChatModalProps> = memo(props => {
    const { isPending, messages, onCancel, onInterrupt, renderSegment, sendPrompt, title } = props;
    const [prompt, setPrompt] = useState('');
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const historyRef = useRef<HTMLDivElement>(null);
    const timer = useTimeout();

    // Autofocus the prompt on mount
    useEffect(() => {
        timer.set(() => textAreaRef.current?.focus());
        return timer.clear;
    }, [timer]);

    const fieldSizingSupported = useMemo(() => CSS.supports('field-sizing', 'content'), []);

    // Firefox does not support the CSS property "field-sizing" which allows for the height of the textarea
    // to increase up to "max-height" based on the textarea content. Here we use a layout effect to mimic this
    // behavior in JavaScript.
    useLayoutEffect(() => {
        if (fieldSizingSupported || !textAreaRef.current) return;

        const el = textAreaRef.current;
        el.style.height = 'inherit';

        // Calculate height
        const computed = getComputedStyle(el);
        const nextHeight = el.scrollHeight + parseInt(computed.borderTopWidth) + parseInt(computed.borderBottomWidth);

        el.style.height = `${nextHeight}px`;
    }, [fieldSizingSupported, prompt]);

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
                        <ChatItem key={message.id} message={message} renderSegment={renderSegment} />
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
                                aria-label={`${title} Prompt`}
                                className="form-control prompt-input"
                                maxLength={4000}
                                name="chat-prompt"
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter a prompt"
                                ref={textAreaRef}
                                rows={1}
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
