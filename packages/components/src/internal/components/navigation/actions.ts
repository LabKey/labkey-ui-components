import { Ajax, Utils, ActionURL } from '@labkey/api';

import { buildURL } from '../../url/AppURL';
import { AppProperties } from '../../app/models';

import { getAppProductIds, getPrimaryAppProperties } from '../../app/utils';

import { ProductMenuModel } from './model';
import { ModuleContext } from '../base/ServerContext';

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

export async function initMenuModel(
    appProperties: AppProperties,
    moduleContext: ModuleContext,
    containerId: string,
    containerPath?: string
): Promise<ProductMenuModel> {
    const primaryProductId = getPrimaryAppProperties(moduleContext).productId;
    const menuModel = new ProductMenuModel({
        containerId,
        containerPath,
        currentProductId: appProperties?.productId ?? primaryProductId,
        userMenuProductId: primaryProductId,
        productIds: getAppProductIds(primaryProductId),
    });

    try {
        const sections = await menuModel.getMenuSections();
        return menuModel.setLoadedSections(sections);
    } catch (e) {
        console.error('Problem retrieving product menu data.', e);
        return menuModel.setError('Error in retrieving product menu data. Please contact your site administrator.');
    }
}
