import { ActionURL, Ajax, Domain, getServerContext, Utils } from '@labkey/api';

import { List } from 'immutable';

import { buildURL, Principal } from '../../../..';

import { DuplicateFilesResponse } from '../../assay/actions';

import { IssuesListDefModel, IssuesListDefOptionsConfig } from './models';

export function fetchIssuesListDefDesign(issueDefName?: string): Promise<IssuesListDefModel> {
    return new Promise((resolve, reject) => {
        Domain.getDomainDetails({
            containerPath: getServerContext().container.path,
            schemaName: 'issues',
            queryName: issueDefName,
            domainKind: issueDefName === undefined ? 'IssueDefinition' : undefined,
            success: data => {
                resolve(IssuesListDefModel.create(data));
            },
            failure: error => {
                reject(error);
            },
        });
    });
}

export function getUsersForGroup(groupId: number): Promise<List<Principal>> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('issues', 'getUsersForGroup.api'),
            method: 'GET',
            params: { groupId },
            scope: this,
            success: Utils.getCallbackWrapper(coreUsersData => {
                let users = List<Principal>();
                coreUsersData.forEach(user => {
                    const usr = Principal.create(user);
                    users = users.push(usr);
                });

                resolve(users);
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
            url: ActionURL.buildURL('issues', 'getProjectGroups.api'),
            method: 'GET',
            scope: this,
            success: Utils.getCallbackWrapper(coreGroupsData => {
                let groups = List<Principal>();
                coreGroupsData.forEach(principal => {
                    const grp = Principal.create(principal);
                    groups = groups.push(grp);
                });

                resolve(groups);
            }),
            failure: Utils.getCallbackWrapper(error => {
                reject(error);
            }),
        });
    });
}

export function saveIssueListDefOptions(options: IssuesListDefOptionsConfig): Promise<DuplicateFilesResponse> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('issues', 'admin.api'),
            method: 'POST',
            params: options,
            success: Utils.getCallbackWrapper(res => {
                resolve(res);
            }),
            failure: Utils.getCallbackWrapper(response => {
                console.error(response);
                reject(response);
            }),
        });
    });
}
