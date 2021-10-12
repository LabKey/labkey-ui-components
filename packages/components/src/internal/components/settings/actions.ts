import { Ajax, Utils } from '@labkey/api';

import { buildURL } from '../../url/AppURL';
import { handleRequestFailure } from '../../util/utils';

export const save = (key: string, value: string | boolean): Promise<null> => {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('sampleManager', 'setNameExpressionOptions'),
            jsonData: { [key]: value },
            method: 'POST',
            success: Utils.getCallbackWrapper(response => resolve(response)),
            failure: handleRequestFailure(reject, 'Failed to save name expression options.'),
        });
    });
};

export const init = (): Promise<{ prefix: string; allowUserSpecifiedNames: boolean }> => {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('sampleManager', 'getNameExpressionOptions'),
            success: Utils.getCallbackWrapper(response => resolve(response)),
            failure: handleRequestFailure(reject, 'Failed to get name expression options.'),
        });
    });
};
