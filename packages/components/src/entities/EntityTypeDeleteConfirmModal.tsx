import React, { FC, memo, useCallback, useState } from 'react';
import { Map } from 'immutable';

import { SampleOperation } from '../internal/components/samples/constants';
import { buildURL } from '../internal/url/AppURL';
import { ConfirmModal } from '../internal/components/base/ConfirmModal';

interface Props {
    deleteConfirmationActionName?: string;
    isSample?: boolean;
    isShared?: boolean;
    noun: string;
    onCancel: () => any;
    onConfirm: (userComment: string) => any;
    rowId: number;
    showDeleteComment?: boolean;
    showDependenciesLink?: boolean;
}

export const EntityTypeDeleteConfirmModal: FC<Props> = memo(props => {
    const {
        isShared,
        isSample,
        onConfirm,
        onCancel,
        showDependenciesLink = false,
        rowId,
        deleteConfirmationActionName,
        noun,
        showDeleteComment,
    } = props;
    const [auditUserComment, setAuditUserComment] = useState<string>();

    const onConfirmCallback = useCallback(() => {
        onConfirm(auditUserComment);
    }, [onConfirm, auditUserComment]);

    const onCommentChange = useCallback(evt => {
        setAuditUserComment(evt.target.value);
    }, []);

    let dependencies = <>dependencies</>;
    if (showDependenciesLink && deleteConfirmationActionName) {
        let params = Map<string, string>();
        params = params.set('singleObjectRowId', rowId.toString());
        if (isSample) {
            params = params.set('sampleOperation', SampleOperation[SampleOperation.Delete]);
        }
        dependencies = <a href={buildURL('experiment', deleteConfirmationActionName, params.toJS())}>dependencies</a>;
    }

    return (
        <ConfirmModal
            title={`Permanently delete ${isShared ? 'shared ' : ''}${noun.toLowerCase()} type?`}
            onConfirm={onConfirmCallback}
            onCancel={onCancel}
            confirmVariant="danger"
            confirmButtonText="Yes, Delete"
            cancelButtonText="Cancel"
        >
            <span>
                The {noun.toLowerCase()} type and all of its {dependencies} will be permanently deleted.
                {isShared && (
                    <>
                        {' '}
                        Because this is a <strong>shared</strong> {noun.toLowerCase()} type, you may be affecting
                        other folders.
                    </>
                )}
                <div className="top-spacing">
                    <div>
                        <strong>Deletion cannot be undone.</strong> Do you want to proceed?
                    </div>
                    {showDeleteComment && (
                        <div>
                            <div>
                                <strong>Reason(s) for deleting</strong>
                            </div>
                            <div>
                                <textarea
                                    className="form-control"
                                    placeholder="Enter comments (optional)"
                                    value={auditUserComment}
                                    onChange={onCommentChange}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </span>
        </ConfirmModal>
    );
});
