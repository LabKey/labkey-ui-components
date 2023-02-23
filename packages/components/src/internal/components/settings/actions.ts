import { Ajax, Utils, Security } from '@labkey/api';

import { buildURL } from '../../url/AppURL';
import { handleRequestFailure } from '../../util/utils';
import { SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';

import { naturalSortByProperty } from '../../../public/sort';

export const saveNameExpressionOptions = (
    key: string,
    value: string | boolean,
    containerPath?: string
): Promise<null> => {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL(SAMPLE_MANAGER_APP_PROPERTIES.controllerName, 'setNameExpressionOptions.api', undefined, {
                container: containerPath,
            }),
            jsonData: { [key]: value },
            method: 'POST',
            success: Utils.getCallbackWrapper(response => resolve(response)),
            failure: handleRequestFailure(reject, 'Failed to save name expression options.'),
        });
    });
};

export const deleteContainerWithComment = (comment: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        Security.deleteContainer({
            comment,
            success: data => {
                resolve(data);
            },
            failure: error => {
                console.error('Failed to delete project', error);
                reject(error);
            },
        });
    });
};

export interface Summary {
    count: number;
    noun: string;
}

export const getDeletionSummaries = (): Promise<Summary[]> => {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('core', 'getModuleSummary.api'),
            method: 'GET',
            success: Utils.getCallbackWrapper(response => {
                const summaries = response?.moduleSummary;
                summaries.sort(naturalSortByProperty('noun'));
                resolve(summaries);
            }),
            failure: handleRequestFailure(reject, 'Failed to retrieve deletion summary.'),
        });
    });
};

export interface GetNameExpressionOptionsResponse {
    allowUserSpecifiedNames: boolean;
    prefix: string;
}

export const loadNameExpressionOptions = (containerPath?: string): Promise<GetNameExpressionOptionsResponse> => {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL(SAMPLE_MANAGER_APP_PROPERTIES.controllerName, 'getNameExpressionOptions.api', undefined, {
                container: containerPath,
            }),
            success: Utils.getCallbackWrapper(response => resolve(response)),
            failure: handleRequestFailure(reject, 'Failed to get name expression options.'),
        });
    });
};
