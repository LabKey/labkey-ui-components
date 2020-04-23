import { Ajax, Utils, ActionURL } from '@labkey/api';

import { buildURL } from '../../url/ActionURL';

export function signOut(navigateUrl?: string) {
    const startUrl = buildURL('project', 'start', undefined, { returnURL: false });

    // for the redirectUrl to work in the case of CAS logout provider redirect, this URL needs to include the host (Issue 39803)
    const returnUrl = ActionURL.getBaseURL(true) + (navigateUrl || startUrl);

    Ajax.request({
        url: buildURL('login', 'logoutAPI.api', undefined, { returnURL: returnUrl }),
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

export function signIn() {
    window.location.href = buildURL('login', 'login');
}
