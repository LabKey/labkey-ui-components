import { ActionURL, Ajax, Utils } from '@labkey/api';

import { resolveErrorMessage } from '../../util/messaging';

import { PipelineStatusDetailModel } from './model';

export function getPipelineStatusDetail(
    rowId: number,
    offset?: number,
    count?: number
): Promise<PipelineStatusDetailModel> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('pipeline-status', 'statusDetails.api'),
            method: 'GET',
            params: {
                rowId,
                offset,
                count,
            },
            success: Utils.getCallbackWrapper(response => {
                if (response.success) {
                    resolve(PipelineStatusDetailModel.fromJSON(response.data));
                } else {
                    console.error(response);
                    reject('There was a problem retrieving the status detail.');
                }
            }),
            failure: Utils.getCallbackWrapper(response => {
                console.error(response);
                reject(resolveErrorMessage(response));
            }),
        });
    });
}
