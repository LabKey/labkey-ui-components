import { Ajax, Utils } from '@labkey/api';

import { buildURL } from '../../url/AppURL';
import { handleRequestFailure } from '../../util/utils';
import { SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';

export const saveNameExpressionOptions = (key: string, value: string | boolean): Promise<null> => {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL(SAMPLE_MANAGER_APP_PROPERTIES.controllerName, 'setNameExpressionOptions'),
            jsonData: { [key]: value },
            method: 'POST',
            success: Utils.getCallbackWrapper(response => resolve(response)),
            failure: handleRequestFailure(reject, 'Failed to save name expression options.'),
        });
    });
};

export const loadNameExpressionOptions = (): Promise<{ prefix: string; allowUserSpecifiedNames: boolean }> => {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL(SAMPLE_MANAGER_APP_PROPERTIES.controllerName, 'getNameExpressionOptions'),
            success: Utils.getCallbackWrapper(response => resolve(response)),
            failure: handleRequestFailure(reject, 'Failed to get name expression options.'),
        });
    });
};
