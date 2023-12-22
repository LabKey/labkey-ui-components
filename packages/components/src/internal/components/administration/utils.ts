import { ActionURL } from '@labkey/api';

import { List } from 'immutable';
import moment from 'moment';

import { hasPremiumModule } from '../../app/utils';
import { ModuleContext } from '../base/ServerContext';
import { Principal } from '../permissions/models';

import { MemberType } from './models';

export function isLoginAutoRedirectEnabled(moduleContext: ModuleContext): boolean {
    return moduleContext?.api?.AutoRedirectSSOAuthConfiguration !== undefined;
}

export function isApiKeyGenerationEnabled(moduleContext: ModuleContext): boolean {
    return !!moduleContext?.api?.allowApiKeys;
}

export function getApiExpirationMessage(moduleContext: ModuleContext): string {
    const expSeconds = moduleContext?.api?.apiKeyExpirationSeconds;
    if (!expSeconds || expSeconds === -1)
        return "never expire";
    return "expire after " + moment.duration(expSeconds, 'seconds').humanize();
}

export function showPremiumFeatures(moduleContext?: ModuleContext): boolean {
    return hasPremiumModule(moduleContext) && !ActionURL.getParameter('excludePremium');
}

export function createGroupedOptions(principals: List<Principal>): Array<{ label: string; options: Principal[] }> {
    const options = principals.reduce(
        (prev, curr) => {
            if (curr.isSiteGroup) {
                prev[0].options.push(curr);
            } else if (curr.type === MemberType.group) {
                prev[1].options.push(curr);
            } else {
                prev[2].options.push(curr);
            }
            return prev;
        },
        [
            {
                label: 'Site Groups',
                options: [],
            },
            {
                label: 'Project Groups',
                options: [],
            },
            {
                label: 'Users',
                options: [],
            },
        ]
    );

    // If there are no Site Groups, label 'Project Groups' as 'Groups'
    if (options[0].options.length === 0) {
        options.shift();
        options[0].label = 'Groups';
    }

    return options;
}
