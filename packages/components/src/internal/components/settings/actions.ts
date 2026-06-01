/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Ajax, Utils } from '@labkey/api';

import { buildURL } from '../../url/AppURL';
import { handleRequestFailure } from '../../request';
import { SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';

export const saveNameExpressionOptions = (
    key: string,
    value: string | boolean,
    containerPath?: string
): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL(SAMPLE_MANAGER_APP_PROPERTIES.controllerName, 'setNameExpressionOptions.api', undefined, {
                container: containerPath,
            }),
            jsonData: { [key]: value },
            method: 'POST',
            success: Utils.getCallbackWrapper(response => resolve(response.ineligibleSampleTypes)),
            failure: handleRequestFailure(reject, 'Failed to save name expression options.'),
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
