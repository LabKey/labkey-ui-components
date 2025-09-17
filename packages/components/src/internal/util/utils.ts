/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Set as ImmutableSet, Iterable, List, Map } from 'immutable';
import { getServerContext, Utils } from '@labkey/api';
import { ChangeEvent, CSSProperties } from 'react';

import { hasParameter, toggleParameter } from '../url/ActionURL';
import { QueryInfo } from '../../public/QueryInfo';
import { STORED_AMOUNT_FIELDS } from '../components/samples/constants';

// Case-insensitive Object reference. Returns undefined if either object or prop does not resolve.
// If both casings exist (e.g. 'x' and 'X' are props) then either value may be returned.
export function caseInsensitive(obj: Record<string, any>, prop: string): any {
    if (obj === undefined || obj === null) {
        return undefined;
    }

    if (Utils.isString(prop)) {
        const lower = prop.toLowerCase();

        for (const p in obj) {
            if (obj.hasOwnProperty(p) && p.toLowerCase() === lower) {
                return obj[p];
            }
        }
    }

    return undefined;
}

/**
 * Returns a new string in which the first character of the given string is capitalized.  If
 * the value is, empty, undefined, or not a string returns the value.
 * @param value string to convert
 */
export function capitalizeFirstChar(value: string): string {
    if (value && typeof value === 'string' && value.length > 1) {
        return [value.substr(0, 1).toUpperCase(), value.substr(1)].join('');
    }
    return value;
}

/**
 * Returns a new string in which the first character of the given string is not capitalized.  If
 * the value is, empty, undefined, or not a string returns the value.
 * @param value string to convert
 */
export function uncapitalizeFirstChar(value: string): string {
    if (value && typeof value === 'string' && value.length > 1) {
        return [value.substr(0, 1).toLowerCase(), value.substr(1)].join('');
    }
    return value;
}

/**
 * Util to format the keys in a record
 * Example: convert {capitalizedFirstKey: value} to {CapitalizedFirstKey: value} with capitalizeFirstChar fn
 * @param obj the original object to transform
 * @param keyTransformFn the transform function for keys
 */
export function withTransformedKeys(obj: Record<string, any>, keyTransformFn: (value) => string): Record<string, any> {
    if (obj === undefined || obj === null) {
        return obj;
    }

    const transformedObj = {};
    for (const rawKey in obj) {
        if (obj.hasOwnProperty(rawKey)) {
            const key = keyTransformFn(rawKey);
            transformedObj[key] = obj[rawKey];
        }
    }

    return transformedObj;
}

/**
 * Returns a copy of List<string> and ensures that in copy all values are lower case strings.
 * @param a
 */
export function toLowerSafe(a: string[]): string[] {
    if (a) {
        return a.filter(v => typeof v === 'string').map(v => v.toLowerCase());
    }

    return [];
}

export function camelCaseToTitleCase(text: string): string {
    const camelEdges = /([A-Z](?=[A-Z][a-z])|[^A-Z](?=[A-Z])|[a-zA-Z](?=[^a-zA-Z]))/g;
    const saferText = text.replace(camelEdges, '$1 ');
    return saferText.charAt(0).toUpperCase() + saferText.slice(1);
}

export function not(predicate: (...args: any[]) => boolean): (...args: any[]) => boolean {
    return function () {
        return !predicate.apply(this, arguments);
    };
}

export function applyDevTools() {
    if (devToolsActive() && window['devToolsExtension']) {
        return window['devToolsExtension']();
    }

    return f => f;
}

const DEV_TOOLS_URL_PARAMETER = 'devTools';

export function devToolsActive(): boolean {
    return getServerContext().devMode === true && hasParameter(DEV_TOOLS_URL_PARAMETER);
}

export function toggleDevTools(): void {
    if (getServerContext().devMode) {
        toggleParameter(DEV_TOOLS_URL_PARAMETER, 1);
    }
}

let DOM_COUNT = 0;
const DOM_PREFIX = 'labkey-app-';

// Only exported to use with tests. Don't use this anywhere else. This is needed so we can use it in beforeEach for jest
// snapshot tests. This way a snapshot will be identical when run as part of a test suite or run individually.
export function TESTS_ONLY_RESET_DOM_COUNT(): void {
    DOM_COUNT = 0;
}

// Generate an id with a dom-unique integer suffix
export function generateId(prefix?: string): string {
    return (prefix ? prefix : DOM_PREFIX) + DOM_COUNT++;
}

// http://davidwalsh.name/javascript-debounce-function
export function debounce(func, wait, immediate?: boolean): () => void {
    let timeout: number;
    return function () {
        const context = this,
            args = arguments;
        const later = function (): void {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = window.setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

/**
 * Performs an equality check on two arrays, returning true of the arrays are the same size
 *
 * @param array1
 * @param array2
 */
export function unorderedEqual(array1: any[], array2: any[]): boolean {
    if (array1.length !== array2.length) return false;

    const sortedA1 = array1.sort();
    const sortedA2 = array2.sort();
    for (let i = 0; i < sortedA1.length; i++) {
        if (sortedA1[i] !== sortedA2[i]) {
            return false;
        }
    }
    return true;
}

/**
 * Returns true if value is undefined, an empty string, or an empty array.  Otherwise, returns false.
 * @param value
 */
export function valueIsEmpty(value: any): boolean {
    if (!value) return true;
    if (typeof value === 'string' && value === '') return true;
    return Array.isArray(value) && value.length === 0;
}

/**
 * Creates a JS Object, suitable for use as a fieldValues object for QueryInfoForm,
 * mapping between field keys and values that are shared by all ids for the given data.
 *
 * It is assumed that the set of fields in each row of data is the same, though some fields
 * may be empty or null.  If the field sets are different, the results returned will
 * be as if the values were present and the same as in one of the other rows.
 *
 * @param data Map between ids and a map of data for the ids (i.e, a row of data for that id)
 */
export function getCommonDataValues(data: Map<any, any>, fileFields?: string[]): any {
    let valueMap = Map<string, any>(); // map from fields to the value shared by all rows
    let fieldsInConflict = ImmutableSet<string>();
    let emptyFields = ImmutableSet<string>(); // those fields that are empty
    const fileMap = {};
    data.map((rowData, id) => {
        if (rowData) {
            rowData.forEach((data, key) => {
                if (!fieldsInConflict.has(key)) {
                    // skip fields that are already in conflict
                    let value = data;
                    const rawValue = data;

                    // Convert from immutable to regular JS
                    if (Iterable.isIterable(data)) {
                        if (List.isList(data)) {
                            value = data.toJS();
                        } else {
                            value = data.get('value');
                        }
                    }

                    const currentValueEmpty = valueIsEmpty(value);
                    const havePreviousValue = valueMap.has(key);
                    const arrayNotEqual =
                        Array.isArray(value) &&
                        valueMap.get(key) &&
                        (!Array.isArray(valueMap.get(key)) || !unorderedEqual(valueMap.get(key), value));

                    if (!currentValueEmpty) {
                        // non-empty value, so let's see if we have the same value
                        if (emptyFields.contains(key)) {
                            fieldsInConflict = fieldsInConflict.add(key);
                        } else if (!havePreviousValue) {
                            valueMap = valueMap.set(key, value);
                            if (fileFields?.indexOf(key) > -1) {
                                fileMap[key] = rawValue;
                            }
                        }
                        if (arrayNotEqual) {
                            fieldsInConflict = fieldsInConflict.add(key);
                            valueMap = valueMap.delete(key);
                        } else if (valueMap.get(key) !== value) {
                            fieldsInConflict = fieldsInConflict.add(key);
                            valueMap = valueMap.delete(key);
                        }
                    } else if (havePreviousValue) {
                        // some row had a value, but this row does not
                        fieldsInConflict = fieldsInConflict.add(key);
                        valueMap = valueMap.delete(key);
                    } else {
                        emptyFields = emptyFields.add(key);
                    }
                }
            });
        } else {
            console.error('Unable to find data for selection id ' + id);
        }
    });

    // return full file data map (url, displayValue, value) for file fields
    fileFields?.forEach(fileField => {
        if (valueMap.has(fileField)) valueMap = valueMap.set(fileField, fileMap[fileField]);
    });

    return valueMap.toObject();
}

// exported for jest testing
export function hasAmountOrUnitChanged(updatedValuesMap: Map<string, any>, originalRowMap: Map<string, any>): boolean {
    // if we have an updated value for amount and it has been changed, return true
    if (
        updatedValuesMap.has(STORED_AMOUNT_FIELDS.AMOUNT) &&
        !isSameWithStringCompare(
            updatedValuesMap.get(STORED_AMOUNT_FIELDS.AMOUNT),
            originalRowMap.get(STORED_AMOUNT_FIELDS.AMOUNT)?.get('value')
        )
    ) {
        return true;
    }
    // if we have an updated value for units and it has been changed, return true
    if (
        updatedValuesMap.has(STORED_AMOUNT_FIELDS.UNITS) &&
        !isSameWithStringCompare(
            updatedValuesMap.get(STORED_AMOUNT_FIELDS.UNITS),
            originalRowMap.get(STORED_AMOUNT_FIELDS.UNITS)?.get('value')
        )
    ) {
        return true;
    }
    return false;
}

// export for jest testing
export function isSameWithStringCompare(value1: any, value2: any): boolean {
    if (value1 === value2 || (valueIsEmpty(value1) && valueIsEmpty(value2))) return true;
    if (value1 && value2) {
        const strVal1 = value1.toString();
        const strVal2 = value2.toString();
        return strVal1 === strVal2;
    }
    return false; // one value is empty and the other is not.
}

/**
 * Constructs an array of objects (suitable for the rows parameter of updateRows) where each object contains the
 * values that are different from the ones in originalData object as well as the primary key values for that row.
 * If updatedValues is empty or all of the originalData values are the same as the updatedValues, returns an empty array.
 *
 * @param originalData a map from an id field to a Map from fieldKeys to an object with a 'value' field
 * @param updatedValues an object mapping fieldKeys to values that are being updated
 * @param queryInfo the queryInfo to get column information from
 * @param additionalCols additional array of fieldKeys to include
 */
export function getUpdatedData(
    originalData: Map<string, any>, // the rows in the original data have column names as keys
    updatedValues: Record<string, any>, // the keys here are column fieldKeys
    queryInfo: QueryInfo,
    additionalCols?: Set<string>
): any[] {
    const updateValuesMap = Map<any, any>(updatedValues);
    const pkColsLc = new Set<string>();
    queryInfo.pkCols.forEach(key => pkColsLc.add(key.toLowerCase()));
    additionalCols?.forEach(col => pkColsLc.add(col.toLowerCase()));

    // if the originalData has the container/folder values, keep those as well (i.e. treat it as a primary key)
    const folderKey = originalData
        .first()
        .keySeq()
        .find(key => key.toLowerCase() === 'folder' || key.toLowerCase() === 'container');
    if (folderKey) pkColsLc.add(folderKey.toLowerCase());

    const updatedData = originalData.map(originalRowMap => {
        const amountOrUnitChanged = hasAmountOrUnitChanged(updateValuesMap, originalRowMap);

        return originalRowMap.reduce((m, fieldValueMap, key) => {
            const isPKCol = pkColsLc.has(key.toLowerCase());

            // Issue 42672: The original data has keys that are column names. Need to get the QueryColumn object from that
            // name so that we can get the fieldKey for the column to get the updated value from the updateValuesMap.
            // (e.g., "U g$Sl" instead of "U g/l")
            const col = queryInfo.getColumnFromName(key);
            if (!col && !isPKCol) {
                if (fieldValueMap) {
                    throw new Error(`Unable to find column for key ${key}.`);
                } else {
                    return m;
                }
            }

            if (fieldValueMap?.has('value')) {
                if (isPKCol) {
                    return m.set(key, fieldValueMap.get('value'));
                }

                const colValueIsIncluded = updateValuesMap.has(col.fieldKey);
                const updatedValue =
                    updateValuesMap.get(col.fieldKey) == undefined ? null : updateValuesMap.get(col.fieldKey);
                const valueIsChanged = !isSameWithStringCompare(
                    updateValuesMap.get(col.fieldKey),
                    fieldValueMap.get('value')
                );
                const isStoredAmountField =
                    col.fieldKey === STORED_AMOUNT_FIELDS.AMOUNT || col.fieldKey === STORED_AMOUNT_FIELDS.UNITS;
                if (colValueIsIncluded && valueIsChanged) {
                    return m.set(key, updatedValue);
                } else if (colValueIsIncluded && isStoredAmountField) {
                    // If you update amount or units, the saved row has to include both so include even if the value hasn't changed
                    if (amountOrUnitChanged) {
                        return m.set(key, updatedValue);
                    } else {
                        return m;
                    }
                } else {
                    return m;
                }
            }
            // Handle multi-value select
            else if (List.isList(fieldValueMap)) {
                let updatedVal = updateValuesMap.get(col.fieldKey);
                if (Array.isArray(updatedVal)) {
                    updatedVal = updatedVal.map(val => {
                        const match = fieldValueMap.find(original => original.get('value') === val);
                        if (match !== undefined) {
                            return match.get('displayValue');
                        }
                        return val;
                    });

                    return m.set(key, updatedVal);
                } else if (updateValuesMap.has(col.fieldKey) && updatedVal === undefined) {
                    return m.set(key, []);
                } else return m;
            } else return m;
        }, Map<string, any>());
    });
    // we want the rows that contain more than just the primaryKeys
    return updatedData
        .filter(rowData => rowData.size > pkColsLc.size)
        .map(rowData => rowData.toJS())
        .toArray();
}

/**
 * This forces tooltips to close and menus to stop showing pressed state after you close them on Chrome. We likely will
 * not need this if/when we upgrade React Bootstrap to something beyond the pre-release version we are using.
 */
export const blurActiveElement = (): void => {
    (document.activeElement as HTMLElement).blur();
};

const TRUE_STRINGS = ['true', 't', 'yes', 'y', 'on', '1'];
const FALSE_STRINGS = ['false', 'f', 'no', 'n', 'off', '0'];

export function isBoolean(value: any, allowNull = true): boolean {
    if (typeof value === 'boolean') return true;

    if (!value) return allowNull;

    if (TRUE_STRINGS.indexOf(value.toString().toLowerCase()) > -1) return true;

    return FALSE_STRINGS.indexOf(value.toString().toLowerCase()) > -1;
}

export function isFloat(value: number | string): boolean {
    return !isNaN(Number(value)) && !isNaN(parseFloat(value + ''));
}

export function isInteger(value: number | string): boolean {
    const intValue = parseScientificInt(value);

    return !isNaN(intValue) && intValue == Number(value);
}

export function isIntegerInRange(value: number, min: number, max?: number): boolean {
    return isInteger(value) && (!min || Number(value) >= min) && (!max || Number(value) <= max);
}

export function isNonNegativeInteger(value: number | string): boolean {
    return isInteger(value) && Number(value) >= 0;
}

export function isNonNegativeFloat(value: number | string): boolean {
    return isFloat(value) && Number(value) >= 0;
}

// works with string that might contain Scientific Notation
export function parseScientificInt(value: any): number {
    if (value == null) return undefined;

    const valueStr: string = String(value).trim();
    if (!valueStr) return undefined;

    if (isNaN(Number(valueStr))) return NaN;

    const valueLocaleStr = Number(valueStr).toLocaleString('fullwide', { useGrouping: false });

    return parseInt(valueLocaleStr, 10);
}

function getFileExtensionType(value: string): string {
    const parts = value.split('.');
    return parts[parts.length - 1].toLowerCase();
}

export function isImage(value): boolean {
    // Note: don't add tif, or tiff here, most browsers will not render them (see Issue 49852)
    const validImageExtensions = ['jpg', 'jpeg', 'bmp', 'gif', 'ico', 'png', 'svg'];
    const extensionType = getFileExtensionType(value);
    return validImageExtensions.indexOf(extensionType) > -1;
}

export function downloadAttachment(href: string, openInTab?: boolean, fileName?: string): Promise<void> {
    if (openInTab) {
        window.open(href, '_blank', 'noopener,noreferrer');
    } else {
        const link = document.createElement('a');
        link.href = href;
        if (fileName) {
            link.download = fileName;
        }
        link.click();
    }

    return undefined;
}

// copied from platform/api/src/org/labkey/api/attachments/Attachment.java
const EXTENSION_FONT_CLS_MAP = {
    '7z': 'fa fa-file-archive-o',
    audio: 'fa fa-file-audio-o',
    csv: 'fa fa-file-text-o',
    dll: 'fa fa-file-code-o',
    doc: 'fa fa-file-word-o',
    docm: 'fa fa-file-word-o',
    docx: 'fa fa-file-word-o',
    dotm: 'fa fa-file-word-o',
    dotx: 'fa fa-file-word-o',
    exe: 'fa fa-file-code-o',
    folder: 'fa fa-folder-o',
    gz: 'fa fa-file-archive-o',
    html: 'fa fa-file-code-o',
    image: 'fa fa-file-image-o',
    iqy: 'fa fa-file-code-o',
    jar: 'fa fa-file-archive-o',
    json: 'fa fa-file-code-o',
    log: 'fa fa-file-text-o',
    pdf: 'fa fa-file-pdf-o',
    potm: 'fa fa-file-powerpoint-o',
    potx: 'fa fa-file-powerpoint-o',
    ppsm: 'fa fa-file-powerpoint-o',
    ppsx: 'fa fa-file-powerpoint-o',
    ppt: 'fa fa-file-powerpoint-o',
    pptm: 'fa fa-file-powerpoint-o',
    pptx: 'fa fa-file-powerpoint-o',
    prg: 'fa fa-file-code-o',
    r: 'fa fa-file-code-o',
    rtf: 'fa fa-file-word-o',
    sql: 'fa fa-file-code-o',
    tar: 'fa fa-file-archive-o',
    text: 'fa fa-file-text-o',
    tgz: 'fa fa-file-archive-o',
    tsv: 'fa fa-file-text-o',
    txt: 'fa fa-file-text-o',
    video: 'fa fa-file-video-o',
    vsd: 'fa fa-file-image-o',
    wiki: 'fa fa-file-code-o',
    xar: 'fa fa-file-archive-o',
    xls: 'fa fa-file-excel-o',
    xlsb: 'fa fa-file-excel-o',
    xlsm: 'fa fa-file-excel-o',
    xlsx: 'fa fa-file-excel-o',
    xltm: 'fa fa-file-excel-o',
    xltx: 'fa fa-file-excel-o',
    xml: 'fa fa-file-code-o',
    zip: 'fa fa-file-archive-o',
};

export function getIconFontCls(value: string, unavailable?: boolean): string {
    if (!value) {
        return undefined;
    }

    if (unavailable) return 'fa fa-exclamation-triangle';

    const extensionType = getFileExtensionType(value);
    if (EXTENSION_FONT_CLS_MAP[extensionType]) {
        return EXTENSION_FONT_CLS_MAP[extensionType];
    }

    return isImage(value) ? 'fa fa-file-image-o' : 'fa fa-file-o';
}

/**
 * Formats number of bytes into a human-readable string.
 * Example:
 * ```
 * formatBytes(1024);       // 1 KB
 * formatBytes('1024');     // 1 KB
 * formatBytes(1234);       // 1.21 KB
 * formatBytes(1234, 3);    // 1.205 KB
 * ```
 * https://stackoverflow.com/a/18650828
 */
export function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === undefined || bytes === null) return 'Size unknown';
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Given an array of 1-based ordinals, which may have gaps in them (e.g., [1, 3, 4, 6]) and an
 * array of ordered values, extract the ordered values that correspond to the gaps in
 * the ordinals (e.g., values[1], values[4]).
 * @param ordinals the 1-based ordinal list, possibly with gaps
 * @param orderedValues The ordered values to extract the missing values from
 */
export function findMissingValues(ordinals: number[], orderedValues: any[]): any[] {
    let index = 0;
    let oIndex = 0;
    const missingValues = [];
    while (index < orderedValues.length) {
        if (oIndex >= ordinals.length || ordinals[oIndex] !== index + 1) {
            missingValues.push(orderedValues[index]);
        } else {
            oIndex++;
        }
        index++;
    }
    return missingValues;
}

// Helper that handles grabbing a files array from an HTMLInput ChangeEvent, use this to reduce boilerplate when
// handling events for file inputs.
export const handleFileInputChange = (
    callback: (files: File[]) => void
): ((evt: ChangeEvent<HTMLInputElement>) => void) => {
    return (evt: ChangeEvent<HTMLInputElement>): void => {
        if (evt.currentTarget.files.length > 0) {
            callback(Array.from(evt.currentTarget.files));
        }
    };
};

export function parseCsvString(value: string, delimiter: string, removeQuotes?: boolean): string[] {
    if (delimiter === '"') throw 'Unsupported delimiter: ' + delimiter;

    if (!delimiter) return undefined;

    if (value == null) return undefined;

    let start = 0;
    const parsedValues = [];
    while (start < value.length) {
        let end;
        const ch = value[start];
        if (ch === delimiter) {
            // empty string case
            end = start;
            parsedValues.push('');
        } else if (ch === '"') {
            // starting a quoted value
            end = start;
            while (true) {
                // find the end of the quoted value
                end = value.indexOf('"', end + 1);
                if (end === -1) break;
                if (end === value.length - 1 || value[end + 1] !== '"') {
                    // end quote at end of string or without double quote
                    break;
                }
                end++; // skip double ""
            }
            // if no ending quote, don't remove quotes;
            if (end === -1 || end !== value.length - 1) {
                let isCurrentDelimiterOrQuote = true;
                if (end > -1) {
                    const nextChar = value[end + 1];
                    // Issue 51056: "a, "b should be parsed to ["a, "b], not [a, ]
                    isCurrentDelimiterOrQuote = nextChar === '"' || nextChar === delimiter;
                }

                if (end === -1 || !isCurrentDelimiterOrQuote) {
                    end = value.indexOf(delimiter, start);
                    if (end === -1) end = value.length;
                    parsedValues.push(value.substring(start, end));
                    start = end + delimiter.length;
                    continue;
                }
            }
            let parsedValue = removeQuotes ? value.substring(start + 1, end) : value.substring(start, end + 1); // start is at the quote
            if (removeQuotes && parsedValue.indexOf('""') !== -1) {
                parsedValue = parsedValue.replace(/""/g, '"');
            }
            parsedValues.push(parsedValue);
            end++; // get past the last "
        } else {
            end = value.indexOf(delimiter, start);
            if (end === -1) end = value.length;
            parsedValues.push(value.substring(start, end));
        }
        start = end + delimiter.length;
    }
    return parsedValues;
}

const TSV_ESCAPE_CHARS = ['\r', '\n', '\\', '"'];
function hasTsvEscapeChar(value: any, delimiter: string): boolean {
    const allEscapedChars = [...TSV_ESCAPE_CHARS, delimiter];
    return !!allEscapedChars.find(char => value.indexOf(char) > -1);
}

// see TSVWriter.quoteValue
// Issue 52430: Sample Manager: sample names with newline characters
export function quoteValueWithDelimiters(value: any, delimiter: string): string {
    if (!value || !Utils.isString(value)) {
        return value;
    }
    if (!delimiter) {
        throw new Error('Delimiter is required.');
    }
    if (!hasTsvEscapeChar(value, delimiter)) return value; // nothing to do for a string that doesn't contain any character that needs to be escaped

    if (value.indexOf('"') !== -1) {
        value = value.replace(/"/g, '""');
    }
    return '"' + value + '"';
}

export function isQuotedWithDelimiters(value: any, delimiter: string): boolean {
    if (!value || !Utils.isString(value)) {
        return false;
    }
    if (!delimiter) {
        throw new Error('Delimiter is required.');
    }

    const strVal = value + '';
    if (!hasTsvEscapeChar(strVal, delimiter)) return false;

    return strVal.startsWith('"') && strVal.endsWith('"');
}

export function arrayEquals(a: string[], b: string[], ignoreOrder = true, caseInsensitive?: boolean): boolean {
    if (a === b) return true;
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    const aStr = ignoreOrder ? a.sort().join(';') : a.join(';');
    const bStr = ignoreOrder ? b.sort().join(';') : b.join(';');

    return caseInsensitive ? aStr.toLowerCase() === bStr.toLowerCase() : aStr === bStr;
}

export function getValueFromRow(row: Record<string, any>, col: string): number | string {
    if (!row) return undefined;

    const val = caseInsensitive(row, col);
    if (Utils.isArray(val)) {
        return val[0]?.value;
    } else if (Utils.isObject(val)) {
        return val?.value;
    }
    return val;
}

export function makeCommaSeparatedString<T>(values: T[], lastSeparator = ' and ', postfix = ''): string {
    if (!values || values.length === 0) return '';
    if (values.length === 1) return values[0] + postfix;

    const firsts = values.slice(0, values.length - 1);
    const last = values[values.length - 1];
    return firsts.join(', ') + lastSeparator + last + postfix;
}

/**
 * Convert [SampleType1, SampleType2, SampleType3], 'sample type' => '3 sample types (SampleType1, SampleType2 and SampleType3)'
 * @param values
 * @param nounSingular
 * @param nounPlural
 */
export function getValuesSummary<T>(values: T[], nounSingular: string, nounPlural?: string): string {
    if (!values || values.length === 0) return '';
    if (values.length === 1) return `1 ${nounSingular} (${values[0]})`;

    const plural = nounPlural ?? nounSingular + 's';
    return `${values.length} ${plural} (${makeCommaSeparatedString(values)})`;
}

/**
 * given a data map, return the CSSProperties that correspond to the 'style' property for that map.
 * If a column is provided, the map is expected to be a full row of data with the column being (possibly) one of the
 * fields in that row. If no column is provided, the data is expected to be a single field's data.
 * @param data either a row of data or a single field's data
 */
export function getDataStyling(data: Map<string, any> | any): CSSProperties {
    if (!data) {
        return undefined;
    }
    let style;
    if (Map.isMap(data)) {
        if (data.has('style')) {
            style = styleStringToObj(data.get('style'));
        }
    } else if (Utils.isObject(data)) {
        style = styleStringToObj(caseInsensitive(data, 'style'));
    }
    return style;
}

/**
 * Converts a string containing css styling directives to an object consumable by react components in a style property
 * Example input: ;font-style: italic;color: #7b64ff;background-color: #fe9200 !important;
 * @param styleString
 */
// exported for jest testing
export function styleStringToObj(styleString: string): CSSProperties {
    if (!styleString) {
        return undefined;
    }
    const obj = styleString
        .split(';')
        .filter(token => token?.trim() !== '')
        .reduce((prev, curr) => {
            const tokens = curr.split(':');
            prev[tokens[0]?.trim()] = tokens[1]?.replace('!important', '')?.trim();
            return prev;
        }, {});

    return Object.keys(obj).reduce((prev, key) => {
        const camelCased = key.replace(/-[a-z]/g, g => g[1].toUpperCase());
        prev[camelCased] = obj[key];
        return prev;
    }, {});
}

type Collection<C> = C[] | Set<C>;

/**
 * Replacer function for JSON.stringify() to support having object keys sorted in output. Supports deeply nested objects.
 *
 * https://stackoverflow.com/a/43636793
 */
const stringifyReplacer = (_, value): any => {
    if (value instanceof Object && !(value instanceof Array) && Object.keys(value).length > 0) {
        return Object.keys(value)
            .sort()
            .reduce((sorted, key) => {
                sorted[key] = value[key];
                return sorted;
            }, {});
    }

    return value;
};

/**
 * Serializes a Set/Array into a JSON string with sorted unique members.
 * Useful for determining deep equivalency.
 *
 * https://stackoverflow.com/a/43858768
 */
const toJsonSet = (s): string => JSON.stringify([...new Set(s)].sort(), stringifyReplacer);

/**
 * Compare any combination of two Set(s)/Array(s) to determine if they're equivalent.
 * NOTE: This does not do deeply nested equivalency in all cases. Specifically, when objects are
 * compared the order of their properties is determined by the symbol/type of the property.
 */
export function isSetEqual<T = any>(a: Collection<T>, b: Collection<T>): boolean {
    return toJsonSet(a) === toJsonSet(b);
}

export function isBlankValue(val: any): boolean {
    if (val === undefined || val === null) return true;
    if (typeof val !== 'string') return false;
    return val.toString().trim() === '';
}

/**
 * When this package is exported this environment variable reference is inline rewritten as
 * `const IS_NODE_TEST_ENV = "production" === 'test';`
 * so this will always be false in the exported package.
 */
const IS_NODE_TEST_ENV = process.env.NODE_ENV === 'test';

let IS_TEST_ENV = false;

/**
 * Support external packages being able to configure @labkey/components to recognize test environments.
 */
export const setIsTestEnv = (isTestEnv: boolean): void => {
    IS_TEST_ENV = !!isTestEnv;
};

export const isTestEnv = (): boolean => IS_NODE_TEST_ENV || IS_TEST_ENV;
