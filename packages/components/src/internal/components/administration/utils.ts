import { ActionURL } from '@labkey/api';

import moment from 'moment';

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
    return 'expire after ' + moment.duration(expSeconds, 'seconds').humanize();
}

export function showPremiumFeatures(moduleContext?: ModuleContext): boolean {
    return hasPremiumModule(moduleContext) && !ActionURL.getParameter('excludePremium');
}

