import { Ajax, Utils } from '@labkey/api';

import { buildURL } from '../../url/AppURL';
import { InferDomainResponse } from '../../../public/InferDomainResponse';
import { processRequest } from '../../query/api';

// TODO: Move this out of assay/utils
export function inferDomainFromFile(
    file: File | string, // file or webdav url path
    numLinesToInclude: number,
    domainKindName?: string
): Promise<InferDomainResponse> {
    return new Promise((resolve, reject) => {
        const form = new FormData();
        form.append('file', file);
        form.append('numLinesToInclude', numLinesToInclude ? (numLinesToInclude + 1).toString() : undefined);
        if (domainKindName) {
            form.append('domainKindName', domainKindName);
        }

        Ajax.request({
            url: buildURL('property', 'inferDomain'),
            method: 'POST',
            form,
            success: Utils.getCallbackWrapper((response, request) => {
                if (processRequest(response, request, reject)) return;
                resolve(InferDomainResponse.create(response));
            }),
            failure: Utils.getCallbackWrapper(error => {
                console.error(error);
                reject(
                    'There was a problem determining the fields in the uploaded file.  Please check the format of the file.'
                );
            }),
        });
    });
}

/**
 * This is used for retrieving preview data for a file already on the server side
 * @param file This can be a rowId for the file, or a path to the file
 * @param fileName The file name to be used to check the extension
 * @param numLinesToInclude the number of lines of data to include (excludes the header)
 */
export function getServerFilePreview(
    file: string,
    fileName: string,
    numLinesToInclude: number
): Promise<InferDomainResponse> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('property', 'getFilePreview.api'),
            params: {
                file,
                numLinesToInclude: numLinesToInclude ? numLinesToInclude + 1 : undefined, // add one to account for the header
                guessFormatAsTSV: fileName?.toLowerCase().endsWith('.tmp'), // Issue 47749
            },
            success: Utils.getCallbackWrapper(response => {
                resolve(InferDomainResponse.create(response));
            }),
            failure: Utils.getCallbackWrapper(response => {
                reject('There was a problem retrieving the preview data.');
                console.error(response);
            }),
        });
    });
}
