import {IssuesListDefModel} from "./models";
import {ActionURL, Ajax, Domain, getServerContext, Utils} from "@labkey/api";
import {Principal} from "../../..";
import { List } from 'immutable';
import {UserGroup} from "../../permissions/models";

export function fetchIssuesListDefDesign(issueDefName: string): Promise<IssuesListDefModel> {
    return new Promise((resolve, reject) => {

        Domain.getDomainDetails({
            containerPath: getServerContext().container.path,
            schemaName: 'issues',
            queryName: issueDefName,
            success: data => {
                resolve(IssuesListDefModel.create(data));
            },
            failure: error => {
                reject(error);
            },
        });
    })

}

export function getUsersForGroup(groupId: number): Promise<List<UserGroup>> {

    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('issues', 'GetUsersForGroup.api'),
            method: 'GET',
            params: {groupId},
            scope: this,
            success: Utils.getCallbackWrapper(coreUsersData => {

                let userGroupList = List<UserGroup>();
                coreUsersData.forEach(user => {
                    const usr = UserGroup.create(user);
                    userGroupList = userGroupList.push(usr);
                });

                resolve(userGroupList);

            }),
            failure: Utils.getCallbackWrapper(error => {
                reject(error);
            }),
        });
    });
}

export function getProjectGroups(): Promise<List<Principal>> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('issues', 'GetProjectGroups.api'),
            method: 'GET',
            scope: this,
            success: Utils.getCallbackWrapper(coreGroupsData => {

                let coreGroupsList = List<Principal>();
                coreGroupsData.forEach(principal => {
                    const grp = Principal.create(principal);
                    coreGroupsList = coreGroupsList.push(grp);
                });

                resolve(coreGroupsList);

            }),
            failure: Utils.getCallbackWrapper(error => {
                reject(error);
            }),
        });
    });
}
