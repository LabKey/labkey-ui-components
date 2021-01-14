import { ActionURL, Ajax, Utils } from "@labkey/api";
import { PipelineStatusDetailModel } from "./model";
import { resolveErrorMessage } from "../../..";

export function getPipelineStatusDetail(rowId: number, offset?: number, count?: number ): Promise<PipelineStatusDetailModel> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('pipeline-status', 'statusDetails.api'),
            method: 'GET',
            params: {
                rowId,
                offset,
                count
            },
            success: Utils.getCallbackWrapper(response => {
                if (response.success) {

                    resolve(PipelineStatusDetailModel.loadResult(response.data));
                } else {
                    console.error(response);
                    reject('There was a problem retrieving the the status detail.');
                }
            }),
            failure: Utils.getCallbackWrapper(response => {
                console.error(response);
                reject(resolveErrorMessage(response));
            }),
        });
    });
}
