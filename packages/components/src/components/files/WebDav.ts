
import { Map, Record } from 'immutable';
import { ActionURL, Ajax, Utils } from '@labkey/api';
import {DEFAULT_FILE, FileAttachmentFormModel, IFile} from "./models";

export class WebDavFile extends Record(DEFAULT_FILE) implements IFile {
    contentLength: number;
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
    propertiesRowId?: number;

    constructor(values?: { [key: string]: any }) {
        super(values);
    }

    /**
     * values is presumed to be an object returned from the webdav controller.  It has several fields we are not
     * currently using in the application.  We pick out the ones we want and make their names more standard.
     * N.B.  The "size" field is particularly problematic since records already have a size field, so don't use that
     * (contentlength seems to have the same value anyway).
     * @param values
     */
    static create(values): WebDavFile {
        let props = {};

        if (values['collection'])
            props['isCollection'] = values['collection'];
        if (values['contentlength'])
            props['contentLength'] = values['contentlength'];
        if (values['createdby'])
            props['createdBy'] = values['createdby'];
        if (values['creationdate'])
            props['created'] = values['creationdate'];
        if (values['dataFileUrl'])
            props['dataFileUrl'] = values['dataFileUrl'];
        if (values['description'])
            props['description'] = values['description'];
        if (values['href']) {
            props['href'] = values['href'];
            props['downloadUrl'] = props['href'] + "?contentDisposition=attachment";
        }
        if (values['iconFontCls'])
            props['iconFontCls'] = values['iconFontCls'];
        if (values['id'])
            props['id'] = values['id'];
        if (values['lastmodified'])
            props['lastModified'] = values['lastmodified'];
        if (values['leaf'])
            props['isLeaf'] = values['leaf'];
        if (values['text'])
            props['name'] = values['text'];
        return new WebDavFile(props);
    }
}

export interface WebDavContainer extends FileAttachmentFormModel {
    containerPath: string
    isLoading: boolean
    uploadedFiles: Map<string, WebDavFile>
}

export class WebDav extends Record({
    containerPath: undefined
}) {
    containerPath: string;

    constructor(values?: { [key: string]: any }) {
        super(values);
    }

    static create(containerPath: string): WebDav {
        return new WebDav({
            containerPath
        });
    }

    getWebDavBaseUrl() : string {
        return ActionURL.getContextPath() + '/_webdav' + ActionURL.encodePath(this.containerPath) + "/" + encodeURIComponent("@files");
    }

    // N.B.  We don't actually retrieve any of the custom properties here (since we won't display them), but need the
    // rowId to be able to update descriptions reliably.
    getCustomProperties(webDavFiles: Map<string, WebDavFile>) : Promise<Map<string, WebDavFile>> {
        return new Promise((resolve, reject) => {
            return Ajax.request({
                url: ActionURL.buildURL('fileContent', 'getCustomProperties.api', this.containerPath),
                method: "GET",
                success: Utils.getCallbackWrapper((response) => {
                    let updatedFiles = webDavFiles.asMutable();
                    response.rows.forEach((row) => {
                        if (updatedFiles.has(row['name'])) {
                            updatedFiles.setIn([row['name'], 'propertiesRowId'], row['rowId']);
                        }
                    });
                    resolve(updatedFiles.asImmutable());
                }),
                failure: Utils.getCallbackWrapper((response) => {
                    console.error("Problem retrieving file content custom properties for container " + this.containerPath, response);
                    reject(response)
                }, null, false)
            })
        });
    }

    getWebDavFiles(directory?: string, includeDirectories?: boolean): Promise<Map<string, WebDavFile>> {
        return new Promise((resolve, reject) => {
            let url = this.getWebDavBaseUrl();

            if (directory) {
                url  += ("/" + encodeURIComponent(directory));
            }

            return Ajax.request({
                url: url + "?method=JSON",
                method: "GET",
                success: Utils.getCallbackWrapper((response) => {
                    let filteredFiles = Map<string, WebDavFile>().asMutable();
                    response.files.forEach((file) => {
                        let webDavFile = WebDavFile.create(file);
                        if (includeDirectories || !webDavFile.isCollection) {
                            filteredFiles.set(webDavFile.name, webDavFile);
                        }
                    });
                    resolve(filteredFiles.asImmutable());
                }),
                failure: Utils.getCallbackWrapper((response) => {
                    console.error("Problem retrieving webDav files for container " + this.containerPath);
                    reject(response)
                }, null, false)
            })
        });
    }

    getFiles(includeDirectories?: boolean): Promise<Map<string, WebDavFile>> {
        return new Promise((resolve, reject) => {
            return this.getWebDavFiles(undefined, includeDirectories)
                .then(response =>
                    this.getCustomProperties(response)
                        .then( updates => resolve(updates)));
        });
    }

    getDownloadUrl(files: Map<string, WebDavFile>, zipName?: string): string {
        if (!files || files.size === 0)
            return undefined;

        let url;
        if (files.size === 1) {
            url = files.first().downloadUrl;
        }
        else {
            url = this.getWebDavBaseUrl() + "?method=zip&depth=1";
            files.forEach((file) => {
                url += "&file=" + encodeURIComponent(file.name);
            });
            if (zipName)
                url += "&zipName=" + encodeURIComponent(zipName);
        }
        return url;
    }

    downloadFiles(fileNames: Map<string, WebDavFile>, zipName?: string) {
        const downloadUrl = this.getDownloadUrl(fileNames, zipName);
        if (downloadUrl)
            window.location.href = downloadUrl;
    }

    uploadFile(file: File, directory?: string, createIntermediates?: boolean) : Promise<string> {
        return new Promise((resolve, reject) => {
            let form = new FormData();
            form.append('file', file);

            let url = this.getWebDavBaseUrl();

            if (directory) {
                url  += ("/" + encodeURIComponent(directory));
            }

            if (createIntermediates)
                url += '?createIntermediates=' + createIntermediates;

            Ajax.request({
                url: url,
                method: 'POST',
                form,
                success: Utils.getCallbackWrapper((response) => {
                    resolve(file.name);
                }),
                failure: Utils.getCallbackWrapper((response) => {
                    console.error('failure uploading file ' + file.name);
                    reject(file.name)
                }, null, false)
            });
        })
    }

    uploadFiles(files: Map<string, File>, onSuccess?: () => any, onFailure?: (any) => any) {

        if (!files || files.size == 0)
            return;

        let promises = [];
        // DavController does not support multiple file uploads, so we do one at a time...
        files.forEach((file) => {
            promises.push(this.uploadFile(file));
        });
        Promise.all(promises).then(response => {
            if (onSuccess)
                onSuccess();
        }).catch(reason => {
            if (onFailure)
                onFailure(reason);
        });
    }

    deleteWebDavFile(fileName: string, onDelete?: (fileName) => any, onFailure?: (fileName) => any) {
        // http://localhost:8080/labkey/_webdav/Biologics/__LBC-1/%40files/C3CB102.csv?method=DELETE
        Ajax.request({
            url: this.getWebDavBaseUrl() + "/" + encodeURIComponent(fileName) + "?method=DELETE",
            method: 'POST',
            success: Utils.getCallbackWrapper((responses) => {
                if (onDelete)
                    onDelete(fileName);
            }),
            failure: Utils.getCallbackWrapper((response) => {
                console.error("Problem deleting file ", fileName);
                if (onFailure)
                    onFailure(fileName);
            })
        })
    }

    updateFileDescription(file: WebDavFile, description: string, onSuccess?: (file: WebDavFile) => any, onFailure?: (file: WebDavFile) => any) {
        let fileObject = {
            Name: file.name,
            id: file.href, // yeah, I don't get it either.  Why not id?
            'Flag/Comment': description
        };
        if (file.propertiesRowId)
            fileObject['RowId'] = file.propertiesRowId;
        else
            fileObject['DataFileURL'] = file.dataFileUrl;

        const payload = {
            files: [fileObject]
        };
        Ajax.request({
            url: ActionURL.buildURL('filecontent', 'updateFileProps.api', this.containerPath),
            method: 'POST',
            jsonData: payload,
            success: Utils.getCallbackWrapper((response) => {
                if (!response.success) {
                    console.error('Problem updating description for file', file, response);
                    if (onFailure) {
                        onFailure(file);
                    }
                }
                else {
                    if (onSuccess) {
                        onSuccess(file);
                    }
                }
            }),
            failure: Utils.getCallbackWrapper((response) => {
                console.error('Problem updating description for file', file, response);
                if (onFailure) {
                    onFailure(file);
                }
            })
        })
    }
}
