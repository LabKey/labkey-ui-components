import { buildURL, EntityDataType } from '../..';
import { Ajax, Utils } from '@labkey/api';

export interface DeleteConfirmationData {
    canDelete: Array<any>
    cannotDelete: Array<any>
}

export function getDeleteConfirmationData(selectionKey: string, dataTypeKey: EntityDataType, rowIds?: Array<string>): Promise<DeleteConfirmationData> {
    return new Promise((resolve, reject) => {
        let params;
        if (selectionKey) {
            params = {
                dataRegionSelectionKey: selectionKey
            }
        }
        else {
            params = {
                rowIds
            }
        }
        return Ajax.request({
            url: buildURL('experiment', dataTypeKey === EntityDataType.DataClass ? 'getDataDeleteConfirmationData.api' : "getMaterialDeleteConfirmationData.api", params),
            method: "GET",
            success: Utils.getCallbackWrapper((response) => {
                if (response.success) {
                    resolve(response.data);
                }
                else {
                    reject(response.exception);
                }
            }),
            failure: Utils.getCallbackWrapper((response) => {
                reject(response ? response.exception : 'Unknown error getting delete confirmation data.');
            })
        })
    });
}

export function getSampleDeleteConfirmationData(selectionKey: string, rowIds?: Array<string>): Promise<DeleteConfirmationData> {
    return getDeleteConfirmationData(selectionKey, EntityDataType.Sample, rowIds);
}

export function getDataDeleteConfirmationData(selectionKey: string, rowIds?: Array<string>): Promise<DeleteConfirmationData> {
    return getDeleteConfirmationData(selectionKey, EntityDataType.DataClass, rowIds);
}
