import {Query} from "@labkey/api";
import {OntologyModel} from "../ontology/models";

// maybe should tuck into permissions actions.... I mean it's such a similar call
export function getPrincipals(): Promise<any> {
    return new Promise((resolve, reject) => {
        Query.executeSql({
            schemaName: 'core',
            sql: "SELECT p.*, u.DisplayName FROM Principals p LEFT JOIN Users u ON p.type='u' AND p.UserId=u.UserId", // TODO: maybe adjust to take out container
            success: response => {
                resolve(response.rows);
            },
            failure: error => {
                console.error('Failed to fetch principals', error);
                reject(error);
            },
        });
    });
}

export function getGroupMembership(): Promise<any> {
    return new Promise((resolve, reject) => {
        Query.selectRows({
            method: 'POST',
            schemaName: 'core',
            queryName: 'Members',
            columns: 'UserId,GroupId,GroupId/Name,UserId/DisplayName',
            success: response => {
                resolve(response.rows);
            },
            failure: error => {
                console.error('Failed to fetch group memberships', error);
                reject(error);
            },
        });
    });
}
