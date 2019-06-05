/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import {Map, List} from "immutable";
import {Ajax, ActionURL, Utils} from "@labkey/api";

// Converts the 2D array returned by inferDomain action into a list of row maps that the grid understands
export function convertRowDataIntoPreviewData(rowArray: any, previewRowCount: number): List<Map<string, any>> {
    let rows = List<Map<string, any>>();

    const headerRow = Utils.isArray(rowArray) && rowArray.length > 0 ? rowArray[0] : undefined;
    if (!headerRow) {
        return rows;
    }

    for (let i = 1; i < Math.min((previewRowCount + 1), rowArray.length); i++) {
        const row = rowArray[i];

        let m = {};
        headerRow.forEach((column, j) => {
            m[column] = row[j];
        });

        rows = rows.push(Map(m));
    }

    return rows;
}

export function inferDomainFromFile(file: File, numLinesToInclude: number) : Promise<any> {
    return new Promise((resolve, reject) => {
        let form = new FormData();
        form.append('file', file);
        form.append('numLinesToInclude', numLinesToInclude ? (numLinesToInclude + 1).toString() : undefined);

        Ajax.request({
            url: ActionURL.buildURL('property', 'inferDomain'),
            method: 'POST',
            form,
            success: (response) => {
                resolve(JSON.parse(response.responseText));
            },
            failure: (response) => {
                reject("There was a problem uploading the data file for inferring the domain.");
                console.error(response);
            }
        });
    })
}