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
