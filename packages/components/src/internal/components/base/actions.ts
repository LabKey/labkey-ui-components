/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Ajax, Utils } from '@labkey/api';

import { buildURL } from '../../../url/ActionURL';

import { InferDomainResponse } from './models/model';

export function inferDomainFromFile(file: File, numLinesToInclude: number): Promise<InferDomainResponse> {
    return new Promise((resolve, reject) => {
        const form = new FormData();
        form.append('file', file);
        form.append('numLinesToInclude', numLinesToInclude ? (numLinesToInclude + 1).toString() : undefined);

        Ajax.request({
            url: buildURL('property', 'inferDomain'),
            method: 'POST',
            form,
            success: Utils.getCallbackWrapper(response => {
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
 * @param file  This can be a rowId for the file, or a path to the file
 * @param numLinesToInclude: the number of lines of data to include (excludes the header)
 */
export function getServerFilePreview(file: string, numLinesToInclude: number): Promise<InferDomainResponse> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('property', 'getFilePreview.api'),
            method: 'GET',
            params: {
                file,
                numLinesToInclude: numLinesToInclude ? numLinesToInclude + 1 : undefined, // add one to account for the header
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

export function getUserProperties(userId: number): Promise<any> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL(
                'user',
                'getUserProps.api',
                { userId },
                {
                    container: '/', // always use root container for this API call
                }
            ),
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(response => {
                reject(response);
            }),
        });
    });
}
