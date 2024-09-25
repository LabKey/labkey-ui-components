/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List, Map, OrderedMap } from 'immutable';

import { parseScientificInt } from '../../util/utils';

import { QueryColumn } from '../../../public/QueryColumn';
import { FileSizeLimitProps } from '../../../public/files/models';

import { ALL_FILES_LIMIT_KEY } from './models';

// Converts the 2D array returned by inferDomain action into a list of row maps that the grid understands
export function convertRowDataIntoPreviewData(
    data: List<any>,
    previewRowCount: number,
    fields?: List<QueryColumn>
): List<Map<string, any>> {
    let rows = List<Map<string, any>>();

    const headerRow = data.size > 0 ? data.get(0) : undefined;
    if (!headerRow) {
        return rows;
    }

    // numeric data is imported as Doubles for excel (see org.labkey.api.exp.PropertyType#getFromExcelCell)
    const integerFieldInds: number[] = [];
    if (fields && fields.size > 0) {
        fields.forEach((field, ind) => {
            const rangeURI = field.rangeURI;
            if (
                rangeURI &&
                (rangeURI.toLowerCase() === 'xsd:int' ||
                    rangeURI.toLowerCase() === 'http://www.w3.org/2001/xmlschema#int')
            ) {
                integerFieldInds.push(ind);
            }
        });
    }

    for (let i = 1; i < Math.min(previewRowCount + 1, data.size); i++) {
        const row = data.get(i);

        let m = OrderedMap<string, any>();
        headerRow.forEach((column, j) => {
            let value = row.get(j);
            // Issue 43531: We only want to do the integer conversion if the value is an integer.  If the value is a string that
            // looks like an integer (e.g., 000304), we want to retain the leading 0s at least in the preview.  The 0's will get
            // lopped off if the domain field is actually numeric.
            if (
                integerFieldInds.indexOf(j) > -1 &&
                !isNaN(parseFloat(value)) &&
                isFinite(value) &&
                value.toString().endsWith('.0')
            )
                value = parseScientificInt(value);
            m = m.set(column, value);
        });

        rows = rows.push(m);
    }

    return rows;
}

// Finds the extension on the given file name, including the '.'. Optionally, returning the type based on the first or
// last index of '.' in the file name.
// If there is no extension returns the empty string.
// If fileName is undefined, returns undefined.
export function getFileExtension(fileName: string, lastIndex = true): string {
    if (fileName) {
        const dotIndex = lastIndex ? fileName.lastIndexOf('.') : fileName.indexOf('.');
        return dotIndex >= 0 ? fileName.slice(dotIndex) : '';
    }
    return undefined;
}

export type FileExtensionMatch = {
    extension: string;
    isMatch: boolean;
};

export function fileMatchesAcceptedFormat(fileName: string, formatExtensionStr: string): FileExtensionMatch {
    // Issue 51331: Support case-insensitive matching on file extensions
    const acceptedFormatArray = formatExtensionStr.toLowerCase().replace(/\s/g, '').split(',');
    let extension = getFileExtension(fileName);
    let isMatch = extension?.length > 0 && acceptedFormatArray.indexOf(extension.toLowerCase()) >= 0;

    // Issue 42637: some file name extensions may not be based off of the last index of '.' in the file name
    if (!isMatch) {
        extension = getFileExtension(fileName, false);
        isMatch = extension?.length > 0 && acceptedFormatArray.indexOf(extension.toLowerCase()) >= 0;
    }

    return { extension, isMatch };
}

export interface SizeLimitCheckResult {
    isOversized: boolean;
    isOversizedForPreview: boolean;
    limits: FileSizeLimitProps;
}

export function fileSizeLimitCompare(file: File, sizeLimits: Map<string, FileSizeLimitProps>): SizeLimitCheckResult {
    if (!sizeLimits || sizeLimits.isEmpty())
        return {
            isOversized: false,
            isOversizedForPreview: false,
            limits: undefined,
        };

    const extension = getFileExtension(file.name);
    let limits: FileSizeLimitProps = sizeLimits.get(ALL_FILES_LIMIT_KEY) || ({} as FileSizeLimitProps);
    if (extension && sizeLimits.has(extension)) {
        limits = { ...limits, ...sizeLimits.get(extension) };
    }

    return {
        isOversized: limits.maxSize && file.size > limits.maxSize.value,
        isOversizedForPreview: limits.maxPreviewSize && file.size > limits.maxPreviewSize.value,
        limits,
    };
}
