import { Ajax, Utils } from '@labkey/api';
import { buildURL } from "../../url/ActionURL";

export function signOut() {
    const startUrl = buildURL('project', 'start', undefined, {returnURL: false});

    Ajax.request({
        url: buildURL('login', 'logoutAPI.api'),
        method: 'POST',
        success: Utils.getCallbackWrapper((response) => {
            window.location.href = startUrl;
        }),
        failure: Utils.getCallbackWrapper((response) => {
            console.error(response);
            window.location.href = startUrl;
        }, false)
    });
}

export function signIn() {
    window.location.href = buildURL('login', 'login');
}
