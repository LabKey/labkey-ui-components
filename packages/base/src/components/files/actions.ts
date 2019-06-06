/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import {Map, List} from "immutable";

// Converts the 2D array returned by inferDomain action into a list of row maps that the grid understands
export function convertRowDataIntoPreviewData(data: List<any>, previewRowCount: number): List<Map<string, any>> {
    let rows = List<Map<string, any>>();

    const headerRow = data.size > 0 ? data.get(0) : undefined;
    if (!headerRow) {
        return rows;
    }

    for (let i = 1; i < Math.min((previewRowCount + 1), data.size); i++) {
        const row = data.get(i);

        let m = Map<string, any>();
        headerRow.forEach((column, j) => {
            m = m.set(column, row.get(j));
        });

        rows = rows.push(m);
    }

    return rows;
}