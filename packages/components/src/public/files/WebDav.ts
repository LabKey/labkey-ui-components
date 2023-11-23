import { Map, Record } from 'immutable';

import { ActionURL, Ajax, Utils } from '@labkey/api';

import { DEFAULT_FILE, IFile } from '../../internal/components/files/models';

const SC_FILE_MATCH = 208;

export interface IFileExtended extends IFile {
    collection: boolean; // Gets coerced to isCollection
    contenttype: string; // Gets coerced to contentType
    creationdate: string; // Gets coerced to created
    lastmodified: string; // Gets coerced to lastModified
    leaf: boolean; // Gets coerced to isLeaf
    text: string; // Gets coerced to name
}

export class WebDavFile implements IFile {
    declare canDelete: boolean;
    declare canEdit: boolean;
    declare canRead: boolean;
    declare canRename: boolean;
    declare canUpload: boolean;
    declare contentLength: number;
    declare contentType: string;
    declare created: string;
    declare createdBy: string;
    declare createdById: number;
    declare dataFileUrl: string;
    declare description: string;
    declare downloadUrl: string;
    declare href: string;
    declare id: string;
    declare iconFontCls: string;
    declare isCollection: boolean;
    declare isLeaf: boolean;
    declare lastModified: string;
    declare name: string;
    declare options: string;
    declare propertiesRowId?: number;

    constructor(props: IFileExtended) {
        const { collection, contenttype, creationdate, lastmodified, leaf, text, ...validProps } = props;
        const { href } = validProps;

        if (collection !== undefined) validProps.isCollection = collection;
        if (contenttype !== undefined) validProps.contentType = contenttype;
        if (creationdate !== undefined) validProps.created = creationdate;
        if (href !== undefined) validProps.downloadUrl = href + '?contentDisposition=attachment';
        if (lastmodified !== undefined) validProps.lastModified = lastmodified;
        if (leaf !== undefined) validProps.isLeaf = leaf;
        if (text !== undefined) validProps.name = text;

        Object.assign(this, DEFAULT_FILE, validProps);
    }
}

export function getWebDavUrl(
    containerPath: string,
    directory?: string,
    createIntermediates?: boolean,
    skipAtFiles?: boolean,
    asJSON?: boolean
): string {
    const containerPath_ = containerPath?.startsWith('/') ? containerPath : '/' + containerPath;
    let url = `${ActionURL.getContextPath()}/_webdav${ActionURL.encodePath(containerPath_)}`;

    if (!skipAtFiles) url += '/' + encodeURIComponent('@files');
    if (directory) url += '/' + encodeURIComponent(directory).replace(/%2F/g, '/');
    if (createIntermediates) url += '?createIntermediates=' + createIntermediates;
    if (asJSON) url += '?method=JSON';

    return url;
}

export function getWebDavFiles(
    containerPath: string,
    directory?: string,
    includeDirectories?: boolean,
    skipAtFiles?: boolean,
    alternateFilterCondition?: (file: any) => boolean
): Promise<Map<string, any>> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: getWebDavUrl(containerPath, directory, false, skipAtFiles, true),
            success: Utils.getCallbackWrapper(response => {
                // Filter directories and create webdav files
                const filteredFiles = response.files.reduce((filtered, file) => {
                    const filterCondition = alternateFilterCondition
                        ? alternateFilterCondition(file)
                        : includeDirectories || !file.collection;
                    if (filterCondition) {
                        return filtered.set(file.text, new WebDavFile(file));
                    } else {
                        return filtered;
                    }
                }, Map<string, WebDavFile>());
                resolve(Map({ files: filteredFiles, permissions: response.permissions }));
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
    createIntermediates?: boolean,
    overwrite = true
): Promise<string> {
    const url = getWebDavUrl(containerPath, directory, createIntermediates);
    return uploadWebDavFileToUrl(file, url, overwrite);
}

export function uploadWebDavFileToUrl(file: File, url: string, overwrite = true): Promise<string> {
    return new Promise((resolve, reject) => {
        const form = new FormData();
        form.append('file', file);
        form.append('overwrite', overwrite ? 'T' : 'F');

        Ajax.request({
            url,
            method: 'POST',
            form,
            success: Utils.getCallbackWrapper((response, request) => {
                if (!overwrite && request?.status === SC_FILE_MATCH) {
                    reject('File already exists: ' + file.name);
                } else {
                    resolve(file.name);
                }
            }),
            failure: Utils.getCallbackWrapper(
                () => {
                    console.error('Failure uploading file: ' + file.name);
                    reject('Failure uploading file: ' + file.name);
                },
                null,
                true
            ),
        });
    });
}

export function createWebDavDirectory(
    containerPath: string,
    directory: string,
    createIntermediates?: boolean
): Promise<string> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: getWebDavUrl(containerPath, directory, createIntermediates),
            method: 'MKCOL',
            success: Utils.getCallbackWrapper(() => {
                resolve(directory);
            }),
            failure: Utils.getCallbackWrapper(
                () => {
                    console.error('failure creating directory ' + directory);
                    reject(directory);
                },
                null,
                false
            ),
        });
    });
}

export function deleteWebDavResource(containerPath: string, directoryOrFilePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: getWebDavUrl(containerPath, directoryOrFilePath),
            method: 'DELETE',
            success: Utils.getCallbackWrapper(() => {
                resolve(directoryOrFilePath);
            }),
            failure: Utils.getCallbackWrapper(
                () => {
                    console.error('failure deleting resource ' + directoryOrFilePath);
                    reject(directoryOrFilePath);
                },
                null,
                false
            ),
        });
    });
}
