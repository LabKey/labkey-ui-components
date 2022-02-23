import { List } from 'immutable'
import {User} from "../base/models/User";
import { ITab } from '../navigation/SubNav';
import {AppURL} from "../../url/AppURL";
import {SecurityPolicy} from "../permissions/models";
import {Security} from "@labkey/api";

export function getAdministrationSubNavTabs(user: User): List<ITab> {
    let tabs = List<string>();

    if (user.isAdmin) {
        tabs = tabs.push('Users');
        tabs = tabs.push('Permissions');
    }
    if (user.isAppAdmin()) {
        tabs = tabs.push('Settings');
    }

    return tabs.map(text => ({
        text,
        url: AppURL.create('admin', text.toLowerCase())
    })).toList()
}

export function getUserGridFilterURL(userIds: List<number>, urlPrefix: string): AppURL {
    let url = AppURL.create('admin', 'users');
    if (userIds && userIds.size > 0) {
        url = url.addParam(urlPrefix + '.UserId~in', userIds.join(';'));
    }
    return url;
}

export function updateSecurityPolicy(containerPath: string, userIds: List<number>, roleUniqueNames: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
        Security.getPolicy({
            containerPath: containerPath,
            resourceId: containerPath,
            success: (data, relevantRoles) => {
                let policy = SecurityPolicy.create({policy: data, relevantRoles});
                userIds.forEach((userId) => {
                    roleUniqueNames.forEach(name => {
                        policy = SecurityPolicy.addUserIdAssignment(policy, userId, name);
                    });
                });

                Security.savePolicy({
                    containerPath: containerPath,
                    policy: {policy},
                    success: (response) => {
                        resolve(response);
                    },
                    failure: (error) => {
                        reject(error);
                    }
                });
            },
            failure: (error) => {
                reject(error);
            }
        });
    });
}
