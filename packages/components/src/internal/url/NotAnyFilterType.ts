import { Filter } from '@labkey/api';

/**
 * A dummy FilterType to indicate no value is selected, not even '[blank]'. The counterpart to IFilterType.HAS_ANY_VALUE
 * Used by FilterFacetedSelector for unchecking '[All]' value(s).
 */
class NotAnyFilterType implements Filter.IFilterType {
    getDisplaySymbol(): string {
        return null;
    }
    getDisplayText(): string {
        return 'NotAny';
    }
    getLongDisplayText(): string {
        return this.getDisplayText();
    }
    getURLSuffix(): string {
        return 'notany';
    }
    isDataValueRequired(): boolean {
        return false;
    }
    isMultiValued(): boolean {
        return false;
    }
    isTableWise(): boolean {
        return true;
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

export const NOT_ANY_FILTER_TYPE = new NotAnyFilterType();
