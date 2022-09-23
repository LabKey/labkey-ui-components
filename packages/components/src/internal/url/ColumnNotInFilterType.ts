import { Filter } from '@labkey/api';

class ColumnNotInFilterType implements Filter.IFilterType {
    getDisplaySymbol(): string {
        return null;
    }
    getDisplayText(): string {
        return 'COLUMN NOT IN';
    }
    getLongDisplayText(): string {
        return this.getDisplayText();
    }
    getURLSuffix(): string {
        return 'columnnotin';
    }
    isDataValueRequired(): boolean {
        return true;
    }
    isMultiValued(): boolean {
        return false;
    }
    isTableWise(): boolean {
        return false;
    }
    getMultiValueFilter(): Filter.IFilterType {
        return null;
    }
    getMultiValueMaxOccurs(): number {
        return 0;
    }
    getMultiValueMinOccurs(): number {
        return 0;
    }
    getMultiValueSeparator(): string {
        return null;
    }
    getOpposite(): Filter.IFilterType {
        return null;
    }
    getSingleValueFilter(): Filter.IFilterType {
        return null;
    }
    parseValue(value: any) {
        return value;
    }
    getURLParameterValue(value: any) {
        return value;
    }
    validate(value: any, jsonType: string, columnName: string) {}
    getLabKeySqlOperator(): string {
        return null;
    }
}

export const COLUMN_NOT_IN_FILTER_TYPE = new ColumnNotInFilterType();
