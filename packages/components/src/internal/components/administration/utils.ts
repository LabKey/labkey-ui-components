import { ActionURL } from '@labkey/api';

import { App } from '../../../index';

export function isLoginAutoRedirectEnabled(moduleContext: any): boolean {
    return moduleContext?.api?.AutoRedirectSSOAuthConfiguration !== undefined;
}

export function showPremiumFeatures(): boolean {
    return App.hasPremiumModule() && !ActionURL.getParameter('excludePremium');
}
