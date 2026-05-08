import React, { FC, memo, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { BaseModal } from '../../Modal';

interface Props {
    onCancel: () => void;
    onSubmit?: (prompt: string) => void;
    title: ReactNode;
}

export const ChatModal: FC<Props> = memo(({ onCancel, onSubmit, title }) => {
    const [prompt, setPrompt] = useState('');
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    // Fix for autoFocus not working in Modals
    useEffect(() => {
        const timeout = setTimeout(() => {
            textAreaRef.current?.focus();
        }, 100);
        return () => clearTimeout(timeout);
    }, []);

    const handleChange = useCallback<React.ChangeEventHandler<HTMLTextAreaElement>>(evt => {
        setPrompt(evt.target.value);
    }, []);

    const handleSend = useCallback(() => {
        if (!prompt.trim()) return;

        onSubmit?.(prompt);
        setPrompt('');
    }, [prompt, onSubmit]);

    const handleKeyDown = useCallback<React.KeyboardEventHandler<HTMLTextAreaElement>>(
        evt => {
            if (evt.key === 'Enter' && !evt.shiftKey) {
                evt.preventDefault();
                handleSend();
            }
        },
        [handleSend]
    );

    const handleSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(
        evt => {
            evt.preventDefault();
            handleSend();
        },
        [handleSend]
    );

    return (
        <BaseModal className="chat-modal">
            <div className="modal-header">
                <h4 className="modal-title text__wrap">{title}</h4>
                <button className="btn btn-sm btn-default" onClick={onCancel} type="button">
                    End Chat
                </button>
            </div>
            <div className="modal-body">
                Explain the calculation you would like and I'll help you write the expression. You can also ask
                questions about what fields can be used and what calculations can be done.
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
                    <button className="btn btn-default prompt-button" disabled={!prompt.trim()} type="submit">
                        <i className="fa fa-arrow-up" />
                    </button>
                </form>
                <div className="caution-text">
                    Your data and chats are private. AI can make mistakes. Double check any suggestions.
                </div>
            </div>
        </BaseModal>
    );
});
ChatModal.displayName = 'ChatModal';
