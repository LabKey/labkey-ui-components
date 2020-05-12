import {IssuesListDefModel} from "./models";
import {ActionURL, Ajax, Domain, getServerContext, Utils} from "@labkey/api";

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

export function getUsersForGroup(groupId: any): Promise<any> {

    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('issues', 'GetUsersForGroup'),
            method: 'GET',
            params: {groupId},
            scope: this,
            success: Utils.getCallbackWrapper(data => {
                resolve(data);
            }),
            failure: Utils.getCallbackWrapper(error => {
                reject(error);
            }),
        });
    });
}
