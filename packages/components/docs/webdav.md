# Webdav API

Below example walks you through how you can utilize LabKey's WebDAV API in your React development to get already uploaded
files from the server, and to upload new files to the server.

Additionally, FileAttachmentForm component allows users to select files to be uploaded via file
selection or drag & drop - example to render FileAttachmentForm component [here](./fileAttachment.md).

## [WebDav](../src/public/files/WebDav.ts#L69)
```ts

//imports
import { getWebDavFiles, WebDavFile, uploadWebDavFile } from '@labkey/components';

//constants
const ATTACHMENTS_DIR = "MyUploads"

//model
export class AttachmentModel {
    /**
     * @hidden
     */
    [immerable] = true;

    readonly savedFiles?: Array<string>; //to get uploaded file names from the server
    readonly filesToUpload?: Map<string, File>; //to upload files to the server

    constructor(values?: Partial<AttachmentModel>) {
        Object.assign(this, values);
    }

    static create(raw?: any): AttachmentModel {
        return new AttachmentModel({ ...raw });
    }
}

//action to get file(s)
export async function getFiles(container: string, directory?: string, includeSubdirectories?: boolean): Promise<Array<SavedFileModel>> {
    return new Promise((resolve, reject) => {
        getWebDavFiles(container, directory, includeSubdirectories)
            .then((response) => {
                const displayFiles = response.get('files').valueSeq().map((file: WebDavFile) => {
                    //Note: you can return other properties of the WebDavFile, below only returns file name
                    return {file.name};
                });
                resolve(displayFiles);
            })
            .catch(response => {
                if (response) {
                    const msg = `Unable to load files in ${(directory ? directory : 'root')}: ${response}`;
                    reject(msg);
                }
            });
    });
}

//action to upload file(s) to the server
function uploadFiles(model: AttachmentModel): any {
    return new Promise((resolve, reject) => {

        // Nothing to do here
        if (model.filesToUpload?.size === 0) {
            resolve(model.filesToUpload);
        }

        const uploadedFiles = Array<string>();

        model.filesToUpload.map((fileToUpload) => {

            if (fileToUpload) {

                uploadWebDavFile(fileToUpload, ActionURL.getContainer(), ATTACHMENTS_DIR, true)
                    .then((name: string) => {
                        uploadedFiles.push(name);
                        if (uploadedFiles.length ===  model.filesToUpload.size) {
                            resolve(uploadedFiles);
                        }
                    })
                    .catch(reason => {
                        reject(reason);
                    });
            }
        }, this);
    });
}
