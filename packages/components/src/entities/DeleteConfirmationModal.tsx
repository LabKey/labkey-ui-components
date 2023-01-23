import React, { FC, memo, ReactNode, useCallback, useState } from 'react';

import { ConfirmModal, ConfirmModalProps } from '../internal/components/base/ConfirmModal';

export interface DeleteConfirmationModalProps extends Omit<ConfirmModalProps, 'onConfirm'> {
    message: ReactNode;
    onCancel: () => any;
    onConfirm: (userComment: string) => any;
    showDeleteComment?: boolean;
}

export const DeleteConfirmationModal: FC<DeleteConfirmationModalProps> = memo(props => {
    const { cancelButtonText, confirmButtonText, message, onCancel, onConfirm, showDeleteComment, title } = props;
    const [auditUserComment, setAuditUserComment] = useState<string>();

    const onConfirmCallback = useCallback(() => {
        onConfirm(auditUserComment);
    }, [onConfirm, auditUserComment]);

    const onCommentChange = useCallback(evt => {
        setAuditUserComment(evt.target.value);
    }, []);

    return (
        <ConfirmModal
            title={title}
            onConfirm={onConfirmCallback}
            onCancel={onCancel}
            confirmVariant="danger"
            confirmButtonText={confirmButtonText}
            cancelButtonText={cancelButtonText}
        >
            <span>
                {message}
                {!!onConfirm && (
                    <div className="top-spacing">
                        <div>
                            <strong>Deletion cannot be undone.</strong> Do you want to proceed?
                        </div>
                        {showDeleteComment && (
                            <div className="top-spacing">
                                <div className="bottom-spacing">
                                    <strong>Reason(s) for deleting</strong>
                                </div>
                                <div>
                                    <textarea
                                        className="form-control"
                                        placeholder="Enter comments (optional)"
                                        onChange={onCommentChange}
                                        rows={5}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </span>
        </ConfirmModal>
    );
});
