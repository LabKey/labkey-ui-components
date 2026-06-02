/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import fs from 'fs';

// Copied from ui-components because we can't import that package in node.
function naturalSort(aso, bso) {
    // http://stackoverflow.com/questions/19247495/alphanumeric-sorting-an-array-in-javascript
    if (aso === bso) return 0;
    if (aso === undefined || aso === null || aso === '') return 1;
    if (bso === undefined || bso === null || bso === '') return -1;

    let a1,
        b1,
        i = 0,
        n;

    // If no matches are found in the group, then match() will return null
    const rx = /(\.\d+)|(\d+(\.\d+)?)|([^\d.]+)|(\.\D+)|(\.$)/g;
    const a = aso.toString().toLowerCase().match(rx) ?? [];
    const b = bso.toString().toLowerCase().match(rx) ?? [];

    const L = a.length;
    while (i < L) {
        if (!b[i]) return 1;
        a1 = a[i];
        b1 = b[i++];
        if (a1 !== b1) {
            n = a1 - b1;
            if (!isNaN(n)) return n;
            return a1 > b1 ? 1 : -1;
        }
    }
    return b[i] ? -1 : 0;
}

export function writeFile(fileName, linesSet) {
    const writeStream = fs.createWriteStream(fileName);
    const arr = Array.from(linesSet).sort(naturalSort);
    arr.forEach(name => writeStream.write(`${name}\n`));
    writeStream.end();
    console.log(`${arr.length} lines written to ${fileName}`);
}
