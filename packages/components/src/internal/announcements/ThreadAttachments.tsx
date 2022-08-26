import React, { FC, memo, useCallback } from 'react';
import { Modal } from 'react-bootstrap';

import { Attachment, getAttachmentURL } from './model';
import {Alert} from "../components/base/Alert";

interface ThreadAttachmentProps {
    attachment: Attachment;
    onRemove?: (name: string) => void;
}

const ThreadAttachment: FC<ThreadAttachmentProps> = memo(({ attachment, onRemove }) => {
    const _onRemove = useCallback(() => onRemove(attachment.name), [attachment, onRemove]);
    // Only generate a URL if the file has been uploaded.
    const url = attachment.created !== undefined ? getAttachmentURL(attachment) : undefined;

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
    error?: string;
    onRemove?: (name: string) => void;
}

export const ThreadAttachments: FC<ThreadAttachmentsProps> = memo(({ attachments, error, onRemove }) => (
    <div className="thread-editor-attachments">
        <div className="thread-editor-attachments__error help-block">{error}</div>

        <div className="thread-editor-attachments__body">
            <div className="thread-editor-attachments__list">
                {attachments.map(attachment => (
                    <ThreadAttachment key={attachment.name} attachment={attachment} onRemove={onRemove} />
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

export const RemoveAttachmentModal: FC<RemoveAttachmentModalProps> = memo(
    ({ cancel, error, isRemoving, name, remove }) => {
        return (
            <Modal show onHide={cancel} className="archive-notebook-modal">
                <Modal.Header>
                    <Modal.Title>Delete Attachment?</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Alert>{error}</Alert>
                    Are you sure you want to delete the attachment "{name}"?
                </Modal.Body>

                <Modal.Footer>
                    <div className="pull-left">
                        <button className="btn btn-default" disabled={isRemoving === true} onClick={cancel}>
                            Cancel
                        </button>
                    </div>

                    <div className="pull-right">
                        <button className="btn btn-danger" disabled={isRemoving} onClick={remove}>
                            Yes, delete attachment
                        </button>
                    </div>
                </Modal.Footer>
            </Modal>
        );
    }
);
