import {IssuesListDefModel} from "../../..";
import {Domain, getServerContext} from "@labkey/api";

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
