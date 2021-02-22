# Webdav API

Below example walks you through how you can utilize LabKey's WebDAV API in your React development to get already uploaded
files from the server, and to upload new files to the server.

Additionally, FileAttachmentForm component allows users to select files to be uploaded via file
selection or drag & drop - example to render FileAttachmentForm component [here](./fileAttachment.md).

## [WebDav](../src/public/files/WebDav.ts#L69)
```ts
import { getWebDavFiles, WebDavFile, uploadWebDavFile } from '@labkey/components';

const ATTACHMENTS_DIR = 'MyUploads';

export class AttachmentModel {
    [immerable] = true;

    readonly savedFiles: string[]; // to get uploaded file names from the server
    readonly filesToUpload: Map<string, File>; // to upload files to the server

    constructor(values?: Partial<AttachmentModel>) {
        Object.assign(this, values);
    }
}

// Action to get file(s)
export function getFiles(container: string, directory?: string, includeSubdirectories?: boolean): Promise<AttachmentModel> {
    return new Promise(async (resolve, reject) => {
        try {
            const webDavFilesResponse = await getWebDavFiles(container, directory, includeSubdirectories);
            // Note: you can return other properties of the WebDavFile, below only returns file name
            const savedFiles = webDavFilesResponse.get('files').valueSeq().map(file => file.name);
            resolve(new AttachmentModel({ savedFiles }));
        } catch (response) {
            let msg = `Unable to load files in ${(directory ? directory : 'root')}`;
            if (response) {
                msg += `: ${response}`;
            }
            reject(msg);
        }
    });
}

// Action to upload file(s) to the server
function uploadFiles(model: AttachmentModel): any {
    return new Promise((resolve, reject) => {

        // Nothing to do here
        if (model.filesToUpload?.size === 0) {
            resolve(model.filesToUpload);
        }

        const uploadedFiles: string[] = [];

        model.filesToUpload.map((fileToUpload) => {

            if (fileToUpload) {
                uploadWebDavFile(fileToUpload, ActionURL.getContainer(), ATTACHMENTS_DIR, true)
                    .then((name: string) => {
                        uploadedFiles.push(name);
                        if (uploadedFiles.length === model.filesToUpload.size) {
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
```
