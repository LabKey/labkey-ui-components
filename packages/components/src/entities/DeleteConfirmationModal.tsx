import React, { FC, memo, useCallback, useState } from 'react';

import { ConfirmModal, ConfirmModalProps } from '../internal/components/base/ConfirmModal';

export interface DeleteConfirmationModalProps extends Omit<ConfirmModalProps, 'onConfirm'> {
    onConfirm?: (userComment: string) => void;
    showDeleteComment?: boolean;
}

export const DeleteConfirmationModal: FC<DeleteConfirmationModalProps> = memo(props => {
    const { children, onConfirm, showDeleteComment, ...confirmModalProps } = props;
    const [auditUserComment, setAuditUserComment] = useState<string>();

    const onConfirmCallback = useCallback(() => {
        onConfirm(auditUserComment);
    }, [onConfirm, auditUserComment]);

    const onCommentChange = useCallback(evt => {
        setAuditUserComment(evt.target.value);
    }, []);

    return (
        <ConfirmModal confirmVariant="danger" {...confirmModalProps} onConfirm={onConfirmCallback}>
            {children}
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
        </ConfirmModal>
    );
});
