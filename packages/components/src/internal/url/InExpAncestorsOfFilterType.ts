import { Filter } from '@labkey/api';

/**
 * This implements the filter corresponding to <code>QueryServiceImpl.InLineageOfClause: inexpancestorsof</code>
 */
class InExpAncestorsOfFilterType implements Filter.IFilterType {
    getDisplaySymbol(): string {
        return null;
    }
    getDisplayText(): string {
        return 'IN ANCESTORS OF';
    }
    getLongDisplayText(): string {
        return this.getDisplayText();
    }
    getURLSuffix(): string {
        return 'inexpancestorsof';
    }
    isDataValueRequired(): boolean {
        return true;
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

export const IN_EXP_ANCESTORS_OF_FILTER_TYPE = new InExpAncestorsOfFilterType();
