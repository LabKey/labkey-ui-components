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
