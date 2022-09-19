import { ActionURL } from '@labkey/api';

import { List } from 'immutable';

import { hasPremiumModule } from '../../app/utils';
import { Principal } from '../permissions/models';

export function isLoginAutoRedirectEnabled(moduleContext: any): boolean {
    return moduleContext?.api?.AutoRedirectSSOAuthConfiguration !== undefined;
}

export function showPremiumFeatures(): boolean {
    return hasPremiumModule() && !ActionURL.getParameter('excludePremium');
}

export function createGroupedOptions(principals: List<Principal>): any {
    const options = principals.reduce(
        (prev, curr) => {
            if (curr.isSiteGroup) {
                prev[0].options.push(curr);
            } else if (curr.type === 'g') {
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
