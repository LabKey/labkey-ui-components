import { ActionURL } from '@labkey/api';

import { hasPremiumModule } from '../../app/utils';

export function isLoginAutoRedirectEnabled(moduleContext: any): boolean {
    return moduleContext?.api?.AutoRedirectSSOAuthConfiguration !== undefined;
}

export function showPremiumFeatures(): boolean {
    return hasPremiumModule() && !ActionURL.getParameter('excludePremium');
}
