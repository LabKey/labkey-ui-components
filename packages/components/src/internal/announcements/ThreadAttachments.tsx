import React, { FC, memo, useCallback } from 'react';

import { Alert } from '../components/base/Alert';
import { Modal } from '../Modal';

import { Attachment, getAttachmentURL } from './model';

interface ThreadAttachmentProps {
    attachment: Attachment;
    containerPath?: string;
    onRemove?: (name: string) => void;
}

const ThreadAttachment: FC<ThreadAttachmentProps> = memo(({ attachment, containerPath, onRemove }) => {
    const _onRemove = useCallback(() => onRemove(attachment.name), [attachment, onRemove]);
    // Only generate a URL if the file has been uploaded.
    const url = attachment.created !== undefined ? getAttachmentURL(attachment, containerPath) : undefined;

    return (
        <div className="thread-attachment">
            {onRemove !== undefined && (
                <span
                    className="fa fa-times-circle thread-attachment-icon thread-attachment-icon--remove"
                    onClick={_onRemove}
                />
            )}

            <span className="fa fa-file-text thread-attachment-icon thread-attachment-icon--file" />

            {url === undefined && <span>{attachment.name}</span>}

            {url !== undefined && (
                <a href={url} target="_blank" rel="noopener noreferrer">
                    {attachment.name}
                </a>
            )}
        </div>
    );
});

interface ThreadAttachmentsProps {
    attachments: Attachment[];
    containerPath?: string;
    error?: string;
    onRemove?: (name: string) => void;
}

export const ThreadAttachments: FC<ThreadAttachmentsProps> = memo(({ attachments, containerPath, error, onRemove }) => (
    <div className="thread-editor-attachments">
        <div className="thread-editor-attachments__error help-block">{error}</div>

        <div className="thread-editor-attachments__body">
            <div className="thread-editor-attachments__list">
                {attachments.map(attachment => (
                    <ThreadAttachment
                        key={attachment.name}
                        attachment={attachment}
                        onRemove={onRemove}
                        containerPath={containerPath}
                    />
                ))}
            </div>
        </div>
    </div>
));

interface RemoveAttachmentModalProps {
    cancel: () => void;
    error: string;
    isRemoving: boolean;
    name: string;
    remove: () => void;
}

export const RemoveAttachmentModal: FC<RemoveAttachmentModalProps> = memo(props => (
    <Modal
        canConfirm={!props.isRemoving}
        confirmClass="btn-danger"
        confirmText="Yes, delete attachment"
        onCancel={props.cancel}
        onConfirm={props.remove}
        title="Delete Attachment?"
    >
        <Alert>{props.error}</Alert>
        Are you sure you want to delete the attachment "{props.name}"?
    </Modal>
));
