import { List, Map } from 'immutable';

import { QueryColumn } from '../../../public/QueryColumn';

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

interface FieldValue {
    displayValue?: any;
    formattedValue?: any;
    value: any;
}

type FieldArray = FieldValue[];
type FieldMap = Map<string, any>;
type FieldList = List<FieldMap>;

const isFieldList = (value: any): value is FieldList => List.isList(value);

const isFieldArray = (value: any): value is FieldArray => Array.isArray(value);

const isFieldMap = (value: any): value is FieldMap => Map.isMap(value);

const resolveFieldValue = (data: FieldValue, lookup?: boolean, ignoreFormattedValue?: boolean): string => {
    if (!ignoreFormattedValue && data.hasOwnProperty('formattedValue')) {
        return data.formattedValue;
    }

    const o = lookup !== true && data.hasOwnProperty('displayValue') ? data.displayValue : data.value;
    return o !== null && o !== undefined ? o : undefined;
};

export function resolveDetailFieldValue(
    data: FieldList | FieldArray | FieldMap | FieldValue,
    lookup?: boolean,
    ignoreFormattedValue?: boolean
): string | string[] {
    if (data) {
        if (isFieldList(data) && data.size) {
            return data.toJS().map(d => resolveFieldValue(d, lookup, ignoreFormattedValue));
        } else if (isFieldArray(data) && data.length) {
            return data.map(d => resolveFieldValue(d, lookup, ignoreFormattedValue));
        } else if (isFieldMap(data)) {
            return resolveFieldValue(data.toJS(), lookup, ignoreFormattedValue);
        }

        return resolveFieldValue(data as FieldValue, lookup, ignoreFormattedValue);
    }

    return undefined;
}
