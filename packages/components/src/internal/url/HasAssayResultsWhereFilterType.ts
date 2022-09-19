import { Filter } from '@labkey/api';

/**
 * This implements the filter corresponding to <code>QueryServiceImpl.HasAssayResultsClause: hasassayresultswhere</code>
 */
class HasAssayResultsWhereFilterType implements Filter.IFilterType {
    getDisplaySymbol(): string {
        return null;
    }

    getDisplayText(): string {
        return 'HAS ASSAY RESULTS WHERE';
    }

    getLabKeySqlOperator(): string {
        return null;
    }

    getLongDisplayText(): string {
        return this.getDisplayText();
    }

    getMultiValueFilter(): Filter.IFilterType {
        return undefined;
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
        return  null;
    }

    getURLParameterValue(value: any): any {
        return value;
    }

    getURLSuffix(): string {
        return 'hasassayresultswhere';
    }

    isDataValueRequired(): boolean {
        return false;
    }

    isMultiValued(): boolean {
        return false;
    }

    isTableWise(): boolean {
        return false;
    }

    parseValue(value: string | any[]): any | any[] {
        return value;
    }

    validate(value: any, jsonType: string, columnName: string): any {
    }
}

export const HAS_ASSAY_RESULTS_WHERE_FILTER_TYPE = new HasAssayResultsWhereFilterType()
