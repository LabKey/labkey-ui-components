import { ActionURL } from '@labkey/api';
import { formatDistance } from 'date-fns';

import { hasPremiumModule } from '../../app/utils';
import { ModuleContext } from '../base/ServerContext';

export function isLoginAutoRedirectEnabled(moduleContext: ModuleContext): boolean {
    return moduleContext?.api?.AutoRedirectSSOAuthConfiguration !== undefined;
}

export function isApiKeyGenerationEnabled(moduleContext: ModuleContext): boolean {
    return !!moduleContext?.api?.allowApiKeys;
}

export function isSessionKeyGenerationEnabled(moduleContext: ModuleContext): boolean {
    return !!moduleContext?.api?.allowSessionKeys;
}

export function getApiExpirationMessage(moduleContext: ModuleContext): string {
    const expSeconds = moduleContext?.api?.apiKeyExpirationSeconds;
    if (!expSeconds || expSeconds === -1) {
        return 'never expire';
    }

    // https://stackoverflow.com/a/52768660
    return 'expire after ' + formatDistance(0, expSeconds * 1000, { includeSeconds: true });
}

export function showPremiumFeatures(moduleContext?: ModuleContext): boolean {
    return hasPremiumModule(moduleContext) && !ActionURL.getParameter('excludePremium');
}
