import { Map, Record } from 'immutable';

import { ActionURL, Ajax, Utils } from '@labkey/api';

import { DEFAULT_FILE, IFile } from './models';

export class WebDavFile extends Record(DEFAULT_FILE) implements IFile {
    contentLength: number;
    contentType: string;
    created: string;
    createdBy: string;
    createdById: number;
    dataFileUrl: string;
    description: string;
    downloadUrl: string;
    href: string;
    id: string;
    iconFontCls: string;
    isCollection: boolean;
    isLeaf: boolean;
    lastModified: string;
    name: string;
    options: string;
    propertiesRowId?: number;
    canDelete: boolean;
    canEdit: boolean;
    canRead: boolean;
    canRename: boolean;
    canUpload: boolean;

    constructor(params?: IFile) {
        params ? super(params) : super();
    }

    static create(values): WebDavFile {
        const webDavFile = new WebDavFile(values);

        return webDavFile.merge({
            canDelete: values.canDelete,
            canEdit: values.canEdit,
            canRead: values.canRead,
            canRename: values.canRename,
            canUpload: values.canUpload,
            isCollection: values.collection,
            isLeaf: values.leaf,
            createdBy: values.createdby,
            created: values.creationdate,
            lastModified: values.lastmodified,
            downloadUrl: values.href ? values.href + '?contentDisposition=attachment' : undefined,
            name: values.text,
            contentType: values.contenttype || webDavFile.contentType,
        }) as WebDavFile;
    }
}

function getWebDavUrl(containerPath: string, directory?: string, createIntermediates?: boolean, skipAtFiles?: boolean) {
    let url =
        ActionURL.getContextPath() +
        '/_webdav' +
        ActionURL.encodePath(containerPath) +
        (!skipAtFiles ? '/' + encodeURIComponent('@files') : '');

    if (directory) {
        url += '/' + directory;
    }

    if (createIntermediates) {
        url += '?createIntermediates=' + createIntermediates;
    }

    return url;
}

export function getWebDavFiles(
    containerPath: string,
    directory?: string,
    includeDirectories?: boolean,
    skipAtFiles?: boolean,
    onlyPermittedDirectories?: boolean // Will return only uploadable directories
): Promise<Map<string, WebDavFile>> {
    return new Promise((resolve, reject) => {
        const url = getWebDavUrl(containerPath, directory, false, skipAtFiles);

        return Ajax.request({
            url: url + '?method=JSON',
            method: 'GET',
            success: Utils.getCallbackWrapper(response => {
                // Filter directories and create webdav files
                const filteredFiles = response.files.reduce((filtered, file) => {
                    const filterCondition = (onlyPermittedDirectories) ? (file.collection && file.canUpload) : (includeDirectories || !file.collection);
                    if (filterCondition) {
                        return filtered.set(file.text, WebDavFile.create(file));
                    } else {
                        return filtered;
                    }
                }, Map<string, WebDavFile>());
                resolve(filteredFiles);
            }),
            failure: Utils.getCallbackWrapper(
                response => {
                    console.error('Problem retrieving webDav files for container ' + containerPath);
                    reject(response);
                },
                null,
                false
            ),
        });
    });
}

export function uploadWebDavFile(
    file: File,
    containerPath: string,
    directory?: string,
    createIntermediates?: boolean
): Promise<string> {
    return new Promise((resolve, reject) => {
        const form = new FormData();
        form.append('file', file);

        const url = getWebDavUrl(containerPath, directory, createIntermediates);

        Ajax.request({
            url,
            method: 'POST',
            form,
            success: Utils.getCallbackWrapper(() => {
                resolve(file.name);
            }),
            failure: Utils.getCallbackWrapper(
                () => {
                    console.error('failure uploading file ' + file.name);
                    reject(file.name);
                },
                null,
                false
            ),
        });
    });
}
