import { ActionURL, Ajax, Utils } from '@labkey/api';

import { AnnouncementModel, EDITABLE_FIELDS } from './model';

const createThreadForm = (thread: Partial<AnnouncementModel>, files: File[]) => {
    const form = new FormData();
    EDITABLE_FIELDS.forEach(field => {
        const value = thread[field];

        if (value !== undefined) {
            form.append(`thread.${field}`, value.toString());
        }
    });
    files.forEach((file, i) => {
        form.append(`file${i === 0 ? '' : i}`, file);
    });
    return form;
};

export interface AnnouncementsAPIWrapper {
    createThread: (
        thread: Partial<AnnouncementModel>,
        files: File[],
        reply?: boolean,
        containerPath?: string
    ) => Promise<AnnouncementModel>;
    deleteAttachment: (parent: string, name: string, containerPath?: string) => Promise<boolean>;
    deleteThread: (threadRowId: number, containerPath?: string) => Promise<boolean>;
    getDiscussions: (discussionSrcIdentifier: string, containerPath?: string) => Promise<AnnouncementModel[]>;
    getThread: (threadRowId: number, containerPath?: string) => Promise<AnnouncementModel>;
    renderContent: (content: string, containerPath?: string) => Promise<string>;
    updateThread: (
        thread: Partial<AnnouncementModel>,
        files: File[],
        containerPath?: string
    ) => Promise<AnnouncementModel>;
}

export class ServerAnnouncementsAPIWrapper implements AnnouncementsAPIWrapper {
    createThread = (
        thread: Partial<AnnouncementModel>,
        files,
        reply?: boolean,
        containerPath?: string
    ): Promise<AnnouncementModel> => {
        const form = createThreadForm(thread, files);
        form.append('reply', (!!reply).toString());
        return new Promise((resolve, reject) => {
            return Ajax.request({
                url: ActionURL.buildURL('announcements', 'createThread.api', containerPath),
                method: 'POST',
                form,
                success: Utils.getCallbackWrapper(({ data }) => {
                    resolve(data);
                }),
                failure: Utils.getCallbackWrapper(
                    error => {
                        reject(error);
                    },
                    undefined,
                    true
                ),
            });
        });
    };
    deleteAttachment = (entityId: string, name: string, containerPath?: string): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            return Ajax.request({
                url: ActionURL.buildURL('announcements', 'deleteAttachment.api', containerPath),
                method: 'POST',
                jsonData: { entityId, name },
                success: Utils.getCallbackWrapper(({ success }) => resolve(success)),
                failure: Utils.getCallbackWrapper(
                    error => {
                        reject(error);
                    },
                    undefined,
                    true
                ),
            });
        });
    };
    deleteThread = (threadRowId: number, containerPath?: string): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            return Ajax.request({
                url: ActionURL.buildURL('announcements', 'deleteThread.api', containerPath),
                method: 'POST',
                jsonData: { rowId: threadRowId },
                success: Utils.getCallbackWrapper(({ success }) => resolve(success)),
                failure: Utils.getCallbackWrapper(
                    error => {
                        reject(error);
                    },
                    undefined,
                    true
                ),
            });
        });
    };
    getDiscussions = (discussionSrcIdentifier: string, containerPath?: string): Promise<AnnouncementModel[]> => {
        return new Promise((resolve, reject) => {
            return Ajax.request({
                url: ActionURL.buildURL('announcements', 'getDiscussions.api', containerPath),
                method: 'POST',
                jsonData: { discussionSrcIdentifier },
                success: Utils.getCallbackWrapper(({ data }) => {
                    resolve(data);
                }),
                failure: Utils.getCallbackWrapper(
                    error => {
                        reject(error);
                    },
                    undefined,
                    true
                ),
            });
        });
    };
    getThread = (threadRowId: number, containerPath?: string): Promise<AnnouncementModel> => {
        return new Promise((resolve, reject) => {
            return Ajax.request({
                url: ActionURL.buildURL('announcements', 'getThread.api', containerPath),
                method: 'POST',
                jsonData: { rowId: threadRowId },
                success: Utils.getCallbackWrapper(({ data }) => {
                    resolve(data);
                }),
                failure: Utils.getCallbackWrapper(
                    error => {
                        reject(error);
                    },
                    undefined,
                    true
                ),
            });
        });
    };
    renderContent = (content: string, containerPath?: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            return Ajax.request({
                url: ActionURL.buildURL('core', 'transformWiki.api', containerPath),
                method: 'POST',
                jsonData: { body: content, fromFormat: 'MARKDOWN', toFormat: 'HTML' },
                success: Utils.getCallbackWrapper(({ body }) => {
                    resolve(body);
                }),
                failure: Utils.getCallbackWrapper(
                    error => {
                        reject(error);
                    },
                    undefined,
                    true
                ),
            });
        });
    };
    updateThread = (
        thread: Partial<AnnouncementModel>,
        files: File[],
        containerPath?: string
    ): Promise<AnnouncementModel> => {
        const form = createThreadForm(thread, files);
        return new Promise((resolve, reject) => {
            return Ajax.request({
                url: ActionURL.buildURL('announcements', 'updateThread.api', containerPath),
                method: 'POST',
                form,
                success: Utils.getCallbackWrapper(({ data }) => {
                    resolve(data);
                }),
                failure: Utils.getCallbackWrapper(
                    error => {
                        reject(error);
                    },
                    undefined,
                    true
                ),
            });
        });
    };
}

let DEFAULT_WRAPPER: AnnouncementsAPIWrapper;

export const getDefaultAnnouncementsAPIWrapper = (): AnnouncementsAPIWrapper => {
    if (!DEFAULT_WRAPPER) DEFAULT_WRAPPER = new ServerAnnouncementsAPIWrapper();
    return DEFAULT_WRAPPER;
};
