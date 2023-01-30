import { Ajax, Utils, ActionURL } from '@labkey/api';

import { buildURL } from '../../url/AppURL';
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


export function getUserMenuSection(productId: string, container: string): Promise<MenuSectionModel> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('product', 'userMenuSection.api', undefined, {
                container,
            }),
            params: Object.assign({
                productId,
            }),
            success: Utils.getCallbackWrapper(response => {
                if (response) {
                    resolve(MenuSectionModel.create(response, productId, container));
                }
                else {
                    console.warn("No user menu section returned");
                    resolve(undefined);
                }
            }),
            failure: Utils.getCallbackWrapper(response => {
                console.error(response);
                reject(response);
            })
        })
    })
}
