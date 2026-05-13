import { List, Map } from 'immutable';

import { QueryColumn } from '../../../public/QueryColumn';
import { QueryInfo } from '../../../public/QueryInfo';
import { STORED_AMOUNT_FIELDS } from '../samples/constants';
import { isSameWithStringCompare } from '../../util/utils';

const LABEL_FIELD_SUFFIX = '::label';

export const getQueryFormLabelFieldName = function (name: string): string {
    return name + LABEL_FIELD_SUFFIX;
};

export const isQueryFormLabelField = function (name: string): boolean {
    return name.endsWith(LABEL_FIELD_SUFFIX);
};

export const getFieldEnabledFieldName = function (column: QueryColumn, fieldName?: string): string {
    const name = fieldName ? fieldName : column ? column.fieldKey : 'unknownField';
    return name + '::enabled';
};

// exported for jest testing
export function hasAmountOrUnitChanged(updatedValuesMap: Map<string, any>, originalRowMap: Map<string, any>): boolean {
    // If we have an updated value for amount, and it has been changed, return true
    if (
        updatedValuesMap.has(STORED_AMOUNT_FIELDS.AMOUNT) &&
        !isSameWithStringCompare(
            updatedValuesMap.get(STORED_AMOUNT_FIELDS.AMOUNT),
            originalRowMap.get(STORED_AMOUNT_FIELDS.AMOUNT)?.get('value')
        )
    ) {
        return true;
    }
    // If we have an updated value for units, and it has been changed, return true
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

/**
 * Constructs an array of objects, suitable for the "rows" parameter of updateRows, where each object contains the
 * values that are different from the ones in the originalData object as well as the primary key values for that row.
 * If updatedValues are empty, or all the originalData values are the same as the updatedValues, then it returns an
 * empty array.
 *
 * @param originalData a map from an id field to a Map from fieldKeys to an object with a 'value' field
 * @param updatedValues an object mapping fieldKeys to values that are being updated
 * @param queryInfo the queryInfo to get column information from
 */
export function getUpdatedData(
    originalData: Map<string, any>, // the rows in the original data have column names as keys
    updatedValues: Record<string, any>, // the keys here are column fieldKeys
    queryInfo: QueryInfo
): any[] {
    const updateValuesMap = Map<any, any>(updatedValues);
    const pkColsLc = new Set<string>();
    const pkColsInUse = new Set<string>();
    queryInfo.pkCols.forEach(key => pkColsLc.add(key.toLowerCase()));

    // if the originalData has the container/folder values, keep those as well (i.e., treat it as a primary key)
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
                    pkColsInUse.add(key.toLowerCase());
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
        .filter(rowData => rowData.size > pkColsInUse.size)
        .map(rowData => rowData.toJS())
        .toArray();
}

interface FieldValue {
    displayValue?: any;
    formattedValue?: any;
    value: any;
}

type FieldArray = FieldValue[];
type FieldMap = Map<string, any>;
type FieldList = List<FieldMap>;
type Field = FieldList | FieldArray | FieldMap | FieldValue;

const isFieldList = (value: any): value is FieldList => List.isList(value);

const isFieldArray = (value: any): value is FieldArray => Array.isArray(value);

const isFieldMap = (value: any): value is FieldMap => Map.isMap(value);

const resolveFieldValue = (
    fieldValue: FieldValue,
    resolveDisplayValue?: boolean,
    resolveFormattedValue?: boolean
): string => {
    if (resolveFormattedValue && fieldValue.hasOwnProperty('formattedValue')) {
        return fieldValue.formattedValue;
    }

    if (resolveDisplayValue && fieldValue.hasOwnProperty('displayValue')) {
        return fieldValue.displayValue;
    }

    return fieldValue.value === null ? undefined : fieldValue.value;
};

export function resolveDetailFieldValue(
    field: Field,
    resolveDisplayValue?: boolean,
    resolveFormattedValue?: boolean
): string | string[] {
    if (field) {
        if (isFieldList(field) && field.size) {
            return field.toJS().map(d => resolveFieldValue(d, resolveDisplayValue, resolveFormattedValue));
        } else if (isFieldArray(field) && field.length) {
            return field.map(d => resolveFieldValue(d, resolveDisplayValue, resolveFormattedValue));
        } else if (isFieldMap(field)) {
            return resolveFieldValue(field.toJS(), resolveDisplayValue, resolveFormattedValue);
        }

        return resolveFieldValue(field as FieldValue, resolveDisplayValue, resolveFormattedValue);
    }

    return undefined;
}

export function resolveDetailFieldLabel(field: Field): string | string[] {
    return resolveDetailFieldValue(field, true, true);
}
