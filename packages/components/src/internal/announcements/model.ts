import { ActionURL, User } from '@labkey/api';

// Expected to match WikiRendererType.java
export enum AnnouncementRenderType {
    HTML = 'HTML',
    MARKDOWN = 'MARKDOWN',
    RADEOX = 'RADEOX',
    TEXT_WITH_LINKS = 'TEXT_WITH_LINKS',
}

export interface Attachment {
    created?: string;
    documentSize: number;
    name: string;
    parent?: string;
}

export const getAttachmentURL = (attachment: Attachment, containerPath?: string): string => {
    return ActionURL.buildURL('announcements', 'download', containerPath, {
        name: attachment.name,
        entityId: attachment.parent,
    });
};

export interface AnnouncementModel {
    approved?: string;
    author: User;
    attachments: Attachment[];
    body: string;
    containerId: string;
    containerPath: string;
    created: string;
    createdBy: number;
    discussionSrcIdentifier?: string;
    discussionSrcEntityType?: string;
    entityId: string;
    expires?: string;
    formattedHtml: string;
    modified: string;
    modifiedBy: number;
    parent?: string;
    rendererType: AnnouncementRenderType;
    responses: AnnouncementModel[];
    rowId: number;
    status?: string;
    title: string;
}

// See copyEditableProps from AnnouncementsController
export const EDITABLE_FIELDS = [
    'approved',
    'body',
    'discussionSrcIdentifier',
    'discussionSrcEntityType',
    'expires',
    'parent',
    'rendererType',
    'rowId',
    'status',
    'title',
];

export interface ThreadActions {
    onCreate: (newThread: AnnouncementModel) => void;
    onDelete: () => void;
    onUpdate: () => void;
}
