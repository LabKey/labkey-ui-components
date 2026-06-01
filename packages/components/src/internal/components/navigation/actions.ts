/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Ajax, Utils, ActionURL } from '@labkey/api';

import { buildURL } from '../../url/AppURL';

import { request } from '../../request';

import { MenuSectionModel } from './model';

export function signOut(navigateUrl?: string): void {
    const startUrl = buildURL('project', 'start', undefined, { returnUrl: false });

    // for the redirectUrl to work in the case of CAS logout provider redirect, this URL needs to include the host (Issue 39803)
    const returnUrl = ActionURL.getBaseURL(true) + (navigateUrl || startUrl);

    Ajax.request({
        url: buildURL('login', 'logoutAPI.api', undefined, { returnUrl }),
        method: 'POST',
        success: Utils.getCallbackWrapper(response => {
            window.location.href = response.redirectUrl || returnUrl;
        }),
        failure: Utils.getCallbackWrapper(response => {
            console.error(response);
            window.location.href = returnUrl;
        }, false),
    });
}

export function signIn(): void {
    window.location.href = buildURL('login', 'login');
}

export async function getUserMenuSection(productId: string, container: string): Promise<MenuSectionModel> {
    const response = await request<any>({
        url: ActionURL.buildURL('product', 'userMenuSection.api', container),
        params: { productId },
        errorLogMsg: 'Failed to load user menu sections',
    });

    if (!response.data) {
        console.warn('No user menu section returned');
        return undefined;
    }

    return MenuSectionModel.create(response.data, container);
}
