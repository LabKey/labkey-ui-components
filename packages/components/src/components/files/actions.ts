/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Map, OrderedMap, List, fromJS } from "immutable";
import { QueryColumn } from "../base/models/model";

// Converts the 2D array returned by inferDomain action into a list of row maps that the grid understands
export function convertRowDataIntoPreviewData(data: List<any>, previewRowCount: number, fields?: List<QueryColumn>): List<Map<string, any>> {
    let rows = List<Map<string, any>>();

    const headerRow = data.size > 0 ? data.get(0) : undefined;
    if (!headerRow) {
        return rows;
    }

    // numeric data is imported as Doubles for excel (see org.labkey.api.exp.PropertyType#getFromExcelCell)
    let integerFieldInds = [];
    if (fields && fields.size > 0) {
        fields.forEach((field, ind) => {
            const rangeURI = field.get('rangeURI');
            if (rangeURI && (rangeURI.toLowerCase() === 'xsd:int' || rangeURI.toLowerCase() === 'http://www.w3.org/2001/xmlschema#int')) {
                integerFieldInds.push(ind);
            }
        })
    }

    for (let i = 1; i < Math.min((previewRowCount + 1), data.size); i++) {
        const row = data.get(i);

        let m = OrderedMap<string, any>();
        headerRow.forEach((column, j) => {
            let value = row.get(j);
            if (integerFieldInds.indexOf(j) > -1 && (!isNaN(parseFloat(value)) && isFinite(value)))
                value = parseInt(value, 10);
            m = m.set(column, value);
        });

        rows = rows.push(m);
    }

    return rows;
}

export function fileMatchesAcceptedFormat(fileName: string, formatExtensionStr: string): Map<string, any> {
    const acceptedFormatArray: Array<string> = formatExtensionStr.replace(/\s/g, '').split(',');
    const dotIndex = fileName.lastIndexOf('.');
    const extension = fileName.slice(dotIndex);
    const isMatch = acceptedFormatArray.indexOf(extension) >= 0;

    return fromJS({
        extension,
        isMatch
    });
}