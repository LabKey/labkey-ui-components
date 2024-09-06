import React, { FC, memo, PropsWithChildren } from 'react';

import classNames from 'classnames';

import { FormButtons } from './FormButtons';
import { CommentTextArea } from './components/forms/input/CommentTextArea';

export interface ModalButtonsProps extends PropsWithChildren {
    actionName?: string;
    canConfirm?: boolean;
    cancelText?: string;
    confirmClass?: string;
    confirmText?: string;
    confirmingText?: string;
    isConfirming?: boolean;
    onCancel?: () => void;
    onCommentChange?: (comment: string) => void;
    onConfirm?: () => void;
    requiresUserComment?: boolean;
}

export const ModalButtons: FC<ModalButtonsProps> = memo(props => {
    const {
        actionName = 'Update',
        cancelText = 'Cancel',
        canConfirm = true,
        children,
        confirmClass = 'btn-success',
        confirmText = 'Save',
        confirmingText = 'Saving...',
        isConfirming,
        onCancel,
        onCommentChange,
        onConfirm,
        requiresUserComment,
    } = props;
    const confirmButtonClass = classNames('btn', confirmClass);

    if (!onCancel && !onConfirm) return null;

    return (
        <div className="modal-footer modal-buttons">
            <FormButtons sticky={false}>
                {onCancel && (
                    <button className="btn btn-default" onClick={onCancel} type="button">
                        {cancelText}
                    </button>
                )}
                {children}
                {onCommentChange && (
                    <CommentTextArea
                        containerClassName="inline-comment"
                        onChange={onCommentChange}
                        actionName={actionName}
                        requiresUserComment={requiresUserComment}
                        inline
                    />
                )}
                {onConfirm && (
                    <button
                        className={confirmButtonClass}
                        onClick={onConfirm}
                        type="button"
                        disabled={isConfirming || !canConfirm}
                    >
                        {isConfirming ? confirmingText : confirmText}
                    </button>
                )}
            </FormButtons>
        </div>
    );
});
