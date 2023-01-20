import React, { FC, memo, ReactNode, useCallback, useMemo, useState } from 'react';
import { Map } from 'immutable';

import { SampleOperation } from '../internal/components/samples/constants';
import { buildURL } from '../internal/url/AppURL';
import { ConfirmModal, ConfirmModalProps } from '../internal/components/base/ConfirmModal';

export interface DeleteConfirmModalProps extends Omit<ConfirmModalProps, 'onConfirm'> {
    message: ReactNode;
    onCancel: () => any;
    onConfirm: (userComment: string) => any;
    showDeleteComment?: boolean;
}

export const DeleteConfirmModal: FC<DeleteConfirmModalProps> = memo(props => {
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
            onConfirm={showDeleteComment ? onConfirmCallback : undefined}
            onCancel={onCancel}
            confirmVariant="danger"
            confirmButtonText={confirmButtonText}
            cancelButtonText={cancelButtonText}
        >
            <span>
                {message}
                {showDeleteComment && (
                    <div className="top-spacing">
                        <div>
                            <strong>Deletion cannot be undone.</strong> Do you want to proceed?
                        </div>
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
                    </div>
                )}
            </span>
        </ConfirmModal>
    );
});

interface Props extends Omit<DeleteConfirmModalProps, 'message'> {
    deleteConfirmationActionName?: string;
    isSample?: boolean;
    isShared?: boolean;
    noun: string;
    rowId: number;
    showDependenciesLink?: boolean;
}

export const EntityTypeDeleteConfirmModal: FC<Props> = memo(props => {
    const {
        isShared,
        isSample,
        showDependenciesLink = false,
        rowId,
        deleteConfirmationActionName,
        noun,
        ...rest
    } = props;

    const dependencies = useMemo(() => {
        if (!showDependenciesLink || !deleteConfirmationActionName) return undefined;

        let params = Map<string, string>();
        params = params.set('singleObjectRowId', rowId.toString());
        if (isSample) {
            params = params.set('sampleOperation', SampleOperation[SampleOperation.Delete]);
        }

        return (
            <>
                <a href={buildURL('experiment', deleteConfirmationActionName, params.toJS())}>dependencies</a>
            </>
        );
    }, [deleteConfirmationActionName, isSample, rowId, showDependenciesLink]);

    const message = useMemo(() => {
        return (
            <>
                The {noun.toLowerCase()} type and all of its {dependencies} will be permanently deleted.
                {isShared && (
                    <>
                        {' '}
                        Because this is a <strong>shared</strong> {noun.toLowerCase()} type, you may be affecting other
                        folders.
                    </>
                )}
            </>
        );
    }, [dependencies, isShared, noun]);

    return (
        <DeleteConfirmModal
            {...rest}
            cancelButtonText="Cancel"
            confirmButtonText="Yes, Delete"
            message={message}
            title={`Permanently delete ${isShared ? 'shared ' : ''}${noun.toLowerCase()} type?`}
        />
    );
});
