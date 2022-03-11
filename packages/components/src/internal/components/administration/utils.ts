import { ActionURL, getServerContext } from '@labkey/api';

import { App } from '../../../index';

export function isLoginAutoRedirectEnabled(): boolean {
    return getServerContext().moduleContext.api.AutoRedirectSSOAuthConfiguration != undefined;
}

export function showPremiumFeatures(): boolean {
    return App.hasPremiumModule() && !ActionURL.getParameter('excludePremium');
}
