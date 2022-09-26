import { ActionURL } from '@labkey/api';

import { hasPremiumModule } from '../../app/utils';
import { ModuleContext } from '../base/ServerContext';

export function isLoginAutoRedirectEnabled(moduleContext: ModuleContext): boolean {
    return moduleContext?.api?.AutoRedirectSSOAuthConfiguration !== undefined;
}

export function showPremiumFeatures(moduleContext?: ModuleContext): boolean {
    return hasPremiumModule(moduleContext) && !ActionURL.getParameter('excludePremium');
}
