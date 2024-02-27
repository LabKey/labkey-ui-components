import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';

export interface Props {
    actionName: string;
    disabled?: boolean;
    inline?: boolean;
    onChange: (comment: string) => void;
    rows?: number;
    resizable?: boolean;
    containerClassName?: string;
    requiresUserComment?: boolean;
    maxLength?: number;
}

export const COMMENT_FIELD_ID = 'actionComments';

export const CommentTextArea: FC<Props> = props => {
    const {
        actionName,
        containerClassName,
        disabled,
        inline,
        onChange,
        maxLength = 1000,
        requiresUserComment,
        rows,
    } = props;
    const [showError, setShowError] = useState<boolean>(false);
    const inputRef = useRef<HTMLTextAreaElement>();
    useEffect(() => {
        if (inline) {
            // borrowed from https://css-tricks.com/the-cleanest-trick-for-autogrowing-textareas/
            const textArea = inputRef.current;
            textArea.addEventListener('input', () => {
                textArea.style.height = 'auto';
                textArea.style.height = Math.min(92, textArea.scrollHeight) + 'px';
            });
        }
    }, [inline]);

    const onCommentChange = useCallback(
        event => {
            const _comment = event.target.value;
            const tooLong = _comment.trim().length > maxLength;
            setShowError(tooLong);
            if (!tooLong) {
                onChange(_comment);
            }
        },
        [maxLength, onChange]
    );

    return (
        <>
            <div className={containerClassName}>
                <span className={inline ? 'inline-comment-label' : ''}>
                    Reason for {actionName}{requiresUserComment ? ' *' : ''}
                </span>
                <div className={classNames('form-group', { 'has-error': showError })}>
                    <textarea
                        className="form-control"
                        id={COMMENT_FIELD_ID}
                        placeholder={'Enter reason ' + (requiresUserComment ? '(required)' : '(optional)')}
                        rows={rows ?? (inline ? 1 : 5)}
                        disabled={disabled}
                        onChange={onCommentChange}
                        maxLength={maxLength + 1} // allow an extra character, so we can trigger the error message
                        ref={inputRef}
                    />
                    {showError && (
                        <span className="help-block">
                            Please limit your reason to {maxLength.toLocaleString()} characters.
                        </span>
                    )}
                </div>
            </div>
        </>
    );
};

CommentTextArea.defaultProps = {
    containerClassName: 'top-spacing',
};
