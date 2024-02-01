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

const resolveFieldValue = (data: FieldValue, ignoreFormattedValue?: boolean): string => {
    if (!ignoreFormattedValue && data.hasOwnProperty('formattedValue')) {
        return data.formattedValue;
    }

    // Issue 45256: Ignore the "displayValue" as it may be built from a query XML annotated "textExpression"
    return data.value === null ? undefined : data.value;
};

export function resolveDetailFieldValue(
    data: FieldList | FieldArray | FieldMap | FieldValue,
    ignoreFormattedValue?: boolean
): string | string[] {
    if (data) {
        if (isFieldList(data) && data.size) {
            return data.toJS().map(d => resolveFieldValue(d, ignoreFormattedValue));
        } else if (isFieldArray(data) && data.length) {
            return data.map(d => resolveFieldValue(d, ignoreFormattedValue));
        } else if (isFieldMap(data)) {
            return resolveFieldValue(data.toJS(), ignoreFormattedValue);
        }

        return resolveFieldValue(data as FieldValue, ignoreFormattedValue);
    }

    return undefined;
}
