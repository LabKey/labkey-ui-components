/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Modal, ModalHeader } from '../../Modal';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { ChatMessage, ChatRole, ChatSegment } from './models';
import { cancelEvent } from '../../events';
import { useTimeout } from '../../hooks';
import classNames from 'classnames';
import { DropdownButton, MenuItem } from '../../dropdowns';

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

export interface ChatHistoryProps {
    isPending: boolean;
    messages: ChatMessage[];
    renderSegment?: RenderSegment;
}

export const ChatHistory: FC<ChatHistoryProps> = memo(props => {
    const { messages, isPending, renderSegment } = props;
    const historyRef = useRef<HTMLDivElement>(null);

    return (
        <div aria-live="polite" className="chat-history" ref={historyRef} role="log">
            {messages.map(message => (
                <ChatItem key={message.id} message={message} renderSegment={renderSegment} />
            ))}
            {isPending && (
                <div className="chat-item assistant-response pending">
                    <LoadingSpinner msg="Thinking..." />
                </div>
            )}
        </div>
    );
});
ChatHistory.displayName = 'ChatHistory';

export interface ChatPromptProps {
    isPending: boolean;
    onInterrupt: (isUser?: boolean) => void;
    sendPrompt: (prompt: string) => Promise<void>;
    title: ReactNode;
}

export const ChatPrompt: FC<ChatPromptProps> = memo(props => {
    const { isPending, sendPrompt, title, onInterrupt } = props;
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const lastSentPromptRef = useRef('');
    const [prompt, setPrompt] = useState('');
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

    const handleSend = useCallback(() => {
        const trimmed = prompt.trim();
        if (!trimmed || isPending) return;
        lastSentPromptRef.current = trimmed;
        setPrompt('');
        sendPrompt(trimmed);
    }, [prompt, isPending, sendPrompt]);

    const handleSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(
        evt => {
            cancelEvent(evt);
            handleSend();
        },
        [handleSend]
    );

    const handleInterrupt = useCallback(() => {
        onInterrupt(true);
        setPrompt(current => (current === '' ? lastSentPromptRef.current : current));

        // Place the cursor back where it was in the prompt
        timer.set(() => {
            const el = textAreaRef.current;
            if (!el) return;
            el.focus();
            const end = el.value.length;
            el.setSelectionRange(end, end);
        });
    }, [onInterrupt, timer]);

    const handleChange = useCallback<React.ChangeEventHandler<HTMLTextAreaElement>>(evt => {
        setPrompt(evt.target.value);
    }, []);

    const handleKeyDown = useCallback<React.KeyboardEventHandler<HTMLTextAreaElement>>(
        evt => {
            if (evt.key === 'Enter' && !evt.shiftKey) {
                cancelEvent(evt);
                handleSend();
            }
        },
        [handleSend]
    );

    return (
        <>
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
                    <button
                        aria-label="Stop"
                        className="btn btn-default prompt-button"
                        onClick={handleInterrupt}
                        type="button"
                    >
                        <i className="fa fa-stop" />
                    </button>
                )}
                {!isPending && (
                    <button
                        aria-label="Submit"
                        className="btn btn-default prompt-button"
                        disabled={!prompt.trim()}
                        type="submit"
                    >
                        <i className="fa fa-arrow-up" />
                    </button>
                )}
            </form>
            <div className="chat-modal__caution">AI can make mistakes. Double check any suggestions.</div>
        </>
    );
});
ChatPrompt.displayName = 'ChatPrompt';

export interface ChatSessionProps {
    isPending: boolean;
    messages: ChatMessage[];
    onClose: () => void;
    onInterrupt: (isUser?: boolean) => void;
    renderSegment?: RenderSegment;
    sendPrompt: (prompt: string) => Promise<void>;
    title: ReactNode;
}

export const ChatModal: FC<ChatSessionProps> = memo(props => {
    const { isPending, messages, onClose, onInterrupt, renderSegment, sendPrompt, title } = props;

    const handleClose = useCallback(() => {
        onInterrupt(false);
        onClose();
    }, [onClose, onInterrupt]);

    const header = (
        <ModalHeader title={title}>
            <button className="btn btn-sm btn-default" onClick={handleClose} type="button">
                End Chat
            </button>
        </ModalHeader>
    );

    const footer = <ChatPrompt isPending={isPending} onInterrupt={onInterrupt} sendPrompt={sendPrompt} title={title} />;

    return (
        <Modal className="chat-modal" footer={footer} header={header} title={title}>
            <ChatHistory isPending={isPending} messages={messages} renderSegment={renderSegment} />
        </Modal>
    );
});
ChatModal.displayName = 'ChatModal';

enum ChatPosition {
    bottomLeft = 'chat-sidebar--bl',
    bottomRight = 'chat-sidebar--br',
    topLeft = 'chat-sidebar--tl',
    topRight = 'chat-sidebar--tr',
}

const POSITION_LABELS = {
    [ChatPosition.bottomLeft]: 'Bottom Left',
    [ChatPosition.bottomRight]: 'Bottom Right',
    [ChatPosition.topLeft]: 'Top Left',
    [ChatPosition.topRight]: 'Top Right',
};

interface ChatPositionIconProps {
    position: ChatPosition;
}

const ChatPositionIcon: FC<ChatPositionIconProps> = memo(({ position }) => {
    const x = position === ChatPosition.topRight || position === ChatPosition.bottomRight ? 6 : 2;
    const y = position === ChatPosition.bottomLeft || position === ChatPosition.bottomRight ? 6 : 3;

    return (
        <svg aria-hidden="true" height="12" viewBox="0 -2 14 14" width="12" xmlns="http://www.w3.org/2000/svg">
            <rect
                fill="none"
                height="10.5"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.5"
                width="10.5"
                x=".75"
                y=".75"
            />
            <rect fill="currentColor" height="4" rx="0.5" width="4" x={x} y={y} />
        </svg>
    );
});
ChatPositionIcon.displayName = 'ChatPositionIcon';

interface ChatPositionMenuItemProps {
    currenPosition: ChatPosition;
    position: ChatPosition;
    setPosition: (position: ChatPosition) => void;
}

const ChatPositionMenuItem: FC<ChatPositionMenuItemProps> = memo(({ currenPosition, position, setPosition }) => {
    const active = currenPosition === position;
    const onClick = useCallback(() => setPosition(position), [position, setPosition]);
    return (
        <MenuItem active={active} aria-label={POSITION_LABELS[position]} onClick={onClick}>
            <ChatPositionIcon position={position} /> {POSITION_LABELS[position]}
        </MenuItem>
    );
});
ChatPositionMenuItem.displayName = 'ChatPositionMenuItem';

interface ChatPositionMenuProps {
    position: ChatPosition;
    setPosition: (position: ChatPosition) => void;
}

const ChatPositionMenu: FC<ChatPositionMenuProps> = memo(({ position, setPosition }) => {
    const icon = <ChatPositionIcon position={position} />;
    const label = 'LabKey Assistant Chat Window Position Menu';
    return (
        <DropdownButton aria-label={label} buttonClassName="btn-sm" noCaret title={icon}>
            <ChatPositionMenuItem
                currenPosition={position}
                position={ChatPosition.bottomRight}
                setPosition={setPosition}
            />
            <ChatPositionMenuItem
                currenPosition={position}
                position={ChatPosition.bottomLeft}
                setPosition={setPosition}
            />
            <ChatPositionMenuItem
                currenPosition={position}
                position={ChatPosition.topRight}
                setPosition={setPosition}
            />
            <ChatPositionMenuItem currenPosition={position} position={ChatPosition.topLeft} setPosition={setPosition} />
        </DropdownButton>
    );
});
ChatPositionMenu.displayName = 'ChatPositionMenu';

interface ChatSidebarProps extends ChatSessionProps {
    loading: boolean;
    startNewChat: () => void;
}

export const ChatSidebar: FC<ChatSidebarProps> = memo(props => {
    const { isPending, loading, messages, onClose, onInterrupt, title, renderSegment, sendPrompt, startNewChat } =
        props;
    const [position, setPosition] = useState(ChatPosition.bottomRight);
    const [minimized, setMinimized] = useState(false);
    const toggleMinimized = useCallback(() => setMinimized(current => !current), []);
    const handleClose = useCallback(() => {
        onInterrupt(false);
        onClose();
    }, [onClose, onInterrupt]);

    const className = classNames('chat-sidebar', position, { 'chat-sidebar--minimized': minimized });
    const minimizeClassName = classNames('fa', { 'fa-chevron-up': minimized, 'fa-minus': !minimized });
    const bodyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll the conversation to the bottom when new messages get appended
        const el = bodyRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }, [isPending, messages]);

    return (
        <aside aria-labelledby="chat-sidebar-title" className={className}>
            <div className="chat-sidebar__header">
                <div className="chat-sidebar__title" id="chat-sidebar-title">
                    {title}
                </div>

                <div className="chat-sidebar__buttons">
                    <button className="btn btn-sm btn-default" onClick={startNewChat} type="button">
                        <span className="fa fa-plus" />
                    </button>

                    <ChatPositionMenu position={position} setPosition={setPosition} />

                    <button className="btn btn-sm btn-default" onClick={toggleMinimized} type="button">
                        <span className={minimizeClassName} />
                    </button>

                    <button className="btn btn-sm btn-default" onClick={handleClose} type="button">
                        End Chat
                    </button>
                </div>
            </div>

            {!minimized && (
                <div className="chat-sidebar__body" ref={bodyRef}>
                    <ChatHistory isPending={isPending} messages={messages} renderSegment={renderSegment} />
                    {loading && (
                        <div className="chat-history">
                            <LoadingSpinner msg="Loading chat history..." />
                        </div>
                    )}
                </div>
            )}

            {!minimized && (
                <div className="chat-sidebar__footer">
                    <ChatPrompt isPending={isPending} onInterrupt={onInterrupt} sendPrompt={sendPrompt} title={title} />
                </div>
            )}
        </aside>
    );
});

ChatSidebar.displayName = 'ChatSidebar';
