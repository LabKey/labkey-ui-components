import { ActionURL, Ajax, Utils } from '@labkey/api';

import { AnnouncementModel, EDITABLE_FIELDS } from './model';

const createThreadForm = (thread: Partial<AnnouncementModel>, files: File[]) => {
    const form = new FormData();
    EDITABLE_FIELDS.forEach((field) => {
        const value = thread[field];

        if (value !== undefined) {
            form.append(`thread.${field}`, value.toString());
        }
    });
    files.forEach((file, i)  => {
        form.append(`file${i === 0 ? '' : i}`, file);
    });
    return form;
};

export interface AnnouncementsAPIWrapper {
    createThread: (thread: Partial<AnnouncementModel>, files: File[], reply?: boolean) => Promise<AnnouncementModel>;
    deleteAttachment: (parent: string, name: string) => Promise<boolean>;
    deleteThread: (threadRowId: number) => Promise<boolean>;
    getDiscussions: (discussionSrcIdentifier: string) => Promise<AnnouncementModel[]>;
    getThread: (threadRowId: number) => Promise<AnnouncementModel>;
    renderContent: (content: string) => Promise<string>;
    updateThread: (thread: Partial<AnnouncementModel>, files: File[]) => Promise<AnnouncementModel>;
}

export class ServerAnnouncementsAPIWrapper implements AnnouncementsAPIWrapper {
    createThread = (thread: Partial<AnnouncementModel>, files, reply?: boolean): Promise<AnnouncementModel> => {
        const form = createThreadForm(thread, files);
        form.append('reply', (!!reply).toString());
        return new Promise((resolve, reject) => {
            return Ajax.request({
                url: ActionURL.buildURL('announcements', 'createThread.api'),
                method: 'POST',
                form,
                success: Utils.getCallbackWrapper(({ data }) => { resolve(data); }),
                failure: Utils.getCallbackWrapper(error => { reject(error); }, undefined, true),
            });
        });
    };
    deleteAttachment = (entityId: string, name: string): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            return Ajax.request({
                url: ActionURL.buildURL('announcements', 'deleteAttachment.api'),
                method: 'POST',
                jsonData: { entityId, name },
                success: Utils.getCallbackWrapper(({ success }) => resolve(success)),
                failure: Utils.getCallbackWrapper(error => { reject(error); }, undefined, true),
            });
        });
    };
    deleteThread = (threadRowId: number): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            return Ajax.request({
                url: ActionURL.buildURL('announcements', 'deleteThread.api'),
                method: 'POST',
                jsonData: { rowId: threadRowId },
                success: Utils.getCallbackWrapper(({ success }) => resolve(success)),
                failure: Utils.getCallbackWrapper(error => { reject(error); }, undefined, true),
            });
        });
    };
    getDiscussions = (discussionSrcIdentifier: string): Promise<AnnouncementModel[]> => {
        return new Promise((resolve, reject) => {
            return Ajax.request({
                url: ActionURL.buildURL('announcements', 'getDiscussions.api'),
                method: 'POST',
                jsonData: { discussionSrcIdentifier },
                success: Utils.getCallbackWrapper(({ data }) => { resolve(data); }),
                failure: Utils.getCallbackWrapper(error => { reject(error); }, undefined, true),
            });
        });
    };
    getThread = (threadRowId: number): Promise<AnnouncementModel> => {
        return new Promise((resolve, reject) => {
            return Ajax.request({
                url: ActionURL.buildURL('announcements', 'getThread.api'),
                method: 'POST',
                jsonData: { rowId: threadRowId },
                success: Utils.getCallbackWrapper(({ data }) => { resolve(data); }),
                failure: Utils.getCallbackWrapper(error => { reject(error); }, undefined, true),
            });
        });
    };
    renderContent = (content: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            return Ajax.request({
                url: ActionURL.buildURL('core', 'transformWiki.api'),
                method: 'POST',
                jsonData: { body: content, fromFormat: 'MARKDOWN', toFormat: 'HTML' },
                success: Utils.getCallbackWrapper(({ body }) => { resolve(body); }),
                failure: Utils.getCallbackWrapper(error => { reject(error); }, undefined, true),
            });
        });
    };
    updateThread = (thread: Partial<AnnouncementModel>, files: File[]): Promise<AnnouncementModel> => {
        const form = createThreadForm(thread, files);
        return new Promise((resolve, reject) => {
            return Ajax.request({
                url: ActionURL.buildURL('announcements', 'updateThread.api'),
                method: 'POST',
                form,
                success: Utils.getCallbackWrapper(({ data }) => { resolve(data); }),
                failure: Utils.getCallbackWrapper(error => { reject(error); }, undefined, true),
            });
        });
    };
}

export const getDefaultAnnouncementsAPIWrapper = (): AnnouncementsAPIWrapper => new ServerAnnouncementsAPIWrapper();
